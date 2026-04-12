import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/lib/yogaData';
import { ArrowLeft, Clock, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function Lessons() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCat = urlParams.get('category') || 'asana';

  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', activeCategory],
    queryFn: () => base44.entities.Lesson.filter({ category: activeCategory }),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];

  const generateLesson = async () => {
    setGenerating(true);
    const cat = CATEGORIES[activeCategory];
    const level = profile?.skills?.[activeCategory] > 60 ? 'advanced' : profile?.skills?.[activeCategory] > 30 ? 'intermediate' : 'beginner';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Generate a short yoga lesson (2-5 minutes reading time) for category "${cat.label}" at ${level} level.

Include:
1. A catchy title
2. A brief description (1 sentence)
3. Main content with:
   - Key concepts or pose breakdown
   - Anatomy connection
   - Breath instructions
   - Teaching cues (if relevant)
   - Modifications
   - Common mistakes to avoid
   - A philosophical insight

Format the content in markdown. Keep it concise and practical.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          duration_minutes: { type: 'number' },
          difficulty: { type: 'string' },
          pose_tags: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const lesson = await base44.entities.Lesson.create({
      ...result,
      category: activeCategory,
      for_user_type: 'both',
      xp_reward: 15,
    });

    queryClient.invalidateQueries({ queryKey: ['lessons', activeCategory] });
    setGenerating(false);
    setSelectedLesson(lesson);
    setGeneratedContent(lesson);
  };

  const completeLesson = async (lesson) => {
    const today = new Date().toISOString().split('T')[0];
    await base44.entities.LessonCompletion.create({
      lesson_id: lesson.id,
      category: activeCategory,
      xp_earned: lesson.xp_reward || 10,
      completed_date: today,
    });

    if (profile) {
      const newSkills = { ...profile.skills };
      newSkills[activeCategory] = Math.min((newSkills[activeCategory] || 0) + 3, 100);
      await base44.entities.UserProfile.update(profile.id, {
        skills: newSkills,
        total_lessons_completed: (profile.total_lessons_completed || 0) + 1,
        total_xp: (profile.total_xp || 0) + (lesson.xp_reward || 10),
        last_active_date: today,
        daily_goals_completed_today: (profile.daily_goals_completed_today || 0) + 1,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }

    setSelectedLesson(null);
  };

  if (selectedLesson) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto px-5 pt-14 pb-24">
        <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to lessons
        </button>
        <Badge className="mb-3">{CATEGORIES[activeCategory]?.icon} {CATEGORIES[activeCategory]?.label}</Badge>
        <h1 className="text-2xl font-bold mb-2">{selectedLesson.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedLesson.duration_minutes || 3} min</span>
          <span className="capitalize">{selectedLesson.difficulty}</span>
        </div>
        <div className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0">
          <ReactMarkdown>{selectedLesson.content || selectedLesson.description || 'No content available.'}</ReactMarkdown>
        </div>
        <div className="mt-8">
          <Button
            onClick={() => completeLesson(selectedLesson)}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Complete Lesson (+{selectedLesson.xp_reward || 10} XP)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Learn</h1>
      <p className="text-sm text-muted-foreground mb-6">Short lessons tailored to your level</p>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 scrollbar-hide">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeCategory === key
                ? "bg-primary text-primary-foreground"
                : "bg-white border border-border text-muted-foreground"
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={generateLesson}
        disabled={generating}
        className="w-full mt-4 mb-6 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating lesson...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate a new lesson</>
        )}
      </motion.button>

      {/* Lesson list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-3 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No lessons yet. Generate your first one!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lessons.map((lesson, i) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedLesson(lesson)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border cursor-pointer hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                {CATEGORIES[activeCategory]?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{lesson.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lesson.duration_minutes || 3} min · {lesson.difficulty} · +{lesson.xp_reward || 10} XP
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}