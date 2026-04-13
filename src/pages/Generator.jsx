import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Video, Sparkles, Loader2, CheckCircle2, Play, Pause, ChevronDown, ChevronUp, Film, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Tabs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'content', label: 'Lesson Content', icon: BookOpen },
  { id: 'video', label: 'Video Scripts', icon: Video },
  { id: 'heygen', label: 'HeyGen AI', icon: Film },
];

export default function Generator() {
  const [activeTab, setActiveTab] = useState('content');

  return (
    <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Generator</h1>
      <p className="text-sm text-muted-foreground mb-6">Create AI-powered lesson content and video scripts</p>

      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-8 p-1 rounded-2xl bg-muted overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'content' && <ContentGenerator />}
      {activeTab === 'video' && <VideoScriptGenerator />}
      {activeTab === 'heygen' && <HeyGenVideoGenerator />}
    </div>
  );
}

// ─── HeyGen Video Generator ──────────────────────────────────────────────────
function HeyGenVideoGenerator() {
  const [avatarId, setAvatarId] = useState(() => localStorage.getItem('yp_heygen_avatar_id') || 'f6b7752b8a474c2b80ed17f257c13a8f');
  const [voiceId, setVoiceId] = useState(() => localStorage.getItem('yp_heygen_voice_id') || 'HnMw7TbDd271beGNltfP');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [scriptText, setScriptText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | generating | polling | done | error
  const [videoId, setVideoId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef(null);

  const { data: tracks = [] } = useQuery({
    queryKey: ['curriculumTracks'],
    queryFn: () => base44.entities.CurriculumTrack.filter({ is_published: true }, 'order_index', 50),
  });
  const { data: allLessons = [] } = useQuery({
    queryKey: ['allLessonsGen'],
    queryFn: () => base44.entities.CurriculumLesson.filter({ is_published: true }, 'order_index', 200),
  });

  // Persist avatar/voice IDs to localStorage
  useEffect(() => { if (avatarId) localStorage.setItem('yp_heygen_avatar_id', avatarId); }, [avatarId]);
  useEffect(() => { if (voiceId) localStorage.setItem('yp_heygen_voice_id', voiceId); }, [voiceId]);

  // Auto-fill script from lesson
  useEffect(() => {
    if (selectedLesson) {
      const text = selectedLesson.voiceover_script || selectedLesson.description || selectedLesson.title || '';
      setScriptText(text);
    }
  }, [selectedLesson]);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const pollStatus = useCallback(async (vid, lessonId, count = 0) => {
    if (count > 60) {
      setStatus('error');
      setErrorMsg('Video is taking too long. Check your HeyGen dashboard directly.');
      return;
    }
    try {
      const res = await base44.functions.pollHeygenVideo({ video_id: vid, lesson_id: lessonId });
      setPollCount(count);
      if (res.status === 'completed' && res.video_url) {
        setVideoUrl(res.video_url);
        setStatus('done');
      } else if (res.status === 'failed') {
        setStatus('error');
        setErrorMsg('HeyGen reported the video as failed. Check your avatar ID and script length.');
      } else {
        // still processing — poll again in 8 seconds
        pollRef.current = setTimeout(() => pollStatus(vid, lessonId, count + 1), 8000);
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(`Poll error: ${e.message}`);
    }
  }, []);

  const generate = async () => {
    if (!avatarId.trim()) { setErrorMsg('Avatar ID is required'); return; }
    if (!scriptText.trim()) { setErrorMsg('Script text is required'); return; }

    setStatus('generating');
    setErrorMsg('');
    setVideoId('');
    setVideoUrl('');

    try {
      const res = await base44.functions.generateHeygenVideo({
        lesson_id: selectedLesson?.id || null,
        script_text: scriptText.trim(),
        avatar_id: avatarId.trim(),
        voice_id: voiceId.trim() || undefined,
      });

      if (res.error) {
        setStatus('error');
        setErrorMsg(res.error + (res.heygen_data ? `\n\nFull response: ${JSON.stringify(res.heygen_data, null, 2)}` : ''));
        return;
      }

      setVideoId(res.video_id);
      setStatus('polling');
      setPollCount(0);
      pollStatus(res.video_id, selectedLesson?.id || null, 0);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message || 'Unknown error');
    }
  };

  const reset = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setStatus('idle');
    setVideoId('');
    setVideoUrl('');
    setErrorMsg('');
    setPollCount(0);
  };

  return (
    <div className="space-y-4">
      {/* Credentials */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">HeyGen Settings</p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">HeyGen Avatar ID <span className="text-primary">*</span></label>
          <input
            value={avatarId}
            onChange={e => setAvatarId(e.target.value)}
            placeholder="f6b7752b8a474c2b80ed17f257c13a8f"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">app.heygen.com → Avatars → click your avatar → copy ID</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            ElevenLabs Voice ID
            <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">auto-routed via ElevenLabs</span>
          </label>
          <input
            value={voiceId}
            onChange={e => setVoiceId(e.target.value)}
            placeholder="HnMw7TbDd271beGNltfP"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">Your ElevenLabs voice ID — audio is generated by ElevenLabs then synced to your HeyGen avatar.</p>
        </div>
      </div>

      {/* Lesson picker */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Lesson</p>
        <select
          value={selectedLesson?.id || ''}
          onChange={e => {
            const l = allLessons.find(x => x.id === e.target.value);
            setSelectedLesson(l || null);
          }}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        >
          <option value="">— Select a lesson (or type script below) —</option>
          {allLessons.map(l => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>

      {/* Script */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Script</p>
          <span className="text-xs text-muted-foreground">{scriptText.length} chars · ~{Math.round(scriptText.split(' ').filter(Boolean).length / 130)} min</span>
        </div>
        <textarea
          value={scriptText}
          onChange={e => setScriptText(e.target.value)}
          placeholder="Type or paste the script for your avatar to read..."
          rows={6}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <pre className="text-xs text-destructive whitespace-pre-wrap break-all">{errorMsg}</pre>
        </div>
      )}

      {/* Status */}
      {status === 'polling' && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Generating video...</p>
            <p className="text-xs text-muted-foreground">Polling HeyGen every 8s · check {pollCount + 1}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{videoId}</span>
        </div>
      )}

      {status === 'done' && videoUrl && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Video ready
          </div>
          <video src={videoUrl} controls className="w-full rounded-lg" />
          <a href={videoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Open in new tab</a>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {(status === 'error' || status === 'done') && (
          <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
        <button
          onClick={generate}
          disabled={status === 'generating' || status === 'polling' || !avatarId.trim() || !scriptText.trim()}
          className={cn(
            'flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
            status === 'generating' || status === 'polling'
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : !avatarId.trim() || !scriptText.trim()
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {status === 'generating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending to HeyGen...</>
           : status === 'polling' ? <><Loader2 className="w-4 h-4 animate-spin" /> Waiting for video...</>
           : <><Film className="w-4 h-4" /> Generate Avatar Video</>}
        </button>
      </div>
    </div>
  );
}

// ─── Content Generator ──────────────────────────────────────────────────────
function ContentGenerator() {
  const [generating, setGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [generatedIds, setGeneratedIds] = useState(new Set());
  const [expandedTrack, setExpandedTrack] = useState(null);

  const { data: tracks = [] } = useQuery({
    queryKey: ['curriculumTracks'],
    queryFn: () => base44.entities.CurriculumTrack.filter({ is_published: true }, 'order_index', 50),
  });

  const { data: lessons = [], refetch: refetchLessons } = useQuery({
    queryKey: ['allLessonsGen'],
    queryFn: () => base44.entities.CurriculumLesson.filter({ is_published: true }, 'order_index', 500),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];

  const withoutContent = lessons.filter(l => !l.content);

  const generateOne = async (lesson, track) => {
    try {
      const response = await base44.functions.invoke('generateAdaptiveLesson', {
        journeyId: track?.category || lesson.track_id,
        categoryKey: track?.category || 'asana',
        focusId: null,
        focusLabel: lesson.title,
      });
      const { lesson: generated } = response.data;
      await base44.entities.CurriculumLesson.update(lesson.id, { content: generated.content });
      setGeneratedIds(prev => new Set([...prev, lesson.id]));
    } catch (err) {
      console.error(`Failed to generate content for "${lesson.title}":`, err);
    }
  };

  const generateAll = async () => {
    if (!profile || withoutContent.length === 0) return;
    setGenerating(true);
    setBulkProgress({ done: 0, total: withoutContent.length });
    const trackMap = Object.fromEntries(tracks.map(t => [t.id, t]));
    for (let i = 0; i < withoutContent.length; i++) {
      const lesson = withoutContent[i];
      await generateOne(lesson, trackMap[lesson.track_id]);
      setBulkProgress({ done: i + 1, total: withoutContent.length });
    }
    await refetchLessons();
    setGenerating(false);
  };

  const generateForLesson = async (lesson) => {
    const track = tracks.find(t => t.id === lesson.track_id);
    setGenerating(true);
    await generateOne(lesson, track);
    await refetchLessons();
    setGenerating(false);
  };

  const lessonsByTrack = tracks.map(t => ({
    track: t,
    lessons: lessons.filter(l => l.track_id === t.id),
  })).filter(g => g.lessons.length > 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="p-4 rounded-2xl bg-card border border-border mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">{lessons.length} total lessons</p>
            <p className="text-xs text-muted-foreground">
              {lessons.length - withoutContent.length} have content · {withoutContent.length} need generation
            </p>
          </div>
          {withoutContent.length > 0 && (
            <Button
              onClick={generateAll}
              disabled={generating}
              className="rounded-xl gap-1.5 text-sm"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? `${bulkProgress.done}/${bulkProgress.total}` : 'Generate All'}
            </Button>
          )}
        </div>
        {/* Progress bar */}
        {lessons.length > 0 && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              animate={{ width: `${((lessons.length - withoutContent.length) / lessons.length) * 100}%` }}
              className="h-full rounded-full bg-primary"
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
        {generating && bulkProgress.total > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Generating {bulkProgress.done + 1} of {bulkProgress.total}…
          </p>
        )}
      </div>

      {/* Per-track lesson list */}
      <div className="space-y-3">
        {lessonsByTrack.map(({ track, lessons: tLessons }) => {
          const hasAll = tLessons.every(l => l.content || generatedIds.has(l.id));
          const isExpanded = expandedTrack === track.id;
          return (
            <div key={track.id} className="rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <span className="text-xl">{track.icon || '📚'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{track.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tLessons.filter(l => l.content || generatedIds.has(l.id)).length}/{tLessons.length} generated
                  </p>
                </div>
                {hasAll && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="divide-y divide-border">
                      {tLessons.map(lesson => {
                        const hasContent = !!(lesson.content || generatedIds.has(lesson.id));
                        return (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                            <div className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                              hasContent ? 'bg-primary' : 'bg-muted'
                            )}>
                              {hasContent
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                                : <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                              }
                            </div>
                            <p className="flex-1 text-sm">{lesson.title}</p>
                            {!hasContent && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={generating}
                                onClick={() => generateForLesson(lesson)}
                                className="h-7 px-2.5 text-xs rounded-lg gap-1"
                              >
                                <Sparkles className="w-3 h-3" /> Generate
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Video Script Generator ─────────────────────────────────────────────────
const SCRIPT_SECTIONS = ['HOOK', 'INTRO', 'TEACH', 'PRACTICE', 'OUTRO'];

function VideoScriptGenerator() {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState(null);
  const [teleprompter, setTeleprompter] = useState(false);

  const { data: tracks = [] } = useQuery({
    queryKey: ['curriculumTracks'],
    queryFn: () => base44.entities.CurriculumTrack.filter({ is_published: true }, 'order_index', 50),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['allLessonsGen'],
    queryFn: () => base44.entities.CurriculumLesson.filter({ is_published: true }, 'order_index', 500),
  });

  const lessonsByTrack = tracks.map(t => ({
    track: t,
    lessons: lessons.filter(l => l.track_id === t.id),
  })).filter(g => g.lessons.length > 0);

  const generateScript = async () => {
    if (!selectedLesson) return;
    setGenerating(true);
    setScript(null);
    try {
      const lesson = lessons.find(l => l.id === selectedLesson);
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a yoga video scriptwriter. Write a complete, camera-ready video script for a yoga lesson about "${lesson?.title}".

The script must have exactly these sections in order: HOOK, INTRO, TEACH, PRACTICE, OUTRO.

For each section provide:
- section: the section name (HOOK/INTRO/TEACH/PRACTICE/OUTRO)
- script: what the teacher says verbatim (warm, conversational, present-tense)
- broll: 2-3 suggested B-roll shots for video editors
- onscreen_text: any text overlay to show on screen (title cards, callouts)
- duration_seconds: estimated spoken duration

Keep the tone warm, encouraging, and expert. Total script should be 8-12 minutes of content.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  script: { type: 'string' },
                  broll: { type: 'array', items: { type: 'string' } },
                  onscreen_text: { type: 'string' },
                  duration_seconds: { type: 'number' },
                },
              },
            },
          },
        },
      });
      setScript(result);
    } catch (err) {
      console.error('Script generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (teleprompter && script) {
    return <TeleprompterMode script={script} onClose={() => setTeleprompter(false)} />;
  }

  return (
    <div>
      {/* Lesson selector */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Select a Lesson
        </label>
        <select
          value={selectedLesson || ''}
          onChange={e => { setSelectedLesson(e.target.value || null); setScript(null); }}
          className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Choose a lesson…</option>
          {lessonsByTrack.map(({ track, lessons: tLessons }) => (
            <optgroup key={track.id} label={track.title}>
              {tLessons.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <Button
        onClick={generateScript}
        disabled={!selectedLesson || generating}
        className="w-full h-12 rounded-2xl gap-2 mb-8"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? 'Writing script…' : 'Generate Video Script'}
      </Button>

      {script && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">{script.title}</h2>
            <Button onClick={() => setTeleprompter(true)} variant="outline" className="rounded-xl gap-1.5 text-sm h-9">
              <Play className="w-3.5 h-3.5" /> Teleprompter
            </Button>
          </div>

          <div className="space-y-4">
            {(script.sections || []).map((sec, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{sec.section}</span>
                  {sec.duration_seconds && (
                    <span className="text-xs text-muted-foreground">~{Math.round(sec.duration_seconds / 60)} min</span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {/* Script */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Script</p>
                    <p className="text-sm leading-relaxed">{sec.script}</p>
                  </div>
                  {/* B-roll */}
                  {sec.broll?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">B-Roll Shots</p>
                      <div className="space-y-1">
                        {sec.broll.map((shot, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="text-primary text-xs mt-0.5">▸</span>
                            <p className="text-xs text-muted-foreground">{shot}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* On-screen text */}
                  {sec.onscreen_text && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">On-Screen Text</p>
                      <div className="px-3 py-2 rounded-lg bg-muted border border-border">
                        <p className="text-xs font-medium">{sec.onscreen_text}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Teleprompter Mode ──────────────────────────────────────────────────────
function TeleprompterMode({ script, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.5); // px per frame
  const [section, setSection] = useState(0);
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  const fullText = (script.sections || [])
    .map(s => `[${s.section}]\n\n${s.script}`)
    .join('\n\n─────────────────────\n\n');

  const scroll = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop += speed * 0.5;
    rafRef.current = requestAnimationFrame(scroll);
  }, [speed]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(scroll);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, scroll]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onClose} className="text-white/50 text-sm hover:text-white transition">← Exit</button>
        <p className="text-white/70 text-sm font-medium">{script.title}</p>
        <button
          onClick={() => setPlaying(p => !p)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          {playing
            ? <Pause className="w-4 h-4 text-white" />
            : <Play className="w-4 h-4 text-white" />
          }
        </button>
      </div>

      {/* Speed slider */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-white/10">
        <span className="text-white/40 text-xs">Slow</span>
        <input
          type="range" min="0.3" max="4" step="0.1"
          value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          className="flex-1 accent-amber-400"
        />
        <span className="text-white/40 text-xs">Fast</span>
      </div>

      {/* Scroll content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-8 py-8"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Red guide line */}
        <div className="sticky top-1/3 left-0 right-0 h-0.5 bg-red-500/40 pointer-events-none z-10" />
        <p className="text-white text-2xl leading-relaxed font-light whitespace-pre-wrap pb-[60vh]">
          {fullText}
        </p>
      </div>
    </div>
  );
}
