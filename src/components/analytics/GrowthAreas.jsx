import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { CATEGORIES, getSkillLabel } from '@/lib/yogaData';
import { TRACK_ICONS } from '@/lib/curriculumData';

export default function GrowthAreas({ skills = {}, progress = [], allLessons = [], tracks = [] }) {
  const navigate = useNavigate();

  // Calculate lessons completed per category in last 14 days
  const twoWeeksAgo = Date.now() - 14 * 86400000;
  const recentByTrack = {};
  progress.forEach(p => {
    if (new Date(p.completed_at).getTime() > twoWeeksAgo) {
      recentByTrack[p.track_id] = (recentByTrack[p.track_id] || 0) + 1;
    }
  });

  // Score each category: lower skill + less recent activity = higher priority
  const scored = Object.entries(CATEGORIES).map(([key, cat]) => {
    const skill = skills[key] || 0;
    const track = tracks.find(t => t.category === key);
    const recentLessons = track ? (recentByTrack[track.id] || 0) : 0;
    const totalInTrack = allLessons.filter(l => l.track_id === track?.id).length;
    const completedInTrack = progress.filter(p => p.track_id === track?.id).length;
    const remaining = Math.max(0, totalInTrack - completedInTrack);

    // Priority score: weight low skill + low recent activity
    const priority = (100 - skill) * 0.7 + Math.max(0, 3 - recentLessons) * 10;

    return { key, cat, skill, recentLessons, track, remaining, priority };
  });

  const top3 = scored
    .filter(s => s.track) // only include categories with a published track
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const RANK_STYLES = [
    { bg: 'bg-foreground', text: 'text-background', border: 'border-foreground' },
    { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' },
    { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' },
  ];

  return (
    <div className="space-y-3">
      {top3.map(({ key, cat, skill, recentLessons, track, remaining }, i) => {
        const style = RANK_STYLES[i];
        const improvement = 100 - skill;

        return (
          <motion.button
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate('/Learn')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${style.border} bg-white hover:shadow-sm transition-all text-left`}
          >
            {/* Rank badge */}
            <div className={`w-8 h-8 rounded-full ${style.bg} ${style.text} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
              {i + 1}
            </div>

            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
              {cat.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{cat.label}</p>
                <span className="text-xs font-bold">{skill}/100</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                <div className="h-full rounded-full bg-foreground/30" style={{ width: `${skill}%` }} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground">{getSkillLabel(skill)}</span>
                {recentLessons === 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">No recent activity</span>
                )}
                {remaining > 0 && (
                  <span className="text-[10px] text-muted-foreground">{remaining} lessons left</span>
                )}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </motion.button>
        );
      })}

      {top3.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Complete some lessons to see your growth areas.
        </div>
      )}
    </div>
  );
}