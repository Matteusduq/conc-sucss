'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bookmark,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Topic,
  StudyMaterial,
  MaterialProgress,
  MaterialHighlight,
  HighlightFlashcardDraft,
} from '@/types/database';
import { formatDurationSeconds } from '@/lib/utils/date';
import { getStudyMaterialSignedUrl } from '@/lib/storage/study-materials';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { createClient } from '@/lib/supabase/client';
import { SupabaseStudyRepository } from '@/lib/data/repository/supabase-repository';
import { createFlashcardAction } from '@/lib/data/store';
import { reanchorHighlight } from '@/lib/pdf/text-anchor';
import { findDomRectsForText } from '@/lib/pdf/highlights';
import { PdfSelectionToolbar } from './PdfSelectionToolbar';
import { HighlightSidebar } from './HighlightSidebar';
import type { TextSelectionPayload } from './PdfDocumentView';

// Importação dinâmica do viewer para evitar renderização no SSR (Node.js)
const PdfDocumentView = dynamic(
  () => import('./PdfDocumentView').then((mod) => mod.PdfDocumentView),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
        <p className="text-xs text-zinc-400">Inicializando visualizador de alta fidelidade...</p>
      </div>
    ),
  }
);

interface PdfReaderProps {
  topic: Topic;
  material: StudyMaterial;
  progress?: MaterialProgress;
  initialHighlightId?: string | null;
  onUpdateProgress: (data: Partial<MaterialProgress>) => void;
  onCompleteMaterial: () => void;
  onOpenTec: () => void;
}

