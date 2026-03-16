import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, BookOpen, Target } from 'lucide-react';
import { CATEGORIES, ACHIEVEMENTS, getSkillLabel } from '@/lib/yogaData';
import { cn } from '@/lib/utils';
import SkillRadar from '@/components/dashboard/SkillRadar';

export default function Progress() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['lessonCompletions'],
    queryFn: () => base44.entities.LessonCompletion.list('-created_date', 100),
  });

  const profile = profiles[0];
  const skills = profile?.skills || {};
  const earnedAchievements = profile?.achievements || [];

  // Count completions by category
  const catCounts = {};
  completions.forEach(c => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  });

  const statCards = [
    { label: 'Total XP', value: profile?.total_xp || 0, icon: Star, color: 'text-amber-500 bg-amber-50' },
    { label: 'Streak', value: `${profile?.streak_days || 0} days`, icon: Flame, color: 'text-orange-500 bg-orange-50' },
    { label: 'Lessons', value: profile?.total_lessons_completed || 0, icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
    { label: 'Achievements', value: earnedAchievements.length, icon: Trophy, color: 'text-purple-500 bg-purple-50' },
  ];

  return (
    <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Progress</h1>
      <p className="text-sm text-muted-foreground mb-6">Track your yoga journey</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 rounded-2xl bg-white border border-border"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Skill Radar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl border border-border p-5 mb-8"
      >
        <h3 className="text-sm font-semibold mb-3">Skill Map</h3>
        <SkillRadar skills={skills} />
      </motion.div>

      {/* Category breakdown */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-3">Category Progress</h3>
        <div className="space-y-3">
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const level = skills[key] || 0;
            const count = catCounts[key] || 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{getSkillLabel(level)}</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${level}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{count} lessons completed</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Achievements</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((ach) => {
            const earned = earnedAchievements.includes(ach.id);
            return (
              <motion.div
                key={ach.id}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "p-4 rounded-2xl border text-center transition-all",
                  earned
                    ? "bg-white border-primary/20"
                    : "bg-muted/50 border-border opacity-50"
                )}
              >
                <span className="text-2xl">{ach.icon}</span>
                <p className="font-semibold text-xs mt-2">{ach.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ach.description}</p>
                {earned && <p className="text-[10px] text-primary font-bold mt-1">+{ach.xp} XP</p>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}