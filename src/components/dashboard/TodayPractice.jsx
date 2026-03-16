import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY_ITEMS = [
  { id: 'asana', label: 'Asana drill', minutes: 3, icon: '🧘' },
  { id: 'anatomy', label: 'Anatomy insight', minutes: 2, icon: '🦴' },
  { id: 'cue', label: 'Cueing practice', minutes: 3, icon: '🗣️' },
];

export default function TodayPractice({ completedCount = 0 }) {
  const total = TODAY_ITEMS.reduce((sum, i) => sum + i.minutes, 0);
  const allDone = completedCount >= TODAY_ITEMS.length;

  return (
    <div className="p-5 rounded-2xl border border-border bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold">Today's Practice</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" /> ~{total} min total
          </p>
        </div>
        {allDone && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-foreground text-background">
            Done ✓
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {TODAY_ITEMS.map((item, i) => {
          const done = i < completedCount;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3"
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                done ? "bg-foreground" : "bg-muted"
              )}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-background" />
                  : <span className="text-sm">{item.icon}</span>
                }
              </div>
              <div className="flex-1">
                <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                  {item.label}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{item.minutes}m</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}