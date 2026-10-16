'use client';

import React from 'react';
import { JourneyPhaseInfo } from '@/lib/gamification/journey';
import { Swords, CheckCircle2, Clock, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WeeklyBossProps {
  phaseInfo: JourneyPhaseInfo;
  isCompletedThisWeek: boolean;
  completedAt?: string;
  onOpenRecordModal: () => void;
  unmetBossMockReason?: string;
}

export function WeeklyBoss({
  phaseInfo,
  isCompletedThisWeek,
  onOpenRecordModal,
  unmetBossMockReason,
}: WeeklyBossProps) {
  const boss = phaseInfo.weeklyBossRecommendation;

  return (
    <div
      className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
        isCompletedThisWeek
          ? 'border-emerald-500/40 bg-zinc-950/80'
          : 'border-purple-500/40 bg-gradient-to-br from-purple-950/20 via-zinc-900/90 to-zinc-950 shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 font-mono">
                Desafio Semanal
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                +{boss.xpReward} XP
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Boss da Semana — Checkpoint Estruturado
            </h3>
          </div>
        </div>

        {isCompletedThisWeek ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" /> Boss Derrotado Esta Semana!
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs border border-zinc-700/60">
            <Clock className="w-3.5 h-3.5 text-purple-400" /> Pendente nesta semana
          </span>
        )}
      </div>

      {/* Unmet Boss Warning if registered mock did not qualify */}
      {!isCompletedThisWeek && unmetBossMockReason && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-300">
              Simulado registrado, mas não completou o Checkpoint Semanal:
            </div>
            <div className="text-zinc-300 mt-0.5">{unmetBossMockReason}</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm font-semibold text-zinc-200">
          {boss.description}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
          O Boss semanal não é gerado por IA, mas sim um{' '}
          <strong className="text-zinc-200 font-semibold">checkpoint real</strong> que você realiza
          no TEC Concursos ou em simulados oficiais. Avalia seu desempenho líquido nas disciplinas de
          P1 e P2 sob as regras rigorosas do Cebraspe (+1 / -1 / 0).
        </p>
      </div>

      {/* Target Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Meta de Questões</div>
          <div className="text-lg font-black text-white font-mono mt-0.5">
            {boss.targetQuestions} itens
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Bateria Cebraspe</div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <div className="text-[10px] text-blue-400 uppercase font-semibold">P1 (Básicos)</div>
          <div className="text-lg font-black text-blue-400 font-mono mt-0.5">
            {boss.p1Target} itens
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Corte mín. 18 líquida</div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <div className="text-[10px] text-purple-400 uppercase font-semibold">P2 (Específicos)</div>
          <div className="text-lg font-black text-purple-400 font-mono mt-0.5">
            {boss.p2Target} itens
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Corte mín. 27 líquida</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span>Prazo: pode ser executado em qualquer dia da semana corrente.</span>
        </div>

        <Button
          onClick={onOpenRecordModal}
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs gap-1.5 shadow-md shrink-0"
        >
          {isCompletedThisWeek ? 'Registrar Novo Checkpoint' : 'Registrar Resultado do Boss'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
