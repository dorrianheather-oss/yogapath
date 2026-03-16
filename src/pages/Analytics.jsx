import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Activity } from 'lucide-react';
import { CATEGORIES, getSkillLabel } from '@/lib/yogaData';
import ActivityHeatmap from '@/components/analytics/ActivityHeatmap';
import SkillRadarChart from '@/components/analytics/SkillRadarChart';
import GrowthAreas from '@/components/analytics/GrowthAreas';

export default function Analytics() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];

  const { data: progress = [], isLoading } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => base44.entities.UserProgress.list('-created_date', 500),
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ['allLessons'],
    queryFn: () => base44.entities.CurriculumLesson.filter({ is_published: true }, 'order_index', 500),
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ['curriculumTracks'],
    queryFn: () => base44.entities.CurriculumTrack.filter({ is_published: true }, 'order_index', 50),
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const skills = profile?.skills || {};
  const totalXP = profile?.total_xp || 0;
  const totalLessons = progress.length;
  const streak = profile?.streak_days || 0;

  // XP over last 4 weeks (aggregate by week)
  const now = Date.now();
  const weeklyXP = Array.from({ length: 4 }, (_, wi) => {
    const weekStart = now - (wi + 1) * 7 * 86400000;
    const weekEnd = now - wi * 7 * 86400000;
    const xp = progress
      .filter(p => {
        const t = new Date(p.completed_at).getTime();
        return t >= weekStart && t < weekEnd;
      })
      .reduce((s, p) => s + (p.xp_earned || 0), 0);
    return { week: `W-${wi === 0 ? 'this' : wi}`, xp };
  }).reverse();

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Your mastery journey at a glance</p>
      </motion.div>

      {/* Summary stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Total XP', value: totalXP, icon: '⭐' },
            { label: 'Lessons', value: totalLessons, icon: '📖' },
            { label: 'Streak', value: `${streak}d`, icon: '🔥' },
          ].map((s, i) => (
            <div key={s.label} className="p-4 rounded-2xl bg-white border border-border text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly activity heatmap */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Weekly Activity</h2>
        </div>
        <ActivityHeatmap progress={progress} />
      </motion.div>

      {/* Skill radar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Skill Proficiency</h2>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <SkillRadarChart skills={skills} />
        </div>
      </motion.div>

      {/* Top 3 growth areas */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Top 3 Areas for Growth</h2>
        </div>
        <GrowthAreas skills={skills} progress={progress} allLessons={allLessons} tracks={tracks} />
      </motion.div>
    </div>
  );
}