import { useState, useEffect } from "react";

const QUESTIONS = [
  {
    block: "Experience",
    text: "How long have you been practicing yoga, if at all?",
    opts: [
      { t: "Never practiced", scores: { level: -20 } },
      { t: "Less than 6 months", scores: { level: 0 } },
      { t: "6 months to 2 years", scores: { level: 30 } },
      { t: "2+ years consistently", scores: { level: 60 } },
    ],
  },
  {
    block: "Experience",
    text: "How have you typically practiced yoga?",
    opts: [
      { t: "Guided classes or videos", scores: { level: 10, kinesthetic: 10 } },
      { t: "Some self-guided practice", scores: { level: 20, kinesthetic: 20 } },
      { t: "Structured study or training", scores: { level: 40, philosophy: 20 } },
      { t: "Inconsistent or just getting started", scores: { level: 0 } },
    ],
  },
  {
    block: "Embodied awareness",
    text: "When you're in a pose, what are you most aware of?",
    weight: 2,
    opts: [
      { t: "How it looks or whether I'm doing it correctly", scores: { proprioception: 0, breath: 0 } },
      { t: "Sensation in my body — muscles, joints", scores: { proprioception: 30, kinesthetic: 20 } },
      { t: "My breath", scores: { breath: 30, proprioception: 10 } },
      { t: "I lose track of my attention", scores: { proprioception: 0, breath: 0 } },
    ],
  },
  {
    block: "Embodied awareness",
    text: "When you move, do you notice differences between your left and right side?",
    weight: 2,
    opts: [
      { t: "Yes — one side feels significantly different", scores: { proprioception: 40, kinesthetic: 30 } },
      { t: "Slightly, but not much", scores: { proprioception: 20, kinesthetic: 15 } },
      { t: "Not really — it feels the same", scores: { proprioception: 5 } },
      { t: "I've never paid attention to that", scores: { proprioception: 0 } },
    ],
  },
  {
    block: "Embodied awareness",
    text: "When you slow your breath down, what do you notice?",
    weight: 2,
    opts: [
      { t: "I can extend and control it comfortably", scores: { breath: 40, level: 20 } },
      { t: "I can slow it, but it feels effortful", scores: { breath: 20 } },
      { t: "It becomes uncomfortable or irregular", scores: { breath: 5 } },
      { t: "I haven't explored this yet", scores: { breath: 0 } },
    ],
  },
  {
    block: "Goals",
    text: "What brings you to YogaPath right now?",
    opts: [
      { t: "I want to build a consistent practice", scores: { intent: "practice" } },
      { t: "I want to understand yoga more deeply, not just do it", scores: { intent: "depth", philosophy: 20 } },
      { t: "I want to prepare to teach", scores: { intent: "teach", philosophy: 30, level: 20 } },
      { t: "I'm managing stress or seeking balance", scores: { intent: "wellness", breath: 10 } },
    ],
  },
  {
    block: "Goals",
    text: "What does progress look like to you?",
    opts: [
      { t: "Moving into more advanced postures", scores: { intent: "asana" } },
      { t: "Feeling more aware and connected in my body", scores: { intent: "awareness", proprioception: 10 } },
      { t: "Understanding yoga beyond the physical practice", scores: { intent: "philosophy", philosophy: 20 } },
      { t: "Being able to guide or teach others", scores: { intent: "teach", philosophy: 15 } },
    ],
  },
  {
    block: "Learning preference",
    text: "When you're learning something new, what helps it click?",
    opts: [
      { t: "Seeing it demonstrated", scores: { pref: "visual" } },
      { t: "Understanding the explanation first", scores: { pref: "conceptual", philosophy: 10 } },
      { t: "Trying it and feeling it out", scores: { pref: "kinesthetic", kinesthetic: 10 } },
      { t: "A mix of explanation and practice", scores: { pref: "mixed" } },
    ],
  },
  {
    block: "Learning preference",
    text: "How do you feel about understanding the 'why' behind the practice — like anatomy or philosophy?",
    opts: [
      { t: "I enjoy it — it deepens my practice", scores: { philosophy: 30, pref: "conceptual" } },
      { t: "Some is helpful, but I prefer doing", scores: { philosophy: 10 } },
      { t: "It feels overwhelming right now", scores: { philosophy: 0 } },
      { t: "I'm curious but new to it", scores: { philosophy: 15 } },
    ],
  },
  {
    block: "Practice awareness",
    text: "When a pose becomes uncomfortable, how do you tend to respond?",
    weight: 1.5,
    opts: [
      { t: "I ease out of it", scores: { proprioception: 10 } },
      { t: "I push through it", scores: { proprioception: 5 } },
      { t: "I stay with it and focus on my breath", scores: { breath: 20, proprioception: 20 } },
      { t: "I don't usually stay long enough to notice", scores: { proprioception: 0 } },
    ],
  },
];

