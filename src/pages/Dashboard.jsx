import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Star, ChevronRight } from 'lucide-react';
import { JOURNEYS } from '@/lib/journeyData';
import TodayPractice from '@/components/dashboard/TodayPractice';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });

  const profile = profiles?.[0];

  React.useEffect(() => {
    if (!isLoading && !profile) {
      navigate('/Onboarding');
    }
  }, [isLoading, profile, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const skills = profile.skills || {};
  const getMasteryLabel = (score) => {
    if (score >= 80) return 'Guide';
    if (score >= 55) return 'Teacher';
    if (score >= 30) return 'Practitioner';
    return 'Beginner';
  };

  return (
    <div className="px-5 pt-12 pb-6 space-y-8 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Good to see you</p>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.user_type === 'teacher' ? 'Teacher' : 'Practitioner'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{profile.streak_days || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
              <Star className="w-4 h-4" />
              <span className="text-sm font-bold">{profile.total_xp || 0}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Today's Practice */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <TodayPractice completedCount={profile.daily_goals_completed_today || 0} />
      </motion.div>

      {/* Journey Paths */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-bold mb-4">What do you want to practice today?</h2>
        <div className="grid grid-cols-2 gap-3">
          {JOURNEYS.map((journey, i) => {
            const skillScore = skills[journey.categoryKey] || 0;
            const mastery = getMasteryLabel(skillScore);
            return (
              <motion.button
                key={journey.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/Journey/${journey.id}`)}
                className="flex flex-col items-start p-4 rounded-2xl border border-border bg-white hover:shadow-sm transition-all text-left"
              >
                <span className="text-3xl mb-3">{journey.icon}</span>
                <p className="font-semibold text-sm leading-tight">{journey.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{mastery}</p>
                <div className="w-full mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{ width: `${Math.min(skillScore, 100)}%` }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}