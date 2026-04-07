import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, BookOpen } from 'lucide-react';
import { CATEGORIES, getSkillLabel } from '@/lib/yogaData';
import { cn } from '@/lib/utils';
import SkillRadar from '@/components/dashboard/SkillRadar';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { computeEarnedBadges, BADGES } from '@/lib/badgeEngine';

export default function Progress() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => base44.entities.UserProgress.list('-created_date', 500),
  });

  const profile = profiles[0];
  const skills = profile?.skills || {};

  const earnedBadgeIds = computeEarnedBadges(profile, progress);
  const earnedCount = BADGES.filter(b => earnedBadgeIds.has(b.id)).length;

  const { data: tracks = [] } = useQuery({
    queryKey: ['curriculumTracks'],
    queryFn: () => base44.entities.CurriculumTrack.filter({ is_published: true }, 'order_index', 50),
  });

  // Build track_id -> category map, then count completed lessons per category
  const trackCategoryMap = Object.fromEntries(tracks.map(t => [t.id, t.category]));
  const catCounts = progress.reduce((acc, p) => {
    const category = trackCategoryMap[p.track_id];
    if (category) acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: 'Total XP', value: profile?.total_xp || 0, icon: Star, color: 'text-foreground bg-muted' },
    { label: 'Streak', value: `${profile?.streak_days || 0} days`, icon: Flame, color: 'text-foreground bg-muted' },
    { label: 'Lessons', value: profile?.total_lessons_completed || 0, icon: BookOpen, color: 'text-foreground bg-muted' },
    { label: 'Badges', value: earnedCount, icon: Trophy, color: 'text-foreground bg-muted' },
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

      {/* Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Badges</h3>
        <BadgeGrid earnedIds={earnedBadgeIds} />
      </div>
    </div>
  );
}