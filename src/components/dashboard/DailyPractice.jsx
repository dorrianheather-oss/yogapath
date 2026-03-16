import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Clock, ChevronRight, CheckCircle2, RefreshCw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TRACK_ICONS } from '@/lib/curriculumData';

const STORAGE_KEY = 'yogapath_daily_practice';

function getStoredPractice() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const ageMs = Date.now() - parsed.generatedAt;
    if (ageMs > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

export default function DailyPractice({ profile, allLessons, tracks, progress }) {
  const navigate = useNavigate();
  const [practice, setPractice] = useState(() => getStoredPractice());
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const countdown = useCountdown(practice ? practice.generatedAt + 24 * 60 * 60 * 1000 : null);
  const completedIds = new Set(progress.map(p => p.lesson_id));
  const doneCount = practice ? practice.items.filter(item => completedIds.has(item.lessonId)).length : 0;
  const allDone = practice && doneCount === practice.items.length;

  const generate = async () => {
    setGenerating(true);

    // Find skill gaps: categories with lowest scores
    const skills = profile?.skills || {};
    const categories = ['asana', 'anatomy', 'breathwork', 'philosophy', 'cueing', 'programming'];
    const sorted = categories
      .filter(c => tracks.some(t => t.category === c))
      .sort((a, b) => (skills[a] || 0) - (skills[b] || 0));

    // Pick top 3 weakest categories
    const weakCategories = sorted.slice(0, 3);

    // Build a prompt to get a structured 10-min plan
    const skillSummary = sorted.map(c => `${c}: ${skills[c] || 0}/100`).join(', ');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a yoga curriculum advisor. A ${profile?.user_type || 'student'} with ${profile?.experience_level || 'beginner'} experience has these skill levels: ${skillSummary}.

Create a personalized 10-minute daily practice sequence targeting their weakest areas (${weakCategories.join(', ')}).

Return exactly 3-4 micro-lesson items totaling ~10 minutes. Each item should:
- Be from one of these categories: ${weakCategories.join(', ')}
- Have a clear, specific title (not a generic name — make it feel like a real lesson)
- Have a short motivational reason WHY this addresses their gap
- A duration in minutes (2-4 min each)

Make the titles feel like real micro-lesson content (e.g. "The Hip Flexor Stretch Breakdown", "Ujjayi Breath Timing in Vinyasa", "Warrior II Alignment Cues").`,
      response_json_schema: {
        type: 'object',
        properties: {
          theme: { type: 'string' },
          tagline: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                category: { type: 'string' },
                duration_minutes: { type: 'number' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Try to match each item to an actual lesson in the DB, fallback to null
    const enriched = result.items.map(item => {
      const catLessons = allLessons.filter(l => l.category === item.category || l.track_id);
      // Best-effort fuzzy match by category
      const trackMatch = tracks.find(t => t.category === item.category);
      const trackLessons = allLessons.filter(l => l.track_id === trackMatch?.id && !completedIds.has(l.id));
      const matchedLesson = trackLessons[0] || null;
      return {
        ...item,
        lessonId: matchedLesson?.id || null,
        lessonData: matchedLesson || null,
        trackData: trackMatch || null,
      };
    });

    const stored = {
      generatedAt: Date.now(),
      theme: result.theme,
      tagline: result.tagline,
      items: enriched,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setPractice(stored);
    setExpanded(true);
    setGenerating(false);
  };

  const refresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPractice(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daily Practice</h2>
        {practice && !allDone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="w-3 h-3" />
            <span className="font-mono">{countdown}</span>
          </div>
        )}
      </div>

      {!practice ? (
        /* Generate CTA */
        <button
          onClick={generate}
          disabled={generating}
          className="w-full p-5 rounded-2xl border-2 border-dashed border-border bg-white flex flex-col items-center gap-2 hover:bg-muted/30 transition-all disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-sm font-semibold">Analysing your skill gaps…</p>
              <p className="text-xs text-muted-foreground">Building your personalised 10-min session</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-background" />
              </div>
              <p className="text-sm font-bold">Generate Today's Practice</p>
              <p className="text-xs text-muted-foreground text-center">AI picks your biggest skill gaps and builds a 10-min sequence</p>
            </>
          )}
        </button>
      ) : (
        /* Practice card */
        <div className={cn("rounded-2xl border border-border bg-white overflow-hidden", allDone && "border-foreground/20")}>
          {/* Header */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center gap-3 p-4 text-left"
          >
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl",
              allDone ? "bg-foreground" : "bg-muted"
            )}>
              {allDone ? <CheckCircle2 className="w-5 h-5 text-background" /> : '⚡'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{practice.theme}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{practice.items.length} done
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  ~{practice.items.reduce((s, i) => s + i.duration_minutes, 0)} min
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 rounded-full bg-muted overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${practice.items.length > 0 ? (doneCount / practice.items.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform flex-shrink-0", expanded && "rotate-90")} />
          </button>

          {/* Items */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border divide-y divide-border">
                  {practice.items.map((item, i) => {
                    const done = item.lessonId && completedIds.has(item.lessonId);
                    const icon = TRACK_ICONS[item.category] || '📖';
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (item.lessonId && item.lessonData) {
                            navigate(`/Lesson/${item.lessonId}`, {
                              state: { lesson: item.lessonData, track: item.trackData },
                            });
                          }
                        }}
                        disabled={!item.lessonId}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left transition-all",
                          item.lessonId && !done && "hover:bg-muted/40 cursor-pointer",
                          !item.lessonId && "cursor-default opacity-75"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          done ? "bg-foreground" : "bg-muted"
                        )}>
                          {done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-background" />
                            : <span className="text-xs">{icon}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-semibold", done && "line-through text-muted-foreground")}>
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.reason}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.duration_minutes} min</p>
                        </div>
                        {item.lessonId && !done && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground italic">{practice.tagline}</p>
                  <button
                    onClick={refresh}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Regenerate tomorrow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}