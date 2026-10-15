'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Topic, Subject, ErrorType, ErrorSeverity } from '@/types/database';

interface ErrorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  subjects: Subject[];
  initialTopicId?: string;
  onSaveError: (data: {
    exam_id: string;
    subject_id: string;
    topic_id: string;
    question_session_id: string | null;
    error_type: ErrorType;
    summary: string;
    correct_rule: string | null;
    personal_note: string | null;
    severity: ErrorSeverity;
  }) => void;
}

export const ERROR_TYPE_OPTIONS: { id: ErrorType; label: string; desc: string }[] = [
  { id: 'CONCEPT_CONFUSION', label: 'Conceito Confundido', desc: 'Troca de conceitos parecidos (ex: dispensa x inexigibilidade)' },
  { id: 'COMPETENCE_SWAP', label: 'Troca de Competência', desc: 'Pegadinha Cebraspe de competência Câmara x Senado x Congresso' },
  { id: 'ABSOLUTE_WORD_TRAP', label: 'Pegadinha de Palavra Absoluta', desc: '"Sempre", "nunca", "exclusivamente", "salvo"' },
  { id: 'EXCEPTION_FORGOTTEN', label: 'Exceção Esquecida', desc: 'Lembrou da regra geral, mas caiu na exceção da lei' },
  { id: 'LAW_OR_CASELAW', label: 'Lei Seca / Jurisprudência', desc: 'Desconhecimento do texto literal do artigo ou súmula' },
  { id: 'INATTENTION', label: 'Falta de Atenção', desc: 'Leu rápido demais, ignorou comando ou negação' },
  { id: 'INTERPRETATION', label: 'Interpretação / Inferência', desc: 'Inferência indevida ou extrapolação do texto' },
  { id: 'REWRITE_MEANING', label: 'Reescrita com Alteração', desc: 'Mudança sutil de sentido ou tempo verbal' },
  { id: 'CONTENT_UNKNOWN', label: 'Conteúdo Desconhecido', desc: 'Nunca tinha estudado esse detalhe' },
  { id: 'GUESS', label: 'Chute Incorreto', desc: 'Arriscou quando deveria ter deixado em branco' },
  { id: 'OTHER', label: 'Outro Motivo', desc: 'Motivo diverso' },
];

export function ErrorLogModal({
  isOpen,
  onClose,
  topics,
  subjects,
  initialTopicId,
  onSaveError,
}: ErrorLogModalProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || (topics[0]?.id ?? ''));
  const [errorType, setErrorType] = useState<ErrorType>('CONCEPT_CONFUSION');
  const [severity, setSeverity] = useState<ErrorSeverity>('MEDIUM');
  const [summary, setSummary] = useState<string>('');
  const [correctRule, setCorrectRule] = useState<string>('');
  const [personalNote, setPersonalNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const selectedSubject = selectedTopic ? subjects.find((s) => s.id === selectedTopic.subject_id) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !selectedSubject) {
      setErrorMsg('Selecione um tópico.');
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('Descreva o erro sucintamente.');
      return;
    }

    onSaveError({
      exam_id: selectedTopic.exam_id,
      subject_id: selectedSubject.id,
      topic_id: selectedTopic.id,
      question_session_id: null,
      error_type: errorType,
      summary: summary.trim(),
      correct_rule: correctRule.trim() || null,
      personal_note: personalNote.trim() || null,
      severity,
    });

    onClose();
    setSummary('');
    setCorrectRule('');
    setPersonalNote('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Caderno de Erros — Catalogar Falha"
      description="Identifique a raiz cognitiva do erro para que o sistema alimente o motor de revisões."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Tópico</label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
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

        {/* Error Reason Chips */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1.5">
            Por que você errou? (Taxonomia Cebraspe)
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {ERROR_TYPE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setErrorType(opt.id)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  errorType === opt.id
                    ? 'border-zinc-200 bg-zinc-800 text-white font-bold'
                    : 'border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-semibold text-[11px] leading-tight">{opt.label}</div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Resumo do Erro (sem copiar o enunciado inteiro)
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ex: Confundi competência privativa da Câmara com competência do Congresso"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
            required
          />
        </div>

        {/* Correct Rule */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Regra Correta / Dispositivo Legal (Gabarito Real)
          </label>
          <input
            type="text"
            value={correctRule}
            onChange={(e) => setCorrectRule(e.target.value)}
            placeholder="Ex: CF Art. 51 trata de competência privativa da Câmara dos Deputados"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Gravidade / Reincidência</label>
          <div className="flex gap-2">
            {[
              { id: 'LOW', label: 'Baixa (Detalhe residual)' },
              { id: 'MEDIUM', label: 'Média (Atenção necessária)' },
              { id: 'HIGH', label: 'Alta (Ponto crítico para a prova)' },
            ].map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSeverity(s.id as ErrorSeverity)}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium cursor-pointer ${
                  severity === s.id
                    ? 'border-zinc-200 bg-zinc-800 text-white font-bold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Salvar no Caderno de Erros</Button>
        </div>
      </form>
    </Modal>
  );
}
