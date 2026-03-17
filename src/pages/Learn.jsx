import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ChevronRight, Lock, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRACK_ICONS } from '@/lib/curriculumData';

export default function Learn() {
  const navigate = useNavigate();
  const [activeTrackId, setActiveTrackId] = useState(null);

  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['curriculumTracks'],
    queryFn: () => base44.entities.CurriculumTrack.filter({ is_published: true }, 'order_index', 50),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];

  const { data: progress = [] } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => base44.entities.UserProgress.list('-created_date', 500),
  });

  const completedLessonIds = new Set(progress.map(p => p.lesson_id));

  const filteredTracks = tracks.filter(t =>
    t.for_user_type === 'both' || t.for_user_type === profile?.user_type || !profile
  );

  if (tracksLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (filteredTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-3xl">📚</div>
        <p className="font-semibold mb-1">No curriculum yet</p>
        <p className="text-sm text-muted-foreground mb-4">Ask an admin to publish the curriculum.</p>
        {profile?.role === 'admin' && (
          <button onClick={() => navigate('/Admin')} className="text-sm font-semibold underline">
            Go to Admin Portal
          </button>
        )}
      </div>
    );
  }

  return (
    const MASTERY_LABELS = {
    foundations: 'Foundations',
    practitioner: 'Practitioner',
    teacher_200: 'Teacher (200hr)',
    advanced_300: 'Advanced Teacher (300hr)',
    mastery_500: 'Mastery (500hr)',
  };

  // Group tracks by mastery level
  const levelOrder = ['foundations', 'practitioner', 'teacher_200', 'advanced_300', 'mastery_500'];
  const tracksByLevel = levelOrder
    .map(lv => ({ lv, label: MASTERY_LABELS[lv], tracks: filteredTracks.filter(t => (t.mastery_level || 'foundations') === lv) }))
    .filter(g => g.tracks.length > 0);
  const ungrouped = filteredTracks.filter(t => !t.mastery_level);

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Your Path</h1>
      <p className="text-sm text-muted-foreground mb-6">Follow the curriculum, unlock each lesson</p>

      {/* Track selector */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveTrackId(null)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all",
            !activeTrackId ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-muted-foreground"
          )}
        >All</button>
        {filteredTracks.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTrackId(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all",
              activeTrackId === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-muted-foreground"
            )}
          >
            <span>{t.icon || TRACK_ICONS[t.category]}</span> {t.title}
          </button>
        ))}
      </div>

      {/* Grouped by mastery level */}
      <div className="space-y-6">
        {(tracksByLevel.length > 0 ? tracksByLevel : [{ lv: 'all', label: null, tracks: filteredTracks }]).map(group => (
          <div key={group.lv}>
            {group.label && tracksByLevel.length > 1 && (
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">{group.label}</p>
            )}
            <div className="space-y-4">
              {group.tracks
                .filter(t => !activeTrackId || t.id === activeTrackId)
                .map(track => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    completedLessonIds={completedLessonIds}
                    onLessonClick={(lesson, module) => navigate(`/Lesson/${lesson.id}`, { state: { lesson, module, track } })}
                  />
                ))}
            </div>
          </div>
        ))}
        {ungrouped.filter(t => !activeTrackId || t.id === activeTrackId).map(track => (
          <TrackCard
            key={track.id}
            track={track}
            completedLessonIds={completedLessonIds}
            onLessonClick={(lesson, module) => navigate(`/Lesson/${lesson.id}`, { state: { lesson, module, track } })}
          />
        ))}
      </div>
    </div>
  );
}

function TrackCard({ track, completedLessonIds, onLessonClick }) {
  const [expanded, setExpanded] = useState(true);

  const { data: modules = [] } = useQuery({
    queryKey: ['modules', track.id],
    queryFn: () => base44.entities.CurriculumModule.filter({ track_id: track.id, is_published: true }, 'order_index', 20),
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ['trackLessons', track.id],
    queryFn: () => base44.entities.CurriculumLesson.filter({ track_id: track.id, is_published: true }, 'order_index', 100),
  });

  // Count completed for this track
  const trackCompleted = allLessons.filter(l => completedLessonIds.has(l.id)).length;
  const trackTotal = allLessons.length;
  const progressPct = trackTotal > 0 ? Math.round((trackCompleted / trackTotal) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-white">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
          {track.icon || TRACK_ICONS[track.category]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{track.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{trackCompleted}/{trackTotal}</span>
          </div>
        </div>
        <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform flex-shrink-0", expanded && "rotate-90")} />
      </button>

      {expanded && modules.length > 0 && (
        <div className="border-t border-border">
          {modules.map((mod, mi) => {
            const modLessons = allLessons
              .filter(l => l.module_id === mod.id)
              .sort((a, b) => a.order_index - b.order_index);

            // Determine unlock: first module always unlocked, subsequent need prev module complete
            const prevModLessons = mi === 0 ? [] : allLessons
              .filter(l => l.module_id === modules[mi - 1]?.id);
            const prevModDone = mi === 0 || prevModLessons.every(l => completedLessonIds.has(l.id));

            return (
              <ModuleSection
                key={mod.id}
                module={mod}
                lessons={modLessons}
                isUnlocked={prevModDone}
                completedLessonIds={completedLessonIds}
                onLessonClick={(lesson) => onLessonClick(lesson, mod)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModuleSection({ module, lessons, isUnlocked, completedLessonIds, onLessonClick }) {
  return (
    <div className="border-t border-border first:border-t-0">
      <div className={cn("px-4 py-2.5 flex items-center gap-2", !isUnlocked && "opacity-50")}>
        {!isUnlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{module.title}</p>
      </div>
      <div className="pb-2">
        {lessons.map((lesson, li) => {
          const isDone = completedLessonIds.has(lesson.id);
          // Lesson is unlocked if module is unlocked AND all previous lessons in this module are done
          const prevLessonsDone = lessons.slice(0, li).every(l => completedLessonIds.has(l.id));
          const isLessonUnlocked = isUnlocked && (li === 0 || prevLessonsDone);

          return (
            <motion.button
              key={lesson.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: li * 0.03 }}
              onClick={() => isLessonUnlocked && onLessonClick(lesson)}
              disabled={!isLessonUnlocked}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                isLessonUnlocked && !isDone && "hover:bg-muted/50 cursor-pointer",
                !isLessonUnlocked && "cursor-not-allowed opacity-40"
              )}
            >
              {/* Status icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isDone ? "bg-foreground" : isLessonUnlocked ? "bg-muted border-2 border-border" : "bg-muted"
              )}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-background" />
                ) : isLessonUnlocked ? (
                  <PlayCircle className="w-4 h-4 text-foreground" />
                ) : (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>

              {/* Lesson info */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", isDone && "line-through text-muted-foreground")}>{lesson.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lesson.duration_minutes} min · +{lesson.xp_reward} XP
                </p>
              </div>

              {isLessonUnlocked && !isDone && (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}