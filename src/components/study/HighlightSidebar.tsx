'use client';

import React, { useState } from 'react';
import {
  Highlighter,
  MessageSquare,
  Bookmark,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { MaterialHighlight, HighlightFlashcardDraft, Flashcard } from '@/types/database';
import { HighlightDetail } from './HighlightDetail';
import { Button } from '@/components/ui/Button';

type SidebarTab = 'highlights' | 'notes' | 'bookmarks';

interface HighlightSidebarProps {
  currentPage: number;
  totalPages: number;
  highlights: MaterialHighlight[];
  selectedHighlight: MaterialHighlight | null;
  savedFlashcards: Flashcard[];
  notesByPage: Record<string, string>;
  bookmarks: number[];
  onSelectHighlight: (highlight: MaterialHighlight | null) => void;
  onNavigatePage: (page: number) => void;
  onSaveNote: (text: string) => void;
  onDeleteHighlight: (highlightId: string) => void;
  onRegenerateAI: (highlightId: string) => void;
  onDiscardDraft: (highlightId: string) => void;
  onSaveFlashcard: (draft: HighlightFlashcardDraft & { explanation: string }) => Promise<void>;
  onOpenTec: () => void;
  generatingHighlightId?: string | null;
}

export function HighlightSidebar({
  currentPage,
  totalPages,
  highlights,
  selectedHighlight,
  savedFlashcards,
  notesByPage,
  bookmarks,
  onSelectHighlight,
  onNavigatePage,
  onSaveNote,
  onDeleteHighlight,
  onRegenerateAI,
  onDiscardDraft,
  onSaveFlashcard,
  onOpenTec,
  generatingHighlightId,
}: HighlightSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('highlights');
  const pageNote = notesByPage[currentPage.toString()] || '';

  // Conjunto de source_highlight_ids com flashcards salvos
  const savedHighlightIds = new Set(
    savedFlashcards
      .filter((fc) => fc.source_highlight_id && fc.active)
      .map((fc) => fc.source_highlight_id!)
  );

  // Se houver um highlight selecionado, exibe os detalhes completos
  if (selectedHighlight) {
    const hasCard = savedHighlightIds.has(selectedHighlight.id);
    return (
      <div className="h-full flex flex-col min-h-[500px]">
        <HighlightDetail
          highlight={selectedHighlight}
          hasSavedFlashcard={hasCard}
          onClose={() => onSelectHighlight(null)}
          onDelete={(id) => {
            onDeleteHighlight(id);
            onSelectHighlight(null);
          }}
          onRegenerateAI={onRegenerateAI}
          onDiscardDraft={onDiscardDraft}
          onSaveFlashcard={onSaveFlashcard}
          isGenerating={generatingHighlightId === selectedHighlight.id}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl text-xs">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/70 p-1 gap-1">
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-medium transition-all cursor-pointer ${
            activeTab === 'highlights'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Highlighter className="w-3.5 h-3.5 text-amber-400" />
          <span>Marcações</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-900 text-zinc-300 font-mono">
            {highlights.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-medium transition-all cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-zinc-800 text-blue-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>Notas</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-medium transition-all cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Favoritos</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-900 text-zinc-300 font-mono">
            {bookmarks.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ABA: MARCAÇÕES */}
        {activeTab === 'highlights' && (
          <div className="space-y-3">
            {highlights.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl space-y-2">
                <Highlighter className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-zinc-400 font-medium">Nenhuma marcação no PDF.</p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Selecione qualquer trecho no texto da página para destacar e pedir uma explicação pedagógica à IA.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {highlights.map((h) => {
                  const hasCard = savedHighlightIds.has(h.id);
                  const isCurrent = h.page_number === currentPage;
                  const isGenerating =
                    generatingHighlightId === h.id || h.ai_status === 'GENERATING';

                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        if (h.page_number !== currentPage) {
                          onNavigatePage(h.page_number);
                        }
                        onSelectHighlight(h);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group text-left space-y-2 ${
                        isCurrent
                          ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
                          : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                          Página {h.page_number}
                        </span>

                        {/* Status visual da IA */}
                        {isGenerating ? (
                          <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                            IA gerando...
                          </span>
                        ) : hasCard ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Flashcard salvo
                          </span>
                        ) : h.ai_status === 'READY' ? (
                          <span className="flex items-center gap-1 text-[10px] text-purple-400 font-medium">
                            <Sparkles className="w-3 h-3" />
                            Explicação pronta
                          </span>
                        ) : h.ai_status === 'NOT_RECOMMENDED' ? (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                            <HelpCircle className="w-3 h-3" />
                            Sem flashcard
                          </span>
                        ) : h.ai_status === 'FAILED' ? (
                          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Falha IA
                          </span>
                        ) : null}
                      </div>

                      <p className="text-zinc-200 line-clamp-2 text-[11px] italic leading-relaxed">
                        &ldquo;{h.selected_text}&rdquo;
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50 text-[10px] text-zinc-400">
                        <span>{new Date(h.created_at).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center gap-0.5 text-zinc-400 group-hover:text-amber-400 transition-colors">
                          Ver detalhes
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOTAS */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="font-semibold">Notas da Página {currentPage}</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {currentPage} de {totalPages}
              </span>
            </div>
            <textarea
              value={pageNote}
              onChange={(e) => onSaveNote(e.target.value)}
              placeholder="Digite anotações ou sínteses deste trecho do material..."
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 leading-relaxed"
            />
            <p className="text-[10px] text-zinc-400">
              Salvo automaticamente no banco de progresso do tópico.
            </p>
          </div>
        )}

        {/* ABA: FAVORITOS */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-3">
            <span className="font-semibold text-zinc-300">Páginas Marcadas</span>
            {bookmarks.length === 0 ? (
              <p className="text-zinc-400 text-[11px]">Nenhuma página favoritada ainda.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {bookmarks.map((bm) => (
                  <button
                    key={bm}
                    onClick={() => onNavigatePage(bm)}
                    className={`p-2 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
                      bm === currentPage
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                        : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    pág. {bm}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Próximo Passo: TEC Concursos */}
      <div className="p-3.5 border-t border-zinc-800 bg-blue-950/20 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-blue-300 text-[11px]">Próximo Passo</span>
          <span className="text-[10px] text-zinc-400">Teoria → Questões</span>
        </div>
        <p className="text-zinc-400 text-[10px] leading-relaxed">
          Após ler a teoria, consolide o aprendizado com a bateria de questões no TEC.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenTec}
          className="w-full text-xs border-blue-900/60 text-blue-300 hover:bg-blue-950/60 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          Abrir TEC Concursos
        </Button>
      </div>
    </div>
  );
}
