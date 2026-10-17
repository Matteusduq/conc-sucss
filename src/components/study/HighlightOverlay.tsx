'use client';

import React from 'react';
import { MaterialHighlight, HighlightRect } from '@/types/database';

interface HighlightOverlayProps {
  highlights: MaterialHighlight[];
  activeHighlightId: string | null;
  pendingSelectionRects?: HighlightRect[] | null;
  currentMaterialVersion?: number;
}

export function HighlightOverlay({
  highlights,
  activeHighlightId,
  pendingSelectionRects,
  currentMaterialVersion,
}: HighlightOverlayProps) {
  return (
    <div className="pdf-highlight-overlay absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Destaques salvos e persistidos */}
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
                key={`hl-${highlight.id}-${idx}`}
                className="absolute pointer-events-none transition-colors duration-150"
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.width * 100}%`,
                  height: `${rect.height * 100}%`,
                  backgroundColor: isActive
                    ? 'rgba(250, 204, 21, 0.48)'
                    : 'rgba(250, 204, 21, 0.34)',
                  boxShadow: isActive
                    ? '0 0 0 1.5px rgba(234, 179, 8, 0.7)'
                    : 'none',
                  borderRadius: '2px',
                }}
                aria-hidden="true"
              />
            ))}
          </React.Fragment>
        );
      })}

      {/* 2. Destaque pendente imediato (preview enquanto o toolbar "Marcar + IA" está aberto) */}
      {pendingSelectionRects &&
        pendingSelectionRects.map((rect, idx) => (
          <div
            key={`pending-preview-${idx}`}
            className="absolute pointer-events-none"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
              backgroundColor: 'rgba(250, 204, 21, 0.34)',
              boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.45)',
              borderRadius: '2px',
            }}
            aria-hidden="true"
          />
        ))}
    </div>
  );
}
