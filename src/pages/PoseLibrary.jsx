import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { POSE_CATEGORIES } from '@/lib/yogaData';

export default function PoseLibrary() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPose, setSelectedPose] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: poses = [], isLoading, refetch } = useQuery({
    queryKey: ['poses'],
    queryFn: () => base44.entities.Pose.list('-created_date', 50),
  });

  const generatePoses = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 8 diverse yoga poses with detailed information. Include a mix of categories (standing, seated, balance, backbend, forward_fold, twist). For each pose provide:
- name (English)
- sanskrit_name
- category (one of: standing, seated, balance, inversion, backbend, forward_fold, twist, prone, supine)
- difficulty (beginner, intermediate, or advanced)
- description (2-3 sentences)
- muscle_groups (array of 3-5 muscles)
- teaching_cues (array of 4-5 clear cues)
- modifications (array of 2-3 modifications)
- common_mistakes (array of 2-3 mistakes)
- breath_instruction (one sentence)
- contraindications (array of 1-2)`,
      response_json_schema: {
        type: 'object',
        properties: {
          poses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sanskrit_name: { type: 'string' },
                category: { type: 'string' },
                difficulty: { type: 'string' },
                description: { type: 'string' },
                muscle_groups: { type: 'array', items: { type: 'string' } },
                teaching_cues: { type: 'array', items: { type: 'string' } },
                modifications: { type: 'array', items: { type: 'string' } },
                common_mistakes: { type: 'array', items: { type: 'string' } },
                breath_instruction: { type: 'string' },
                contraindications: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    });

    if (result.poses) {
      await base44.entities.Pose.bulkCreate(result.poses);
      refetch();
    }
    setGenerating(false);
  };

  const filtered = poses.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sanskrit_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (selectedPose) {
    return (
      <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
        <button onClick={() => setSelectedPose(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-4">
          <Badge className="capitalize mb-2">{selectedPose.category?.replace('_', ' ')}</Badge>
          <h1 className="text-2xl font-bold">{selectedPose.name}</h1>
          {selectedPose.sanskrit_name && (
            <p className="text-sm text-muted-foreground italic">{selectedPose.sanskrit_name}</p>
          )}
        </div>

        <p className="text-sm leading-relaxed mb-6">{selectedPose.description}</p>

        {/* Muscle groups */}
        {selectedPose.muscle_groups?.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Muscle Groups</h3>
            <div className="flex flex-wrap gap-1.5">
              {selectedPose.muscle_groups.map((m, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Teaching cues */}
        {selectedPose.teaching_cues?.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-sage-50 border border-sage-200">
            <h3 className="text-xs font-bold uppercase text-sage-700 tracking-wider mb-2">🗣️ Teaching Cues</h3>
            <ul className="space-y-2">
              {selectedPose.teaching_cues.map((c, i) => (
                <li key={i} className="text-sm text-sage-800 flex gap-2">
                  <span className="text-sage-500 font-bold">{i + 1}.</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modifications */}
        {selectedPose.modifications?.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-lavender-50 border border-lavender-200">
            <h3 className="text-xs font-bold uppercase text-lavender-700 tracking-wider mb-2">Modifications</h3>
            <ul className="space-y-1.5">
              {selectedPose.modifications.map((m, i) => (
                <li key={i} className="text-sm text-lavender-800">• {m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Common mistakes */}
        {selectedPose.common_mistakes?.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-terra-50 border border-terra-200">
            <h3 className="text-xs font-bold uppercase text-terra-700 tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Common Mistakes
            </h3>
            <ul className="space-y-1.5">
              {selectedPose.common_mistakes.map((m, i) => (
                <li key={i} className="text-sm text-terra-800">• {m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Breath */}
        {selectedPose.breath_instruction && (
          <div className="mb-5 p-4 rounded-2xl bg-muted">
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">🌬️ Breath</h3>
            <p className="text-sm">{selectedPose.breath_instruction}</p>
          </div>
        )}

        {selectedPose.contraindications?.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <strong>Contraindications:</strong> {selectedPose.contraindications.join(', ')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Pose Library</h1>
      <p className="text-sm text-muted-foreground mb-5">Explore and learn yoga poses</p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search poses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-5 px-5">
        <button
          onClick={() => setFilterCategory('all')}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
            filterCategory === 'all' ? "bg-primary text-white" : "bg-white border text-muted-foreground"
          )}
        >All</button>
        {POSE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-all",
              filterCategory === cat ? "bg-primary text-white" : "bg-white border text-muted-foreground"
            )}
          >{cat.replace('_', ' ')}</button>
        ))}
      </div>

      {poses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm mb-4">No poses yet. Generate your starter library!</p>
          <Button onClick={generatePoses} disabled={generating} className="rounded-2xl">
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Pose Library</>}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {filtered.map((pose, i) => (
          <motion.div
            key={pose.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelectedPose(pose)}
            className="p-4 rounded-2xl bg-white border border-border cursor-pointer hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl mb-2.5">
              🧘
            </div>
            <p className="font-semibold text-sm leading-tight">{pose.name}</p>
            {pose.sanskrit_name && (
              <p className="text-[10px] text-muted-foreground italic mt-0.5">{pose.sanskrit_name}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <Badge variant="secondary" className="text-[10px] capitalize">{pose.difficulty}</Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}