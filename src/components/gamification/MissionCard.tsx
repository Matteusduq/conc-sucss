'use client';

import React from 'react';
import { DailyMission } from '@/lib/gamification/types';
import { CheckCircle2, Clock, Circle, ArrowRight, Target, Sparkles, BookOpen, Brain, AlertOctagon, PenTool, Swords } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface MissionCardProps {
  mission: DailyMission;
  onActionClick?: (mission: DailyMission) => void;
}

const MISSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CORE_STUDY: BookOpen,
  QUESTIONS: Target,
  MEMORY: Brain,
  ERROR_REVIEW: AlertOctagon,
  DISCURSIVE: PenTool,
  WEEKLY_BOSS: Swords,
  MOCK_EXAM: Swords,
};

export function MissionCard({ mission, onActionClick }: MissionCardProps) {
  const isCompleted = mission.status === 'COMPLETED';
  const isInProgress = mission.status === 'IN_PROGRESS';
  const progressPercent = Math.min(
    100,
    Math.round((mission.current_value / Math.max(1, mission.target_value)) * 100)
  );

  const Icon = MISSION_ICONS[mission.type] || Sparkles;

  if (mission.is_main) {
    return (
      <div
        className={`p-5 rounded-2xl border-2 transition-all shadow-md space-y-4 ${
          isCompleted
            ? 'border-emerald-500/50 bg-emerald-950/20'
            : 'border-amber-500/50 bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Missão Principal de Hoje
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Baseada no StudyScore estratégico
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              +{mission.xp_reward} XP
            </span>
            {isCompleted ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Concluída
              </span>
            ) : isInProgress ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Clock className="w-4 h-4" /> Em andamento
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-tight">
            {mission.title}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {mission.description}
          </p>

          {mission.reason && (
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">Por que esta missão agora?</div>
              <div className="leading-relaxed">{mission.reason}</div>
            </div>
          )}
        </div>

        {/* Progress & CTA */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Progresso verificado:</span>
            <span className="font-mono font-semibold text-zinc-200">
              {mission.current_value} / {mission.target_value} {mission.unit} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-zinc-400">
            Atualização automática pelos registros de estudo
          </span>
          {mission.cta_url && !isCompleted && (
            <Link href={mission.cta_url}>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs gap-1.5 shadow-md">
                {mission.cta_label || 'Iniciar Missão'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Support Mission Card
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'border-emerald-500/40 bg-zinc-950/80'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className={`text-xs font-bold ${isCompleted ? 'text-zinc-300' : 'text-white'}`}>
                {mission.title}
              </h4>
              {isCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {mission.description}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
          +{mission.xp_reward} XP
        </span>
      </div>

      {/* Progress bar and CTA */}
      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>
              {mission.current_value} de {mission.target_value} {mission.unit}
            </span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-400' : 'bg-indigo-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {mission.cta_url && !isCompleted && (
          <Link href={mission.cta_url} className="shrink-0">
            <Button size="sm" variant="outline" className="text-[11px] h-7 border-zinc-700 hover:bg-zinc-800">
              {mission.cta_label || 'Executar'}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
