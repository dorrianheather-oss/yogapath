// Badge definitions — each has an `evaluate` fn that returns true if the badge is earned
export const BADGES = [
  // Lesson milestones
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🌱',
    rarity: 'common',
  },
  {
    id: 'lessons_5',
    title: 'Finding Your Footing',
    description: 'Complete 5 lessons',
    icon: '👣',
    rarity: 'common',
  },
  {
    id: 'lessons_10',
    title: 'Dedicated Student',
    description: 'Complete 10 lessons',
    icon: '📚',
    rarity: 'uncommon',
  },
  {
    id: 'lessons_25',
    title: 'Deep Diver',
    description: 'Complete 25 lessons',
    icon: '🌊',
    rarity: 'rare',
  },
  {
    id: 'lessons_50',
    title: 'Seasoned Practitioner',
    description: 'Complete 50 lessons',
    icon: '🏆',
    rarity: 'epic',
  },

  // XP milestones
  {
    id: 'xp_100',
    title: '100 XP Milestone',
    description: 'Earn 100 XP',
    icon: '⭐',
    rarity: 'common',
  },
  {
    id: 'xp_500',
    title: 'Rising Star',
    description: 'Earn 500 XP',
    icon: '🌟',
    rarity: 'uncommon',
  },
  {
    id: 'xp_1000',
    title: 'XP Legend',
    description: 'Earn 1000 XP',
    icon: '💫',
    rarity: 'rare',
  },

  // Streak badges
  {
    id: 'streak_3',
    title: 'Building Momentum',
    description: '3-day streak',
    icon: '🔥',
    rarity: 'common',
  },
  {
    id: 'streak_7',
    title: '7-Day Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    rarity: 'uncommon',
  },
  {
    id: 'streak_14',
    title: 'Fortnight Flow',
    description: 'Maintain a 14-day streak',
    icon: '🌙',
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🌕',
    rarity: 'epic',
  },

  // Skill mastery (reaching 80+ in a category)
  {
    id: 'master_asana',
    title: 'Mastered Vinyasa',
    description: 'Reach 80 in Asana',
    icon: '🧘',
    rarity: 'epic',
  },
  {
    id: 'master_anatomy',
    title: 'Body Scholar',
    description: 'Reach 80 in Anatomy',
    icon: '🦴',
    rarity: 'epic',
  },
  {
    id: 'master_breathwork',
    title: 'Breath Master',
    description: 'Reach 80 in Breathwork',
    icon: '🌬️',
    rarity: 'epic',
  },
  {
    id: 'master_philosophy',
    title: 'Philosophy Sage',
    description: 'Reach 80 in Philosophy',
    icon: '📿',
    rarity: 'epic',
  },
  {
    id: 'master_cueing',
    title: 'Voice of Wisdom',
    description: 'Reach 80 in Cueing',
    icon: '🗣️',
    rarity: 'epic',
  },
  {
    id: 'master_programming',
    title: 'Class Architect',
    description: 'Reach 80 in Programming',
    icon: '📋',
    rarity: 'epic',
  },

  // Special
  {
    id: 'all_categories',
    title: 'Well-Rounded',
    description: 'Complete a lesson in every category',
    icon: '🌈',
    rarity: 'rare',
  },
];

export const RARITY_STYLES = {
  common:   { border: 'border-border',        bg: 'bg-white',         label: 'bg-muted text-muted-foreground' },
  uncommon: { border: 'border-blue-200',      bg: 'bg-blue-50',       label: 'bg-blue-100 text-blue-700' },
  rare:     { border: 'border-purple-200',    bg: 'bg-purple-50',     label: 'bg-purple-100 text-purple-700' },
  epic:     { border: 'border-amber-300',     bg: 'bg-amber-50',      label: 'bg-amber-100 text-amber-700' },
};

/**
 * Given the current profile + progress array, return the full set of earned badge IDs.
 */
export function computeEarnedBadges(profile, progressList) {
  if (!profile) return new Set();

  const totalLessons = progressList.length;
  const totalXP = profile.total_xp || 0;
  const streak = profile.streak_days || 0;
  const skills = profile.skills || {};

  // Track categories touched
  const categoriesWithLesson = new Set(progressList.map(p => p.track_id).filter(Boolean));

  const ALL_CATEGORY_TRACK_COUNT = 6; // asana, anatomy, breathwork, philosophy, cueing, programming

  const earned = new Set();

  if (totalLessons >= 1)  earned.add('first_lesson');
  if (totalLessons >= 5)  earned.add('lessons_5');
  if (totalLessons >= 10) earned.add('lessons_10');
  if (totalLessons >= 25) earned.add('lessons_25');
  if (totalLessons >= 50) earned.add('lessons_50');

  if (totalXP >= 100)  earned.add('xp_100');
  if (totalXP >= 500)  earned.add('xp_500');
  if (totalXP >= 1000) earned.add('xp_1000');

  if (streak >= 3)  earned.add('streak_3');
  if (streak >= 7)  earned.add('streak_7');
  if (streak >= 14) earned.add('streak_14');
  if (streak >= 30) earned.add('streak_30');

  if ((skills.asana       || 0) >= 80) earned.add('master_asana');
  if ((skills.anatomy     || 0) >= 80) earned.add('master_anatomy');
  if ((skills.breathwork  || 0) >= 80) earned.add('master_breathwork');
  if ((skills.philosophy  || 0) >= 80) earned.add('master_philosophy');
  if ((skills.cueing      || 0) >= 80) earned.add('master_cueing');
  if ((skills.programming || 0) >= 80) earned.add('master_programming');

  if (categoriesWithLesson.size >= ALL_CATEGORY_TRACK_COUNT) earned.add('all_categories');

  return earned;
}

/**
 * Returns newly earned badge IDs (in earnedNow but not in previouslySaved).
 */
export function getNewlyUnlocked(previouslySaved = [], earnedNow) {
  return [...earnedNow].filter(id => !previouslySaved.includes(id));
}