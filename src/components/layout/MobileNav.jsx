import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Sparkles, LayoutGrid, Heart, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BASE_NAV = [
  { path: '/Dashboard', icon: Home, label: 'Home' },
  { path: '/Learn', icon: Map, label: 'Learn' },
  { path: '/Generator', icon: Sparkles, label: 'Generate' },
  { path: '/ClassBuilder', icon: LayoutGrid, label: 'Build' },
  { path: '/Library', icon: Heart, label: 'Saved' },
];

const ADMIN_NAV_ITEM = { path: '/Admin', icon: ShieldCheck, label: 'Admin' };

export default function MobileNav() {
  const location = useLocation();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1),
    staleTime: 60_000,
  });
  const profile = profiles[0];
  const isAdmin = profile?.role === 'admin';

  const navItems = isAdmin ? [...BASE_NAV, ADMIN_NAV_ITEM] : BASE_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          const isHeart = path === '/Library';
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive && "stroke-[2.5px]",
                isHeart && isActive && "fill-current"
              )} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
