import React from 'react';
import { CATEGORIES } from '@/lib/yogaData';

export default function SkillRadar({ skills = {} }) {
  const cats = Object.entries(CATEGORIES);
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 70;

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / cats.length - Math.PI / 2;
    const r = (value / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const points = cats.map(([key], i) => getPoint(i, skills[key] || 0));
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridLevels.map(level => {
          const gridPoints = cats.map((_, i) => getPoint(i, level));
          return (
            <polygon
              key={level}
              points={gridPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={level === 100 ? 1.5 : 0.5}
            />
          );
        })}

        {/* Axes */}
        {cats.map((_, i) => {
          const end = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={end.x} y2={end.y}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygon}
          fill="hsl(var(--primary) / 0.15)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="hsl(var(--primary))" />
        ))}

        {/* Labels */}
        {cats.map(([key, cat], i) => {
          const labelPoint = getPoint(i, 130);
          return (
            <text
              key={key}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-muted-foreground font-medium"
            >
              {cat.icon}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {cats.map(([key, cat]) => (
          <div key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className="font-semibold text-foreground">{skills[key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}