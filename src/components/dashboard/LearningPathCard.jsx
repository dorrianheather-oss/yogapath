import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import { CATEGORIES } from '@/lib/yogaData';

export default function LearningPathCard({ category, level, lessonsCompleted = 0 }) {
  const cat = CATEGORIES[category];
  if (!cat) return null;

  return (
    <Link to={`/Lessons?category=${category}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border hover:shadow-sm transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{cat.label}</p>
          <p className="text-xs text-muted-foreground">{cat.description} · Level {level}</p>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(lessonsCompleted * 15, 100)}%` }}
            />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.div>
    </Link>
  );
}