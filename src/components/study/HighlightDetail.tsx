'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  X,
  BookOpen,
  HelpCircle,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import { MaterialHighlight, HighlightFlashcardDraft, CardType } from '@/types/database';
import { Button } from '@/components/ui/Button';

interface HighlightDetailProps {
  highlight: MaterialHighlight;
  hasSavedFlashcard: boolean;
  onClose: () => void;
  onDelete: (highlightId: string) => void;
  onRegenerateAI: (highlightId: string) => void;
  onDiscardDraft: (highlightId: string) => void;
  onSaveFlashcard: (draft: HighlightFlashcardDraft & { explanation: string }) => Promise<void>;
  isGenerating?: boolean;
  currentMaterialVersion?: number;
}

export function HighlightDetail({
  highlight,
  hasSavedFlashcard,
  onClose,
  onDelete,
  onRegenerateAI,
  onDiscardDraft,
  onSaveFlashcard,
  isGenerating = false,
  currentMaterialVersion,
}: HighlightDetailProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);

  // Form state editável para o flashcard
  const initialDraft = highlight.ai_flashcard_draft;
  const [draftFront, setDraftFront] = useState(initialDraft?.front || '');
  const [draftBack, setDraftBack] = useState(initialDraft?.back || '');
  const [draftCardType, setDraftCardType] = useState<CardType>(
    initialDraft?.card_type || initialDraft?.cardType || 'CONTENT'
  );
  const [draftExplanation, setDraftExplanation] = useState(highlight.ai_explanation || '');

  // Atualiza estados caso o highlight mude
  React.useEffect(() => {
    if (highlight.ai_flashcard_draft) {
      setDraftFront(highlight.ai_flashcard_draft.front);
      setDraftBack(highlight.ai_flashcard_draft.back);
      setDraftCardType(
        highlight.ai_flashcard_draft.card_type ||
          highlight.ai_flashcard_draft.cardType ||
          'CONTENT'
      );
    }
    setDraftExplanation(highlight.ai_explanation || '');
  }, [highlight]);

  const handleSaveCard = async () => {
    if (!draftFront.trim() || !draftBack.trim()) return;
    setIsSavingCard(true);
    try {
      const draftPriority =
        highlight.ai_flashcard_draft?.exam_priority ||
        highlight.ai_flashcard_draft?.examPriority ||
        'HIGH';

      await onSaveFlashcard({
        front: draftFront.trim(),
        back: draftBack.trim(),
        card_type: draftCardType,
        cardType: draftCardType,
        exam_priority: draftPriority,
        examPriority: draftPriority,
        explanation: draftExplanation.trim(),
      });
    } finally {
      setIsSavingCard(false);
    }
  };

  const isActuallyGenerating = isGenerating;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl text-xs animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-zinc-100">
            Marcação • Pág. {highlight.page_number}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="p-1 h-7 w-7 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Aviso de atualização do PDF e necessidade de revisão */}
        {currentMaterialVersion !== undefined &&
          highlight.material_version !== currentMaterialVersion && (
            <div className="p-3.5 rounded-xl border border-amber-800/80 bg-amber-950/30 text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Revisão Necessária</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Esta marcação precisa ser revisada após a atualização do PDF.
              </p>
            </div>
          )}

        {/* Trecho selecionado */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
            Trecho Marcado
          </span>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-zinc-200 italic leading-relaxed text-[11px] selection:bg-amber-500/30">
            &ldquo;{highlight.selected_text}&rdquo;
          </div>
        </div>

        {/* Status: Geração interrompida ou expirada */}
        {highlight.ai_status === 'GENERATING' && !isActuallyGenerating && (
          <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 space-y-3">
            <div className="flex items-start gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-200">Geração interrompida</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  A geração anterior com a IA não foi concluída. Clique abaixo para tentar novamente.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegenerateAI(highlight.id)}
              className="w-full border-amber-800/80 text-amber-200 hover:bg-amber-950/40"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Status: Gerando IA */}
        {isActuallyGenerating && (
          <div className="p-4 rounded-xl border border-indigo-900/60 bg-indigo-950/20 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-indigo-300">Analisando com IA pedagógica...</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Extraindo explicação concisa, ponto-chave para prova e elaborando proposta de flashcard atômico.
              </p>
            </div>
          </div>
        )}

        {/* Status: Falha */}
        {highlight.ai_status === 'FAILED' && !isActuallyGenerating && (
          <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 space-y-3">
            <div className="flex items-start gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">
                  {highlight.ai_error === 'IA ainda não configurada.'
                    ? 'IA ainda não configurada'
                    : 'Não foi possível gerar a explicação.'}
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {highlight.ai_error || 'Ocorreu uma instabilidade na consulta. A marcação continua salva.'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegenerateAI(highlight.id)}
              className="w-full border-rose-800/80 text-rose-200 hover:bg-rose-950/40"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Status: Não Recomendado */}
        {highlight.ai_status === 'NOT_RECOMMENDED' && !isActuallyGenerating && (
          <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 space-y-3">
            <div className="flex items-start gap-2 text-amber-300">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-200">IA não recomenda flashcard</p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Este trecho é útil como contexto, mas não contém uma unidade de memorização suficientemente atômica.
                </p>
                {highlight.ai_explanation && (
                  <p className="text-[11px] text-zinc-400 pt-1 italic">
                    Orientação pedagógica: {highlight.ai_explanation}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRegenerateAI(highlight.id)}
              className="w-full text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Tentar gerar novamente
            </Button>
          </div>
        )}

        {/* Status: Ready (com explicação didática) */}
        {highlight.ai_status === 'READY' && !isActuallyGenerating && (
          <div className="space-y-4">
            {/* Explicação Didática */}
            {highlight.ai_explanation && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Explicação Didática
                </span>
                <p className="text-zinc-300 leading-relaxed text-[11px] bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                  {highlight.ai_explanation}
                </p>
              </div>
            )}

            {/* Ponto-Chave */}
            {highlight.ai_key_point && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                  Ponto-Chave para Prova
                </span>
                <div className="text-zinc-200 font-medium text-[11px] bg-blue-950/30 p-2.5 rounded-lg border border-blue-900/50">
                  {highlight.ai_key_point}
                </div>
              </div>
            )}

            {/* Pegadinha Cebraspe (se houver) */}
            {highlight.ai_cebraspe_trap && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Atenção: Pegadinha Cebraspe
                </span>
                <div className="text-rose-200 text-[11px] leading-relaxed bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/60">
                  {highlight.ai_cebraspe_trap}
                </div>
              </div>
            )}

            {/* Estado de Flashcard Salvo */}
            {hasSavedFlashcard ? (
              <div className="p-3.5 rounded-xl border border-emerald-900/80 bg-emerald-950/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-200">Flashcard salvo na memória</p>
                  <p className="text-[10px] text-zinc-400">
                    Ativo no algoritmo de repetição espaçada FSRS.
                  </p>
                </div>
              </div>
            ) : highlight.ai_flashcard_draft ? (
              /* Draft de Flashcard Editável */
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" />
                    Flashcard Sugerido (FSRS)
                  </span>
                  <span className="text-[10px] text-zinc-500">Revise antes de salvar</span>
                </div>

                {/* Tipo de Cartão */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400">Tipo de Cartão:</label>
                  <select
                    value={draftCardType}
                    onChange={(e) => setDraftCardType(e.target.value as CardType)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="CONTENT">Conceito Geral (CONTENT)</option>
                    <option value="RULE">Regra / Prazo / Competência (RULE)</option>
                    <option value="COMPARISON">Diferenciação (COMPARISON)</option>
                    <option value="CEBRASPE_TRUE_FALSE">Julgamento C/E (CEBRASPE_TRUE_FALSE)</option>
                  </select>
                </div>

                {/* Frente */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400">Frente (Pergunta / Assertiva):</label>
                  <textarea
                    value={draftFront}
                    onChange={(e) => setDraftFront(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Verso */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400">Verso (Resposta / Justificativa):</label>
                  <textarea
                    value={draftBack}
                    onChange={(e) => setDraftBack(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Explicação complementar salva no cartão */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400">Explicação / Contexto (oculta até revelar):</label>
                  <textarea
                    value={draftExplanation}
                    onChange={(e) => setDraftExplanation(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Ações do Flashcard */}
                <div className="space-y-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveCard}
                    disabled={isSavingCard || !draftFront.trim() || !draftBack.trim()}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold shadow-md"
                  >
                    <Brain className="w-3.5 h-3.5 mr-1.5" />
                    {isSavingCard ? 'Salvando no FSRS...' : 'Adicionar à memória'}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRegenerateAI(highlight.id)}
                      className="text-zinc-300 border-zinc-800 hover:bg-zinc-900"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Gerar outra versão
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDiscardDraft(highlight.id)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      Descartar sugestão
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Draft foi descartado mas highlight continua */
              <div className="pt-2 border-t border-zinc-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRegenerateAI(highlight.id)}
                  className="w-full text-zinc-300 border-zinc-800"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Gerar novo flashcard com IA
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Status: NOT_REQUESTED */}
        {highlight.ai_status === 'NOT_REQUESTED' && !isActuallyGenerating && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <Button
              size="sm"
              onClick={() => onRegenerateAI(highlight.id)}
              className="w-full bg-gradient-to-r from-amber-500 to-purple-600 text-zinc-950 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Pedir explicação e flashcard com IA
            </Button>
          </div>
        )}
      </div>

      {/* Footer com exclusão da marcação */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
        {isConfirmingDelete ? (
          <div className="flex items-center justify-between w-full gap-2 animate-in fade-in">
            <span className="text-[11px] text-rose-300">Excluir marcação?</span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsConfirmingDelete(false)}
                className="h-7 text-[10px] px-2"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => onDelete(highlight.id)}
                className="h-7 text-[10px] px-2 bg-rose-600 hover:bg-rose-700"
              >
                Sim, excluir
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsConfirmingDelete(true)}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-rose-400 transition-colors text-[11px] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir marcação</span>
          </button>
        )}
      </div>
    </div>
  );
}
