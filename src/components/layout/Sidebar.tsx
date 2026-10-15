'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ListTree,
  BookMarked,
  Brain,
  TrendingUp,
  PenTool,
  AlertOctagon,
  BarChart3,
  Settings,
  Sparkles,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const NAV_ITEMS = [
  { href: '/hoje', label: 'Hoje', icon: CalendarDays },
  { href: '/jornada', label: 'Jornada', icon: Compass },
  { href: '/plano', label: 'Plano', icon: ListTree },
  { href: '/biblioteca', label: 'Biblioteca', icon: BookMarked },
  { href: '/memoria', label: 'Memória', icon: Brain },
  { href: '/performance', label: 'Performance', icon: TrendingUp },
  { href: '/discursiva', label: 'Discursiva', icon: PenTool },
  { href: '/erros', label: 'Erros', icon: AlertOctagon },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 min-h-screen justify-between">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-black text-zinc-950 text-sm">
              CD
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight leading-tight">
                Câmara 2027
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                Cockpit de Estudos
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/hoje' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all',
                  isActive
                    ? 'bg-zinc-800/90 text-white border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-zinc-100' : 'text-zinc-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Future AI status indicator */}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Módulo IA
          </span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            Preparado
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-tight">
          Motor determinístico ativo. Nenhuma chamada de API externa requerida.
        </p>
      </div>
    </aside>
  );
}
