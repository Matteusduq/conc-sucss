'use client';

import React from 'react';
import { DailyMission } from '@/lib/gamification/types';
import { MissionCard } from './MissionCard';
import { Target, CheckCircle2, Sparkles } from 'lucide-react';

interface DailyMissionsProps {
  missions: DailyMission[];
  dateStr?: string;
}

export function DailyMissions({ missions, dateStr }: DailyMissionsProps) {
  const completedCount = missions.filter((m) => m.status === 'COMPLETED').length;
  const totalCount = missions.length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  const mainMission = missions.find((m) => m.is_main);
  const supportMissions = missions.filter((m) => !m.is_main);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Missões de Hoje
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Metas do dia derivadas do StudyScore e do tempo disponível.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            {completedCount} de {totalCount} concluídas
          </span>
          {isAllCompleted && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> +40 XP Bônus Diário
            </span>
          )}
        </div>
      </div>

      {/* Main Mission */}
      {mainMission && (
        <MissionCard mission={mainMission} />
      )}

      {/* Support Missions Grid */}
      {supportMissions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Missões de Apoio & Consolidação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supportMissions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
