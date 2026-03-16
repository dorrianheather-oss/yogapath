export const CATEGORIES = {
  asana: { label: 'Asana', icon: '🧘', color: 'sage', description: 'Movement & poses' },
  anatomy: { label: 'Anatomy', icon: '🦴', color: 'terra', description: 'Body knowledge' },
  breathwork: { label: 'Breathwork', icon: '🌬️', color: 'lavender', description: 'Pranayama practice' },
  philosophy: { label: 'Philosophy', icon: '📿', color: 'sage', description: 'Ancient wisdom' },
  cueing: { label: 'Cueing', icon: '🗣️', color: 'terra', description: 'Teaching language' },
  programming: { label: 'Programming', icon: '📋', color: 'lavender', description: 'Class design' },
};

export const SKILL_LABELS = {
  0: 'Newcomer',
  20: 'Beginner',
  40: 'Developing',
  60: 'Intermediate',
  80: 'Advanced',
  100: 'Master',
};

export function getSkillLabel(value) {
  const thresholds = [100, 80, 60, 40, 20, 0];
  for (const t of thresholds) {
    if (value >= t) return SKILL_LABELS[t];
  }
  return 'Newcomer';
}

export const ACHIEVEMENTS = [
  { id: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '🌱', xp: 10 },
  { id: 'streak_3', title: 'Building Momentum', description: '3-day streak', icon: '🔥', xp: 25 },
  { id: 'streak_7', title: 'Dedicated Practitioner', description: '7-day streak', icon: '⚡', xp: 50 },
  { id: 'anatomy_explorer', title: 'Anatomy Explorer', description: 'Complete 5 anatomy lessons', icon: '🦴', xp: 30 },
  { id: 'cue_master', title: 'Cueing Master', description: 'Complete 5 cueing lessons', icon: '🗣️', xp: 30 },
  { id: 'first_class', title: 'Class Creator', description: 'Build your first class sequence', icon: '✨', xp: 40 },
  { id: 'philosophy_guide', title: 'Philosophy Guide', description: 'Complete 5 philosophy lessons', icon: '📿', xp: 30 },
  { id: 'all_categories', title: 'Well-Rounded', description: 'Complete a lesson in every category', icon: '🌟', xp: 50 },
  { id: 'breathwork_10', title: 'Breath Awakened', description: 'Complete 10 breathwork lessons', icon: '🌬️', xp: 40 },
  { id: 'xp_500', title: 'Rising Star', description: 'Earn 500 XP', icon: '⭐', xp: 25 },
];

export const POSE_CATEGORIES = [
  'standing', 'seated', 'balance', 'inversion', 'backbend', 'forward_fold', 'twist', 'prone', 'supine'
];

export const CLASS_THEMES = [
  'Grounding', 'Heart Opening', 'Hip Opening', 'Strength Building',
  'Balance & Focus', 'Flexibility', 'Stress Relief', 'Energy Flow',
  'Core Power', 'Restoration'
];

export const CLASS_SECTIONS = [
  'Centering & Breath',
  'Warm Up',
  'Standing Flow',
  'Peak Pose',
  'Cool Down',
  'Savasana & Closing'
];