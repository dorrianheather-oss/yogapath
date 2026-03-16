import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Star, ChevronRight, PlayCircle, CheckCircle2, Lock } from 'lucide-react';
import { TRACK_ICONS } from '@/lib/curriculumData';
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

  // Find the "next up" lesson across all tracks
  const getNextLesson = (track) => {
    const trackModules = modules
      .filter(m => m.track_id === track.id)
      .sort((a, b) => a.order_index - b.order_index);

    for (const mod of trackModules) {
      const modLessons = allLessons
        .filter(l => l.module_id === mod.id)
        .sort((a, b) => a.order_index - b.order_index);
      for (const lesson of modLessons) {
        if (!completedIds.has(lesson.id)) return { lesson, module: mod };
      }
    }
    return null; // All done
  };

  const getTrackProgress = (track) => {
    const tLessons = allLessons.filter(l => l.track_id === track.id);
    const done = tLessons.filter(l => completedIds.has(l.id)).length;
    return { done, total: tLessons.length, pct: tLessons.length > 0 ? Math.round((done / tLessons.length) * 100) : 0 };
  };

  const totalCompleted = progress.length;

  return (
    <div className="px-5 pt-12 pb-24 space-y-8 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.user_type === 'teacher' ? 'Teacher' : 'Practitioner'}
            </h1>
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
        </div>
      </motion.div>

      {/* Continue learning — next lesson */}
      {filteredTracks.length > 0 && (() => {
        const nextItems = filteredTracks
          .map(t => ({ track: t, ...getNextLesson(t) }))
          .filter(x => x.lesson)
          .slice(0, 1);

        if (nextItems.length === 0) return null;
        const { track, lesson, module: mod } = nextItems[0];

        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Continue Learning</h2>
            <button
              onClick={() => navigate(`/Lesson/${lesson.id}`, { state: { lesson, module: mod, track } })}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-foreground text-background hover:opacity-90 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                {track.icon || TRACK_ICONS[track.category]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium opacity-70 mb-0.5">{track.title} · {mod?.title}</p>
                <p className="font-bold text-sm leading-tight">{lesson.title}</p>
                <p className="text-xs opacity-60 mt-0.5">{lesson.duration_minutes} min · +{lesson.xp_reward} XP</p>
              </div>
              <PlayCircle className="w-8 h-8 opacity-80 flex-shrink-0" />
            </button>
          </motion.div>
        );
      })()}

      {/* Track progress overview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Tracks</h2>
          <button onClick={() => navigate('/Learn')} className="text-xs font-semibold flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2.5">
          {filteredTracks.map((track, i) => {
            const { done, total, pct } = getTrackProgress(track);
            const next = getNextLesson(track);
            const allDone = done === total && total > 0;

            return (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => navigate('/Learn', { state: { activeTrack: track.id } })}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-border hover:shadow-sm transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {track.icon || TRACK_ICONS[track.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{track.title}</p>
                    <span className="text-xs text-muted-foreground">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {next?.lesson && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">Next: {next.lesson.title}</p>
                  )}
                  {allDone && (
                    <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Complete
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Lessons Done', value: totalCompleted },
            { label: 'Total XP', value: profile.total_xp || 0 },
            { label: 'Day Streak', value: profile.streak_days || 0 },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-2xl bg-white border border-border text-center">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}