export function PdfReader({
  topic,
  material,
  progress,
  initialHighlightId,
  onUpdateProgress,
  onCompleteMaterial,
  onOpenTec,
}: PdfReaderProps) {
  const { user, store, updateStore } = useModal();
  const userId = user?.id || 'local-user';

  const [currentPage, setCurrentPage] = useState<number>(progress?.current_page || 1);
  const [totalPages, setTotalPages] = useState<number>(material.page_count || 1);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [notesByPage, setNotesByPage] = useState<Record<string, string>>(
    progress?.notes_by_page || {}
  );
  const [bookmarks, setBookmarks] = useState<number[]>(progress?.bookmarks || []);

  // Estados do PDF real e storage
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [highlightError, setHighlightError] = useState<string | null>(null);
  const hasRetriedSignedUrlRef = useRef<boolean>(false);

  // Estados de marcações e seleção
  const [highlights, setHighlights] = useState<MaterialHighlight[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<MaterialHighlight | null>(null);
  const [activeSelection, setActiveSelection] = useState<TextSelectionPayload | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [isHighlighting, setIsHighlighting] = useState<boolean>(false);
  const [generatingHighlightId, setGeneratingHighlightId] = useState<string | null>(null);
  const [multiPageWarning, setMultiPageWarning] = useState<string | null>(null);

  // Instância do repositório
  const repo = useMemo(() => {
    const supabase = createClient();
    return new SupabaseStudyRepository(supabase);
  }, []);

  // Timer de sessão
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Carrega a Signed URL segura do PDF privado
  useEffect(() => {
    let isCancelled = false;

    async function loadPdfUrl() {
      if (!material.storage_path || material.status === 'PENDING') {
        setIsLoadingPdf(false);
        return;
      }

      setIsLoadingPdf(true);
      setPdfError(null);

      try {
        const url = await getStudyMaterialSignedUrl(material.storage_path, 7200);
        if (!isCancelled) {
          setSignedUrl(url);
          setIsLoadingPdf(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Erro ao gerar signed URL:', err);
          setPdfError(
            err instanceof Error ? err.message : 'Falha ao obter URL segura do documento.'
          );
          setIsLoadingPdf(false);
        }
      }
    }

    loadPdfUrl();

    return () => {
      isCancelled = true;
    };
  }, [material.storage_path, material.status]);

  // Recuperação de URL expirada: tenta gerar nova Signed URL UMA vez sem loop
  const handlePdfLoadError = useCallback(
    async (err: Error) => {
      console.warn('Erro ao carregar PDF:', err.message);

      if (!hasRetriedSignedUrlRef.current && material.storage_path) {
        hasRetriedSignedUrlRef.current = true;
        try {
          setIsLoadingPdf(true);
          setPdfError(null);
          const newUrl = await getStudyMaterialSignedUrl(material.storage_path, 7200);
          setSignedUrl(newUrl);
          setIsLoadingPdf(false);
          return;
        } catch (retryErr) {
          console.error('Falha ao renovar signed URL do PDF:', retryErr);
        }
      }

      setPdfError(
        'Não foi possível carregar o arquivo PDF. Verifique a conexão ou se o material está íntegro.'
      );
      setIsLoadingPdf(false);
    },
    [material.storage_path]
  );

  // 2. Lazy loading das marcações com detecção de GENERATING abandonado
  useEffect(() => {
    let isCancelled = false;

    async function loadHighlights() {
      if (!material.id || !user?.id) return;
      try {
        const data = await repo.listMaterialHighlights(user.id, material.id);
        if (!isCancelled) {
          // Detecta status GENERATING abandonado sem resultado anterior
          const abandoned = data.filter((h) => h.ai_status === 'GENERATING');
          const sanitized = data.map((h) => {
            if (h.ai_status === 'GENERATING') {
              return {
                ...h,
                ai_status: 'FAILED' as const,
                ai_error: h.ai_error || 'Geração anterior interrompida. Clique para tentar novamente.',
              };
            }
            return h;
          });

          // Atualiza os abandonados no banco para FAILED
          if (abandoned.length > 0) {
            Promise.all(
              abandoned.map((h) =>
                repo.updateMaterialHighlightAI(user.id, {
                  id: h.id,
                  ai_status: 'FAILED',
                  ai_error: 'Geração anterior interrompida. Clique para tentar novamente.',
                }).catch((e) => console.error('Erro ao atualizar highlight abandonado:', e))
              )
            );
          }

          setHighlights(sanitized);

          // Se houver deep link via initialHighlightId
          if (initialHighlightId) {
            const found = sanitized.find((h) => h.id === initialHighlightId);
            if (found) {
              setCurrentPage(found.page_number);
              setSelectedHighlight(found);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar destaques do material:', err);
      }
    }

    loadHighlights();

    return () => {
      isCancelled = true;
    };
  }, [material.id, user?.id, repo, initialHighlightId]);

  // Handler de sucesso ao carregar documento PDF: persiste page_count real em study_materials
  const handleDocumentLoadSuccess = useCallback(
    (numPages: number) => {
      setTotalPages(numPages);
      setIsLoadingPdf(false);

      // Quando o PDF carregar e numPages diferir de study_materials.page_count:
      // persistir o page_count real em study_materials; não confundir com MaterialProgress.
      if (material.page_count !== numPages) {
        repo.updateStudyMaterialPageCount(userId, material.id, numPages).catch((err) => {
          console.error('Erro ao atualizar page_count em study_materials:', err);
        });
      }
    },
    [material.id, material.page_count, repo, userId]
  );

  // Reancoragem automática de marcações quando a versão do PDF foi alterada
  const handlePageRendered = useCallback(
    async (pageNumber: number, fullPageText: string, container: HTMLElement) => {
      const currentVer = material.version || 1;
      const outOfDateHighlights = highlights.filter(
        (h) => h.page_number === pageNumber && h.material_version !== currentVer
      );

      if (outOfDateHighlights.length === 0) return;

      for (const h of outOfDateHighlights) {
        const reanchorRes = reanchorHighlight({
          fullPageText,
          selectedText: h.selected_text,
          quotePrefix: h.quote_prefix,
          quoteSuffix: h.quote_suffix,
        });

        // Se houver correspondência única, recalcula rects e offsets e persiste
        if (reanchorRes.found && !reanchorRes.isAmbiguous && reanchorRes.startOffset != null) {
          const newRects = findDomRectsForText(container, h.selected_text, reanchorRes.startOffset);

          if (newRects && newRects.length > 0) {
            const updatedHighlight: MaterialHighlight = {
              ...h,
              material_version: currentVer,
              text_start_offset: reanchorRes.startOffset,
              text_end_offset: reanchorRes.endOffset,
              rects: newRects,
              updated_at: new Date().toISOString(),
            };

            try {
              await repo.persistMaterialHighlight(userId, updatedHighlight);
              setHighlights((prev) =>
                prev.map((item) => (item.id === h.id ? updatedHighlight : item))
              );
              setSelectedHighlight((prev) =>
                prev?.id === h.id ? updatedHighlight : prev
              );
            } catch (persistErr) {
              console.error('Erro ao persistir reancoragem do destaque:', persistErr);
            }
          }
        }
      }
    },
    [material.version, highlights, repo, userId]
  );

  // Navegação de página
  const handlePageChange = useCallback(
    (newPage: number) => {
      const clamped = Math.max(1, Math.min(totalPages, newPage));
      setCurrentPage(clamped);
      setActiveSelection(null);
      setToolbarPos(null);

      const maxReached = Math.max(progress?.max_page_reached || 1, clamped);
      const percent = Math.round((maxReached / totalPages) * 100);

      onUpdateProgress({
        current_page: clamped,
        max_page_reached: maxReached,
        progress_percent: percent,
        total_study_seconds: (progress?.total_study_seconds || 0) + 1,
      });
    },
    [totalPages, progress?.max_page_reached, progress?.total_study_seconds, onUpdateProgress]
  );

  // Bookmarks
  const handleToggleBookmark = useCallback(() => {
    const nextBookmarks = bookmarks.includes(currentPage)
      ? bookmarks.filter((p) => p !== currentPage)
      : [...bookmarks, currentPage].sort((a, b) => a - b);
    setBookmarks(nextBookmarks);
    onUpdateProgress({ bookmarks: nextBookmarks });
  }, [bookmarks, currentPage, onUpdateProgress]);

  // Notas
  const handleSavePageNote = useCallback(
    (noteText: string) => {
      const updated = { ...notesByPage, [currentPage.toString()]: noteText };
      setNotesByPage(updated);
      onUpdateProgress({ notes_by_page: updated });
    },
    [notesByPage, currentPage, onUpdateProgress]
  );

  // Seleção de texto nativo no PDF
  const handleTextSelected = useCallback((payload: TextSelectionPayload) => {
    setActiveSelection(payload);
    // Posiciona a toolbar flutuante centralizada sobre o retângulo da seleção
    setToolbarPos({
      top: payload.clientRect.top - 8,
      left: payload.clientRect.left + payload.clientRect.width / 2,
    });
    setMultiPageWarning(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    setActiveSelection(null);
    setToolbarPos(null);
  }, []);

  const handleMultiPageSelectionAttempt = useCallback(() => {
    setMultiPageWarning('Selecione um trecho dentro de uma única página.');
    setTimeout(() => setMultiPageWarning(null), 4000);
  }, []);

  // 3. FLUXO "MARCAR + IA"
  const handleHighlightAndAskAI = useCallback(async () => {
    if (!activeSelection || isHighlighting) return;

    setIsHighlighting(true);
    const highlightId = `hl-${Date.now()}`;
    const newHighlight: MaterialHighlight = {
      id: highlightId,
      user_id: userId,
      material_id: material.id,
      topic_id: topic.id,
      page_number: currentPage,
      material_version: material.version || 1,
      selected_text: activeSelection.selectedText,
      context_before: activeSelection.contextBefore || null,
      context_after: activeSelection.contextAfter || null,
      quote_prefix: activeSelection.quotePrefix || null,
      quote_suffix: activeSelection.quoteSuffix || null,
      text_start_offset: activeSelection.startOffset ?? null,
      text_end_offset: activeSelection.endOffset ?? null,
      rects: activeSelection.rects,
      color: 'YELLOW',
      ai_status: 'GENERATING',
      ai_explanation: null,
      ai_key_point: null,
      ai_cebraspe_trap: null,
      ai_flashcard_draft: null,
      ai_provider: null,
      ai_model: null,
      ai_generated_at: null,
      ai_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Persiste imediatamente a marcação para garantir integridade
    try {
      await repo.persistMaterialHighlight(userId, newHighlight);
    } catch (err) {
      console.error('Erro ao persistir destaque inicial:', err);
      setIsHighlighting(false);
      setHighlightError('Falha ao salvar marcação no servidor. Tente novamente.');
      return; // Interrompe o fluxo: NÃO adiciona localmente, NÃO chama IA
    }

    // 2. Limpa seleção visual e abre painel da marcação
    window.getSelection()?.removeAllRanges();
    setActiveSelection(null);
    setToolbarPos(null);
    setHighlights((prev) => [newHighlight, ...prev]);
    setSelectedHighlight(newHighlight);
    setGeneratingHighlightId(newHighlight.id);
    setIsHighlighting(false);

    // 3. Chama rota segura de IA no servidor
    try {
      const res = await fetch(`/api/ai/highlights/${newHighlight.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.success && data.highlight) {
        const updated = data.highlight as MaterialHighlight;
        setHighlights((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
        setSelectedHighlight(updated);
      } else {
        const errText = data.error || 'Falha ao comunicar com IA.';
        const failedHighlight: MaterialHighlight = {
          ...newHighlight,
          ai_status: 'FAILED',
          ai_error: errText,
          updated_at: new Date().toISOString(),
        };
        await repo.updateMaterialHighlightAI(userId, {
          id: newHighlight.id,
          ai_status: 'FAILED',
          ai_error: errText,
        });
        setHighlights((prev) => prev.map((h) => (h.id === newHighlight.id ? failedHighlight : h)));
        setSelectedHighlight(failedHighlight);
      }
    } catch (err) {
      console.error('Erro na chamada da API de IA:', err);
      const errText =
        err instanceof Error ? err.message : 'Erro de conexão com o servidor de IA.';
      const failedHighlight: MaterialHighlight = {
        ...newHighlight,
        ai_status: 'FAILED',
        ai_error: errText,
        updated_at: new Date().toISOString(),
      };
      // Persiste FAILED no Supabase mesmo em erro de rede
      try {
        await repo.updateMaterialHighlightAI(userId, {
          id: newHighlight.id,
          ai_status: 'FAILED',
          ai_error: errText,
        });
      } catch (persistErr) {
        console.error('Erro ao persistir status FAILED no Supabase:', persistErr);
      }
      setHighlights((prev) => prev.map((h) => (h.id === newHighlight.id ? failedHighlight : h)));
      setSelectedHighlight(failedHighlight);
    } finally {
      setGeneratingHighlightId(null);
    }
  }, [activeSelection, isHighlighting, userId, material.id, material.version, topic.id, currentPage, repo]);

  // Regenerar IA para uma marcação existente (Retry)
  const handleRegenerateAI = useCallback(
    async (highlightId: string) => {
      setGeneratingHighlightId(highlightId);
      const target = highlights.find((h) => h.id === highlightId);
      if (target) {
        setSelectedHighlight({ ...target, ai_status: 'GENERATING' });
      }

      try {
        const res = await fetch(`/api/ai/highlights/${highlightId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (res.ok && data.success && data.highlight) {
          const updated = data.highlight as MaterialHighlight;
          setHighlights((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
          setSelectedHighlight(updated);
        } else {
          const errText = data.error || 'Falha ao comunicar com IA.';
          if (target) {
            const failedHighlight: MaterialHighlight = {
              ...target,
              ai_status: 'FAILED',
              ai_error: errText,
              updated_at: new Date().toISOString(),
            };
            await repo.updateMaterialHighlightAI(userId, {
              id: highlightId,
              ai_status: 'FAILED',
              ai_error: errText,
            });
            setHighlights((prev) => prev.map((h) => (h.id === target.id ? failedHighlight : h)));
            setSelectedHighlight(failedHighlight);
          }
        }
      } catch (err) {
        console.error('Erro ao regenerar IA:', err);
        const errText =
          err instanceof Error ? err.message : 'Erro de conexão com o servidor de IA.';
        if (target) {
          const failedHighlight: MaterialHighlight = {
            ...target,
            ai_status: 'FAILED',
            ai_error: errText,
            updated_at: new Date().toISOString(),
          };
          try {
            await repo.updateMaterialHighlightAI(userId, {
              id: highlightId,
              ai_status: 'FAILED',
              ai_error: errText,
            });
          } catch (persistErr) {
            console.error('Erro ao persistir status FAILED no retry:', persistErr);
          }
          setHighlights((prev) => prev.map((h) => (h.id === target.id ? failedHighlight : h)));
          setSelectedHighlight(failedHighlight);
        }
      } finally {
        setGeneratingHighlightId(null);
      }
    },
    [highlights, repo, userId]
  );

  // Descartar sugestão da IA (mantém a marcação amarela)
  const handleDiscardDraft = useCallback(
    async (highlightId: string) => {
      const target = highlights.find((h) => h.id === highlightId);
      if (!target) return;

      const updated: MaterialHighlight = {
        ...target,
        ai_flashcard_draft: null,
        updated_at: new Date().toISOString(),
      };

      try {
        await repo.updateMaterialHighlightAI(userId, {
          id: highlightId,
          ai_flashcard_draft: null,
        });
        setHighlights((prev) => prev.map((h) => (h.id === highlightId ? updated : h)));
        setSelectedHighlight(updated);
      } catch (err) {
        console.error('Erro ao descartar rascunho:', err);
      }
    },
    [highlights, repo, userId]
  );

  // Excluir marcação
  const handleDeleteHighlight = useCallback(
    async (highlightId: string) => {
      try {
        await repo.deleteMaterialHighlight(userId, highlightId);
        setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
        if (selectedHighlight?.id === highlightId) {
          setSelectedHighlight(null);
        }
      } catch (err) {
        console.error('Erro ao excluir marcação:', err);
      }
    },
    [repo, userId, selectedHighlight]
  );

  // 4. Salvar Flashcard na Memória (FSRS)
  const handleSaveFlashcard = useCallback(
    async (draft: HighlightFlashcardDraft & { explanation: string }) => {
      if (!selectedHighlight) return;

      const updatedStore = createFlashcardAction(
        {
          user_id: userId,
          exam_id: topic.exam_id,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          card_type: draft.card_type || draft.cardType || 'CONTENT',
          front: draft.front,
          back: draft.back,
          source_type: 'AI_GENERATED',
          source_material_id: material.id,
          source_error_id: null,
          source_highlight_id: selectedHighlight.id,
          explanation: draft.explanation,
          exam_priority: topic.priority,
          priority_boost: 0,
          active: true,
          suspended: false,
        },
        store
      );

      await updateStore(
        () => updatedStore,
        async (remoteRepo, uId) => {
          const latestCard = updatedStore.flashcards[0];
          const latestFsrs = latestCard ? updatedStore.fsrsStates[latestCard.id] : undefined;
          if (latestCard) {
            await remoteRepo.persistFlashcard(uId, latestCard, latestFsrs);
          }
        }
      );
    },
    [selectedHighlight, userId, topic, material.id, store, updateStore]
  );

  // Filtragem dos destaques da página atual para renderização sobre o canvas
  const currentPageHighlights = useMemo(() => {
    return highlights.filter((h) => h.page_number === currentPage);
  }, [highlights, currentPage]);

  const isBookmarked = bookmarks.includes(currentPage);

  // Se material estiver PENDING ou sem PDF
  if (material.status === 'PENDING' || !material.storage_path) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>{topic.name}</span>
              <span>•</span>
              <span className="text-zinc-300 font-semibold">{topic.recommended_material_type}</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight mt-1">
              {material.title}
            </h2>
          </div>
        </div>

        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-100">Material ainda não disponível.</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Este tópico já está priorizado e será liberado assim que o PDF textual correspondente for inserido no repositório.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950 p-6 overflow-y-auto' : ''
      }`}
    >
      {/* Alerta de seleção multipágina se aplicável */}
      {multiPageWarning && (
        <div className="fixed top-6 right-6 z-50 p-3 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{multiPageWarning}</span>
        </div>
      )}

      {/* Alerta de erro ao salvar marcação */}
      {highlightError && (
        <div className="fixed top-6 right-6 z-50 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{highlightError}</span>
          </div>
          <button
            onClick={() => setHighlightError(null)}
            className="text-rose-300 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toolbar Flutuante de Seleção Nativa */}
      {toolbarPos && activeSelection && (
        <PdfSelectionToolbar
          position={toolbarPos}
          onHighlightAndAskAI={handleHighlightAndAskAI}
          isLoading={isHighlighting}
        />
      )}

      {/* Top Toolbar do Leitor */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>{formatDurationSeconds(sessionSeconds)}</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-mono text-zinc-200 px-1">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-zinc-300 text-[11px]">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Bookmark */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleBookmark}
            className={isBookmarked ? 'text-amber-400' : 'text-zinc-400'}
            aria-label="Favoritar página"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label="Alternar tela cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* Botão de Conclusão */}
          <Button
            size="sm"
            variant="secondary"
            onClick={onCompleteMaterial}
            className="border-emerald-800/80 text-emerald-300 hover:bg-emerald-950/60 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 mr-1 text-emerald-400" />
            Concluir Material
          </Button>
        </div>
      </div>

      {/* Layout Principal: Canvas PDF Real + Sidebar de Destaques/Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Visualizador de PDF com Text Layer Real */}
        <div className="lg:col-span-3 min-h-[650px] rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-start p-4 relative overflow-x-auto">
          {isLoadingPdf ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
              <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
              <p className="text-xs text-zinc-400">Carregando arquivo seguro...</p>
            </div>
          ) : pdfError ? (
            <div className="p-12 text-center text-rose-300 space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="font-semibold text-sm">Erro ao abrir PDF</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">{pdfError}</p>
            </div>
          ) : signedUrl ? (
            <PdfDocumentView
              fileUrl={signedUrl}
              currentPage={currentPage}
              zoom={zoom}
              highlights={currentPageHighlights}
              activeHighlightId={selectedHighlight?.id || null}
              activeSelection={activeSelection}
              currentMaterialVersion={material.version || 1}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handlePdfLoadError}
              onSelectHighlight={(h) => setSelectedHighlight(h)}
              onTextSelected={handleTextSelected}
              onMultiPageSelectionAttempt={handleMultiPageSelectionAttempt}
              onClearSelection={handleClearSelection}
              onPageRendered={handlePageRendered}
            />
          ) : null}
        </div>

        {/* Sidebar Lateral */}
        <div className="lg:col-span-1">
          <HighlightSidebar
            currentPage={currentPage}
            totalPages={totalPages}
            highlights={highlights}
            selectedHighlight={selectedHighlight}
            savedFlashcards={store.flashcards}
            notesByPage={notesByPage}
            bookmarks={bookmarks}
            onSelectHighlight={(h) => setSelectedHighlight(h)}
            onNavigatePage={handlePageChange}
            onSaveNote={handleSavePageNote}
            onDeleteHighlight={handleDeleteHighlight}
            onRegenerateAI={handleRegenerateAI}
            onDiscardDraft={handleDiscardDraft}
            onSaveFlashcard={handleSaveFlashcard}
            onOpenTec={onOpenTec}
            generatingHighlightId={generatingHighlightId}
            currentMaterialVersion={material.version || 1}
          />
        </div>
      </div>
    </div>
  );
}
