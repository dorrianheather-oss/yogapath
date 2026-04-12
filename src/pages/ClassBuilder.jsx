import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Plus, ChevronDown, ChevronUp, Trash2, Save, ArrowLeft, CheckCircle2, Download } from 'lucide-react';
import { CLASS_THEMES, CLASS_SECTIONS } from '@/lib/yogaData';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';

function exportClassPDF(cls) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const gold = [196, 148, 90];
  const dark = [17, 17, 16];
  const W = 210;

  // Gold header bar
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 22, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...dark);
  doc.text(cls.title || 'Yoga Class Sequence', 14, 14);

  // Meta row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 70, 60);
  const metaY = 30;
  doc.text(`Theme: ${cls.theme || '—'}`, 14, metaY);
  doc.text(`Difficulty: ${cls.difficulty || '—'}`, 80, metaY);
  doc.text(`Duration: ${cls.duration_minutes || '—'} min`, 145, metaY);

  let y = 40;
  (cls.sections || []).forEach((section, si) => {
    if (y > 265) { doc.addPage(); y = 20; }

    // Section header
    doc.setFillColor(30, 28, 24);
    doc.roundedRect(14, y, W - 28, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(240, 237, 232);
    doc.text(`${si + 1}. ${section.name}`, 18, y + 5.5);
    y += 12;

    (section.poses || []).forEach((pose) => {
      if (y > 268) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 28, 24);
      doc.text(`${pose.pose_name}`, 16, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 90, 80);
      doc.text(pose.duration || '', 160, y);
      y += 5;

      if (pose.cues) {
        const lines = doc.splitTextToSize(`Cues: ${pose.cues}`, W - 36);
        doc.setFontSize(7.5);
        doc.setTextColor(120, 110, 95);
        doc.text(lines, 18, y);
        y += lines.length * 4;
      }
      if (pose.breath) {
        const lines = doc.splitTextToSize(`Breath: ${pose.breath}`, W - 36);
        doc.text(lines, 18, y);
        y += lines.length * 4;
      }
      y += 3;
    });

    if (section.philosophy_note) {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(245, 240, 230);
      const noteLines = doc.splitTextToSize(section.philosophy_note, W - 40);
      doc.roundedRect(14, y - 1, W - 28, noteLines.length * 4 + 5, 2, 2, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 100, 70);
      doc.text(noteLines, 18, y + 3);
      y += noteLines.length * 4 + 8;
    }

    y += 4;
  });

  if (cls.notes) {
    if (y > 255) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 28, 24);
    doc.text('Notes:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 70, 60);
    const noteLines = doc.splitTextToSize(cls.notes, W - 28);
    doc.text(noteLines, 14, y);
  }

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 150, 135);
    doc.text('YogaPath', 14, 292);
    doc.text(`Page ${p} of ${pages}`, W - 14, 292, { align: 'right' });
  }

  doc.save(`${(cls.title || 'class').replace(/\s+/g, '_')}.pdf`);
}

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
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
        <Button onClick={() => exportClassPDF(viewingClass)} variant="outline" className="w-full h-12 rounded-2xl mt-6 gap-2">
          <Download className="w-4 h-4" /> Export PDF
        </Button>
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
            <div className="flex gap-3 mt-6">
              <Button onClick={saveClass} className="flex-1 h-14 rounded-2xl text-base font-semibold">
                <Save className="w-5 h-5 mr-2" /> Save Class
              </Button>
              <Button onClick={() => exportClassPDF(generatedClass)} variant="outline" className="h-14 px-5 rounded-2xl">
                <Download className="w-5 h-5" />
              </Button>
            </div>
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
                    <div className="p-3 rounded-xl bg-muted border border-border">
                      <p className="text-xs text-muted-foreground">📿 {section.philosophy_note}</p>
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