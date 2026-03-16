import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const USER_TYPES = [
  { value: 'student', label: 'I practice yoga', description: 'Deepen your personal practice', icon: '🧘' },
  { value: 'teacher', label: 'I teach yoga', description: 'Enhance your teaching skills', icon: '🎓' },
];

const LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Less than 1 year', icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', description: '1–3 years', icon: '🌿' },
  { value: 'advanced', label: 'Advanced', description: '3+ years', icon: '🌳' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=welcome, 1=user_type, 2=level
  const [userType, setUserType] = useState(null);
  const [level, setLevel] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    const skillBase = level === 'advanced' ? 60 : level === 'intermediate' ? 35 : 15;
    const teacherBonus = userType === 'teacher' ? 15 : 0;

    await base44.entities.UserProfile.create({
      user_type: userType,
      experience_level: level,
      practice_frequency: '1-2_weekly',
      skills: {
        asana: skillBase,
        anatomy: Math.max(skillBase - 10, 5),
        breathwork: Math.max(skillBase - 5, 10),
        philosophy: Math.max(skillBase - 10, 5),
        cueing: Math.max(skillBase - 15 + teacherBonus, 5),
        programming: Math.max(skillBase - 20 + teacherBonus, 5),
      },
      streak_days: 0,
      total_lessons_completed: 0,
      total_xp: 0,
      last_active_date: new Date().toISOString().split('T')[0],
      onboarding_completed: true,
      achievements: [],
      daily_goals_completed_today: 0,
      interests: [],
    });

    navigate('/Dashboard');
  };

  if (step === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-8"
        >
          <span className="text-4xl">🧘</span>
        </motion.div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">YogaPath</h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-xs mb-12">
          Master yoga one micro-lesson at a time. Choose a path, practice a skill, build mastery.
        </p>

        <Button
          onClick={() => setStep(1)}
          className="w-full max-w-xs h-14 rounded-2xl text-base font-semibold"
        >
          Get Started <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen max-w-lg mx-auto px-6 pt-16 pb-8">
        <div className="flex gap-1.5 mb-10">
          {[0, 1].map(i => (
            <div key={i} className={cn("h-1 rounded-full flex-1 transition-all", i === 0 ? "bg-primary" : "bg-border")} />
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-1">How do you use yoga?</h2>
        <p className="text-sm text-muted-foreground mb-8">This helps us tailor your journey</p>

        <div className="space-y-3">
          {USER_TYPES.map(opt => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserType(opt.value)}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                userType === opt.value ? "border-primary bg-primary/5" : "border-border bg-white"
              )}
            >
              <span className="text-3xl">{opt.icon}</span>
              <div>
                <p className="font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={() => setStep(2)}
              disabled={!userType}
              className="w-full h-14 rounded-2xl text-base font-semibold"
            >
              Continue <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-6 pt-16 pb-8">
      <div className="flex gap-1.5 mb-10">
        {[0, 1].map(i => (
          <div key={i} className="h-1 rounded-full flex-1 bg-primary" />
        ))}
      </div>
      <h2 className="text-2xl font-bold mb-1">What's your experience level?</h2>
      <p className="text-sm text-muted-foreground mb-8">We'll match lessons to where you are</p>

      <div className="space-y-3">
        {LEVELS.map(opt => (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLevel(opt.value)}
            className={cn(
              "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
              level === opt.value ? "border-primary bg-primary/5" : "border-border bg-white"
            )}
          >
            <span className="text-3xl">{opt.icon}</span>
            <div>
              <p className="font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleFinish}
            disabled={!level || saving}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start My Journey'}
          </Button>
        </div>
      </div>
    </div>
  );
}