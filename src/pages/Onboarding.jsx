import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import QuestionStep from '@/components/onboarding/QuestionStep';

const QUESTIONS = [
  {
    key: 'user_type',
    question: 'What best describes you?',
    options: [
      { value: 'student', label: 'Yoga Student', description: 'I want to deepen my practice', icon: '🧘' },
      { value: 'teacher', label: 'Yoga Teacher', description: 'I want to improve my teaching', icon: '🎓' },
    ],
  },
  {
    key: 'practice_frequency',
    question: 'How often do you practice?',
    options: [
      { value: 'rarely', label: 'Just starting', description: 'Less than once a week', icon: '🌱' },
      { value: '1-2_weekly', label: '1-2 times a week', description: 'Building consistency', icon: '🌿' },
      { value: '3-4_weekly', label: '3-4 times a week', description: 'Regular practice', icon: '🌳' },
      { value: 'daily', label: 'Daily practice', description: 'Committed practitioner', icon: '🏔️' },
    ],
  },
  {
    key: 'experience_level',
    question: 'What is your overall experience level?',
    options: [
      { value: 'beginner', label: 'Beginner', description: 'Under 1 year of practice', icon: '🌅' },
      { value: 'intermediate', label: 'Intermediate', description: '1-3 years of practice', icon: '☀️' },
      { value: 'advanced', label: 'Advanced', description: '3+ years of experience', icon: '⭐' },
    ],
  },
  {
    key: 'asana_level',
    question: 'How would you rate your asana knowledge?',
    options: [
      { value: 20, label: 'Learning the basics', description: 'Know a few poses' },
      { value: 40, label: 'Getting comfortable', description: 'Know most common poses' },
      { value: 60, label: 'Solid foundation', description: 'Confident in many poses' },
      { value: 80, label: 'Advanced practitioner', description: 'Deep understanding' },
    ],
  },
  {
    key: 'anatomy_level',
    question: 'How well do you understand anatomy?',
    options: [
      { value: 10, label: 'Very little', description: 'Minimal anatomy knowledge' },
      { value: 35, label: 'Some basics', description: 'Know major muscle groups' },
      { value: 60, label: 'Good understanding', description: 'Understand body mechanics' },
      { value: 85, label: 'Deep knowledge', description: 'Could explain anatomy in detail' },
    ],
  },
  {
    key: 'interests',
    question: 'What interests you most?',
    multiSelect: true,
    options: [
      { value: 'asana', label: 'Pose Mastery', icon: '🧘' },
      { value: 'anatomy', label: 'Body Knowledge', icon: '🦴' },
      { value: 'breathwork', label: 'Breathwork', icon: '🌬️' },
      { value: 'philosophy', label: 'Yoga Philosophy', icon: '📿' },
      { value: 'cueing', label: 'Teaching Cues', icon: '🗣️' },
      { value: 'programming', label: 'Class Design', icon: '📋' },
    ],
  },
];

function computeSkills(answers) {
  const freq = { rarely: 0, '1-2_weekly': 10, '3-4_weekly': 20, daily: 30 };
  const base = freq[answers.practice_frequency] || 0;
  const asana = answers.asana_level || 20;
  const anatomy = answers.anatomy_level || 10;

  return {
    asana: Math.min(asana + base, 100),
    anatomy: Math.min(anatomy, 100),
    breathwork: Math.min(base + 15, 100),
    philosophy: Math.min(base + 10, 100),
    cueing: answers.user_type === 'teacher' ? Math.min(base + 25, 100) : Math.min(base + 5, 100),
    programming: answers.user_type === 'teacher' ? Math.min(base + 20, 100) : Math.min(base, 100),
  };
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(-1); // -1 is welcome
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSelect = (key, value, multiSelect) => {
    if (multiSelect) {
      const current = answers[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [key]: updated });
    } else {
      setAnswers({ ...answers, [key]: value });
    }
  };

  const canProceed = () => {
    if (step < 0) return true;
    const q = QUESTIONS[step];
    if (q.multiSelect) return (answers[q.key] || []).length > 0;
    return answers[q.key] !== undefined;
  };

  const handleNext = async () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setSaving(true);
      const skills = computeSkills(answers);
      const today = new Date().toISOString().split('T')[0];

      await base44.entities.UserProfile.create({
        user_type: answers.user_type,
        experience_level: answers.experience_level,
        practice_frequency: answers.practice_frequency,
        skills,
        streak_days: 0,
        total_lessons_completed: 0,
        total_xp: 0,
        last_active_date: today,
        onboarding_completed: true,
        achievements: [],
        daily_goals_completed_today: 0,
        interests: answers.interests || [],
      });

      navigate('/Dashboard');
    }
  };

  if (step === -1) {
    return <WelcomeStep onNext={() => setStep(0)} />;
  }

  const q = QUESTIONS[step];

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        <QuestionStep
          key={step}
          question={q.question}
          options={q.options}
          selected={answers[q.key]}
          onSelect={(val) => handleSelect(q.key, val, q.multiSelect)}
          step={step}
          total={QUESTIONS.length}
          multiSelect={q.multiSelect}
        />
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === QUESTIONS.length - 1 ? (
              'Start Learning'
            ) : (
              <>Continue <ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}