'use client';

import React, { useState } from 'react';
import { X, Swords, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MockExamType } from '@/types/database';
import { calculateMockExamScore } from '@/lib/gamification/mock-exam';

interface RecordMockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    type: MockExamType;
    p1_correct: number;
    p1_wrong: number;
    p1_blank: number;
    p2_correct: number;
    p2_wrong: number;
    p2_blank: number;
    duration_seconds?: number;
    notes?: string;
  }) => void;
}

export function RecordMockModal({ isOpen, onClose, onSave }: RecordMockModalProps) {
  const [mockType, setMockType] = useState<MockExamType>('WEEKLY_CHECKPOINT');
  const [p1Correct, setP1Correct] = useState<string>('15');
  const [p1Wrong, setP1Wrong] = useState<string>('0');
  const [p1Blank, setP1Blank] = useState<string>('0');

  const [p2Correct, setP2Correct] = useState<string>('15');
  const [p2Wrong, setP2Wrong] = useState<string>('0');
  const [p2Blank, setP2Blank] = useState<string>('0');

  const [durationMinutes, setDurationMinutes] = useState<string>('60');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const p1C = parseInt(p1Correct, 10) || 0;
  const p1W = parseInt(p1Wrong, 10) || 0;
  const p1B = parseInt(p1Blank, 10) || 0;
  const p1Total = p1C + p1W + p1B;

  const p2C = parseInt(p2Correct, 10) || 0;
  const p2W = parseInt(p2Wrong, 10) || 0;
  const p2B = parseInt(p2Blank, 10) || 0;
  const p2Total = p2C + p2W + p2B;

  const isFullMockValid = mockType !== 'FULL_MOCK' || (p1Total === 90 && p2Total === 90);

  const evalResult = calculateMockExamScore({
    p1_correct: p1C,
    p1_wrong: p1W,
    p1_blank: p1B,
    p2_correct: p2C,
    p2_wrong: p2W,
    p2_blank: p2B,
    type: mockType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFullMockValid) return;
    onSave({
      type: mockType,
      p1_correct: p1C,
      p1_wrong: p1W,
      p1_blank: p1B,
      p2_correct: p2C,
      p2_wrong: p2W,
      p2_blank: p2B,
      duration_seconds: (parseInt(durationMinutes, 10) || 0) * 60,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Registrar Checkpoint / Simulado
              </h2>
              <span className="text-xs text-zinc-400">
                Modelo Cebraspe com cálculo de pontos líquidos e cortes do edital
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mock Type Select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Tipo de Checkpoint
            </label>
            <select
              value={mockType}
              onChange={(e) => setMockType(e.target.value as MockExamType)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-medium"
            >
              <option value="WEEKLY_CHECKPOINT">Boss da Semana (Checkpoint Semanal)</option>
              <option value="PARTIAL_MOCK">Simulado Parcial de Ritmo (Volume variável)</option>
              <option value="FULL_MOCK">Simulado Completo do Edital (180 itens: 90 P1 + 90 P2)</option>
            </select>
            {mockType === 'FULL_MOCK' && (
              <div className="mt-2 p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300">
                <strong>Regra Full Mock:</strong> Exatamente 90 itens P1 + 90 itens P2 (180 itens no total).
              </div>
            )}
            {mockType === 'WEEKLY_CHECKPOINT' && (
              <div className="mt-2 p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300">
                <strong>Checkpoint Semanal:</strong> Valida o volume mínimo exigido para o Boss da fase atual.
              </div>
            )}
            {mockType === 'PARTIAL_MOCK' && (
              <div className="mt-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                <strong>Simulado Parcial:</strong> Aceita volume livre de itens. Pontua +60 XP a partir de 30 itens.
              </div>
            )}
          </div>

          {/* Block P1 Inputs */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
                P1 — Conhecimentos Básicos
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Mínimo eliminatório: <strong>18 pts líquidos</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Certas (+1)</label>
                <input
                  type="number"
                  min="0"
                  value={p1Correct}
                  onChange={(e) => setP1Correct(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Erradas (-1)</label>
                <input
                  type="number"
                  min="0"
                  value={p1Wrong}
                  onChange={(e) => setP1Wrong(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Branco (0)</label>
                <input
                  type="number"
                  min="0"
                  value={p1Blank}
                  onChange={(e) => setP1Blank(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono text-white text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-zinc-400">Pontuação Líquida P1:</span>
              <span
                className={`font-bold ${
                  evalResult.isP1AboveMinimum ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {evalResult.p1_net} pts {evalResult.isP1AboveMinimum ? '✓' : '(abaixo de 18)'}
              </span>
            </div>
          </div>

          {/* Block P2 Inputs */}
          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
                P2 — Conhecimentos Específicos
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Mínimo eliminatório: <strong>27 pts líquidos</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Certas (+1)</label>
                <input
                  type="number"
                  min="0"
                  value={p2Correct}
                  onChange={(e) => setP2Correct(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Erradas (-1)</label>
                <input
                  type="number"
                  min="0"
                  value={p2Wrong}
                  onChange={(e) => setP2Wrong(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Branco (0)</label>
                <input
                  type="number"
                  min="0"
                  value={p2Blank}
                  onChange={(e) => setP2Blank(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono text-white text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-zinc-400">Pontuação Líquida P2:</span>
              <span
                className={`font-bold ${
                  evalResult.isP2AboveMinimum ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {evalResult.p2_net} pts {evalResult.isP2AboveMinimum ? '✓' : '(abaixo de 27)'}
              </span>
            </div>
          </div>

          {/* Total Net and Eliminatory Status Result */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              evalResult.isAboveEliminatoryThreshold
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-amber-500/40 bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {evalResult.isAboveEliminatoryThreshold ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">
                    {evalResult.statusLabel}
                  </div>
                  <div className="text-[11px] text-zinc-300">
                    Total: {evalResult.total_questions} itens • Líquida total:{' '}
                    <strong className="font-mono text-white">{evalResult.net_points} pts</strong>{' '}
                    (mín. 54)
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-2">
              {evalResult.statusDescription}
            </p>
          </div>

          {/* Time & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Tempo Gasto (minutos)
              </label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Anotações Estratégicas
              </label>
              <input
                type="text"
                placeholder="Ex: Tempo apertado em TI, muitos chutes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
              />
            </div>
          </div>

          {/* Full Mock Validation Banner */}
          {mockType === 'FULL_MOCK' && !isFullMockValid && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Simulado Completo Incompleto:</strong> O edital exige exatamente 90 itens em P1 e 90 em P2 (180 no total). Registrado atualmente: P1 = {p1Total}, P2 = {p2Total}. Ajuste os campos para salvar como FULL_MOCK ou selecione outro tipo.
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-800 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFullMockValid}
              className={`font-bold transition-all ${
                !isFullMockValid
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {mockType === 'FULL_MOCK'
                ? 'Salvar Simulado Completo (+200 XP)'
                : mockType === 'WEEKLY_CHECKPOINT'
                ? 'Salvar Checkpoint Semanal (+120 XP)'
                : 'Salvar Simulado Parcial'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
