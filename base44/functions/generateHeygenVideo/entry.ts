import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Detect if a voice_id looks like an ElevenLabs ID (20-char alphanumeric)
// vs a HeyGen voice ID (UUID format with dashes)
function isElevenLabsVoiceId(id: string): boolean {
  return /^[A-Za-z0-9]{20,24}$/.test(id) && !id.includes('-');
}

export default async function handler(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const {
    lesson_id,
    script_text,
    avatar_id = 'f6b7752b8a474c2b80ed17f257c13a8f', // Heather's default avatar
    voice_id = 'HnMw7TbDd271beGNltfP',              // Heather's ElevenLabs voice
    elevenlabs_api_key,                               // optional override
    width = 1280,
    height = 720,
    speed = 1.0,
  } = body;

  const heygenKey = Deno.env.get('HEYGEN_API_KEY');
  if (!heygenKey) {
    return Response.json({ error: 'HEYGEN_API_KEY environment variable not set' }, { status: 500 });
  }

  if (!script_text?.trim()) {
    return Response.json({ error: 'script_text is required' }, { status: 400 });
  }

  // Build the voice block — HeyGen supports ElevenLabs voices via their audio API
  // If it's an ElevenLabs ID, first generate audio with ElevenLabs then pass to HeyGen
  let voiceBlock: Record<string, unknown>;

  if (voice_id && isElevenLabsVoiceId(voice_id)) {
    // ElevenLabs path: generate audio first, then feed URL to HeyGen
    const elKey = elevenlabs_api_key || Deno.env.get('ELEVENLABS_API_KEY');

    if (!elKey) {
      // Fall back to HeyGen's built-in voice if no ElevenLabs key available
      console.warn('No ELEVENLABS_API_KEY — falling back to HeyGen default voice');
      voiceBlock = {
        type: 'text',
        input_text: script_text.trim(),
        speed,
      };
    } else {
      // Generate audio via ElevenLabs
      console.log('Generating ElevenLabs audio for voice:', voice_id);
      const elResp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: script_text.trim(),
            model_id: 'eleven_turbo_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          }),
        }
      );

      if (!elResp.ok) {
        const elErr = await elResp.text();
        return Response.json({
          error: `ElevenLabs audio generation failed (${elResp.status}): ${elErr.substring(0, 300)}`,
        }, { status: 502 });
      }

      // Upload audio buffer to HeyGen's asset endpoint so it can be referenced
      const audioBuffer = await elResp.arrayBuffer();
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'voice.mp3');
      formData.append('type', 'audio');

      const uploadResp = await fetch('https://upload.heygen.com/v1/asset', {
        method: 'POST',
        headers: { 'X-Api-Key': heygenKey },
        body: formData,
      });

      if (!uploadResp.ok) {
        const uploadErr = await uploadResp.text();
        // Fall back to HeyGen text voice if upload fails
        console.warn('HeyGen audio upload failed, using text voice:', uploadErr);
        voiceBlock = { type: 'text', input_text: script_text.trim(), speed };
      } else {
        const uploadData = await uploadResp.json();
        const audioUrl = uploadData?.data?.url || uploadData?.url;
        if (audioUrl) {
          voiceBlock = { type: 'audio', audio_url: audioUrl };
        } else {
          voiceBlock = { type: 'text', input_text: script_text.trim(), speed };
        }
      }
    }
  } else if (voice_id) {
    // HeyGen native voice ID
    voiceBlock = {
      type: 'text',
      input_text: script_text.trim(),
      voice_id,
      speed,
    };
  } else {
    // No voice specified — use HeyGen default
    voiceBlock = {
      type: 'text',
      input_text: script_text.trim(),
      speed,
    };
  }

  const payload = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: avatar_id.trim(),
          avatar_style: 'normal',
        },
        voice: voiceBlock,
        background: {
          type: 'color',
          value: '#1a1917',
        },
      },
    ],
    dimension: { width, height },
    test: false,
  };

  console.log('HeyGen payload:', JSON.stringify({ ...payload, video_inputs: [{ ...payload.video_inputs[0], voice: { ...voiceBlock, input_text: '[truncated]' } }] }));

  let heygenResp: Response;
  try {
    heygenResp = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': heygenKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    return Response.json({ error: `Network error reaching HeyGen: ${e.message}` }, { status: 502 });
  }

  const data = await heygenResp.json();

  if (!heygenResp.ok) {
    return Response.json({
      error: data?.message || data?.error || JSON.stringify(data),
      heygen_code: data?.code,
      heygen_data: data,
      hint: 'Check HEYGEN_API_KEY is set and avatar_id exists in your HeyGen account at app.heygen.com/avatars',
    }, { status: heygenResp.status });
  }

  const video_id = data?.data?.video_id;
  if (!video_id) {
    return Response.json({ error: 'HeyGen returned no video_id', heygen_data: data }, { status: 500 });
  }

  if (lesson_id) {
    try {
      await base44.asServiceRole.entities.CurriculumLesson.update(lesson_id, {
        heygen_video_id: video_id,
        heygen_status: 'processing',
      });
    } catch (_) {}
  }

  return Response.json({ video_id, status: 'processing' });
}
