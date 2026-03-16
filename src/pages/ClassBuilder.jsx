import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Plus, ChevronDown, ChevronUp, Trash2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CLASS_THEMES, CLASS_SECTIONS } from '@/lib/yogaData';
import { cn } from '@/lib/utils';

export default function ClassBuilder() {
  const [mode, setMode] = useState('list'); // list | create | view
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState('all_levels');
  const [duration, setDuration] = useState(60);
  const [generating, setGenerating] = useState(false);
  const [generatedClass, setGeneratedClass] = useState(null);
  const [viewingClass, setViewingClass] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classSequences'],
    queryFn: () => base44.entities.ClassSequence.list('-created_date', 20),
  });

  const generateClass = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a complete yoga class sequence with theme "${theme || 'Balanced Flow'}", difficulty "${difficulty}", duration ${duration} minutes.

Include these sections: ${CLASS_SECTIONS.join(', ')}

For each section provide:
- name (section name)
- poses (array of 2-4 poses with: pose_name, duration like "5 breaths" or "2 minutes", cues for teaching, breath instructions)
- philosophy_note (optional philosophical connection to the theme)

Make the sequence flow logically with good transitions. Include warm-up, build to peak, then wind down.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                poses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      pose_name: { type: 'string' },
                      duration: { type: 'string' },
                      cues: { type: 'string' },
                      breath: { type: 'string' },
                    },
                  },
                },
                philosophy_note: { type: 'string' },
              },
            },
          },
          notes: { type: 'string' },
        },
      },
    });

    setGeneratedClass(result);
    setGenerating(false);
  };

  const saveClass = async () => {
    await base44.entities.ClassSequence.create({
      ...generatedClass,
      theme: theme || 'Balanced Flow',
      difficulty,
      duration_minutes: duration,
    });
    queryClient.invalidateQueries({ queryKey: ['classSequences'] });
    setMode('list');
    setGeneratedClass(null);
  };

  if (mode === 'view' && viewingClass) {
    return (
      <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
        <button onClick={() => { setMode('list'); setViewingClass(null); }} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-1">{viewingClass.title}</h1>
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="secondary">{viewingClass.theme}</Badge>
          <Badge variant="outline" className="capitalize">{viewingClass.difficulty}</Badge>
          <Badge variant="outline">{viewingClass.duration_minutes} min</Badge>
        </div>
        <ClassSections sections={viewingClass.sections} expandedSection={expandedSection} setExpandedSection={setExpandedSection} />
        {viewingClass.notes && (
          <div className="mt-6 p-4 rounded-2xl bg-muted">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{viewingClass.notes}</p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
        <button onClick={() => { setMode('list'); setGeneratedClass(null); }} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">Build a Class</h1>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Theme</label>
            <div className="flex flex-wrap gap-2">
              {CLASS_THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    theme === t ? "bg-primary text-white" : "bg-white border text-muted-foreground"
                  )}
                >{t}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="all_levels">All Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration</label>
              <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="75">75 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {!generatedClass ? (
          <Button
            onClick={generateClass}
            disabled={generating}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating class...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" /> Generate Sequence</>
            )}
          </Button>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-bold">{generatedClass.title}</h2>
            </div>
            <ClassSections sections={generatedClass.sections} expandedSection={expandedSection} setExpandedSection={setExpandedSection} />
            <Button onClick={saveClass} className="w-full h-14 rounded-2xl text-base font-semibold mt-6">
              <Save className="w-5 h-5 mr-2" /> Save Class
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Class Builder</h1>
          <p className="text-sm text-muted-foreground">Design your yoga classes</p>
        </div>
        <Button onClick={() => setMode('create')} className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-3 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-3xl">📋</div>
          <p className="font-semibold mb-1">No classes yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first class sequence</p>
          <Button onClick={() => setMode('create')} variant="outline" className="rounded-xl">
            <Sparkles className="w-4 h-4 mr-2" /> Build a class
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { setViewingClass(cls); setMode('view'); }}
              className="p-4 rounded-2xl bg-white border border-border cursor-pointer hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-sm">{cls.title}</p>
              <div className="flex items-center gap-2 mt-2">
                {cls.theme && <Badge variant="secondary" className="text-[10px]">{cls.theme}</Badge>}
                <Badge variant="outline" className="text-[10px] capitalize">{cls.difficulty}</Badge>
                {cls.duration_minutes && <Badge variant="outline" className="text-[10px]">{cls.duration_minutes} min</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {cls.sections?.length || 0} sections · {cls.sections?.reduce((sum, s) => sum + (s.poses?.length || 0), 0) || 0} poses
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassSections({ sections, expandedSection, setExpandedSection }) {
  if (!sections?.length) return null;

  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden bg-white">
          <button
            onClick={() => setExpandedSection(expandedSection === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-sm">{section.name}</p>
                <p className="text-xs text-muted-foreground">{section.poses?.length || 0} poses</p>
              </div>
            </div>
            {expandedSection === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {expandedSection === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {section.poses?.map((pose, j) => (
                    <div key={j} className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{pose.pose_name}</p>
                        <span className="text-xs text-muted-foreground">{pose.duration}</span>
                      </div>
                      {pose.cues && <p className="text-xs text-muted-foreground">💬 {pose.cues}</p>}
                      {pose.breath && <p className="text-xs text-muted-foreground mt-0.5">🌬️ {pose.breath}</p>}
                    </div>
                  ))}
                  {section.philosophy_note && (
                    <div className="p-3 rounded-xl bg-lavender-50 border border-lavender-200">
                      <p className="text-xs text-lavender-800">📿 {section.philosophy_note}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}