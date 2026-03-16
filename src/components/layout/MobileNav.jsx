import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Dumbbell, LayoutGrid, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/Dashboard', icon: Home, label: 'Home' },
  { path: '/Lessons', icon: BookOpen, label: 'Learn' },
  { path: '/PoseLibrary', icon: Dumbbell, label: 'Poses' },
  { path: '/ClassBuilder', icon: LayoutGrid, label: 'Build' },
  { path: '/Progress', icon: Trophy, label: 'Progress' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}