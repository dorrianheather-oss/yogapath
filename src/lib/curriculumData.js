// Seed curriculum data — used for initial population via Admin
export const SEED_CURRICULUM = [
  {
    track: {
      title: 'Movement & Asana',
      description: 'Master poses, transitions, and movement mechanics',
      icon: '🧘',
      category: 'asana',
      order_index: 0,
      is_published: true,
      for_user_type: 'both',
    },
    modules: [
      {
        title: 'Foundational Movement',
        description: 'Core principles of safe, aligned movement',
        order_index: 0,
        is_published: true,
        lessons: [
          { title: 'Sun Salutation Mechanics', description: 'Understand the biomechanics of Surya Namaskar A', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Standing Pose Alignment', description: 'Foundation principles for all standing postures', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'Basic Transitions', description: 'Moving with intention between poses', duration_minutes: 3, xp_reward: 10, difficulty: 'beginner', lesson_type: 'text', order_index: 2, is_published: true },
          { title: 'Balance Foundations', description: 'Building stability from the ground up', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 3, is_published: true },
        ],
      },
      {
        title: 'Intermediate Movement',
        description: 'Deepen alignment and explore complex shapes',
        order_index: 1,
        is_published: true,
        lessons: [
          { title: 'Hip Opening Mechanics', description: 'Anatomy and approach to safe hip opening', duration_minutes: 5, xp_reward: 20, difficulty: 'intermediate', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Backbending Fundamentals', description: 'Spinal extension principles and safety', duration_minutes: 5, xp_reward: 20, difficulty: 'intermediate', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'Twisting Mechanics', description: 'Rotational movement in the spine and hips', duration_minutes: 4, xp_reward: 15, difficulty: 'intermediate', lesson_type: 'text', order_index: 2, is_published: true },
          { title: 'Advanced Transitions', description: 'Fluid movement linking complex shapes', duration_minutes: 5, xp_reward: 20, difficulty: 'intermediate', lesson_type: 'text', order_index: 3, is_published: true },
        ],
      },
      {
        title: 'Advanced Movement',
        description: 'Peak poses and advanced architecture',
        order_index: 2,
        is_published: true,
        lessons: [
          { title: 'Arm Balance Entry', description: 'Strength, weight shift and fear management', duration_minutes: 5, xp_reward: 25, difficulty: 'advanced', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Peak Pose Preparation', description: 'Building intelligent sequences toward apex poses', duration_minutes: 5, xp_reward: 25, difficulty: 'advanced', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'Inversion Fundamentals', description: 'Headstand and shoulderstand mechanics', duration_minutes: 5, xp_reward: 25, difficulty: 'advanced', lesson_type: 'text', order_index: 2, is_published: true },
        ],
      },
    ],
  },
  {
    track: {
      title: 'Anatomy',
      description: 'Understand the body behind every pose',
      icon: '🦴',
      category: 'anatomy',
      order_index: 1,
      is_published: true,
      for_user_type: 'both',
    },
    modules: [
      {
        title: 'Major Muscle Groups',
        description: 'Key muscles activated in yoga practice',
        order_index: 0,
        is_published: true,
        lessons: [
          { title: 'The Hip Complex', description: 'Muscles, mobility, and function in the hips', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Core Musculature', description: 'The real core — beyond the six-pack', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'Shoulder Girdle', description: 'Rotator cuff, scapula stability, arm lines', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 2, is_published: true },
        ],
      },
      {
        title: 'Joint Mechanics',
        description: 'How joints move, load, and protect themselves',
        order_index: 1,
        is_published: true,
        lessons: [
          { title: 'Spinal Biomechanics', description: 'Flexion, extension, rotation — understanding the spine', duration_minutes: 5, xp_reward: 20, difficulty: 'intermediate', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Knee Safety in Yoga', description: 'Protecting the knee in standing and seated poses', duration_minutes: 4, xp_reward: 15, difficulty: 'intermediate', lesson_type: 'text', order_index: 1, is_published: true },
        ],
      },
    ],
  },
  {
    track: {
      title: 'Breathwork',
      description: 'Develop pranayama and breath-movement connection',
      icon: '🌬️',
      category: 'breathwork',
      order_index: 2,
      is_published: true,
      for_user_type: 'both',
    },
    modules: [
      {
        title: 'Breath Awareness',
        description: 'Observing and deepening the breath',
        order_index: 0,
        is_published: true,
        lessons: [
          { title: 'The Mechanics of Breath', description: 'Diaphragm, ribcage, and breath physiology', duration_minutes: 3, xp_reward: 10, difficulty: 'beginner', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Ujjayi Breath', description: 'Ocean breath — the foundation of vinyasa', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'Breath + Movement', description: 'Synchronising breath with asana transitions', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 2, is_published: true },
        ],
      },
      {
        title: 'Pranayama Techniques',
        description: 'Classical breathing practices',
        order_index: 1,
        is_published: true,
        lessons: [
          { title: 'Nadi Shodhana', description: 'Alternate nostril breathing for balance', duration_minutes: 4, xp_reward: 15, difficulty: 'intermediate', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Kapalabhati', description: 'Skull-shining breath — energising and cleansing', duration_minutes: 4, xp_reward: 15, difficulty: 'intermediate', lesson_type: 'text', order_index: 1, is_published: true },
        ],
      },
    ],
  },
  {
    track: {
      title: 'Teaching & Cueing',
      description: 'Guide students with clarity and presence',
      icon: '🗣️',
      category: 'cueing',
      order_index: 3,
      is_published: true,
      for_user_type: 'teacher',
    },
    modules: [
      {
        title: 'Foundations of Cueing',
        description: 'The language of clear instruction',
        order_index: 0,
        is_published: true,
        lessons: [
          { title: 'Action-Based Cues', description: 'Direct, clear movement instructions that work', duration_minutes: 3, xp_reward: 10, difficulty: 'beginner', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Alignment Cues', description: 'Language for precise body positioning', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'Breath Cues', description: 'Timing and language for breath instruction', duration_minutes: 3, xp_reward: 10, difficulty: 'beginner', lesson_type: 'text', order_index: 2, is_published: true },
        ],
      },
      {
        title: 'Advanced Cueing',
        description: 'Imagery, presence, and impact',
        order_index: 1,
        is_published: true,
        lessons: [
          { title: 'Imagery Cues', description: 'Using metaphor and sensation to create transformation', duration_minutes: 4, xp_reward: 20, difficulty: 'intermediate', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Teaching Presence', description: 'Voice, pace, and holding space', duration_minutes: 5, xp_reward: 20, difficulty: 'intermediate', lesson_type: 'text', order_index: 1, is_published: true },
        ],
      },
    ],
  },
  {
    track: {
      title: 'Yoga Philosophy',
      description: 'Connect to the wisdom traditions of yoga',
      icon: '📿',
      category: 'philosophy',
      order_index: 4,
      is_published: true,
      for_user_type: 'both',
    },
    modules: [
      {
        title: 'Foundations of Philosophy',
        description: 'Core concepts and lineage',
        order_index: 0,
        is_published: true,
        lessons: [
          { title: 'The Eight Limbs of Yoga', description: "Patanjali's Ashtanga — a complete path", duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Yamas & Niyamas', description: 'Ethical foundations of yoga practice', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'History of Yoga', description: 'Origins, lineages, and modern evolution', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 2, is_published: true },
        ],
      },
    ],
  },
  {
    track: {
      title: 'Class Programming',
      description: 'Architect intelligent, meaningful sequences',
      icon: '📋',
      category: 'programming',
      order_index: 5,
      is_published: true,
      for_user_type: 'teacher',
    },
    modules: [
      {
        title: 'Sequencing Principles',
        description: 'The logic of building a class',
        order_index: 0,
        is_published: true,
        lessons: [
          { title: 'Class Structure Basics', description: 'Opening, build, peak, cool down, close', duration_minutes: 3, xp_reward: 10, difficulty: 'beginner', lesson_type: 'text', order_index: 0, is_published: true },
          { title: 'Energy Curve Management', description: 'Pacing students through 60 minutes', duration_minutes: 4, xp_reward: 15, difficulty: 'beginner', lesson_type: 'text', order_index: 1, is_published: true },
          { title: 'Peak Pose Architecture', description: 'Building intelligently toward the apex', duration_minutes: 5, xp_reward: 20, difficulty: 'intermediate', lesson_type: 'text', order_index: 2, is_published: true },
        ],
      },
    ],
  },
];

export const TRACK_ICONS = {
  asana: '🧘',
  anatomy: '🦴',
  breathwork: '🌬️',
  philosophy: '📿',
  cueing: '🗣️',
  programming: '📋',
};

export const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const MASTERY_LABELS = {
  foundations: 'Foundations',
  practitioner: 'Practitioner',
  teacher_200: 'Teacher (200hr)',
  advanced_300: 'Advanced Teacher (300hr)',
  mastery_500: 'Mastery (500hr)',
};

export const MASTERY_LEVEL_ORDER = ['foundations', 'practitioner', 'teacher_200', 'advanced_300', 'mastery_500'];