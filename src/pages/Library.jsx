import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JOURNEYS } from '@/lib/journeyData';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = {
  asana: { icon: '🧘', label: 'Asana' },
  anatomy: { icon: '🫀', label: 'Anatomy' },
  breathwork: { icon: '🌬️', label: 'Breathwork' },
  philosophy: { icon: '📿', label: 'Philosophy' },
  cueing: { icon: '🗣️', label: 'Cueing' },
  programming: { icon: '📋', label: 'Programming' },
};

export default function Library() {
  const [activeLesson, setActiveLesson] = useState(null);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];
  const savedIds = profile?.saved_lessons || [];

  const { data: allLessons = [], isLoading } = useQuery({
    queryKey: ['savedLessons', savedIds.join(',')],
    queryFn: async () => {
      if (!savedIds.length) return [];
      const all = await base44.entities.Lesson.list('-created_date', 200);
      return all.filter(l => savedIds.includes(l.id));
    },
    enabled: !!profile,
  });

  const unsaveLesson = async (lessonId) => {
    if (!profile) return;
    const updated = savedIds.filter(id => id !== lessonId);
    await base44.entities.UserProfile.update(profile.id, { saved_lessons: updated });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    if (activeLesson?.id === lessonId) setActiveLesson(null);
  };

  if (activeLesson) {
    const cat = CATEGORIES[activeLesson.category] || { icon: '📖', label: activeLesson.category };
    const isSaved = savedIds.includes(activeLesson.id);
    return (
      <div className="min-h-screen max-w-lg mx-auto px-5 pt-12 pb-28">
        <button onClick={() => setActiveLesson(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </button>

        <div className="flex items-start justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium">
            {cat.icon} {cat.label}
          </div>
          <button
            onClick={() => unsaveLesson(activeLesson.id)}
            className="p-2 rounded-full hover:bg-muted transition-all"
          >
            <Heart className="w-5 h-5 fill-foreground text-foreground" />
          </button>
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
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-5 h-5 fill-foreground" />
        <h1 className="text-2xl font-bold">Saved Lessons</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Your bookmarked micro-lessons</p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      ) : allLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold mb-1">No saved lessons yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Tap the heart icon on any lesson to save it here for quick review.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {allLessons.map((lesson, i) => {
            const cat = CATEGORIES[lesson.category] || { icon: '📖', label: lesson.category };
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border"
              >
                <button
                  onClick={() => setActiveLesson(lesson)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.label} · {lesson.duration_minutes || 3} min · {lesson.difficulty}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => unsaveLesson(lesson.id)}
                  className="p-1.5 rounded-full hover:bg-muted transition-all flex-shrink-0"
                >
                  <Heart className="w-4 h-4 fill-foreground text-foreground" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}