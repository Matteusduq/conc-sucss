'use client';

import React from 'react';
import { Plus, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onOpenTecModal: () => void;
  onOpenErrorModal: () => void;
}

export function Header({ onOpenTecModal, onOpenErrorModal }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-400 hidden sm:inline">
          Concurso: <strong className="text-zinc-200">Analista Legislativo (Registro e Redação)</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenErrorModal}
          className="text-xs"
          title="Catalogar erro no caderno"
        >
          <AlertOctagon className="w-3.5 h-3.5 mr-1 text-amber-400" />
          <span className="hidden sm:inline">Caderno de</span> Erros
        </Button>

        <Button
          size="sm"
          onClick={onOpenTecModal}
          className="text-xs shadow-sm bg-zinc-100 text-zinc-950 hover:bg-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-zinc-950" />
          Registrar Sessão TEC
        </Button>
      </div>
    </header>
  );
}
