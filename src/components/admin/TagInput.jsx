import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function TagInput({ tags = [], onChange, context = '' }) {
  const [input, setInput] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const suggestTags = async () => {
    if (!context) return;
    setSuggesting(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest 4-6 concise, lowercase tags for this yoga curriculum item: "${context}". 
Return only relevant tags like: anatomy, alignment, breathwork, beginner, hip-opening, etc. 
Keep each tag 1-3 words max.`,
      response_json_schema: {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    const newTags = (result.tags || []).filter(t => !tags.includes(t));
    onChange([...tags, ...newTags]);
    setSuggesting(false);
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
      <div className="min-h-[42px] flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-muted-foreground">Press Enter or comma to add</p>
        {context && (
          <button
            type="button"
            onClick={suggestTags}
            disabled={suggesting}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {suggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI suggest
          </button>
        )}
      </div>
    </div>
  );
}