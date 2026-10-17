'use client';

import React from 'react';
import { MaterialHighlight } from '@/types/database';

interface HighlightOverlayProps {
  highlights: MaterialHighlight[];
  activeHighlightId: string | null;
  currentMaterialVersion?: number;
  onSelectHighlight: (highlight: MaterialHighlight) => void;
}

export function HighlightOverlay({
  highlights,
  activeHighlightId,
  currentMaterialVersion,
  onSelectHighlight,
}: HighlightOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {highlights.map((highlight) => {
        // Se a versão do highlight diferir da versão do PDF, não renderiza posições antigas
        if (
          currentMaterialVersion !== undefined &&
          highlight.material_version !== currentMaterialVersion
        ) {
          return null;
        }

        const isActive = highlight.id === activeHighlightId;

        return (
          <React.Fragment key={highlight.id}>
            {highlight.rects.map((rect, idx) => (
              <div
                key={`${highlight.id}-${idx}`}
                onClick={(e) => {
                  const sel = window.getSelection();
                  // Se o usuário acabou de selecionar texto, não abre o clique
                  if (sel && sel.toString().trim().length > 0) {
                    return;
                  }
                  e.stopPropagation();
                  onSelectHighlight(highlight);
                }}
                className={`absolute cursor-pointer transition-all duration-150 rounded-[2px] pointer-events-auto ${
                  isActive
                    ? 'bg-amber-400/55 ring-2 ring-amber-500 shadow-sm z-20'
                    : 'bg-amber-300/35 hover:bg-amber-400/50 z-10'
                }`}
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.width * 100}%`,
                  height: `${rect.height * 100}%`,
                  mixBlendMode: 'multiply',
                }}
                title={`Marcação pág. ${highlight.page_number} (clique para ver detalhes)`}
                aria-label={`Marcação de texto: ${highlight.selected_text.slice(0, 30)}...`}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
