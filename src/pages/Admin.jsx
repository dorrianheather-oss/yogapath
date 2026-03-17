import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Eye, EyeOff, Loader2, Sparkles, BookOpen, Layers, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SEED_CURRICULUM } from '@/lib/curriculumData';
import TrackForm from '@/components/admin/TrackForm';
import ModuleForm from '@/components/admin/ModuleForm';
import LessonForm from '@/components/admin/LessonForm';

const MASTERY_LEVELS = [
  { value: 'foundations', label: 'Foundations' },
  { value: 'practitioner', label: 'Practitioner' },
  { value: 'teacher_200', label: 'Teacher (200hr)' },
  { value: 'advanced_300', label: 'Advanced Teacher (300hr)' },
  { value: 'mastery_500', label: 'Mastery (500hr)' },
];

export default function Admin() {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [modal, setModal] = useState(null);
  const [expandedTracks, setExpandedTracks] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
  });
  const profile = profiles[0];

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['allTracks'],
    queryFn: () => base44.entities.CurriculumTrack.list('order_index', 50),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['allModules'],
    queryFn: () => base44.entities.CurriculumModule.list('order_index', 200),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['allLessons'],
    queryFn: () => base44.entities.CurriculumLesson.list('order_index', 500),
  });

  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-3xl">🔒</div>
        <p className="font-bold text-lg mb-1">Admin Only</p>
        <p className="text-sm text-muted-foreground">You need admin access to view this page.</p>
      </div>
    );
  }

  const seedCurriculum = async () => {
    setSeeding(true);
    for (const item of SEED_CURRICULUM) {
      const track = await base44.entities.CurriculumTrack.create(item.track);
      for (const mod of item.modules) {
        const { lessons: modLessons, ...modData } = mod;
        const module = await base44.entities.CurriculumModule.create({ ...modData, track_id: track.id });
        if (modLessons) {
          for (const lesson of modLessons) {
            await base44.entities.CurriculumLesson.create({ ...lesson, module_id: module.id, track_id: track.id });
          }
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ['allTracks'] });
    queryClient.invalidateQueries({ queryKey: ['allModules'] });
    queryClient.invalidateQueries({ queryKey: ['allLessons'] });
    setSeeding(false);
  };

  const togglePublish = async (entity, type) => {
    const entityMap = {
      track: base44.entities.CurriculumTrack,
      module: base44.entities.CurriculumModule,
      lesson: base44.entities.CurriculumLesson,
    };
    await entityMap[type].update(entity.id, { is_published: !entity.is_published });
    queryClient.invalidateQueries({ queryKey: [`all${type.charAt(0).toUpperCase() + type.slice(1)}s`] });
  };

  const deleteEntity = async (entity, type) => {
    if (!confirm(`Delete "${entity.title}"?`)) return;
    const entityMap = {
      track: base44.entities.CurriculumTrack,
      module: base44.entities.CurriculumModule,
      lesson: base44.entities.CurriculumLesson,
    };
    await entityMap[type].delete(entity.id);
    queryClient.invalidateQueries({ queryKey: [`all${type.charAt(0).toUpperCase() + type.slice(1)}s`] });
  };

  // Group tracks by mastery level
  const tracksByLevel = MASTERY_LEVELS.map(level => ({
    ...level,
    tracks: tracks.filter(t => (t.mastery_level || 'foundations') === level.value),
  })).filter(l => l.tracks.length > 0 || tracks.length === 0);

  const levelsWithTracks = tracksByLevel.filter(l => l.tracks.length > 0);

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-sm text-muted-foreground">Manage curriculum</p>
        </div>
        <Button onClick={() => setModal({ type: 'track' })} size="sm" className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Track
        </Button>
      </div>

      {/* Seed button */}
      {tracks.length === 0 && !isLoading && (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl mb-6">
          <div className="text-3xl mb-3">🌱</div>
          <p className="font-semibold mb-1">No curriculum yet</p>
          <p className="text-sm text-muted-foreground mb-4">Seed the starter curriculum to get going fast.</p>
          <Button onClick={seedCurriculum} disabled={seeding} className="rounded-2xl gap-2">
            {seeding ? <><Loader2 className="w-4 h-4 animate-spin" /> Seeding...</> : <><Sparkles className="w-4 h-4" /> Seed Starter Curriculum</>}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'Tracks', value: tracks.length, icon: Layers },
          { label: 'Modules', value: modules.length, icon: BookOpen },
          { label: 'Lessons', value: lessons.length, icon: FileText },
        ].map(stat => (
          <div key={stat.label} className="p-3 rounded-xl bg-white border border-border text-center">
            <stat.icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Curriculum tree grouped by level */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {(levelsWithTracks.length > 0 ? levelsWithTracks : [{ label: 'All Tracks', tracks }]).map(level => (
            <div key={level.value || 'all'}>
              {levelsWithTracks.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">{level.label}</p>
              )}
              <div className="space-y-3">
                {level.tracks.map(track => {
                  const trackModules = modules.filter(m => m.track_id === track.id).sort((a, b) => a.order_index - b.order_index);
                  const isExpanded = expandedTracks[track.id];
                  return (
                    <div key={track.id} className="rounded-2xl border border-border overflow-hidden bg-white">
                      <div className="flex items-center gap-2 p-3">
                        <button onClick={() => setExpandedTracks(e => ({ ...e, [track.id]: !e[track.id] }))} className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xl">{track.icon || '📚'}</span>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{track.title}</p>
                              {track.tags?.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{track.tags[0]}{track.tags.length > 1 ? ` +${track.tags.length - 1}` : ''}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{trackModules.length} modules · {lessons.filter(l => l.track_id === track.id).length} lessons</p>
                          </div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <div className="flex items-center gap-1">
                          <button onClick={() => togglePublish(track, 'track')} className={cn("p-1.5 rounded-lg transition-all", track.is_published ? "text-foreground" : "text-muted-foreground")}>
                            {track.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setModal({ type: 'track', data: track })} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setModal({ type: 'module', parentId: track.id })} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteEntity(track, 'track')} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border">
                          {trackModules.map(mod => {
                            const modLessons = lessons.filter(l => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index);
                            const isModExpanded = expandedModules[mod.id];
                            return (
                              <div key={mod.id} className="border-b border-border last:border-b-0">
                                <div className="flex items-center gap-2 px-4 py-2.5">
                                  <button onClick={() => setExpandedModules(e => ({ ...e, [mod.id]: !e[mod.id] }))} className="flex items-center gap-2 flex-1 min-w-0">
                                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="text-sm font-medium truncate">{mod.title}</p>
                                      <p className="text-xs text-muted-foreground">{modLessons.length} lessons{mod.tags?.length > 0 ? ` · ${mod.tags.slice(0, 2).join(', ')}` : ''}</p>
                                    </div>
                                    {isModExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => togglePublish(mod, 'module')} className={cn("p-1 rounded", mod.is_published ? "text-foreground" : "text-muted-foreground")}>
                                      {mod.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => setModal({ type: 'module', data: mod, parentId: track.id })} className="p-1 rounded text-muted-foreground hover:text-foreground">
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setModal({ type: 'lesson', parentId: mod.id, trackId: track.id })} className="p-1 rounded text-muted-foreground hover:text-foreground">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => deleteEntity(mod, 'module')} className="p-1 rounded text-muted-foreground hover:text-destructive">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {isModExpanded && modLessons.map(lesson => (
                                  <div key={lesson.id} className="flex items-center gap-2 pl-10 pr-4 py-2 bg-muted/30 border-t border-border">
                                    <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{lesson.title}</p>
                                      <p className="text-xs text-muted-foreground">{lesson.duration_minutes}m · {lesson.difficulty}{lesson.tags?.length > 0 ? ` · ${lesson.tags.slice(0, 2).join(', ')}` : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => togglePublish(lesson, 'lesson')} className={cn("p-1 rounded", lesson.is_published ? "text-foreground" : "text-muted-foreground")}>
                                        {lesson.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                      </button>
                                      <button onClick={() => setModal({ type: 'lesson', data: lesson, parentId: mod.id, trackId: track.id })} className="p-1 rounded text-muted-foreground hover:text-foreground">
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => deleteEntity(lesson, 'lesson')} className="p-1 rounded text-muted-foreground hover:text-destructive">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'track' && (
        <TrackForm data={modal.data} onClose={() => setModal(null)} onSave={() => { queryClient.invalidateQueries({ queryKey: ['allTracks'] }); setModal(null); }} />
      )}
      {modal?.type === 'module' && (
        <ModuleForm data={modal.data} trackId={modal.parentId} onClose={() => setModal(null)} onSave={() => { queryClient.invalidateQueries({ queryKey: ['allModules'] }); setModal(null); }} />
      )}
      {modal?.type === 'lesson' && (
        <LessonForm data={modal.data} moduleId={modal.parentId} trackId={modal.trackId} onClose={() => setModal(null)} onSave={() => { queryClient.invalidateQueries({ queryKey: ['allLessons'] }); setModal(null); }} />
      )}
    </div>
  );
}