import { useState } from "react";

const PILLARS = [
  "Asana", "Pranayama", "Meditation",
  "Philosophy", "Anatomy", "Teaching", "Beyond the Mat"
];

const LEVELS = [
  { value: "foundation", label: "Foundation (0-200)" },
  { value: "development", label: "Development (200-500)" },
  { value: "advanced", label: "Advanced (500-800)" },
  { value: "mastery", label: "Mastery" },
];

const FORMATS = [
  "Short video", "B-roll voiceover", "Reading block",
  "Breathwork practice", "Somatic prompt", "Reflective quiz", "Music bed practice"
];

async function generateCourseWithClaude(input) {
  const prompt = `You are an expert yoga curriculum designer. Generate a complete, authentic course structure based on these inputs:

Topic: ${input.topic}
Pillar: ${input.pillar}
Level: ${input.level}
Learning Outcomes:
${input.outcomes}

Generate a course with 5-8 lessons. Each lesson must have the right format for its content type.

Rules:
- Philosophy/anatomy content gets reading block + short video
- Breathwork gets timed practice + somatic prompt
- Movement/asana gets short video + somatic prompt
- Assessment gets reflective quiz
- Opening/closing gets music bed practice
- Be specific, embodied, and authentic — not generic

Respond ONLY with a JSON object in this exact format, no markdown backticks:
{
  "title": "course title",
  "description": "2 sentence course description",
  "lessons": [
    {
      "title": "lesson title",
      "format": "one of: Short video, B-roll voiceover, Reading block, Breathwork practice, Somatic prompt, Reflective quiz, Music bed practice",
      "duration_minutes": 5,
      "script": "full lesson script or content (2-3 paragraphs)",
      "practice_prompt": "specific embodied practice instruction if applicable",
      "quiz_questions": ["question 1", "question 2"]
    }
  ]
}`;
console.log("API KEY:", import.meta.env.VITE_ANTHROPIC_API_KEY?.slice(0, 20));
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function CourseGenerator({ onCourseGenerated }) {
  const [step, setStep] = useState("input");
  const [autoMode, setAutoMode] = useState(false);
  const [input, setInput] = useState({
    topic: "",
    pillar: "Asana",
    level: "foundation",
    outcomes: "",
  });
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!input.topic || !input.outcomes) return;
    setStep("generating");
    setError(null);
    try {
      const generated = await generateCourseWithClaude(input);
      setCourse(generated);
      if (autoMode) {
        await saveCourse(generated);
      } else {
        setStep("review");
      }
    } catch (err) {
      setError("Generation failed. Check your API key and try again.");
      setStep("input");
    }
  };

  const saveCourse = async (courseData) => {
    setStep("saving");
    try {
      if (onCourseGenerated) await onCourseGenerated(courseData, input);
      setStep("done");
    } catch (err) {
      setError("Failed to save course. Try again.");
      setStep("review");
    }
  };

  const updateLesson = (i, field, value) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((l, idx) => idx === i ? { ...l, [field]: value } : l)
    }));
  };

  const reset = () => {
    setStep("input");
    setCourse(null);
    setError(null);
    setInput({ topic: "", pillar: "Asana", level: "foundation", outcomes: "" });
  };

  const s = {
    wrap: { background: "#111110", border: "0.5px solid #2a2720", borderRadius: 16, padding: 24, marginBottom: 24 },
    label: { fontSize: 11, color: "#6b6358", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6, display: "block" },
    input: { width: "100%", background: "#1a1917", border: "0.5px solid #2a2720", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#f0ede8", outline: "none", marginBottom: 14, boxSizing: "border-box" },
    select: { width: "100%", background: "#1a1917", border: "0.5px solid #2a2720", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#f0ede8", outline: "none", marginBottom: 14, boxSizing: "border-box" },
    textarea: { width: "100%", background: "#1a1917", border: "0.5px solid #2a2720", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#f0ede8", outline: "none", marginBottom: 14, minHeight: 80, resize: "vertical", boxSizing: "border-box" },
    btn: { background: "#c4945a", color: "#111110", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" },
    btnGhost: { background: "transparent", border: "0.5px solid #2a2720", color: "#6b6358", borderRadius: 10, padding: "10px 24px", fontSize: 14, cursor: "pointer" },
    heading: { fontSize: 16, fontWeight: 500, color: "#f0ede8", marginBottom: 16 },
    tag: { display: "inline-block", background: "#1e1c18", border: "0.5px solid #3d3326", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#c4945a", marginRight: 6 },
    lessonCard: { background: "#1a1917", border: "0.5px solid #2a2720", borderRadius: 12, padding: 16, marginBottom: 10 },
    error: { background: "#2a1a1a", border: "0.5px solid #5a2020", borderRadius: 8, padding: 12, fontSize: 13, color: "#e07070", marginBottom: 14 },
    spinner: { width: 36, height: 36, border: "2px solid #2a2720", borderTopColor: "#c4945a", borderRadius: "50%", animation: "yp-spin 1s linear infinite", margin: "0 auto 20px" },
  };

  if (step === "input") return (
    <div style={s.wrap}>
      <style>{`@keyframes yp-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={s.heading}>Generate a course with AI</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#6b6358" }}>Full auto</span>
          <div onClick={() => setAutoMode(!autoMode)} style={{ width: 36, height: 20, borderRadius: 10, background: autoMode ? "#c4945a" : "#2a2720", cursor: "pointer", position: "relative", transition: "background .2s" }}>
            <div style={{ position: "absolute", top: 2, left: autoMode ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#f0ede8", transition: "left .2s" }} />
          </div>
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <label style={s.label}>Course topic</label>
      <input style={s.input} placeholder="e.g. Breath awareness for beginners" value={input.topic} onChange={e => setInput(p => ({ ...p, topic: e.target.value }))} />

      <label style={s.label}>Pillar</label>
      <select style={s.select} value={input.pillar} onChange={e => setInput(p => ({ ...p, pillar: e.target.value }))}>
        {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <label style={s.label}>Level</label>
      <select style={s.select} value={input.level} onChange={e => setInput(p => ({ ...p, level: e.target.value }))}>
        {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>

      <label style={s.label}>Learning outcomes (one per line)</label>
      <textarea
        style={s.textarea}
        placeholder={"Student can identify breath in ribs vs chest\nStudent can complete 5 slow breath cycles\nStudent understands breath-nervous system connection"}
        value={input.outcomes}
        onChange={e => setInput(p => ({ ...p, outcomes: e.target.value }))}
      />

      <button style={{ ...s.btn, opacity: (!input.topic || !input.outcomes) ? 0.4 : 1 }} disabled={!input.topic || !input.outcomes} onClick={handleGenerate}>
        {autoMode ? "Generate + publish automatically" : "Generate course →"}
      </button>
    </div>
  );

  if (step === "generating") return (
    <div style={{ ...s.wrap, textAlign: "center", padding: 48 }}>
      <style>{`@keyframes yp-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.spinner} />
      <div style={{ fontSize: 15, color: "#f0ede8", marginBottom: 8 }}>Building your course…</div>
      <div style={{ fontSize: 13, color: "#6b6358" }}>Generating lessons, scripts, and practice prompts</div>
    </div>
  );

  if (step === "saving") return (
    <div style={{ ...s.wrap, textAlign: "center", padding: 48 }}>
      <style>{`@keyframes yp-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.spinner} />
      <div style={{ fontSize: 15, color: "#f0ede8", marginBottom: 8 }}>Saving to your curriculum…</div>
      <div style={{ fontSize: 13, color: "#6b6358" }}>This will appear on the dashboard when done</div>
    </div>
  );

  if (step === "done") return (
    <div style={{ ...s.wrap, textAlign: "center", padding: 48 }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
      <div style={{ fontSize: 15, color: "#f0ede8", marginBottom: 8 }}>Course saved successfully</div>
      <div style={{ fontSize: 13, color: "#6b6358", marginBottom: 24 }}>It will appear on the dashboard once published</div>
      <button style={s.btn} onClick={reset}>Generate another course</button>
    </div>
  );

  if (step === "review" && course) return (
    <div style={s.wrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={s.heading}>{course.title}</div>
        <button style={s.btnGhost} onClick={() => setStep("input")}>← Back</button>
      </div>
      <div style={{ fontSize: 13, color: "#9c8f7a", lineHeight: 1.6, marginBottom: 20 }}>{course.description}</div>
      <div style={{ fontSize: 11, color: "#6b6358", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
        {course.lessons.length} lessons — review and edit before saving
      </div>

      {course.lessons.map((lesson, i) => (
        <div key={i} style={s.lessonCard}>
          <input style={{ ...s.input, marginBottom: 8, padding: "6px 10px", fontSize: 13, fontWeight: 500 }} value={lesson.title} onChange={e => updateLesson(i, "title", e.target.value)} />
          <div style={{ marginBottom: 10 }}>
            <span style={s.tag}>{lesson.format}</span>
            <span style={{ fontSize: 11, color: "#4a4640" }}>{lesson.duration_minutes} min</span>
          </div>
          <label style={s.label}>Script</label>
          <textarea style={{ ...s.textarea, minHeight: 80, fontSize: 12 }} value={lesson.script} onChange={e => updateLesson(i, "script", e.target.value)} />
          {lesson.practice_prompt && (
            <>
              <label style={s.label}>Practice prompt</label>
              <textarea style={{ ...s.textarea, minHeight: 60, fontSize: 12 }} value={lesson.practice_prompt} onChange={e => updateLesson(i, "practice_prompt", e.target.value)} />
            </>
          )}
          {lesson.quiz_questions?.length > 0 && (
            <div>
              <label style={s.label}>Quiz questions</label>
              {lesson.quiz_questions.map((q, qi) => (
                <input key={qi} style={{ ...s.input, marginBottom: 6, fontSize: 12 }} value={q} onChange={e => {
                  const updated = [...lesson.quiz_questions];
                  updated[qi] = e.target.value;
                  updateLesson(i, "quiz_questions", updated);
                }} />
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, ma