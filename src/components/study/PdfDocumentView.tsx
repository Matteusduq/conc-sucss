'use client';

import React, { useRef, useState, useCallback } from 'react';
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
}

interface PdfDocumentViewProps {
  fileUrl: string;
  currentPage: number;
  zoom: number; // Porcentagem: 100 = 1.0
  highlights: MaterialHighlight[];
  activeHighlightId: string | null;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (error: Error) => void;
  onSelectHighlight: (highlight: MaterialHighlight) => void;
  onTextSelected: (payload: TextSelectionPayload) => void;
  onMultiPageSelectionAttempt?: () => void;
  onClearSelection: () => void;
}

export function PdfDocumentView({
  fileUrl,
  currentPage,
  zoom,
  highlights,
  activeHighlightId,
  onLoadSuccess,
  onLoadError,
  onSelectHighlight,
  onTextSelected,
  onMultiPageSelectionAttempt,
  onClearSelection,
}: PdfDocumentViewProps) {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>(750);
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      onClearSelection();
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
      onClearSelection();
      return;
    }

    // Extrai o texto da página a partir da textLayer
    const textLayerEl =
      container.querySelector('.react-pdf__Page__textContent') || container;
    const fullPageText = textLayerEl.textContent || '';
    const anchorContext = extractAnchorContext(fullPageText, validation.selectedText);

    onTextSelected({
      selectedText: validation.selectedText,
      rects: validation.rects,
      clientRect: validation.clientRect,
      contextBefore: anchorContext.contextBefore,
      contextAfter: anchorContext.contextAfter,
      quotePrefix: anchorContext.quotePrefix,
      quoteSuffix: anchorContext.quoteSuffix,
    });
  }, [onClearSelection, onMultiPageSelectionAttempt, onTextSelected]);

  return (
    <div
      className="w-full flex justify-center py-4 select-text"
      onMouseUp={handleSelection}
      onTouchEnd={handleSelection}
    >
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
          />

          {/* Camada de destaques posicionada sobre a página */}
          {isPageLoaded && (
            <HighlightOverlay
              highlights={highlights}
              activeHighlightId={activeHighlightId}
              onSelectHighlight={onSelectHighlight}
            />
          )}
        </div>
      </Document>
    </div>
  );
}
