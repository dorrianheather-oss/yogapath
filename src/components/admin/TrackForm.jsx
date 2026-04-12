import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import TagInput from './TagInput';

const CATEGORIES = ['asana', 'anatomy', 'breathwork', 'philosophy', 'cueing', 'programming'];
const USER_TYPES = ['both', 'student', 'teacher'];
const MASTERY_LEVELS = [
  { value: 'foundations', label: 'Foundations' },
  { value: 'practitioner', label: 'Practitioner' },
  { value: 'teacher_200', label: 'Teacher (200hr)' },
  { value: 'advanced_300', label: 'Advanced Teacher (300hr)' },
  { value: 'mastery_500', label: 'Mastery (500hr)' },
];

export default function TrackForm({ data, onClose, onSave }) {
  const [form, setForm] = useState({
    title: data?.title || '',
    description: data?.description || '',
    icon: data?.icon || '📚',
    category: data?.category || 'asana',
    mastery_level: data?.mastery_level || 'foundations',
    tags: data?.tags || [],
    order_index: data?.order_index ?? 0,
    is_published: data?.is_published ?? false,
    for_user_type: data?.for_user_type || 'both',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    if (data?.id) {
      await base44.entities.CurriculumTrack.update(data.id, form);
    } else {
      await base44.entities.CurriculumTrack.create(form);
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{data ? 'Edit Track' : 'New Track'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input placeholder="Icon" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-20 text-center text-xl" />
            <Input placeholder="Track title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="flex-1" />
          </div>
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2">
            <select className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.for_user_type} onChange={e => setForm(f => ({ ...f, for_user_type: e.target.value }))}>
              {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mastery Level</label>
            <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.mastery_level} onChange={e => setForm(f => ({ ...f, mastery_level: e.target.value }))}>
              {MASTERY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <TagInput
            tags={form.tags}
            onChange={tags => setForm(f => ({ ...f, tags }))}
            context={form.title + (form.description ? ': ' + form.description : '')}
          />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="pub" className="text-sm">Published</label>
          </div>
        </div>
        <Button onClick={save} disabled={saving || !form.title} className="w-full mt-5 rounded-xl">
          {saving ? 'Saving...' : 'Save Track'}
        </Button>
      </div>
    </div>
  );
}