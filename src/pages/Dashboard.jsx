import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getSkillLabel, CATEGORIES } from '@/lib/yogaData';
import DailyBoard from '@/components/dashboard/DailyBoard';
import SkillRadar from '@/components/dashboard/SkillRadar';
import LearningPathCard from '@/components/dashboard/LearningPathCard';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });

  const profile = profiles?.[0];

  useEffect(() => {
    if (!isLoading && !profile) {
      navigate('/Onboarding');
    }
  }, [isLoading, profile, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const skills = profile.skills || {};
  const userName = 'Yogi';

  return (
    <div className="px-5 pt-14 pb-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold tracking-tight">
          {getSkillLabel(Math.max(...Object.values(skills)))} {profile.user_type === 'teacher' ? 'Teacher' : 'Student'}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-primary">{profile.total_xp || 0}</span>
            <span className="text-muted-foreground">XP</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold">{profile.total_lessons_completed || 0}</span>
            <span className="text-muted-foreground">lessons</span>
          </div>
        </div>
      </motion.div>

      {/* Skill Radar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-border p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold mb-3">Your Skills</h3>
        <SkillRadar skills={skills} />
      </motion.div>

      {/* Daily Board */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DailyBoard
          completedCount={profile.daily_goals_completed_today || 0}
          streak={profile.streak_days || 0}
        />
      </motion.div>

      {/* Learning Paths */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-bold mb-3">Your Path</h2>
        <div className="space-y-2.5">
          {Object.keys(CATEGORIES).map((cat) => (
            <LearningPathCard
              key={cat}
              category={cat}
              level={skills[cat] > 60 ? 'Advanced' : skills[cat] > 30 ? 'Intermediate' : 'Beginner'}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}