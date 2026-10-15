'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Topic, Subject, SubjectiveFeeling } from '@/types/database';
import { calculateAccuracyRate, calculateNetPoints } from '@/lib/study-engine/domain';

interface TecSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  subjects: Subject[];
  initialTopicId?: string;
  onSaveSession: (data: {
    subject_id: string;
    topic_id: string;
    performed_at: string;
    total_questions: number;
    correct: number;
    wrong: number;
    blank: number;
    duration_seconds: number;
    subjective_feeling: SubjectiveFeeling;
    notes: string | null;
    accuracy_rate: number;
    net_points: number;
    net_rate: number;
    had_conceptual_error: boolean;
  }) => void;
  onOpenErrorLog?: (topicId: string) => void;
}

export function TecSessionModal({
  isOpen,
  onClose,
  topics,
  subjects,
  initialTopicId,
  onSaveSession,
  onOpenErrorLog,
}: TecSessionModalProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || (topics[0]?.id ?? ''));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const [correct, setCorrect] = useState<number>(24);
  const [wrong, setWrong] = useState<number>(6);
  const [blank, setBlank] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(35);
  const [feeling, setFeeling] = useState<SubjectiveFeeling>('REASONABLE');
  const [notes, setNotes] = useState<string>('');
  const [hadConceptualError, setHadConceptualError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeTopicId = initialTopicId || selectedTopicId;
  const selectedTopic = topics.find((t) => t.id === activeTopicId) || topics[0];
  const selectedSubject = selectedTopic ? subjects.find((s) => s.id === selectedTopic.subject_id) : undefined;

  const currentSum = correct + wrong + blank;
  const isSumValid = currentSum === totalQuestions;
  const netPoints = calculateNetPoints(correct, wrong);
  const accuracy = calculateAccuracyRate(correct, wrong);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !selectedSubject) {
      setErrorMsg('Selecione um tópico válido.');
      return;
    }
    if (!isSumValid) {
      setErrorMsg(`A soma de certas (${correct}) + erradas (${wrong}) + em branco (${blank}) é ${currentSum}, mas o total informado foi ${totalQuestions}.`);
      return;
    }
    if (totalQuestions <= 0) {
      setErrorMsg('O total de questões deve ser maior que 0.');
      return;
    }

    setErrorMsg(null);
    const netRate = netPoints / totalQuestions;

    onSaveSession({
      subject_id: selectedSubject.id,
      topic_id: selectedTopic.id,
      performed_at: new Date(date).toISOString(),
      total_questions: totalQuestions,
      correct,
      wrong,
      blank,
      duration_seconds: durationMinutes * 60,
      subjective_feeling: feeling,
      notes: notes.trim() || null,
      accuracy_rate: accuracy,
      net_points: netPoints,
      net_rate: netRate,
      had_conceptual_error: hadConceptualError,
    });

    onClose();

    if (hadConceptualError && onOpenErrorLog) {
      onOpenErrorLog(selectedTopic.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Sessão no TEC Concursos"
      description="Insira o resultado real obtido externamente para recalcular o domínio Cebraspe."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Topic Selector */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Tópico Estudado</label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-zinc-500"
          >
            {subjects.map((sub) => {
              const subTopics = topics.filter((t) => t.subject_id === sub.id);
              return (
                <optgroup key={sub.id} label={sub.name}>
                  {subTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.priority}] {t.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {/* TEC Helper Box */}
        {selectedTopic?.tec_filter_hint && (
          <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Filtro sugerido no TEC:
              </span>
              <p className="text-zinc-300 text-xs font-mono">{selectedTopic.tec_filter_hint}</p>
            </div>
            <a
              href="https://www.tecconcursos.com.br"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs shrink-0 transition-colors"
            >
              Abrir TEC
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Date and Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-400 mb-1">Data da Sessão</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
              required
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">Tempo Gasto (minutos)</label>
            <input
              type="number"
              min="1"
              max="600"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 font-mono"
              required
            />
          </div>
        </div>

        {/* Questions Breakdown */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 font-medium">Total</label>
              <input
                type="number"
                min="1"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-center text-zinc-100 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-emerald-400 font-medium">Certas</label>
              <input
                type="number"
                min="0"
                value={correct}
                onChange={(e) => setCorrect(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-emerald-900/60 rounded-lg p-1.5 text-center text-emerald-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-rose-400 font-medium">Erradas</label>
              <input
                type="number"
                min="0"
                value={wrong}
                onChange={(e) => setWrong(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-rose-900/60 rounded-lg p-1.5 text-center text-rose-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 font-medium">Em Branco</label>
              <input
                type="number"
                min="0"
                value={blank}
                onChange={(e) => setBlank(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-center text-zinc-300 font-mono"
              />
            </div>
          </div>

          {/* Validation & Net Score Banner */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <div>
              {!isSumValid ? (
                <span className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Soma ({currentSum}) ≠ Total ({totalQuestions})
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Validação correta (100%)
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] text-zinc-400">Nota Líquida:</span>
              <span
                className={`text-base font-black font-mono ${
                  netPoints > 0 ? 'text-emerald-400' : netPoints < 0 ? 'text-rose-400' : 'text-zinc-300'
                }`}
              >
                {netPoints > 0 ? `+${netPoints}` : netPoints} pts
              </span>
            </div>
          </div>
        </div>

        {/* Subjective Feeling */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Percepção Subjetiva</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'MASTERED', label: 'Dominado', color: 'hover:border-emerald-700' },
              { id: 'REASONABLE', label: 'Razoável', color: 'hover:border-blue-700' },
              { id: 'UNSURE', label: 'Inseguro', color: 'hover:border-amber-700' },
              { id: 'VERY_WEAK', label: 'Muito fraco', color: 'hover:border-rose-700' },
            ].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setFeeling(f.id as SubjectiveFeeling)}
                className={`p-2 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  feeling === f.id
                    ? 'border-zinc-200 bg-zinc-800 text-white font-bold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 ' + f.color
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conceptual Error Checkbox */}
        <label className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer">
          <input
            type="checkbox"
            checked={hadConceptualError}
            onChange={(e) => setHadConceptualError(e.target.checked)}
            className="w-4 h-4 rounded text-blue-500 bg-zinc-800 border-zinc-700"
          />
          <span className="text-zinc-300 font-medium">
            Houve erro conceitual importante? (Permite catalogar no Caderno de Erros)
          </span>
        </label>

        {/* Notes */}
        <div>
          <label className="block text-zinc-400 mb-1">Observações da Sessão (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: Pegadinhas Cebraspe sobre prazos e exceções..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!isSumValid}>
            Salvar Sessão e Atualizar Domínio
          </Button>
        </div>
      </form>
    </Modal>
  );
}
