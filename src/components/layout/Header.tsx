'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, AlertOctagon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  userEmail?: string | null;
  onOpenTecModal: () => void;
  onOpenErrorModal: () => void;
  onSignOut?: () => void;
}

export function Header({ userEmail, onOpenTecModal, onOpenErrorModal, onSignOut }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link href="/hoje" className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 p-0.5 shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-sm font-bold text-zinc-100">Câmara 2027</span>
        </Link>
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

        {onSignOut && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onSignOut}
            className="text-xs text-zinc-400 hover:text-red-400 md:hidden ml-1"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </header>
  );
}
