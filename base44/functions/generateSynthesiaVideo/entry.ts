import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

export default async function handler(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const {
    lesson_id,
    script_text,
    avatar_id,
    voice_id,         // Synthesia voice ID (e.g. "en-US-JennyNeural") — NOT ElevenLabs ID
    title = 'YogaPath Lesson',
    background_url,
    test_mode = false, // always default false — never generate test clip unless explicitly requested
  } = body;

  const apiKey = Deno.env.get('SYNTHESIA_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'SYNTHESIA_API_KEY environment variable not set' }, { status: 500 });
  }

  // Hard guards — Synthesia silently makes a 6s test clip if scriptText is missing or blank
  if (!script_text || script_text.trim().length === 0) {
    return Response.json({
      error: 'script_text is required and cannot be empty. Synthesia generates a 6-second test clip when script is missing.',
    }, { status: 400 });
  }

  if (!avatar_id || avatar_id.trim().length === 0) {
    return Response.json({ error: 'avatar_id is required (use your Synthesia avatar ID, not HeyGen)' }, { status: 400 });
  }

  // Build avatar settings — Synthesia voice IDs look like "en-US-JennyNeural", not ElevenLabs UUIDs
  const avatarSettings: Record<string, unknown> = {
    avatarId: avatar_id.trim(),
    horizontalAlign: 'center',
    scale: 1,
    style: 'rectangular',
  };

  // Only add voice if it looks like a Synthesia voice ID (not an ElevenLabs UUID)
  if (voice_id && voice_id.trim().length > 0) {
    avatarSettings.voice = voice_id.trim();
  }

  const input: Record<string, unknown> = {
    avatarSettings,
    scriptText: script_text.trim(), // must be non-empty or Synthesia defaults to 6s test clip
  };

  if (background_url) {
    input.background = background_url;
  }

  // CRITICAL: test must be false (boolean) — Synthesia's test mode = 6-second watermarked clip
  const payload = {
    test: false,
    title: title.substring(0, 100), // Synthesia title max 100 chars
    description: `YogaPath lesson video${lesson_id ? ` — ${lesson_id}` : ''}`,
    visibility: 'private',
    input: [input],
  };

  // Log what we're sending so errors are diagnosable
  console.log('Synthesia payload:', JSON.stringify(payload, null, 2));

  let synthResp: Response;
  try {
    synthResp = await fetch('https://api.synthesia.io/v2/videos', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    return Response.json({ error: `Network error reaching Synthesia: ${e.message}` }, { status: 502 });
  }

  const rawText = await synthResp.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    return Response.json({
      error: `Synthesia returned non-JSON response (status ${synthResp.status}): ${rawText.substring(0, 500)}`,
    }, { status: 502 });
  }

  if (!synthResp.ok) {
    // Surface the full Synthesia error — 400 usually means wrong avatar ID or voice ID
    return Response.json({
      error: data?.message || data?.error || data?.detail || `Synthesia error ${synthResp.status}`,
      hint: synthResp.status === 400
        ? 'Check that avatar_id is a Synthesia avatar ID (not HeyGen). Synthesia avatar IDs look like "anna_costume1_cameraA" for stock avatars, or a UUID for custom avatars. Voice IDs look like "en-US-JennyNeural".'
        : undefined,
      synthesia_data: data,
      payload_sent: payload,
    }, { status: synthResp.status });
  }

  const video_id = data?.id;
  if (!video_id) {
    return Response.json({ error: 'Synthesia returned no video id', raw: data }, { status: 500 });
  }

  // Save to lesson record if we have a lesson_id
  if (lesson_id) {
    try {
      await base44.asServiceRole.entities.CurriculumLesson.update(lesson_id, {
        synthesia_video_id: video_id,
        synthesia_status: 'processing',
      });
    } catch (_) {}
  }

  return Response.json({ video_id, status: 'processing', raw: data });
}
