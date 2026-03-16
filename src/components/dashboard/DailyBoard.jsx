import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAILY_GOALS = [
  { id: 'pose', label: 'Pose breakdown', description: 'Learn one pose in depth', icon: '🧘', minutes: 3 },
  { id: 'anatomy', label: 'Anatomy insight', description: 'Understand a body part', icon: '🦴', minutes: 2 },
  { id: 'breathwork', label: 'Breathwork drill', description: 'Practice pranayama', icon: '🌬️', minutes: 3 },
  { id: 'cue', label: 'Cueing practice', description: 'Learn teaching cues', icon: '🗣️', minutes: 2 },
];

export default function DailyBoard({ completedCount = 0, streak = 0 }) {
  const totalMinutes = DAILY_GOALS.reduce((sum, g) => sum + g.minutes, 0);

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Daily Board</h2>
          <p className="text-xs text-muted-foreground">~{totalMinutes} min today</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-bold">{streak}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {DAILY_GOALS.map((goal, i) => {
          const isCompleted = i < completedCount;
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-2xl border transition-all",
                isCompleted
                  ? "bg-sage-50 border-sage-200"
                  : "bg-white border-border"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isCompleted ? "bg-sage-200" : "bg-muted"
              )}>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-sage-700" />
                ) : (
                  <span className="text-lg">{goal.icon}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {goal.label}
                </p>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {goal.minutes}m
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}