const EMPTY_PROFILE = {
  level: 0, breath: 0, proprioception: 0,
  kinesthetic: 0, philosophy: 0,
  pref: "mixed", intent: "practice",
};

function computeOutput(profile) {
  const lvl = profile.level;
  if (lvl < 30) return {
    headline: "You're at the beginning of your practice journey",
    insight: "Your path will focus on building body awareness, breath connection, and foundational movement before anything else. This is where real practice begins.",
    nodePos: 0,
  };
  if (lvl < 70) return {
    headline: "You have some experience, and real gaps worth exploring",
    insight: `You've practiced but may not have built deep internal awareness yet. Your path will balance movement fundamentals with ${profile.breath < profile.proprioception ? "breath awareness" : "body sensitivity"} — closing the gaps before advancing.`,
    nodePos: 1,
  };
  if (lvl < 120) return {
    headline: "You're in an active development phase",
    insight: "You have a foundation. Now the work is refinement — isolating movement, deepening breath control, and building the awareness that separates practice from performance.",
    nodePos: 2,
  };
  return {
    headline: "You're an established practitioner with room to go deeper",
    insight: "Your path will move into energetics, sequencing logic, and the philosophy that contextualises everything you already do. Teaching fundamentals are on the horizon.",
    nodePos: 3,
  };
}

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
      <div style={{ flex: 1, height: 2, background: "#1e1d1b", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#c4945a", borderRadius: 2, transition: "width .5s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "#4a4640", fontWeight: 500, whiteSpace: "nowrap" }}>
        {current} of {total}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-7" stroke="#111110" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="2" y="5.5" width="8" height="5" rx="1.2" stroke="#2a2720" strokeWidth="1.1" />
      <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="#2a2720" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function PathNode({ name, state }) {
  const circleStyle = {
    width: 40, height: 40, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    ...(state === "done" && { background: "#c4945a" }),
    ...(state === "here" && { background: "#1e1c18", border: "2px solid #c4945a" }),
    ...(state === "next" && { background: "#1a1917", border: "1.5px solid #2a2720" }),
    ...(state === "far" && { background: "#161514", border: "1px solid #1e1d1b" }),
  };
  const labelColor = state === "here" ? "#c4945a" : state === "done" ? "#6b6358" : "#2a2720";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={circleStyle}>
        {state === "done" && <CheckIcon />}
        {state === "here" && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c4945a" }} />}
        {(state === "next" || state === "far") && <LockIcon />}
      </div>
      <span style={{ fontSize: 10, color: labelColor, textAlign: "center", maxWidth: 52, lineHeight: 1.3 }}>{name}</span>
    </div>
  );
}

function SkillBar({ name, value, desc }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(value, 10)), 300);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ background: "#1a1917", border: "0.5px solid #2a2720", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "#6b6358", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{name}</div>
      <div style={{ height: 3, background: "#2a2720", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: `${width}%`, background: "#c4945a", borderRadius: 2, transition: "width 1s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: "#4a4640" }}>{desc}</div>
    </div>
  );
}

function IntroScreen({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 28px", background: "#111110" }}>
      <div style={{ fontSize: 11, color: "#6b6358", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 20 }}>YogaPath</div>
      <h1 style={{ fontSize: 32, fontWeight: 400, color: "#f0ede8", lineHeight: 1.3, marginBottom: 16 }}>
        Let's understand<br />your practice
      </h1>
      <p style={{ fontSize: 15, color: "#6b6358", lineHeight: 1.6, marginBottom: 40, maxWidth: 320 }}>
        10 questions. No right answers.<br />
        We'll map where you are and build your path from there.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: 32, height: 3, borderRadius: 2, background: i < 3 ? "#c4945a" : "#2a2720" }} />
        ))}
      </div>
      <button onClick={onStart} style={{ background: "#c4945a", color: "#111110", border: "none", borderRadius: 10, padding: "16px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer", alignSelf: "flex-start" }}>
        Begin
      </button>
    </div>
  );
}

