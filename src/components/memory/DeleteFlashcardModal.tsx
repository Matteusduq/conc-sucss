'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  cardFront?: string;
  isDeleting?: boolean;
  errorMessage?: string | null;
}

export function DeleteFlashcardModal({
  isOpen,
  onClose,
  onConfirm,
  cardFront,
  isDeleting = false,
  errorMessage = null,
}: DeleteFlashcardModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title="Excluir este flashcard?"
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs text-zinc-300 leading-relaxed">
          Esta ação removerá o cartão e seu histórico de revisão FSRS. A marcação original no PDF, se existir, será preservada.
        </p>

        {cardFront && (
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
            <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
              Frente do Cartão
            </span>
            <p className="font-medium line-clamp-3 text-zinc-200">{cardFront}</p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-500 text-white border-0"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Excluir flashcard
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
