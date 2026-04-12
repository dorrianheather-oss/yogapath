import React from 'react';
import { CATEGORIES, getSkillLabel } from '@/lib/yogaData';

export default function SkillRadarChart({ skills = {} }) {
  const cats = Object.entries(CATEGORIES);
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 80;
  const labelR = 100;

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / cats.length - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const getLabelPoint = (index) => {
    const angle = (Math.PI * 2 * index) / cats.length - Math.PI / 2;
    return { x: cx + labelR * Math.cos(angle), y: cy + labelR * Math.sin(angle) };
  };

  const points = cats.map(([key], i) => getPoint(i, skills[key] || 0));
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {gridLevels.map(level => {
          const gp = cats.map((_, i) => getPoint(i, level));
          return (
            <polygon
              key={level}
              points={gp.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={level === 100 ? 1.5 : 0.75}
            />
          );
        })}

        {/* % labels on one axis */}
        {gridLevels.map(level => {
          const p = getPoint(0, level);
          return (
            <text key={level} x={p.x + 4} y={p.y} className="text-[8px] fill-muted-foreground" dominantBaseline="middle">
              {level}
            </text>
          );
        })}

        {/* Axes */}
        {cats.map((_, i) => {
          const end = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth={0.75} />;
        })}

        {/* Filled area */}
        <polygon
          points={polygon}
          fill="hsl(var(--foreground) / 0.1)"
          stroke="hsl(var(--foreground))"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="hsl(var(--foreground))" />
        ))}

        {/* Labels */}
        {cats.map(([key, cat], i) => {
          const lp = getLabelPoint(i);
          return (
            <g key={key}>
              <text
                x={lp.x} y={lp.y - 5}
                textAnchor="middle" dominantBaseline="middle"
                className="text-[11px] fill-foreground"
              >
                {cat.icon}
              </text>
              <text
                x={lp.x} y={lp.y + 9}
                textAnchor="middle" dominantBaseline="middle"
                className="text-[7.5px] fill-muted-foreground font-medium"
              >
                {cat.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Score grid */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-2 mt-3 w-full">
        {cats.map(([key, cat]) => {
          const score = skills[key] || 0;
          return (
            <div key={key} className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{cat.icon} {cat.label}</span>
                <span className="text-xs font-bold">{score}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${score}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">{getSkillLabel(score)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}