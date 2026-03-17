import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import TagInput from './TagInput';

export default function ModuleForm({ data, trackId, onClose, onSave }) {
  const [form, setForm] = useState({
    title: data?.title || '',
    description: data?.description || '',
    tags: data?.tags || [],
    prerequisite_module_ids: data?.prerequisite_module_ids || [],
    order_index: data?.order_index ?? 0,
    is_published: data?.is_published ?? false,
  });
  const [saving, setSaving] = useState(false);

  const { data: siblingModules = [] } = useQuery({
    queryKey: ['modules', trackId],
    queryFn: () => base44.entities.CurriculumModule.filter({ track_id: trackId }, 'order_index', 50),
    enabled: !!trackId,
  });

  const otherModules = siblingModules.filter(m => m.id !== data?.id);

  const togglePrereq = (id) => {
    setForm(f => ({
      ...f,
      prerequisite_module_ids: f.prerequisite_module_ids.includes(id)
        ? f.prerequisite_module_ids.filter(x => x !== id)
        : [...f.prerequisite_module_ids, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    if (data?.id) {
      await base44.entities.CurriculumModule.update(data.id, form);
    } else {
      await base44.entities.CurriculumModule.create({ ...form, track_id: trackId });
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 my-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{data ? 'Edit Module' : 'New Module'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Input placeholder="Module title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Input type="number" placeholder="Order" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))} className="w-24" />

          <TagInput
            tags={form.tags}
            onChange={tags => setForm(f => ({ ...f, tags }))}
            context={form.title + (form.description ? ': ' + form.description : '')}
          />

          {otherModules.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Prerequisites (modules that must be done first)</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {otherModules.map(mod => (
                  <label key={mod.id} className="flex items-center gap-2 cursor-pointer text-sm p-1 rounded hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={form.prerequisite_module_ids.includes(mod.id)}
                      onChange={() => togglePrereq(mod.id)}
                      className="w-4 h-4"
                    />
                    {mod.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="pubm" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="pubm" className="text-sm">Published</label>
          </div>
        </div>
        <Button onClick={save} disabled={saving || !form.title} className="w-full mt-5 rounded-xl">
          {saving ? 'Saving...' : 'Save Module'}
        </Button>
      </div>
    </div>
  );
}