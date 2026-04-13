import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

export default async function handler(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { video_id, lesson_id } = body;

  if (!video_id) {
    return Response.json({ error: 'video_id is required' }, { status: 400 });
  }

  const apiKey = Deno.env.get('HEYGEN_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'HEYGEN_API_KEY not set' }, { status: 500 });
  }

  const resp = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${video_id}`, {
    headers: { 'X-Api-Key': apiKey },
  });

  const data = await resp.json();
  const status = data?.data?.status; // 'processing' | 'completed' | 'failed'
  const video_url = data?.data?.video_url;

  // If completed and we have a lesson_id, save the URL
  if (status === 'completed' && video_url && lesson_id) {
    try {
      await base44.asServiceRole.entities.CurriculumLesson.update(lesson_id, {
        heygen_video_url: video_url,
        heygen_status: 'completed',
      });
    } catch (_) {}
  }

  return Response.json({ status, video_url: video_url || null, raw: data?.data });
}
