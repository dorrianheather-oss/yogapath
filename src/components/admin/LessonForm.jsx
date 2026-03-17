import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import TagInput from './TagInput';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const LESSON_TYPES = ['text', 'video', 'practice', 'quiz'];

export default function LessonForm({ data, moduleId, trackId, onClose, onSave }) {
  const [form, setForm] = useState({
    title: data?.title || '',
    description: data?.description || '',
    content: data?.content || '',
    video_url: data?.video_url || '',
    duration_minutes: data?.duration_minutes ?? 3,
    xp_reward: data?.xp_reward ?? 15,
    difficulty: data?.difficulty || 'beginner',
    lesson_type: data?.lesson_type || 'text',
    tags: data?.tags || [],
    prerequisite_lesson_ids: data?.prerequisite_lesson_ids || [],
    order_index: data?.order_index ?? 0,
    is_published: data?.is_published ?? false,
  });
  const [saving, setSaving] = useState(false);

  const { data: siblingLessons = [] } = useQuery({
    queryKey: ['moduleLessons', moduleId],
    queryFn: () => base44.entities.CurriculumLesson.filter({ module_id: moduleId }, 'order_index', 100),
    enabled: !!moduleId,
  });

  const otherLessons = siblingLessons.filter(l => l.id !== data?.id);

  const togglePrereq = (id) => {
    setForm(f => ({
      ...f,
      prerequisite_lesson_ids: f.prerequisite_lesson_ids.includes(id)
        ? f.prerequisite_lesson_ids.filter(x => x !== id)
        : [...f.prerequisite_lesson_ids, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    if (data?.id) {
      await base44.entities.CurriculumLesson.update(data.id, form);
    } else {
      await base44.entities.CurriculumLesson.create({ ...form, module_id: moduleId, track_id: trackId });
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 my-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{data ? 'Edit Lesson' : 'New Lesson'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Input placeholder="Lesson title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Short description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <textarea
            placeholder="Lesson content (markdown)"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
          />
          <Input placeholder="Video URL (optional)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
          <div className="flex gap-2">
            <select className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.lesson_type} onChange={e => setForm(f => ({ ...f, lesson_type: e.target.value }))}>
              {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Duration (min)</label>
              <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">XP Reward</label>
              <Input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: Number(e.target.value) }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Order</label>
              <Input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))} />
            </div>
          </div>

          <TagInput
            tags={form.tags}
            onChange={tags => setForm(f => ({ ...f, tags }))}
            context={form.title + (form.description ? ': ' + form.description : '')}
          />

          {otherLessons.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Prerequisites (lessons that must be done first)</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {otherLessons.map(lesson => (
                  <label key={lesson.id} className="flex items-center gap-2 cursor-pointer text-sm p-1 rounded hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={form.prerequisite_lesson_ids.includes(lesson.id)}
                      onChange={() => togglePrereq(lesson.id)}
                      className="w-4 h-4"
                    />
                    {lesson.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="publ" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="publ" className="text-sm">Published</label>
          </div>
        </div>
        <Button onClick={save} disabled={saving || !form.title} className="w-full mt-5 rounded-xl">
          {saving ? 'Saving...' : 'Save Lesson'}
        </Button>
      </div>
    </div>
  );
}