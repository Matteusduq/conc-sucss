'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Topic, Subject, CardType, Priority } from '@/types/database';

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  subjects: Subject[];
  initialTopicId?: string;
  initialCardType?: CardType;
  initialFront?: string;
  initialBack?: string;
  sourceErrorId?: string | null;
  onSaveCard: (data: {
    exam_id: string;
    subject_id: string;
    topic_id: string;
    card_type: CardType;
    front: string;
    back: string;
    source_type: 'MANUAL' | 'ERROR_LOG' | 'MATERIAL';
    source_error_id: string | null;
    source_material_id: string | null;
    exam_priority: Priority;
    priority_boost: number;
    active: boolean;
    suspended: boolean;
  }) => void;
}

export function CreateFlashcardModal({
  isOpen,
  onClose,
  topics,
  subjects,
  initialTopicId,
  initialCardType = 'CONTENT',
  initialFront = '',
  initialBack = '',
  sourceErrorId = null,
  onSaveCard,
}: CreateFlashcardModalProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || (topics[0]?.id ?? ''));
  const [cardType, setCardType] = useState<CardType>(initialCardType);
  const [front, setFront] = useState<string>(initialFront);
  const [back, setBack] = useState<string>(initialBack);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const selectedSubject = selectedTopic ? subjects.find((s) => s.id === selectedTopic.subject_id) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !selectedSubject) {
      setErrorMsg('Selecione um tópico.');
      return;
    }
    if (!front.trim() || !back.trim()) {
      setErrorMsg('Preencha a frente e o verso do cartão.');
      return;
    }

    onSaveCard({
      exam_id: selectedTopic.exam_id,
      subject_id: selectedSubject.id,
      topic_id: selectedTopic.id,
      card_type: cardType,
      front: front.trim(),
      back: back.trim(),
      source_type: sourceErrorId ? 'ERROR_LOG' : 'MANUAL',
      source_error_id: sourceErrorId,
      source_material_id: null,
      exam_priority: selectedTopic.priority,
      priority_boost: cardType === 'ERROR' ? 1.0 : 0,
      active: true,
      suspended: false,
    });

    onClose();
    setFront('');
    setBack('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sourceErrorId ? 'Converter Erro em Flashcard' : 'Novo Flashcard (FSRS)'}
      description="Crie um cartão atômico para memorização de longo prazo com repetição espaçada."
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

        {/* Card Type */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Tipo de Cartão</label>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as CardType)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
          >
            <option value="CONTENT">Conteúdo Teórico Geral</option>
            <option value="ERROR">Derivado de Erro / Pegadinha</option>
            <option value="COMPARISON">Comparação / Diferenciação</option>
            <option value="RULE">Regra Legal / Prazo / Dispositivo</option>
            <option value="CEBRASPE_TRUE_FALSE">Afirmação Certo / Errado (Estilo Cebraspe)</option>
          </select>
        </div>

        {/* Front */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Frente (Pergunta, caso concreto ou comando)
          </label>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={3}
            placeholder="Ex: Qual a hipótese em que a Câmara dos Deputados pode instaurar CPI sem a participação do Senado?"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
            required
          />
        </div>

        {/* Back */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Verso (Resposta objetiva e explicação atômica)
          </label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={3}
            placeholder="Ex: Quando a comissão for criada exclusivamente no âmbito da própria Câmara (CPI da Câmara, art. 58, § 3º da CF e RICD)."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
            required
          />
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
          <Button type="submit">Salvar Flashcard</Button>
        </div>
      </form>
    </Modal>
  );
}
