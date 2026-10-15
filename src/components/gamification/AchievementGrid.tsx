'use client';

import React, { useState } from 'react';
import { ALL_ACHIEVEMENTS } from '@/lib/gamification/achievements';
import {
  Trophy,
  CheckCircle2,
  Lock,
  Footprints,
  Target,
  Award,
  Zap,
  Flame,
  Brain,
  Crown,
  PenTool,
  FileText,
  Compass,
  Shield,
  Sparkles,
  CalendarCheck,
  Swords,
} from 'lucide-react';

interface AchievementGridProps {
  unlockedIds: string[];
}

export function AchievementGrid({ unlockedIds }: AchievementGridProps) {
  const [showAll, setShowAll] = useState(false);
  const unlockedSet = new Set(unlockedIds || []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints':
        return Footprints;
      case 'Target':
        return Target;
      case 'Award':
        return Award;
      case 'Zap':
        return Zap;
      case 'Flame':
        return Flame;
      case 'CheckCircle2':
        return CheckCircle2;
      case 'Brain':
        return Brain;
      case 'Crown':
        return Crown;
      case 'PenTool':
        return PenTool;
      case 'FileText':
        return FileText;
      case 'Compass':
        return Compass;
      case 'Shield':
        return Shield;
      case 'Sparkles':
        return Sparkles;
      case 'Trophy':
        return Trophy;
      case 'CalendarCheck':
        return CalendarCheck;
      case 'Swords':
        return Swords;
      default:
        return Trophy;
    }
  };

  const unlockedList = ALL_ACHIEVEMENTS.filter((a) => unlockedSet.has(a.id));
  const lockedList = ALL_ACHIEVEMENTS.filter((a) => !unlockedSet.has(a.id));

  // By default, display all unlocked + up to 4 next locked ones
  const displayedLocked = showAll ? lockedList : lockedList.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Conquistas da Jornada
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Reconhecimento por marcos reais de dedicação e disciplina acadêmica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            {unlockedList.length} de {ALL_ACHIEVEMENTS.length} desbloqueadas
          </span>
          {lockedList.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
            >
              {showAll ? 'Mostrar menos' : `Ver todas (+${lockedList.length - 4})`}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Unlocked Achievements */}
        {unlockedList.map((ach) => {
          const Icon = getIcon(ach.icon);
          return (
            <div
              key={ach.id}
              className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-zinc-950 shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Desbloqueada
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">{ach.criteria_text}</span>
                <span className="font-mono text-amber-400 font-bold">+{ach.xp_reward} XP</span>
              </div>
            </div>
          );
        })}

        {/* Next Locked Achievements */}
        {displayedLocked.map((ach) => {
          const Icon = getIcon(ach.icon);
          return (
            <div
              key={ach.id}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 opacity-75 space-y-2 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bloqueada
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-300">{ach.title}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">{ach.criteria_text}</span>
                <span className="font-mono text-zinc-400 font-semibold">+{ach.xp_reward} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
