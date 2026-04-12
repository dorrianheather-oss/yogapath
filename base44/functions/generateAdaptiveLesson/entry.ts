import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Mastery tier definitions
const getMasteryTier = (score) => {
  if (score >= 80) return {
    label: 'Guide',
    level: 4,
    lessonDepth: 'expert',
    avoid: 'Do not explain basic definitions or foundational concepts. Assume deep embodied knowledge.',
    focus: 'Focus on subtle refinements, edge cases, advanced biomechanics, philosophical depth, and teaching insights that only come from years of practice.',
    tone: 'peer-to-peer, precise, nuanced',
    vocabulary: 'Use technical anatomical terms, Sanskrit names, and assume familiarity with advanced concepts.',
    examples: 'Use advanced examples, rare variations, and cross-system references (e.g., Iyengar, Ashtanga, somatic movement theory).',
  };
  if (score >= 55) return {
    label: 'Teacher',
    level: 3,
    lessonDepth: 'advanced',
    avoid: 'Do not over-explain basics. Skip definitions of common poses or obvious cues.',
    focus: 'Focus on nuance, deeper mechanics, common teaching mistakes, how to cue effectively, and how to adapt for different bodies.',
    tone: 'collegial, direct, insightful',
    vocabulary: 'Use anatomical terminology with brief clarifications. Reference Sanskrit names naturally.',
    examples: 'Use real-world teaching scenarios, student challenges, and class planning examples.',
  };
  if (score >= 30) return {
    label: 'Practitioner',
    level: 2,
    lessonDepth: 'intermediate',
    avoid: 'Do not over-simplify or treat the learner as a complete beginner. Avoid patronizing language.',
    focus: 'Build on existing knowledge with deeper mechanics, alignment principles, and connections between concepts.',
    tone: 'clear, encouraging, educational',
    vocabulary: 'Introduce anatomical terms with brief explanations. Use English names with Sanskrit in parentheses.',
    examples: 'Use relatable practice scenarios and common challenges a developing practitioner faces.',
  };
  return {
    label: 'Beginner',
    level: 1,
    lessonDepth: 'foundational',
    avoid: 'Do not use unexplained jargon, complex anatomy terms, or assume prior knowledge.',
    focus: 'Focus on clear foundations, safety, basic body awareness, and building confidence.',
    tone: 'warm, accessible, encouraging',
    vocabulary: 'Use plain language. Introduce Sanskrit terms with full English explanations.',
    examples: 'Use simple, everyday analogies and step-by-step instructions.',
  };
};

