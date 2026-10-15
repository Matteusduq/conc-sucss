'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DiscursiveType, Subject, Topic } from '@/types/database';
import { calculateDiscursiveScore } from '@/lib/study-engine/discursive';

interface DiscursiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  onSave: (session: {
    user_id: string;
    exam_id: string;
    type: DiscursiveType;
    performed_at: string;
    title: string | null;
    prompt_summary: string | null;
    related_subject_id: string | null;
    related_topic_id: string | null;
    duration_seconds: number | null;
    lines_written: number;
    content_score: number;
    language_errors: number;
    notes: string | null;
  }) => void;
}

export function DiscursiveSessionModal({
  isOpen,
  onClose,
  subjects,
  topics,
  onSave,
}: DiscursiveSessionModalProps) {
  const [type, setType] = useState<DiscursiveType>('QUESTION_20_LINES');
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [promptSummary, setPromptSummary] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [linesWritten, setLinesWritten] = useState(20);
  const [contentScore, setContentScore] = useState(12);
  const [languageErrors, setLanguageErrors] = useState(1);
  const [notes, setNotes] = useState('');

  const maxLines = type === 'QUESTION_20_LINES' ? 20 : 50;
  const maxScore = type === 'QUESTION_20_LINES' ? 15 : 30;

  // Adjust defaults on type switch
  useEffect(() => {
    if (type === 'QUESTION_20_LINES') {
      setLinesWritten((prev) => (prev > 20 ? 20 : prev));
      setContentScore((prev) => (prev > 15 ? 12 : prev));
    } else {
      setLinesWritten((prev) => (prev < 25 ? 45 : prev));
      setContentScore((prev) => (prev < 15 ? 24 : prev));
    }
  }, [type]);

  const calc = calculateDiscursiveScore(type, contentScore, languageErrors, linesWritten);

  const filteredTopics = topics.filter((t) => (!subjectId ? true : t.subject_id === subjectId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calc.isValid) return;

    onSave({
      user_id: 'local-user',
      exam_id: 'exam-camara-2027',
      type,
      performed_at: new Date(performedAt).toISOString(),
      title: title.trim() || null,
      prompt_summary: promptSummary.trim() || null,
      related_subject_id: subjectId || null,
      related_topic_id: topicId || null,
      duration_seconds: null,
      lines_written: linesWritten,
      content_score: contentScore,
      language_errors: languageErrors,
      notes: notes.trim() || null,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Treino Discursivo">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Type selector */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Tipo de Prova Discursiva</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('QUESTION_20_LINES')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                type === 'QUESTION_20_LINES'
                  ? 'border-white bg-zinc-800 text-white font-bold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="text-xs">Questão Discursiva (Q20)</div>
              <div className="text-[10px] text-zinc-400">Até 20 linhas | 15 pontos máx</div>
            </button>
            <button
              type="button"
              onClick={() => setType('TECHNICAL_PIECE_50_LINES')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                type === 'TECHNICAL_PIECE_50_LINES'
                  ? 'border-white bg-zinc-800 text-white font-bold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="text-xs">Peça Técnica (PT50)</div>
              <div className="text-[10px] text-zinc-400">Até 50 linhas | 30 pontos máx</div>
            </button>
          </div>
        </div>

        {/* Date and Title */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Data do Treino</label>
            <input
              type="date"
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-zinc-500 focus:outline-none"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-zinc-300 font-medium mb-1">Tema / Título da Questão</label>
            <input
              type="text"
              placeholder="Ex: Parecer sobre tramitação de PEC / ASR em plenário"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Prompt Summary */}
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Enunciado ou Resumo da Proposta (Opcional)</label>
          <input
            type="text"
            placeholder="Ex: Análise da constitucionalidade e técnica legislativa de substitutivo..."
            value={promptSummary}
            onChange={(e) => setPromptSummary(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-zinc-500 focus:outline-none"
          />
        </div>

        {/* Subject and Topic Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Disciplina Vinculada (Opcional)</label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId('');
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Nenhuma / Geral</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.exam_block_code ?? 'P1'}] {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Unidade de Estudo (Opcional)</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Selecione o tópico</option>
              {filteredTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scoring input fields */}
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-3">
          <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
            Avaliação Oficial Cebraspe
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Linhas Escritas (1–{maxLines})
              </label>
              <input
                type="number"
                min={1}
                max={maxLines}
                value={linesWritten}
                onChange={(e) => setLinesWritten(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs font-mono font-bold focus:border-zinc-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Nota Conteúdo (0–{maxScore})
              </label>
              <input
                type="number"
                min={0}
                max={maxScore}
                step={0.1}
                value={contentScore}
                onChange={(e) => setContentScore(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs font-mono font-bold focus:border-zinc-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Erros de Escrita (NE)</label>
              <input
                type="number"
                min={0}
                value={languageErrors}
                onChange={(e) => setLanguageErrors(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs font-mono font-bold focus:border-zinc-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Live preview banner */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                Fórmula: {type === 'QUESTION_20_LINES' ? 'NC - 3 × NE / TL' : 'NC - 6 × NE / TL'}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Dedução de linguagem: -{calc.languageDeduction} pts
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block font-medium">Nota Calculada</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {calc.calculatedScore} <span className="text-xs text-zinc-400">/ {maxScore}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Observações do Treino (Opcional)</label>
          <textarea
            rows={2}
            placeholder="Comentários sobre tempo gasto, vocabulário parlamentar, coerência ou estrutura..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-xs focus:border-zinc-500 focus:outline-none"
          />
        </div>

        {calc.errors.length > 0 && (
          <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2 rounded-lg">
            {calc.errors.join(' ')}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!calc.isValid}>
            Salvar Treino
          </Button>
        </div>
      </form>
    </Modal>
  );
}
