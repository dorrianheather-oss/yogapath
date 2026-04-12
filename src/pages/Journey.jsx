import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, Clock, Heart, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getJourney } from '@/lib/journeyData';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function Journey() {
  const navigate = useNavigate();
  const { journeyId = 'asana' } = useParams();
  const journey = getJourney(journeyId);

  const [selectedFocus, setSelectedFocus] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [currentMastery, setCurrentMastery] = useState(null);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', journey?.categoryKey, selectedFocus],
    queryFn: () => base44.entities.Lesson.filter({
      category: journey?.categoryKey,
      ...(selectedFocus ? { pose_tags: selectedFocus } : {}),
    }),
    enabled: !!journey,
  });

  const skillScore = profile?.skills?.[journey?.categoryKey] || 0;
  const level = skillScore >= 60 ? 'advanced' : skillScore >= 30 ? 'intermediate' : 'beginner';

  const generateLesson = async () => {
    if (!journey) return;
    setGenerating(true);
    const focusObj = journey.focuses.find(f => f.id === selectedFocus);

    const response = await base44.functions.invoke('generateAdaptiveLesson', {
      journeyId: journey.id,
      categoryKey: journey.categoryKey,
      focusId: selectedFocus || null,
      focusLabel: focusObj?.label || journey.label,
    });

    const { lesson, mastery } = response.data;
    setCurrentMastery(mastery);
    queryClient.invalidateQueries({ queryKey: ['lessons', journey.categoryKey] });
    setGenerating(false);
    setActiveLesson(lesson);
  };

  const completeLesson = async () => {
    if (!activeLesson || !profile) return;
    const today = new Date().toISOString().split('T')[0];

    await base44.entities.LessonCompletion.create({
      lesson_id: activeLesson.id,
      category: journey.categoryKey,
      xp_earned: activeLesson.xp_reward || 15,
      completed_date: today,
    });

    const newSkills = { ...profile.skills };
    newSkills[journey.categoryKey] = Math.min((newSkills[journey.categoryKey] || 0) + 3, 100);

    await base44.entities.UserProfile.update(profile.id, {
      skills: newSkills,
      total_lessons_completed: (profile.total_lessons_completed || 0) + 1,
      total_xp: (profile.total_xp || 0) + (activeLesson.xp_reward || 15),
      last_active_date: today,
      daily_goals_completed_today: (profile.daily_goals_completed_today || 0) + 1,
    });

    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setActiveLesson(null);
  };

  if (!journey) {
    navigate('/Dashboard');
    return null;
  }

  const savedIds = profile?.saved_lessons || [];
  const isLessonSaved = activeLesson ? savedIds.includes(activeLesson.id) : false;

  const toggleSaveLesson = async () => {
    if (!profile || !activeLesson) return;
    const updated = isLessonSaved
      ? savedIds.filter(id => id !== activeLesson.id)
      : [...savedIds, activeLesson.id];
    await base44.entities.UserProfile.update(profile.id, { saved_lessons: updated });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  // Lesson reading view
  if (activeLesson) {
    return (
      <div className="min-h-screen max-w-lg mx-auto px-5 pt-12 pb-28">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setActiveLesson(null)} className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={toggleSaveLesson}
            className="p-2 rounded-full hover:bg-muted transition-all"
            title={isLessonSaved ? 'Remove from saved' : 'Save lesson'}
          >
            <Heart className={cn("w-5 h-5 transition-all", isLessonSaved ? "fill-foreground text-foreground" : "text-muted-foreground")} />
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium">
            {journey.icon} {journey.label}
          </div>
          {currentMastery && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-xs font-medium">
              {currentMastery.tier} · {currentMastery.score}/100
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">{activeLesson.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeLesson.duration_minutes || 3} min</span>
          <span className="capitalize">{activeLesson.difficulty}</span>
          <span className="font-medium">+{activeLesson.xp_reward || 15} XP</span>
        </div>
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{activeLesson.content || activeLesson.description}</ReactMarkdown>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-lg mx-auto">
            <Button onClick={completeLesson} className="w-full h-14 rounded-2xl text-base font-semibold">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Complete (+{activeLesson.xp_reward || 15} XP)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 pt-12 pb-28">
      {/* Header */}
      <button onClick={() => navigate('/Dashboard')} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> All journeys
      </button>

      <div className="flex items-center gap-3 mb-1">
        <span className="text-4xl">{journey.icon}</span>
        <div>
          <h1 className="text-2xl font-bold">{journey.label}</h1>
          <p className="text-sm text-muted-foreground">{journey.description}</p>
        </div>
      </div>

      {/* Mastery progress */}
      <div className="mt-4 p-4 rounded-2xl bg-muted">
        <div className="flex justify-between text-xs font-medium mb-1.5">
          <span>Your mastery</span>
          <span>{skillScore}/100</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${skillScore}%` }} />
        </div>
      </div>

      {/* Focus areas */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3">Choose your focus</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFocus(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border transition-all",
              !selectedFocus ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-muted-foreground"
            )}
          >
            All
          </button>
          {journey.focuses.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFocus(f.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                selectedFocus === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-muted-foreground"
              )}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={generateLesson}
        disabled={generating}
        className="w-full mt-6 p-4 rounded-2xl border-2 border-dashed border-border bg-white flex items-center justify-center gap-2 text-sm font-semibold hover:bg-muted transition-all disabled:opacity-50"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating lesson...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate a micro-lesson</>
        )}
      </motion.button>

      {/* Past lessons */}
      {lessons.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-3">Past lessons</h2>
          <div className="space-y-2.5">
            {lessons.map((lesson, i) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActiveLesson(lesson)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border cursor-pointer hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
                  {journey.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lesson.duration_minutes || 3} min · {lesson.difficulty} · +{lesson.xp_reward || 15} XP
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}