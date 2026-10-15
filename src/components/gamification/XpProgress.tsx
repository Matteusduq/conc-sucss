'use client';

import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { getLevelProgress } from '@/lib/gamification/xp';

interface XpProgressProps {
  totalXp: number;
  level?: number;
  compact?: boolean;
}

export function XpProgress({ totalXp, compact = false }: XpProgressProps) {
  const { level, currentXpInLevel, xpNeededForNext, progressPercent } = getLevelProgress(totalXp);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
          <Trophy className="w-3.5 h-3.5" />
          <span>Nível {level}</span>
        </div>
        <div className="text-[11px] text-zinc-400 font-mono">
          <span className="text-zinc-200 font-semibold">{totalXp.toLocaleString('pt-BR')}</span> XP
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Nível da Jornada
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>Nível {level}</span>
              <span className="text-[11px] font-normal text-zinc-400 font-mono">
                ({totalXp.toLocaleString('pt-BR')} XP total)
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-zinc-400">Próximo Nível</div>
          <div className="text-xs font-mono font-semibold text-amber-300">
            {currentXpInLevel} / 1.000 XP
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Progresso do Nível: {progressPercent}%
          </span>
          <span>Faltam {xpNeededForNext} XP para o Nível {level + 1}</span>
        </div>
      </div>
    </div>
  );
}
