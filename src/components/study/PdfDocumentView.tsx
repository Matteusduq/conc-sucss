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

    const validation = validateSelection(range, container);

    if (
      !validation.isValid ||
      !validation.selectedText ||
      !validation.rects ||
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
      (container.querySelector('.react-pdf__Page__textLayer') as HTMLElement) ||
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

    // 5. Remove imediatamente a seleção nativa do browser para eliminar o fundo azul/cinza
    try {
      selection.removeAllRanges();
    } catch {
      // Ignora se não for suportado pelo ambiente
    }

    // Notifica componente pai com todos os dados capturados
    onTextSelected(payload);
  }, [onMultiPageSelectionAttempt, onTextSelected]);

  // 2. Detecção de clique em marcações salvas ou clique fora para dispensar toolbar
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Se houver seleção ativa em andamento com drag, não faz nada
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
        return;
      }

      // Se havia uma seleção pendente aberta e o usuário clicou no documento, limpa a seleção
      if (activeSelection) {
        onClearSelection();
        return;
      }

      const container = pageContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      // Verifica se o clique ocorreu sobre algum highlight existente da versão atual
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

      const rect = container.getBoundingClientRect();
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
        (container.querySelector('.react-pdf__Page__textLayer') as HTMLElement) ||
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
        .react-pdf__Page {
          position: relative !important;
        }
        .react-pdf__Page__canvas {
          position: relative !important;
          z-index: 1 !important;
          display: block !important;
        }
        .pdf-highlight-overlay {
          position: absolute !important;
          inset: 0 !important;
          z-index: 2 !important;
          pointer-events: none !important;
        }
        .react-pdf__Page__textLayer {
          position: absolute !important;
          inset: 0 !important;
          z-index: 3 !important;
          pointer-events: auto !important;
        }
        .react-pdf__Page__annotations {
          position: absolute !important;
          inset: 0 !important;
          z-index: 4 !important;
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