function QuestionScreen({ question, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const handleNext = () => {
    if (selected === null) return;
    onAnswer(selected);
    setSelected(null);
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "40px 28px 32px", background: "#111110" }}>
      <ProgressBar current={index + 1} total={total} />
      <div style={{ fontSize: 10, fontWeight: 500, color: "#6b6358", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 14 }}>{question.block}</div>
      <h2 style={{ fontSize: 20, fontWeight: 400, color: "#f0ede8", lineHeight: 1.45, marginBottom: 32 }}>{question.text}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {question.opts.map((opt, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{ background: selected === i ? "#1e1c18" : "#1a1917", border: `0.5px solid ${selected === i ? "#c4945a" : "#2a2720"}`, borderRadius: 12, padding: "16px 18px", fontSize: 14, color: selected === i ? "#f0ede8" : "#c8c0b4", cursor: "pointer", textAlign: "left", lineHeight: 1.4, transition: "all .15s", display: "flex", alignItems: "center", gap: 10 }}>
            {selected === i && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c4945a", flexShrink: 0 }} />}
            {opt.t}
          </button>
        ))}
      </div>
      <button onClick={handleNext} disabled={selected === null} style={{ marginTop: 28, background: "#c4945a", color: "#111110", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: selected === null ? "not-allowed" : "pointer", opacity: selected === null ? 0.3 : 1, transition: "opacity .2s", alignSelf: "flex-start" }}>
        Continue
      </button>
    </div>
  );
}

function OutputScreen({ profile, onRestart }) {
  const out = computeOutput(profile);
  const nodeStates = ["Foundation", "Awareness", "Development", "Mastery"].map((name, i) => ({
    name,
    state: i < out.nodePos ? "done" : i === out.nodePos ? "here" : i === out.nodePos + 1 ? "next" : "far",
  }));
  const breath = Math.min(profile.breath, 100);
  const prop = Math.min(profile.proprioception, 100);
  const phil = Math.min(profile.philosophy, 100);
  const kin = Math.min(profile.kinesthetic, 100);
  const skills = [
    { name: "Body awareness", value: Math.max(prop, 10), desc: prop > 50 ? "Developing well" : "Early stage" },
    { name: "Breath", value: Math.max(breath, 10), desc: breath > 50 ? "Building control" : "Foundational" },
    { name: "Philosophy", value: Math.max(phil, 10), desc: phil > 40 ? "Engaged" : "Light exposure" },
    { name: "Movement", value: Math.max(kin, 10), desc: kin > 50 ? "Kinesthetically aware" : "Growing" },
  ];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "36px 28px 48px", background: "#111110" }}>
      <div style={{ fontSize: 10, color: "#6b6358", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 12 }}>Your starting point</div>
      <h2 style={{ fontSize: 22, fontWeight: 400, color: "#f0ede8", lineHeight: 1.35, marginBottom: 8 }}>{out.headline}</h2>
      <p style={{ fontSize: 14, color: "#9c8f7a", lineHeight: 1.6, marginBottom: 32 }}>{out.insight}</p>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
        {nodeStates.map((n, i) => (
          <div key={n.name} style={{ display: "flex", alignItems: "center", flex: i < nodeStates.length - 1 ? 1 : 0 }}>
            <PathNode name={n.name} state={n.state} />
            {i < nodeStates.length - 1 && <div style={{ flex: 1, height: 2, margin: "0 4px 22px", background: n.state === "done" ? "#c4945a" : "#1e1d1b" }} />}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
        {skills.map(s => <SkillBar key={s.name} {...s} />)}
      </div>
      <button style={{ background: "#c4945a", color: "#111110", border: "none", borderRadius: 10, padding: 16, fontSize: 15, fontWeight: 500, cursor: "pointer", width: "100%", marginBottom: 10 }}>
        Start your path →
      </button>
      <button onClick={onRestart} style={{ background: "transparent", border: "0.5px solid #2a2720", color: "#6b6358", borderRadius: 10, padding: 10, fontSize: 12, cursor: "pointer", width: "100%" }}>
        Retake assessment
      </button>
    </div>
  );
}

export default function Assessment() {
  const [step, setStep] = useState("intro");
  const [current, setCurrent] = useState(0);
  const [profile, setProfile] = useState({ ...EMPTY_PROFILE });

  const handleAnswer = (optIndex) => {
    const q = QUESTIONS[current];
    const w = q.weight || 1;
    const scores = q.opts[optIndex].scores;
    const next = { ...profile };
    Object.entries(scores).forEach(([k, v]) => {
      if (typeof v === "number") next[k] = (next[k] || 0) + v * w;
      else next[k] = v;
    });
    setProfile(next);
    if (current + 1 >= QUESTIONS.length) {
      setStep("output");
    } else {
      setCurrent(c => c + 1);
    }
  };

  const handleRestart = () => {
    setStep("intro");
    setCurrent(0);
    setProfile({ ...EMPTY_PROFILE });
  };

  return (
    <div style={{ background: "#111110", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      {step === "intro" && <IntroScreen onStart={() => setStep("question")} />}
      {step === "question" && <QuestionScreen question={QUESTIONS[current]} index={current} total={QUESTIONS.length} onAnswer={handleAnswer} />}
      {step === "output" && <OutputScreen profile={profile} onRestart={handleRestart} />}
    </div>
  );
}