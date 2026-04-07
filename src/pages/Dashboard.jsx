import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlayCircle, ChevronRight, CheckCircle2, Flame, Star } from 'lucide-react';
import { TRACK_ICONS, MASTERY_LABELS } from '@/lib/curriculumData';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles?.[0];

  const { data: tracks = [] } = useQuery({
    queryKey: ['curriculumTracks'],
    queryFn: () => base44.entities.CurriculumTrack.filter({ is_published: true }, 'order_index', 50),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['allModules'],
    queryFn: () => base44.entities.CurriculumModule.list('order_index', 200),
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ['allLessons'],
    queryFn: () => base44.entities.CurriculumLesson.filter({ is_published: true }, 'order_index', 500),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => base44.entities.UserProgress.list('-created_date', 500),
  });

  React.useEffect(() => {
    if (!isLoading && !profile) navigate('/Onboarding');
  }, [isLoading, profile, navigate]);

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const completedIds = new Set(progress.map(p => p.lesson_id));
  const filteredTracks = tracks.filter(t =>
    t.for_user_type === 'both' || t.for_user_type === profile.user_type
  );

  // Find the very next lesson across all tracks in order
  const findNextLesson = () => {
    for (const track of filteredTracks) {
      const trackModules = modules
        .filter(m => m.track_id === track.id)
        .sort((a, b) => a.order_index - b.order_index);
      for (const mod of trackModules) {
        const modLessons = allLessons
          .filter(l => l.module_id === mod.id)
          .sort((a, b) => a.order_index - b.order_index);
        for (const lesson of modLessons) {
          if (!completedIds.has(lesson.id)) return { lesson, module: mod, track };
        }
      }
    }
    return null;
  };

  const getTrackProgress = (track) => {
    const tLessons = allLessons.filter(l => l.track_id === track.id);
    const done = tLessons.filter(l => completedIds.has(l.id)).length;
    return { done, total: tLessons.length, pct: tLessons.length > 0 ? Math.round((done / tLessons.length) * 100) : 0 };
  };

  const next = findNextLesson();

  // Determine current mastery level from the next track or most progressed
  const currentLevel = next?.track?.mastery_level || filteredTracks[0]?.mastery_level || 'foundations';
  const currentLevelLabel = MASTERY_LABELS[currentLevel] || 'Foundations';

  // Overall progress across all lessons
  const totalLessons = allLessons.length;
  const totalDone = completedIds.size;
  const overallPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{currentLevelLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight">Your Path</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold">{profile.streak_days || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
            <Star className="w-4 h-4" />
            <span className="text-sm font-bold">{profile.total_xp || 0}</span>
          </div>
        </div>
      </motion.div>

      {/* Primary CTA — Next Lesson */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        {next ? (
          <button
            onClick={() => navigate(`/Lesson/${next.lesson.id}`, { state: { lesson: next.lesson, module: next.module, track: next.track } })}
            className="w-full p-5 rounded-3xl bg-foreground text-background text-left hover:opacity-90 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
                {next.track.icon || TRACK_ICONS[next.track.category]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium opacity-60 mb-0.5">{next.track.title} · {next.module.title}</p>
                <p className="font-bold text-lg leading-tight">{next.lesson.title}</p>
                <p className="text-sm opacity-60 mt-1">{next.lesson.duration_minutes} min · +{next.lesson.xp_reward} XP</p>
              </div>
              <PlayCircle className="w-9 h-9 opacity-70 flex-shrink-0 mt-1" />
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm font-semibold">Continue Learning</p>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </div>
          </button>
        ) : (
          <div className="w-full p-5 rounded-3xl bg-muted text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-bold">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">Check back when new lessons are published.</p>
          </div>
        )}
      </motion.div>

      {/* Overall progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-semibold">Overall Progress</span>
          <span>{totalDone}/{totalLessons} lessons · {overallPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full bg-foreground"
          />
        </div>
      </motion.div>

      {/* Track progress pills */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tracks</h2>
          <button onClick={() => navigate('/Learn')} className="text-xs font-semibold flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {filteredTracks.map((track, i) => {
            const { done, total, pct } = getTrackProgress(track);
            const allDone = done === total && total > 0;
            return (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                onClick={() => navigate('/Learn', { state: { activeTrack: track.id } })}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-border hover:shadow-sm transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
                  {track.icon || TRACK_ICONS[track.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{track.title}</p>
                    {allDone
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                      : <span className="text-xs text-muted-foreground">{done}/{total}</span>
                    }
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}