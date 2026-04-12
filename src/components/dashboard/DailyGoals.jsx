import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Flame, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'yogapath_daily_goals';
const BONUS_XP = 25;

const PRESET_GOALS = [
  { label: '10 mins of breathwork', icon: '🌬️', minutes: 10 },
  { label: '5 mins of meditation', icon: '🧘', minutes: 5 },
  { label: 'Study anatomy today', icon: '🦴', minutes: 8 },
  { label: 'Watch a cueing lesson', icon: '🗣️', minutes: 6 },
  { label: 'Practice a new pose', icon: '🌿', minutes: 10 },
  { label: 'Read philosophy notes', icon: '📿', minutes: 5 },
  { label: 'Plan tomorrow\'s class', icon: '📋', minutes: 10 },
  { label: 'Review muscle groups', icon: '💪', minutes: 7 },
];

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getStoredGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) {
      // New day — carry over goals but reset completion
      return {
        date: getTodayKey(),
        goals: (parsed.goals || []).map(g => ({ ...g, done: false })),
        bonusClaimed: false,
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveGoals(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, date: getTodayKey() }));
}

// SVG Progress Ring
function ProgressRing({ pct, size = 56, stroke = 5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--foreground))" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

export default function DailyGoals({ profile }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState(() => getStoredGoals() || { date: getTodayKey(), goals: [], bonusClaimed: false });
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [customText, setCustomText] = useState('');
  const [bonusFlash, setBonusFlash] = useState(false);

  const goals = state.goals;
  const doneCount = goals.filter(g => g.done).length;
  const total = goals.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  // Persist on every state change
  useEffect(() => {
    saveGoals(state);
  }, [state]);

  // Award bonus XP when all goals completed and not yet claimed
  useEffect(() => {
    if (allDone && !state.bonusClaimed && profile) {
      setState(s => ({ ...s, bonusClaimed: true }));
      setBonusFlash(true);
      base44.entities.UserProfile.update(profile.id, {
        total_xp: (profile.total_xp || 0) + BONUS_XP,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      });
      setTimeout(() => setBonusFlash(false), 3000);
    }
  }, [allDone, state.bonusClaimed, profile, queryClient]);

  const toggleGoal = (idx) => {
    setState(s => {
      const goals = s.goals.map((g, i) => i === idx ? { ...g, done: !g.done } : g);
      return { ...s, goals };
    });
  };

  const addPreset = (preset) => {
    setState(s => ({
      ...s,
      goals: [...s.goals, { id: Date.now(), label: preset.label, icon: preset.icon, done: false }],
    }));
    setShowAdd(false);
  };

  const addCustom = () => {
    if (!customText.trim()) return;
    setState(s => ({
      ...s,
      goals: [...s.goals, { id: Date.now(), label: customText.trim(), icon: '🎯', done: false }],
    }));
    setCustomText('');
    setShowAdd(false);
  };

  const removeGoal = (idx) => {
    setState(s => ({ ...s, goals: s.goals.filter((_, i) => i !== idx) }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      {/* Bonus flash */}
      <AnimatePresence>
        {bonusFlash && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background text-sm font-semibold justify-center"
          >
            <Gift className="w-4 h-4" />
            All goals done! +{BONUS_XP} Bonus XP earned 🎉
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-3 p-4 text-left"
        >
          {/* Progress ring */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <ProgressRing pct={pct} />
            <span className="absolute text-[11px] font-bold">
              {total === 0 ? '—' : `${pct}%`}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm">Daily Goals</p>
              {allDone && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-foreground bg-muted px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" /> Done!
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total === 0
                ? 'Add micro-commitments for today'
                : `${doneCount}/${total} completed${allDone && state.bonusClaimed ? ` · +${BONUS_XP} XP earned` : !allDone ? ` · +${BONUS_XP} XP on completion` : ''}`
              }
            </p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">
                {/* Goal list */}
                {goals.length > 0 && (
                  <div className="divide-y divide-border">
                    {goals.map((goal, i) => (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <button
                          onClick={() => toggleGoal(i)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            goal.done
                              ? "bg-foreground border-foreground"
                              : "border-border hover:border-foreground/40"
                          )}
                        >
                          {goal.done && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                        </button>
                        <span className="text-sm mr-0.5">{goal.icon}</span>
                        <p className={cn(
                          "flex-1 text-sm",
                          goal.done && "line-through text-muted-foreground"
                        )}>
                          {goal.label}
                        </p>
                        <button
                          onClick={() => removeGoal(i)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
                          style={{ opacity: goal.done ? 0.4 : undefined }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Add goal */}
                <AnimatePresence>
                  {showAdd && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      {/* Presets */}
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Quick add</p>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_GOALS.filter(p => !goals.some(g => g.label === p.label)).map(preset => (
                            <button
                              key={preset.label}
                              onClick={() => addPreset(preset)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted text-xs font-medium hover:bg-muted/70 transition-all"
                            >
                              {preset.icon} {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Custom input */}
                      <div className="px-4 pb-3 flex gap-2">
                        <input
                          value={customText}
                          onChange={e => setCustomText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addCustom()}
                          placeholder="Or type a custom goal…"
                          className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground/30 transition-all"
                          autoFocus
                        />
                        <button
                          onClick={addCustom}
                          disabled={!customText.trim()}
                          className="px-3 py-2 rounded-xl bg-foreground text-background text-xs font-semibold disabled:opacity-40 transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer actions */}
                <div className={cn("px-4 py-3 flex items-center justify-between", goals.length > 0 && "border-t border-border")}>
                  <button
                    onClick={() => { setShowAdd(s => !s); setCustomText(''); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAdd ? 'Cancel' : 'Add goal'}
                  </button>
                  {goals.length > 0 && !allDone && (
                    <p className="text-xs text-muted-foreground">
                      Complete all for <span className="font-bold text-foreground">+{BONUS_XP} XP</span>
                    </p>
                  )}
                  {allDone && state.bonusClaimed && (
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> +{BONUS_XP} XP earned!
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}