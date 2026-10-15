'use client';

import React from 'react';
import { Flame, CalendarCheck } from 'lucide-react';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  daysStudiedThisWeek: number;
  weeklyTargetDays: number;
  daysStatuses?: { date: string; dayName: string; completed: boolean; isToday: boolean }[];
  showStreak?: boolean;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  daysStudiedThisWeek,
  weeklyTargetDays = 6,
  daysStatuses = [],
  showStreak = true,
}: StreakIndicatorProps) {
  if (!showStreak) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
      {/* Current Streak */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-white font-mono">{currentStreak}</span>
            <span className="text-zinc-400 text-[11px]">dias seguidos</span>
          </div>
          <span className="text-[10px] text-zinc-400">Recorde: {longestStreak} dias</span>
        </div>
      </div>

      <div className="hidden sm:block w-px h-8 bg-zinc-800" />

      {/* Weekly Rhythm */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <CalendarCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-300">Ritmo da Semana</span>
            <span className="text-[11px] font-mono text-zinc-300">
              {daysStudiedThisWeek}/{weeklyTargetDays} dias
            </span>
          </div>
          {/* Day dots */}
          <div className="flex items-center gap-1.5 mt-1">
            {daysStatuses.length > 0 ? (
              daysStatuses.map((day) => (
                <div
                  key={day.date}
                  title={`${day.dayName}: ${day.completed ? 'Dia com estudo significativo' : 'Sem registro'}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    day.completed
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : day.isToday
                      ? 'border border-zinc-400 bg-zinc-800'
                      : 'bg-zinc-800'
                  }`}
                />
              ))
            ) : (
              Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < daysStudiedThisWeek ? 'bg-emerald-400' : 'bg-zinc-800'
                  }`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
