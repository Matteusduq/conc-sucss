'use client';

import React from 'react';
import { JourneyPhase } from '@/lib/gamification/types';
import { CheckCircle2, Circle, ArrowRight, ShieldCheck, Flame, BookOpen, Layers } from 'lucide-react';

interface JourneyMapProps {
  currentPhase: JourneyPhase;
  phaseNumber: number; // 1 to 4
  coveragePercent: number;
}

export function JourneyMap({ currentPhase, phaseNumber, coveragePercent }: JourneyMapProps) {
  const phases = [
    {
      num: 1,
      id: 'BASE',
      name: 'Fase A — Base e Cobertura',
      shortName: 'Base & Teoria',
      threshold: 'Início (> 60 dias)',
      objective: 'Fundamentos, primeiros materiais e início gradual de P3',
      icon: BookOpen,
    },
    {
      num: 2,
      id: 'CONSOLIDATION',
      name: 'Fase B — Consolidação',
      shortName: 'Consolidação',
      threshold: '<= 60 dias ou >= 65% cob.',
      objective: 'Volume de questões Cebraspe, resolução de erros e FSRS',
      icon: Layers,
    },
    {
      num: 3,
      id: 'EXAM_MODE',
      name: 'Fase C — Ritmo de Prova',
      shortName: 'Ritmo de Prova',
      threshold: '15 a 30 dias',
      objective: 'Questões mistas, simulados parciais e controle de pontos líquidos',
      icon: ShieldCheck,
    },
    {
      num: 4,
      id: 'FINAL_SPRINT',
      name: 'Fase D — Reta Final',
      shortName: 'Reta Final',
      threshold: '<= 14 dias',
      objective: 'Blindagem de erros recorrentes, cards vencidos e simulado final',
      icon: Flame,
    },
  ];

  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Mapa da Preparação</span>
            <span className="text-[10px] text-zinc-400 font-normal font-mono">
              (Ciclo até 17/01/2027)
            </span>
          </h2>
          <p className="text-[11px] text-zinc-400">
            Progressão pedagógica por marcos temporais e cobertura do edital.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-zinc-400 font-mono">
            Cobertura Global do Edital:{' '}
            <strong className="text-emerald-400 font-bold">{coveragePercent}%</strong>
          </span>
        </div>
      </div>

      {/* Visual Phase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {phases.map((p) => {
          const isCompleted = phaseNumber > p.num;
          const isCurrent = phaseNumber === p.num;
          const isFuture = phaseNumber < p.num;
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              className={`relative p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 via-zinc-900/90 to-zinc-950 shadow-lg ring-1 ring-amber-500/30'
                  : isCompleted
                  ? 'border-emerald-500/30 bg-zinc-950/70'
                  : 'border-zinc-800/70 bg-zinc-950/40 opacity-75'
              }`}
            >
              {/* Header Status Tag */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCurrent ? '● Fase Atual' : isCompleted ? '✓ Concluída' : 'Próxima'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">{p.threshold}</span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isCurrent
                      ? 'bg-amber-500/20 text-amber-300'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800/50 text-zinc-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-zinc-200' : 'text-zinc-400'
                    }`}
                  >
                    {p.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                    {p.objective}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
