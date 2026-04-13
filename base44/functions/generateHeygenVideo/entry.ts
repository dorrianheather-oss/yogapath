import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

export default async function handler(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const {
    lesson_id,
    script_text,
    avatar_id,
    voice_id,
    width = 1280,
    height = 720,
    speed = 1.0,
  } = body;

  const apiKey = Deno.env.get('HEYGEN_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'HEYGEN_API_KEY environment variable not set' }, { status: 500 });
  }

  if (!script_text) {
    return Response.json({ error: 'script_text is required' }, { status: 400 });
  }
  if (!avatar_id) {
    return Response.json({ error: 'avatar_id is required' }, { status: 400 });
  }
  if (!voice_id) {
    return Response.json({ error: 'voice_id is required' }, { status: 400 });
  }

  // HeyGen v2 video generation
  const payload = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: avatar_id,
          avatar_style: 'normal',
        },
        voice: {
          type: 'text',
          input_text: script_text,
          voice_id: voice_id,
          speed: speed,
        },
        background: {
          type: 'color',
          value: '#1a1917',
        },
      },
    ],
    dimension: { width, height },
    test: false,
  };

  let heygenResp: Response;
  try {
    heygenResp = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return Response.json({ error: `Network error reaching HeyGen: ${e.message}` }, { status: 502 });
  }

  const data = await heygenResp.json();

  if (!heygenResp.ok) {
    // Return the full HeyGen error so the UI can display it
    return Response.json({
      error: data?.message || data?.error || JSON.stringify(data),
      heygen_code: data?.code,
      heygen_data: data,
    }, { status: heygenResp.status });
  }

  const video_id = data?.data?.video_id;
  if (!video_id) {
    return Response.json({ error: 'HeyGen returned no video_id', heygen_data: data }, { status: 500 });
  }

  // Optionally store the video_id on the lesson record
  if (lesson_id) {
    try {
      await base44.asServiceRole.entities.CurriculumLesson.update(lesson_id, {
        heygen_video_id: video_id,
        heygen_status: 'processing',
      });
    } catch (_) {
      // Non-fatal — entity update might fail if fields don't exist yet
    }
  }

  return Response.json({ video_id, status: 'processing' });
}
