import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function ModuleForm({ data, trackId, onClose, onSave }) {
  const [form, setForm] = useState({
    title: data?.title || '',
    description: data?.description || '',
    order_index: data?.order_index ?? 0,
    is_published: data?.is_published ?? false,
  });
  const [saving, setSaving] = useState(false);

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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{data ? 'Edit Module' : 'New Module'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Input placeholder="Module title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Input type="number" placeholder="Order" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))} className="w-24" />
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