import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronRight, ChevronDown, Edit2, Check, X,
  Loader2, BookOpen, Layers, Plus, Trash2, Send, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRACK_ICONS, MASTERY_LABELS, MASTERY_LEVEL_ORDER } from '@/lib/curriculumData';

const TRACKS = [
  { value: 'asana', label: 'Asana & Movement' },
  { value: 'anatomy', label: 'Anatomy & Physiology' },
  { value: 'breathwork', label: 'Breathwork & Pranayama' },
  { value: 'philosophy', label: 'Philosophy & Theory' },
  { value: 'cueing', label: 'Cueing & Communication' },
  { value: 'programming', label: 'Class Programming' },
];

const STAGES = ['setup', 'objectives', 'curriculum', 'review'];

// ─── Stage 1: Setup ───────────────────────────────────────────────────────────
function SetupStage({ onNext }) {
  const [track, setTrack] = useState('');
  const [level, setLevel] = useState('foundations');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Track</p>
        <div className="grid grid-cols-2 gap-2">
          {TRACKS.map(t => (
            <button
              key={t.value}
              onClick={() => setTrack(t.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left',
                track === t.value ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              <span>{TRACK_ICONS[t.value] || '📚'}</span>
              <span className="font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Level</p>
        <div className="space-y-2">
          {MASTERY_LEVEL_ORDER.map(lv => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all',
                level === lv ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              <span className="font-medium">{MASTERY_LABELS[lv]}</span>
              {level === lv && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onNext({ track, level })}
        disabled={!track}
        className={cn(
          'w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
          track ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        Generate objectives <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Stage 2: Objectives ──────────────────────────────────────────────────────
function ObjectivesStage({ config, onNext, onBack }) {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [generated, setGenerated] = useState(false);

  const trackLabel = TRACKS.find(t => t.value === config.track)?.label || config.track;
  const levelLabel = MASTERY_LABELS[config.level] || config.level;

  const generate = async () => {
    setLoading(true);
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert yoga teacher training curriculum designer.

Generate 6-8 clear, specific learning objectives for:
Track: ${trackLabel}
Level: ${levelLabel}

Each objective must:
- Start with a measurable action verb (Demonstrate, Explain, Apply, Analyse, Integrate, Teach, etc.)
- Be specific to yoga teacher training at this level
- Be achievable within a single course module

Return only the objectives as a JSON array of strings. No preamble.`,
        response_json_schema: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } }
          },
          required: ['objectives']
        }
      });
      setObjectives(result.objectives || []);
      setGenerated(true);
    } catch (e) {
      console.error('Objectives generation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateObj = (i, val) => {
    setObjectives(prev => prev.map((o, idx) => idx === i ? val : o));
    setEditingIdx(null);
  };

  const removeObj = (i) => setObjectives(prev => prev.filter((_, idx) => idx !== i));

  const addObj = () => {
    setObjectives(prev => [...prev, 'New objective']);
    setEditingIdx(objectives.length);
    setEditVal('New objective');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Learning Objectives</p>
          <p className="text-sm font-medium mt-0.5">{TRACK_ICONS[config.track]} {trackLabel} · {levelLabel}</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium hover:border-primary/40 transition-all"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {generated ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">Drafting objectives...</span>
        </div>
      )}

      {!loading && objectives.length === 0 && !generated && (
        <button
          onClick={generate}
          className="w-full py-10 rounded-xl border border-dashed border-border text-muted-foreground text-sm flex flex-col items-center gap-2 hover:border-primary/40 transition-all"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          Click Generate to draft objectives with AI
        </button>
      )}

      {!loading && objectives.length > 0 && (
        <div className="space-y-2">
          {objectives.map((obj, i) => (
            <div key={i} className="group flex items-start gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
              <span className="text-primary font-bold text-xs mt-0.5 w-4 shrink-0">{i + 1}</span>
              {editingIdx === i ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && updateObj(i, editVal)}
                    className="flex-1 bg-transparent text-sm outline-none border-b border-primary"
                  />
                  <button onClick={() => updateObj(i, editVal)} className="text-primary"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingIdx(null)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex-1 flex items-start justify-between gap-2">
                  <span className="text-sm leading-snug">{obj}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditingIdx(i); setEditVal(obj); }} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeObj(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addObj}
            className="w-full py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground flex items-center justify-center gap-1.5 hover:border-primary/40 hover:text-foreground transition-all"
          >
            <Plus className="w-3 h-3" /> Add objective
          </button>
        </div>
      )}

      {objectives.length > 0 && (
        <div className="flex gap-2 pt-2">
          <button onClick={onBack} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-all">
            Back
          </button>
          <button
            onClick={() => onNext({ ...config, objectives })}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            Build curriculum <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stage 3: Curriculum Generation ──────────────────────────────────────────
function CurriculumStage({ config, onNext, onBack }) {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openModules, setOpenModules] = useState({});

  const trackLabel = TRACKS.find(t => t.value === config.track)?.label || config.track;
  const levelLabel = MASTERY_LABELS[config.level] || config.level;

  const generate = async () => {
    setLoading(true);
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert yoga teacher training curriculum designer.

Build a complete curriculum for:
Track: ${trackLabel}
Level: ${levelLabel}

Learning Objectives:
${config.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Create 3-5 modules. Each module should have 4-8 lessons.
Each lesson needs a title, a 1-2 sentence description, a duration (5-20 min), and a format.
Formats: "video", "reading", "practice", "quiz", "audio"

The module and lesson structure should directly map to and deliver the learning objectives above.
Be specific, practical, and grounded in authentic yoga teaching — not generic.`,
        response_json_schema: {
          type: 'object',
          properties: {
            track_title: { type: 'string' },
            track_description: { type: 'string' },
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  lessons: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        duration_minutes: { type: 'number' },
                        format: { type: 'string' }
                      },
                      required: ['title', 'description', 'duration_minutes', 'format']
                    }
                  }
                },
                required: ['title', 'description', 'lessons']
              }
            }
          },
          required: ['track_title', 'track_description', 'modules']
        }
      });
      setCurriculum(result);
      // Open first module by default
      setOpenModules({ 0: true });
    } catch (e) {
      console.error('Curriculum generation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateLesson = (mi, li, field, val) => {
    setCurriculum(prev => ({
      ...prev,
      modules: prev.modules.map((m, mIdx) =>
        mIdx !== mi ? m : {
          ...m,
          lessons: m.lessons.map((l, lIdx) => lIdx !== li ? l : { ...l, [field]: val })
        }
      )
    }));
  };

  const updateModule = (mi, field, val) => {
    setCurriculum(prev => ({
      ...prev,
      modules: prev.modules.map((m, mIdx) => mIdx !== mi ? m : { ...m, [field]: val })
    }));
  };

  const toggleModule = (i) => setOpenModules(prev => ({ ...prev, [i]: !prev[i] }));

  const FORMAT_ICONS = { video: '🎬', reading: '📖', practice: '🧘', quiz: '✅', audio: '🎧' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Generated Curriculum</p>
          <p className="text-sm font-medium mt-0.5">{TRACK_ICONS[config.track]} {trackLabel} · {levelLabel}</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium hover:border-primary/40 transition-all"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {curriculum ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">Building your curriculum tree...</span>
          <span className="text-xs">Generating modules and lessons from your objectives</span>
        </div>
      )}

      {!loading && !curriculum && (
        <button
          onClick={generate}
          className="w-full py-10 rounded-xl border border-dashed border-border text-muted-foreground text-sm flex flex-col items-center gap-2 hover:border-primary/40 transition-all"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          Click Generate to build the full curriculum
        </button>
      )}

      {!loading && curriculum && (
        <div className="space-y-2">
          {/* Track header */}
          <div className="bg-card border border-border rounded-xl px-4 py-3 mb-4">
            <input
              value={curriculum.track_title}
              onChange={e => setCurriculum(prev => ({ ...prev, track_title: e.target.value }))}
              className="w-full bg-transparent font-semibold text-base outline-none border-b border-transparent focus:border-primary transition-colors"
            />
            <input
              value={curriculum.track_description}
              onChange={e => setCurriculum(prev => ({ ...prev, track_description: e.target.value }))}
              className="w-full bg-transparent text-xs text-muted-foreground mt-1 outline-none border-b border-transparent focus:border-primary transition-colors"
            />
          </div>

          {/* Module tree */}
          {curriculum.modules.map((mod, mi) => (
            <div key={mi} className="border border-border rounded-xl overflow-hidden">
              {/* Module header */}
              <button
                onClick={() => toggleModule(mi)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-card/80 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    value={mod.title}
                    onChange={e => { e.stopPropagation(); updateModule(mi, 'title', e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    className="bg-transparent text-sm font-medium outline-none w-full truncate"
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{mod.lessons.length} lessons</span>
                {openModules[mi] ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {/* Lessons */}
              <AnimatePresence>
                {openModules[mi] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border divide-y divide-border">
                      {mod.lessons.map((lesson, li) => (
                        <div key={li} className="flex items-start gap-3 px-4 py-2.5 bg-background/40 group">
                          <span className="text-base mt-0.5 shrink-0">{FORMAT_ICONS[lesson.format] || '📄'}</span>
                          <div className="flex-1 min-w-0">
                            <input
                              value={lesson.title}
                              onChange={e => updateLesson(mi, li, 'title', e.target.value)}
                              className="bg-transparent text-sm font-medium outline-none w-full border-b border-transparent focus:border-primary transition-colors"
                            />
                            <input
                              value={lesson.description}
                              onChange={e => updateLesson(mi, li, 'description', e.target.value)}
                              className="bg-transparent text-xs text-muted-foreground mt-0.5 outline-none w-full border-b border-transparent focus:border-primary transition-colors"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 mt-1">{lesson.duration_minutes}m</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {curriculum && !loading && (
        <div className="flex gap-2 pt-2">
          <button onClick={onBack} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-all">
            Back
          </button>
          <button
            onClick={() => onNext({ ...config, curriculum })}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            Push to production <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stage 4: Push to Production ─────────────────────────────────────────────
function PublishStage({ config, onReset }) {
  const [status, setStatus] = useState('idle'); // idle | pushing | done | error
  const [log, setLog] = useState([]);
  const queryClient = useQueryClient();

  const push = async () => {
    setStatus('pushing');
    setLog([]);
    const { curriculum, track, level } = config;

    try {
      // 1. Create or find the track
      setLog(prev => [...prev, 'Creating track...']);
      const existingTracks = await base44.entities.CurriculumTrack.filter({ mastery_level: level });
      let trackRecord = existingTracks.find(t => t.title === curriculum.track_title);

      if (!trackRecord) {
        trackRecord = await base44.entities.CurriculumTrack.create({
          title: curriculum.track_title,
          description: curriculum.track_description,
          mastery_level: level,
          is_published: false,
          order_index: 99,
        });
      }
      setLog(prev => [...prev, `Track ready: ${trackRecord.title}`]);

      // 2. Create modules + lessons
      let moduleIdx = 0;
      for (const mod of curriculum.modules) {
        setLog(prev => [...prev, `Creating module: ${mod.title}`]);
        const moduleRecord = await base44.entities.CurriculumModule.create({
          title: mod.title,
          description: mod.description,
          track_id: trackRecord.id,
          order_index: moduleIdx++,
          is_published: false,
        });

        let lessonIdx = 0;
        for (const lesson of mod.lessons) {
          await base44.entities.CurriculumLesson.create({
            title: lesson.title,
            description: lesson.description,
            duration_minutes: lesson.duration_minutes,
            format: lesson.format,
            module_id: moduleRecord.id,
            track_id: trackRecord.id,
            mastery_level: level,
            order_index: lessonIdx++,
            is_published: false,
          });
        }
        setLog(prev => [...prev, `  ${mod.lessons.length} lessons added`]);
      }

      queryClient.invalidateQueries({ queryKey: ['curriculumTracks'] });
      setLog(prev => [...prev, 'Done! Track saved as draft (unpublished).']);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setLog(prev => [...prev, `Error: ${e.message}`]);
      setStatus('error');
    }
  };

  if (status === 'idle') {
    const totalLessons = config.curriculum.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium mb-3">Ready to push to production</p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Track</span><span className="text-foreground font-medium">{config.curriculum.track_title}</span></div>
            <div className="flex justify-between"><span>Level</span><span className="text-foreground font-medium">{MASTERY_LABELS[config.level]}</span></div>
            <div className="flex justify-between"><span>Modules</span><span className="text-foreground font-medium">{config.curriculum.modules.length}</span></div>
            <div className="flex justify-between"><span>Lessons</span><span className="text-foreground font-medium">{totalLessons}</span></div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            Saved as draft (unpublished). You can review and publish from the Curriculum tab.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReset} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground">
            Start over
          </button>
          <button
            onClick={push}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Confirm & push
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        {log.map((line, i) => (
          <div key={i} className={cn('text-sm flex items-start gap-2', line.startsWith('Error') ? 'text-destructive' : line.startsWith('Done') ? 'text-primary' : 'text-muted-foreground')}>
            <span>{line.startsWith('Error') ? '✗' : line.startsWith('Done') ? '✓' : '·'}</span>
            <span>{line}</span>
          </div>
        ))}
        {status === 'pushing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>

      {status === 'done' && (
        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Plan another curriculum
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CurriculumPlanner() {
  const [stage, setStage] = useState(0);
  const [config, setConfig] = useState({});

  const STAGE_LABELS = ['Track & Level', 'Objectives', 'Curriculum', 'Publish'];

  const reset = () => { setStage(0); setConfig({}); };

  return (
    <div className="space-y-5">
      {/* Stage progress bar */}
      <div className="flex items-center gap-1">
        {STAGE_LABELS.map((label, i) => (
          <React.Fragment key={i}>
            <div className={cn('flex items-center gap-1.5 text-xs font-medium transition-colors', i === stage ? 'text-primary' : i < stage ? 'text-muted-foreground' : 'text-muted-foreground/40')}>
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all', i === stage ? 'bg-primary text-primary-foreground border-primary' : i < stage ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted border-border')}>
                {i < stage ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </div>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < STAGE_LABELS.length - 1 && <div className={cn('flex-1 h-0.5 rounded transition-all', i < stage ? 'bg-primary/30' : 'bg-border')} />}
          </React.Fragment>
        ))}
      </div>

      {/* Stage content */}
      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
          {stage === 0 && <SetupStage onNext={cfg => { setConfig(cfg); setStage(1); }} />}
          {stage === 1 && <ObjectivesStage config={config} onNext={cfg => { setConfig(cfg); setStage(2); }} onBack={() => setStage(0)} />}
          {stage === 2 && <CurriculumStage config={config} onNext={cfg => { setConfig(cfg); setStage(3); }} onBack={() => setStage(1)} />}
          {stage === 3 && <PublishStage config={config} onReset={reset} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