// Journey-specific depth profiles
const getJourneyDepthProfile = (journeyId, masteryTier, focusLabel) => {
  const profiles = {
    asana: {
      1: `Cover the fundamental shape of ${focusLabel}: entry, alignment landmarks, key muscle engagement, and a common beginner mistake. End with a simple breath cue.`,
      2: `Explore the mechanics of ${focusLabel}: joint positioning, muscular co-activation patterns, how to transition in/out, and modifications for different bodies.`,
      3: `Dive into the nuances of ${focusLabel}: subtle alignment refinements, how to cue it for different body types, common compensation patterns, and how it connects to peak pose architecture.`,
      4: `Examine ${focusLabel} at an advanced level: fascial lines engaged, nervous system impact, contraindication reasoning, how to teach it across multiple traditions, and its role in long-term structural development.`,
    },
    anatomy: {
      1: `Introduce the anatomy relevant to ${focusLabel}: where it is in the body, what it does, and which common yoga poses engage it.`,
      2: `Explore functional anatomy of ${focusLabel}: movement mechanics, agonist/antagonist relationships, and how poor alignment creates strain.`,
      3: `Analyze ${focusLabel} in depth: fascial connections, compensatory patterns teachers see most, how to identify restriction vs. hypermobility, and cueing adjustments.`,
      4: `Examine ${focusLabel} with clinical precision: biomechanical research implications, injury mechanisms, post-injury return protocols, and integrating this knowledge into intelligent class programming.`,
    },
    cueing: {
      1: `Introduce action-based cues for ${focusLabel}: what to say, when to say it, and why clear language matters for student safety.`,
      2: `Develop layered cuing for ${focusLabel}: anatomical action cues, breath timing, spatial awareness language, and reading the room.`,
      3: `Refine advanced cuing for ${focusLabel}: imagery cues, multi-layered instructions, when to adjust verbally vs. physically, and how tone affects students' nervous systems.`,
      4: `Master the art of cuing ${focusLabel}: the neuroscience of verbal instruction, developing your unique teaching voice, cross-cultural cuing considerations, and creating transformative classroom moments.`,
    },
    breathwork: {
      1: `Introduce ${focusLabel}: the basic technique, how to practice it safely, and its immediate physiological effect.`,
      2: `Deepen ${focusLabel} practice: the mechanics of the breath pattern, nervous system effects, common mistakes and corrections.`,
      3: `Explore advanced dimensions of ${focusLabel}: integrating with movement, therapeutic applications, when to use it in class sequencing.`,
      4: `Master ${focusLabel}: energetic model (prana/apana), research-backed physiological effects, contraindications by medical condition, and how to build a breathwork curriculum.`,
    },
    philosophy: {
      1: `Introduce the concept of ${focusLabel}: what it means, its historical context, and how it applies to daily life and practice.`,
      2: `Explore ${focusLabel} more deeply: its textual sources, how different yoga traditions interpret it, and practical application in practice.`,
      3: `Examine ${focusLabel} with nuance: contested interpretations, how to weave it meaningfully into class themes without being superficial.`,
      4: `Engage with ${focusLabel} at a scholarly level: original Sanskrit sources, cross-philosophical comparisons, contemporary relevance, and how to teach it in modern contexts authentically.`,
    },
    programming: {
      1: `Introduce the principles of ${focusLabel}: the basic structure, why sequencing logic matters, and a simple template to follow.`,
      2: `Develop ${focusLabel} skills: how to build energy progressively, common sequencing errors, and how to adapt for class length.`,
      3: `Refine ${focusLabel}: peak pose architecture, managing energy curves across a 60-75 minute class, theming with intention, and counterpose logic.`,
      4: `Master ${focusLabel}: sophisticated multi-week programming, working with mixed levels, integrating all six yoga dimensions (asana, breath, philosophy, anatomy, cueing, programming) into a unified class architecture.`,
    },
  };

  const journeyProfile = profiles[journeyId] || profiles.asana;
  return journeyProfile[masteryTier.level] || journeyProfile[1];
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { journeyId, categoryKey, focusId, focusLabel } = await req.json();

    if (!journeyId || !categoryKey) {
      return Response.json({ error: 'journeyId and categoryKey are required' }, { status: 400 });
    }

    // Fetch user profile
    const profiles = await base44.entities.UserProfile.filter({}, '-created_date', 1);
    const profile = profiles[0];

    const skillScore = profile?.skills?.[categoryKey] ?? 15;
    const masteryTier = getMasteryTier(skillScore);
    const depthProfile = getJourneyDepthProfile(journeyId, masteryTier, focusLabel || journeyId);

    const focusContext = focusLabel ? `Focus area: "${focusLabel}".` : '';

    const prompt = `You are an expert yoga educator creating a personalized micro-lesson.

STUDENT PROFILE:
- Journey: ${journeyId}
- Skill score: ${skillScore}/100
- Mastery level: ${masteryTier.label} (${masteryTier.lessonDepth})
- Tone: ${masteryTier.tone}
- Vocabulary level: ${masteryTier.vocabulary}

${focusContext}

LESSON DEPTH INSTRUCTION:
${depthProfile}

WHAT TO AVOID:
${masteryTier.avoid}

WHAT TO FOCUS ON:
${masteryTier.focus}

ADDITIONAL CONTEXT:
${masteryTier.examples}

LESSON FORMAT:
Generate a practical, immediately applicable micro-lesson (3-5 min reading time) in markdown.
Structure:
1. Bold title that reflects the specific depth (NOT generic like "Introduction to X")
2. One precise hook sentence as description
3. Lesson body with:
   - Core concept at the right depth
   - Step-by-step breakdown or technique
   - The key insight that changes how the student practices
   - One concrete drill or exercise
   - A memorable closing principle

Return only the JSON. No preamble.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          duration_minutes: { type: 'number' },
        },
        required: ['title', 'description', 'content', 'duration_minutes'],
      },
    });

    // Save lesson with mastery metadata
    const lesson = await base44.entities.Lesson.create({
      ...result,
      category: categoryKey,
      difficulty: masteryTier.lessonDepth === 'foundational' ? 'beginner'
        : masteryTier.lessonDepth === 'intermediate' ? 'intermediate'
        : 'advanced',
      for_user_type: 'both',
      xp_reward: 10 + (masteryTier.level * 5), // Higher mastery = more XP
      pose_tags: focusId ? [focusId] : [],
      order_index: skillScore, // Store skill score at time of generation
    });

    return Response.json({
      lesson,
      mastery: {
        score: skillScore,
        tier: masteryTier.label,
        level: masteryTier.level,
        depth: masteryTier.lessonDepth,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            