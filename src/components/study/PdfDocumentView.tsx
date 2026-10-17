'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { MaterialHighlight, HighlightRect } from '@/types/database';
import { HighlightOverlay } from './HighlightOverlay';
import { validateSelection } from '@/lib/pdf/highlights';
import { extractAnchorContext } from '@/lib/pdf/text-anchor';

// Configura o worker do PDF.js
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface TextSelectionPayload {
  selectedText: string;
  rects: HighlightRect[];
  clientRect: DOMRect;
  contextBefore: string;
  contextAfter: string;
  quotePrefix: string;
  quoteSuffix: string;
  startOffset: number;
  endOffset: number;
}

interface PdfDocumentViewProps {
  fileUrl: string;
  currentPage: number;
  zoom: number; // Porcentagem: 100 = 1.0
  highlights: MaterialHighlight[];
  activeHighlightId: string | null;
  activeSelection?: TextSelectionPayload | null;
  currentMaterialVersion?: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (error: Error) => void;
  onSelectHighlight: (highlight: MaterialHighlight) => void;
  onTextSelected: (payload: TextSelectionPayload) => void;
  onMultiPageSelectionAttempt?: () => void;
  onClearSelection: () => void;
  onPageRendered?: (pageNumber: number, fullPageText: string, container: HTMLElement) => void;
}

