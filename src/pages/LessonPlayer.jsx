import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle2, Heart, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { TRACK_ICONS } from '@/lib/curriculumData';

const FOCUS_FILTERS = [
  { id: 'all', label: 'Full Lesson' },
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'cueing', label: 'Teaching Cues' },
  { id: 'modifications', label: 'Modifications' },
  { id: 'mechanics', label: 'Mechanics' },
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-muted text-muted-foreground',
  intermediate: 'bg-muted text-muted-foreground',
  advanced: 'bg-foreground text-background',
};

export default function LessonPlayer() {
  const { lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Use state passed via navigation, or fetch if direct URL
  const stateLesson = location.state?.lesson;
  const stateModule = location.state?.module;
  const stateTrack = location.state?.track;

  const { data: fetchedLesson } = useQuery({
    queryKey: ['curriculumLesson', lessonId],
    queryFn: () => base44.entities.CurriculumLesson.filter({ id: lessonId }),
    enabled: !stateLesson && !!lessonId,
    select: (data) => data[0],
  });

  const lesson = stateLesson || fetchedLesson;

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];

  const { data: progress = [] } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => base44.entities.UserProgress.list('-created_date', 500),
  });

  const isCompleted = progress.some(p => p.lesson_id === lessonId);
  const savedIds = profile?.saved_lessons || [];
  const isSaved = savedIds.includes(lessonId);

  const toggleSave = async () => {
    if (!profile) return;
    const updated = isSaved
      ? savedIds.filter(id => id !== lessonId)
      : [...savedIds, lessonId];
    await base44.entities.UserProfile.update(profile.id, { saved_lessons: updated });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  const generateContent = async () => {
    if (!lesson || !profile) return;
    setGenerating(true);
    const response = await base44.functions.invoke('generateAdaptiveLesson', {
      journeyId: stateTrack?.category || lesson.track_id,
      categoryKey: stateTrack?.category || 'asana',
      focusId: null,
      focusLabel: lesson.title,
    });
    const { lesson: generated } = response.data;
    // Update the curriculum lesson content
    await base44.entities.CurriculumLesson.update(lessonId, { content: generated.content });
    queryClient.invalidateQueries({ queryKey: ['curriculumLesson', lessonId] });
    setGenerating(false);
  };

  const completeLesson = async () => {
    if (!lesson || !profile || isCompleted) return;
    setCompleting(true);

    await base44.entities.UserProgress.create({
      lesson_id: lessonId,
      module_id: lesson.module_id,
      track_id: lesson.track_id,
      completed_at: new Date().toISOString(),
      xp_earned: lesson.xp_reward || 15,
    });

    const newSkills = { ...(profile.skills || {}) };
    const cat = stateTrack?.category || 'asana';
    newSkills[cat] = Math.min((newSkills[cat] || 0) + 3, 100);

    await base44.entities.UserProfile.update(profile.id, {
      skills: newSkills,
      total_lessons_completed: (profile.total_lessons_completed || 0) + 1,
      total_xp: (profile.total_xp || 0) + (lesson.xp_reward || 15),
      last_active_date: new Date().toISOString().split('T')[0],
      daily_goals_completed_today: (profile.daily_goals_completed_today || 0) + 1,
    });

    queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setCompleting(false);
    navigate(-1);
  };

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const trackIcon = stateTrack?.icon || TRACK_ICONS[stateTrack?.category] || '📖';
  const hasContent = !!(lesson.content || lesson.description);

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 pt-12 pb-32">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={toggleSave} className="p-2 rounded-full hover:bg-muted transition-all">
          <Heart className={cn("w-5 h-5 transition-all", isSaved ? "fill-foreground text-foreground" : "text-muted-foreground")} />
        </button>
      </div>

      {/* Track + Module breadcrumb */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-xs text-muted-foreground">{trackIcon} {stateTrack?.title || 'Track'}</span>
        {stateModule && (
          <>
            <span className="text-xs text-muted-foreground">›</span>
            <span className="text-xs text-muted-foreground">{stateModule.title}</span>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Badge variant="secondary" className={cn("capitalize text-xs", DIFFICULTY_COLORS[lesson.difficulty])}>
          {lesson.difficulty}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> {lesson.duration_minutes} min
        </span>
        <span className="text-xs font-semibold">+{lesson.xp_reward} XP</span>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        )}
      </div>

      {/* Focus filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-5 px-5 mb-6 scrollbar-hide">
        {FOCUS_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all",
              activeFilter === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-muted-foreground"
            )}
          >{f.label}</button>
        ))}
      </div>

      {/* Content */}
      {hasContent ? (
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-sm max-w-none"
        >
          <ReactMarkdown>{lesson.content || lesson.description}</ReactMarkdown>
          {activeFilter !== 'all' && (
            <div className="mt-6 p-4 rounded-2xl bg-muted border border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                🔍 {FOCUS_FILTERS.find(f => f.id === activeFilter)?.label} Focus
              </p>
              <p className="text-sm text-muted-foreground">
                Filter view coming soon — the full lesson content covers this perspective.
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-2xl">✍️</div>
          <p className="font-semibold mb-1">No content yet</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Generate AI-powered lesson content tailored to your mastery level.
          </p>
          <Button onClick={generateContent} disabled={generating} className="rounded-2xl gap-2">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Content</>}
          </Button>
        </div>
      )}

      {/* Complete CTA */}
      {hasContent && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-lg mx-auto">
            {isCompleted ? (
              <div className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-muted text-muted-foreground text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" /> Lesson Completed
              </div>
            ) : (
              <Button onClick={completeLesson} disabled={completing} className="w-full h-14 rounded-2xl text-base font-semibold">
                {completing
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><CheckCircle2 className="w-5 h-5 mr-2" /> Mark Complete (+{lesson.xp_reward} XP)</>
                }
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}