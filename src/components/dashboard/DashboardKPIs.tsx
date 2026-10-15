import React from 'react';
import { Clock, CheckSquare, Brain, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDurationMinutes } from '@/lib/utils/date';

interface DashboardKPIsProps {
  weeklyStudiedMinutes: number;
  weeklyTargetMinutes: number;
  totalQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  blankQuestions: number;
  netPointsCebraspe: number;
  accuracyRate: number;
  retentionRate: number | null;
  desiredRetention: number;
  atRiskTopicsCount: number;
}

export function DashboardKPIs({
  weeklyStudiedMinutes,
  weeklyTargetMinutes,
  totalQuestions,
  correctQuestions,
  wrongQuestions,
  blankQuestions,
  netPointsCebraspe,
  accuracyRate,
  retentionRate,
  desiredRetention,
  atRiskTopicsCount,
}: DashboardKPIsProps) {
  const weeklyPercent = Math.min(100, Math.round((weeklyStudiedMinutes / Math.max(1, weeklyTargetMinutes)) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Meta Semanal de Tempo */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider font-semibold">Meta Semanal</span>
          <Clock className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {formatDurationMinutes(weeklyStudiedMinutes)}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / {formatDurationMinutes(weeklyTargetMinutes)}
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
        </div>
        <span className="text-[11px] text-zinc-400">
          {weeklyPercent}% da meta concluída nesta semana
        </span>
      </Card>

      {/* 2. Questões & Desempenho TEC */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider font-semibold">Questões TEC</span>
          <CheckSquare className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalQuestions > 0 ? totalQuestions : '0'}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {totalQuestions > 0 ? (
              <>
                <span className="text-emerald-400 font-semibold">{correctQuestions}C</span> •{' '}
                <span className="text-rose-400 font-semibold">{wrongQuestions}E</span> •{' '}
                <span className="text-zinc-400">{blankQuestions}B</span>
              </>
            ) : (
              'Nenhuma sessão registrada'
            )}
          </p>
        </div>
        <div className="text-[11px] text-zinc-400">
          Acurácia: <span className="text-zinc-200 font-semibold">{totalQuestions > 0 ? `${Math.round(accuracyRate * 100)}%` : '-'}</span>
        </div>
      </Card>

      {/* 3. Nota Líquida Cebraspe */}
      <Card className="flex flex-col justify-between border-l-4 border-l-amber-500/80">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider font-semibold">Nota Líquida Cebraspe</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">
            C - E
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                netPointsCebraspe > 0
                  ? 'text-emerald-400'
                  : netPointsCebraspe < 0
                  ? 'text-rose-400'
                  : 'text-zinc-300'
              }`}
            >
              {totalQuestions > 0 ? (netPointsCebraspe > 0 ? `+${netPointsCebraspe}` : netPointsCebraspe) : '0'}
            </span>
            <span className="text-xs text-zinc-400 font-mono">pts líquidos</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {totalQuestions > 0
              ? `${Math.round((netPointsCebraspe / totalQuestions) * 100)}% de aproveitamento líquido`
              : 'Cebraspe: 1 erro anula 1 acerto'}
          </p>
        </div>
        <span className="text-[11px] text-zinc-400">
          Regra: <span className="text-zinc-300 font-medium">1 errada anula 1 certa</span>
        </span>
      </Card>

      {/* 4. Retenção & Alerta de Riscos */}
      <Card className="flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider font-semibold">Retenção & Riscos</span>
          <Brain className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {retentionRate !== null ? `${retentionRate}%` : '-'}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              (meta: {Math.round(desiredRetention * 100)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            {atRiskTopicsCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {atRiskTopicsCount} tópico{atRiskTopicsCount > 1 ? 's' : ''} em risco
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Nenhum tópico em risco</span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-zinc-400">
          {retentionRate !== null ? 'Baseado no algoritmo FSRS' : 'Sem flashcards ativos'}
        </span>
      </Card>
    </div>
  );
}
