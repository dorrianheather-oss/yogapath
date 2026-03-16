import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGES, RARITY_STYLES } from '@/lib/badgeEngine';
import { cn } from '@/lib/utils';

const FILTERS = ['all', 'common', 'uncommon', 'rare', 'epic'];

export default function BadgeGrid({ earnedIds = new Set() }) {
  const [filter, setFilter] = useState('all');

  const visible = BADGES.filter(b => filter === 'all' || b.rarity === filter);
  const earnedCount = BADGES.filter(b => earnedIds.has(b.id)).length;

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{earnedCount}</span> / {BADGES.length} unlocked
        </p>
        <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${(earnedCount / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Rarity filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-5 px-5 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize border transition-all",
              filter === f
                ? "bg-foreground text-background border-foreground"
                : "bg-white border-border text-muted-foreground"
            )}
          >{f}</button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <AnimatePresence mode="popLayout">
          {visible.map((badge, i) => {
            const earned = earnedIds.has(badge.id);
            const rarity = RARITY_STYLES[badge.rarity];
            return (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all relative",
                  earned ? `${rarity.bg} ${rarity.border}` : "bg-muted/40 border-border opacity-40 grayscale"
                )}
              >
                {earned && (
                  <span className={cn(
                    "absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                    rarity.label
                  )}>
                    {badge.rarity}
                  </span>
                )}
                <span className="text-2xl block mb-1.5">{badge.icon}</span>
                <p className="font-semibold text-[11px] leading-tight">{badge.title}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}