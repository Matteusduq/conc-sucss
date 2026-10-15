'use client';

import React from 'react';
import { JourneyPhaseInfo } from '@/lib/gamification/journey';
import { XpProgress } from './XpProgress';
import { StreakIndicator } from './StreakIndicator';
import { Compass, Calendar, ShieldCheck, Sparkles } from 'lucide-react';

interface JourneyHeaderProps {
  phaseInfo: JourneyPhaseInfo;
  daysUntilExam: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  daysStudiedThisWeek: number;
  weeklyTargetDays?: number;
  daysStatuses?: { date: string; dayName: string; completed: boolean; isToday: boolean }[];
  showStreak?: boolean;
}

export function JourneyHeader({
  phaseInfo,
  daysUntilExam,
  totalXp,
  currentStreak,
  longestStreak,
  daysStudiedThisWeek,
  weeklyTargetDays = 6,
  daysStatuses = [],
  showStreak = true,
}: JourneyHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Jornada Câmara 2027
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Edital nº 1/2026 • Registro e Redação
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {phaseInfo.title}
            </h1>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              {phaseInfo.description}
            </p>
          </div>

          {/* Exam Countdown Badge */}
          <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Data da Prova: 17/01/2027</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {daysUntilExam}
              </span>
              <span className="text-xs font-semibold text-zinc-300">dias restantes</span>
            </div>
          </div>
        </div>

        {/* Focus Banner */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Foco Pedagógico Atual:
          </span>
          <span className="text-zinc-200">{phaseInfo.pedagogicalFocus}</span>
          <span className="text-zinc-400">•</span>
          <span className="text-zinc-400">Meta P3: {phaseInfo.discursiveWeeklyTarget} treino(s)/semana</span>
        </div>
      </div>

      {/* Grid: XP & Level and Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <XpProgress totalXp={totalXp} />
        <StreakIndicator
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          daysStudiedThisWeek={daysStudiedThisWeek}
          weeklyTargetDays={weeklyTargetDays}
          daysStatuses={daysStatuses}
          showStreak={showStreak}
        />
      </div>
    </div>
  );
}
