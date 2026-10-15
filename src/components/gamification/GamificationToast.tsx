'use client';

import React from 'react';
import { GamificationNotification } from '@/lib/gamification/types';
import { Sparkles, Trophy, Award, CheckCircle, Swords, X } from 'lucide-react';

interface GamificationToastProps {
  notifications: GamificationNotification[];
  onDismiss: (id: string) => void;
  enabled?: boolean;
}

const TOAST_ICONS: Record<GamificationNotification['type'], React.ComponentType<{ className?: string }>> = {
  LEVEL_UP: Trophy,
  ACHIEVEMENT_UNLOCKED: Award,
  MISSION_COMPLETED: CheckCircle,
  WEEKLY_BOSS_COMPLETED: Swords,
  XP_AWARDED: Sparkles,
};

export function GamificationToast({
  notifications,
  onDismiss,
  enabled = true,
}: GamificationToastProps) {
  if (!enabled || !notifications || notifications.length === 0) return null;

  const current = notifications[0];
  const Icon = TOAST_ICONS[current.type] || Sparkles;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/40 bg-zinc-950/95 backdrop-blur-md shadow-2xl text-white">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-0.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-300 tracking-tight">
              {current.title}
            </h4>
            {current.xpAmount && (
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                +{current.xpAmount} XP
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-300 leading-snug">
            {current.message}
          </p>
        </div>

        <button
          onClick={() => onDismiss(current.id)}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
