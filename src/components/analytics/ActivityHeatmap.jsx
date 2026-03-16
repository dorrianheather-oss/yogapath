import React from 'react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay } from 'date-fns';

const DAYS = 56; // 8 weeks × 7 days
const COLS = 8;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getIntensity(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const CELL_CLASSES = [
  'bg-muted',
  'bg-foreground/20',
  'bg-foreground/40',
  'bg-foreground/65',
  'bg-foreground',
];

export default function ActivityHeatmap({ progress = [] }) {
  // Build a map of date string -> count of completions
  const countByDay = {};
  progress.forEach(p => {
    if (!p.completed_at) return;
    const day = format(new Date(p.completed_at), 'yyyy-MM-dd');
    countByDay[day] = (countByDay[day] || 0) + 1;
  });

  // Build grid: last DAYS days, oldest first
  const today = startOfDay(new Date());
  const cells = Array.from({ length: DAYS }, (_, i) => {
    const date = subDays(today, DAYS - 1 - i);
    const key = format(date, 'yyyy-MM-dd');
    return { date, key, count: countByDay[key] || 0 };
  });

  // Group into weeks (columns)
  const weeks = Array.from({ length: COLS }, (_, wi) =>
    cells.slice(wi * 7, wi * 7 + 7)
  );

  // Month labels — show month name when it changes across weeks
  const monthLabels = weeks.map(week => {
    const first = week[0];
    return first ? format(first.date, 'MMM') : '';
  });
  const deduped = monthLabels.map((m, i) => (i === 0 || m !== monthLabels[i - 1] ? m : ''));

  const totalActive = Object.keys(countByDay).length;
  const totalThisWeek = cells.slice(-7).reduce((s, c) => s + c.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      {/* Day row labels */}
      <div className="flex gap-1.5 mb-1 pl-[28px]">
        {deduped.map((label, wi) => (
          <div key={wi} className="w-[22px] text-[9px] text-muted-foreground text-center shrink-0">
            {label}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        {/* Day of week labels */}
        <div className="flex flex-col gap-1.5 justify-between pr-1">
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
            <div key={i} className="h-[22px] flex items-center justify-end">
              <span className="text-[9px] text-muted-foreground w-[22px] text-right">{d}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={`${format(cell.date, 'MMM d')}: ${cell.count} lesson${cell.count !== 1 ? 's' : ''}`}
                  className={cn(
                    'w-[22px] h-[22px] rounded-sm transition-all',
                    CELL_CLASSES[getIntensity(cell.count)]
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{totalActive}</span> active days
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{totalThisWeek}</span> lessons this week
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">Less</span>
          {CELL_CLASSES.map((cls, i) => (
            <div key={i} className={cn('w-[10px] h-[10px] rounded-sm', cls)} />
          ))}
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}