import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGES, RARITY_STYLES } from '@/lib/badgeEngine';

/**
 * Shows a stack of animated toasts for newly unlocked badges.
 * Props:
 *  - newBadgeIds: string[]
 *  - onDismiss: () => void  (called after last badge auto-dismisses)
 */
export default function BadgeUnlockToast({ newBadgeIds = [], onDismiss }) {
  const badges = newBadgeIds
    .map(id => BADGES.find(b => b.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (badges.length === 0) return;
    const timer = setTimeout(onDismiss, 3500 + (badges.length - 1) * 600);
    return () => clearTimeout(timer);
  }, [badges.length, onDismiss]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {badges.map((badge, i) => {
          const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: -40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ delay: i * 0.18, type: 'spring', stiffness: 320, damping: 22 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${rarity.bg} ${rarity.border} pointer-events-auto`}
            >
              {/* Pulse ring */}
              <div className="relative flex-shrink-0">
                <motion.div
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.18 + 0.2 }}
                  className="absolute inset-0 rounded-full bg-amber-300"
                />
                <span className="text-2xl relative z-10">{badge.icon}</span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Badge Unlocked!</p>
                <p className="font-bold text-sm">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${rarity.label} ml-1`}>
                {badge.rarity}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}