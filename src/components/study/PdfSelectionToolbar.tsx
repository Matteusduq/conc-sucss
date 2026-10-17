'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface PdfSelectionToolbarProps {
  position: { top: number; left: number };
  onHighlightAndAskAI: () => void;
  isLoading?: boolean;
}

export function PdfSelectionToolbar({
  position,
  onHighlightAndAskAI,
  isLoading = false,
}: PdfSelectionToolbarProps) {
  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHighlightAndAskAI();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={isLoading}
          aria-label="Marcar trecho e consultar IA"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-200 font-medium border border-amber-500/30 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{isLoading ? 'Marcando...' : 'Marcar + IA'}</span>
        </button>
      </div>
      {/* Seta indicadora inferior */}
      <div className="w-2.5 h-2.5 bg-zinc-900 border-r border-b border-amber-500/40 rotate-45 mx-auto -mt-1.5 shadow-sm" />
    </div>
  );
}