export function PdfDocumentView({
  fileUrl,
  currentPage,
  zoom,
  highlights,
  activeHighlightId,
  activeSelection,
  currentMaterialVersion,
  onLoadSuccess,
  onLoadError,
  onSelectHighlight,
  onTextSelected,
  onMultiPageSelectionAttempt,
  onClearSelection,
  onPageRendered,
}: PdfDocumentViewProps) {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const suppressNextClickRef = useRef<boolean>(false);
  const lastSelectionTimeRef = useRef<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(750);
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);

  // 1. Detecção e captura precisa de seleção de texto
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = pageContainerRef.current;
    if (!container) return;

    const pageEl = (container.querySelector('.react-pdf__Page') as HTMLElement) || container;
    const validation = validateSelection(range, pageEl);

    if (
      !validation.isValid ||
      !validation.selectedText ||
      !validation.rects ||
      validation.rects.length === 0 ||
      !validation.clientRect
    ) {
      if (validation.error === 'MULTI_PAGE') {
        onMultiPageSelectionAttempt?.();
      }
      return;
    }

    // Extrai o texto da página a partir da textLayer
    const textLayerEl =
      (container.querySelector('.react-pdf__Page__textContent') as HTMLElement) ||
      (container.querySelector('.textLayer') as HTMLElement) ||
      container;
    const fullPageText = textLayerEl.textContent || '';
    const anchorContext = extractAnchorContext(fullPageText, validation.selectedText);

    // Clona DOMRect para garantir imutabilidade após limpar seleção nativa
    const clientRect = validation.clientRect;
    const clonedClientRect = {
      top: clientRect.top,
      left: clientRect.left,
      bottom: clientRect.bottom,
      right: clientRect.right,
      width: clientRect.width,
      height: clientRect.height,
      x: clientRect.x || clientRect.left,
      y: clientRect.y || clientRect.top,
      toJSON: () => ({}),
    } as DOMRect;

    const payload: TextSelectionPayload = {
      selectedText: validation.selectedText,
      rects: validation.rects,
      clientRect: clonedClientRect,
      contextBefore: anchorContext.contextBefore,
      contextAfter: anchorContext.contextAfter,
      quotePrefix: anchorContext.quotePrefix,
      quoteSuffix: anchorContext.quoteSuffix,
      startOffset: anchorContext.startOffset,
      endOffset: anchorContext.endOffset,
    };

    // Remove imediatamente a seleção nativa do browser para eliminar o fundo azul/cinza
    try {
      selection.removeAllRanges();
    } catch {
      // Ignora se não for suportado pelo ambiente
    }

    // Suprime o evento de click imediato/sintético gerado pelo navegador após o drag
    suppressNextClickRef.current = true;
    lastSelectionTimeRef.current = Date.now();

    // Notifica componente pai com todos os dados capturados
    onTextSelected(payload);
  }, [onMultiPageSelectionAttempt, onTextSelected]);

  // Listener global de mouseup para nunca perder o término da seleção, mesmo soltando fora da div
  useEffect(() => {
    const onDocMouseUp = () => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        handleSelection();
      }
    };
    document.addEventListener('mouseup', onDocMouseUp);
    return () => document.removeEventListener('mouseup', onDocMouseUp);
  }, [handleSelection]);

  // 2. Detecção de clique em marcações salvas ou clique fora intencional para dispensar toolbar
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 1. Se suppressNextClickRef === true OU clique ocorreu nos primeiros 400ms da seleção:
      //    resetar para false e retornar para proteger activeSelection contra o clique do drag
      const isRecentSelection = Date.now() - lastSelectionTimeRef.current < 400;
      if (suppressNextClickRef.current || isRecentSelection) {
        suppressNextClickRef.current = false;
        return;
      }

      // Se houver seleção ativa em andamento com drag, não faz nada
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
        return;
      }

      const container = pageContainerRef.current;
      if (!container) return;

      const pageEl = (container.querySelector('.react-pdf__Page') as HTMLElement) || container;
      const rect = pageEl.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      // 2. Detectar se o clique foi sobre um highlight existente:
      //    se sim, abrir esse highlight
      const clickedHighlight = highlights.find((h) => {
        if (
          currentMaterialVersion !== undefined &&
          h.material_version !== currentMaterialVersion
        ) {
          return false;
        }
        return h.rects.some(
          (r) =>
            clickX >= r.x &&
            clickX <= r.x + r.width &&
            clickY >= r.y &&
            clickY <= r.y + r.height
        );
      });

      if (clickedHighlight) {
        onSelectHighlight(clickedHighlight);
        return;
      }

      // 3. Se existe activeSelection e foi um clique posterior realmente intencional fora do toolbar:
      //    então pode limpar a seleção
      if (activeSelection) {
        onClearSelection();
        return;
      }
    },
    [activeSelection, currentMaterialVersion, highlights, onClearSelection, onSelectHighlight]
  );

  // 3. Feedback de cursor ao passar sobre marcações existentes sem bloquear seleção
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons > 0) return; // Não interfere durante drag de seleção
      const container = pageContainerRef.current;
      if (!container) return;

      const pageEl = (container.querySelector('.react-pdf__Page') as HTMLElement) || container;
      const rect = pageEl.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;

      const isOverHighlight = highlights.some((h) => {
        if (
          currentMaterialVersion !== undefined &&
          h.material_version !== currentMaterialVersion
        ) {
          return false;
        }
        return h.rects.some(
          (r) =>
            mouseX >= r.x &&
            mouseX <= r.x + r.width &&
            mouseY >= r.y &&
            mouseY <= r.y + r.height
        );
      });

      container.style.cursor = isOverHighlight ? 'pointer' : '';
    },
    [currentMaterialVersion, highlights]
  );

  // 4. Limpa seleção com tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && activeSelection) {
        onClearSelection();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSelection, onClearSelection]);

  // Notifica o container quando a página é carregada para possibilitar reancoragem
  useEffect(() => {
    if (!isPageLoaded || !pageContainerRef.current) return;
    const container = pageContainerRef.current;
    const timer = setTimeout(() => {
      const textLayerEl =
        (container.querySelector('.react-pdf__Page__textContent') as HTMLElement) ||
        (container.querySelector('.textLayer') as HTMLElement) ||
        container;
      const fullPageText = textLayerEl.textContent || '';
      onPageRendered?.(currentPage, fullPageText, container);
    }, 100);

    return () => clearTimeout(timer);
  }, [isPageLoaded, currentPage, onPageRendered]);

  return (
    <div
      className="w-full flex justify-center py-4 select-text"
      onMouseUp={handleSelection}
      onTouchEnd={handleSelection}
    >
      <style>{`
        /* Stacking context e visibilidade rigorosa das camadas do PDF */
        .react-pdf__Page {
          position: relative !important;
        }

        /* 1. Base do PDF (Canvas): visual do documento sem interceptar mouse events */
        .react-pdf__Page__canvas {
          position: relative !important;
          z-index: 1 !important;
          display: block !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        /* 2. Camada visual de highlights: sob o texto, sobre o canvas */
        .pdf-highlight-overlay {
          position: absolute !important;
          inset: 0 !important;
          z-index: 2 !important;
          pointer-events: none !important;
        }

        /* 3. Text Layer nativa do PDF: captura direta do mouse e seleção 100% fluida */
        .react-pdf__Page__textContent,
        .textLayer {
          position: absolute !important;
          inset: 0 !important;
          z-index: 3 !important;
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          opacity: 1 !important;
        }

        .react-pdf__Page__textContent span,
        .textLayer span {
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }

        /* Estilo da seleção ativa no PDF: destaque suave translúcido sem ofuscar o texto do canvas */
        .react-pdf__Page__textContent ::selection,
        .textLayer ::selection,
        .react-pdf__Page__textContent span::selection,
        .textLayer span::selection {
          background: rgba(250, 204, 21, 0.35) !important;
          color: transparent !important;
        }

        /* 4. Camada de anotações: não bloqueia cliques/drags exceto em links interativos */
        .react-pdf__Page__annotations,
        .annotationLayer,
        .react-pdf__Page__annotations section,
        .annotationLayer section {
          position: absolute !important;
          inset: 0 !important;
          z-index: 4 !important;
          pointer-events: none !important;
        }

        .react-pdf__Page__annotations a,
        .react-pdf__Page__annotations button,
        .react-pdf__Page__annotations input,
        .annotationLayer a,
        .annotationLayer button,
        .annotationLayer input {
          pointer-events: auto !important;
        }
      `}</style>

      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
        onLoadError={(err) => onLoadError(err instanceof Error ? err : new Error(String(err)))}
        loading={
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <div className="w-9 h-9 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
            <p className="text-xs text-zinc-400">Carregando documento do servidor seguro...</p>
          </div>
        }
        error={
          <div className="p-8 text-center text-rose-300 space-y-2">
            <p className="font-semibold text-sm">Não foi possível carregar o arquivo PDF.</p>
            <p className="text-xs text-zinc-400">Verifique a conexão ou se o material está íntegro.</p>
          </div>
        }
      >
        <div
          ref={pageContainerRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleSelection}
          onTouchEnd={handleSelection}
          className="relative shadow-2xl rounded-lg overflow-hidden bg-white border border-zinc-700/60"
        >
          <Page
            pageNumber={currentPage}
            scale={zoom / 100}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            onLoadSuccess={(page) => {
              setPageWidth(page.width);
              setIsPageLoaded(true);
            }}
            loading={
              <div
                className="flex items-center justify-center bg-zinc-900/60 animate-pulse"
                style={{ width: `${pageWidth * (zoom / 100)}px`, height: '800px' }}
              >
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
              </div>
            }
          >
            {/* Camada visual de destaques inserida dentro da Page: atrás do textLayer e sobre o canvas */}
            {isPageLoaded && (
              <HighlightOverlay
                highlights={highlights}
                activeHighlightId={activeHighlightId}
                pendingSelectionRects={activeSelection?.rects}
                currentMaterialVersion={currentMaterialVersion}
              />
            )}
          </Page>
        </div>
      </Document>
    </div>
  );
}
