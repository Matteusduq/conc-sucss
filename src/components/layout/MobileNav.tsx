'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ListTree,
  Brain,
  TrendingUp,
  MoreHorizontal,
  BookMarked,
  AlertOctagon,
  BarChart3,
  Settings,
  PenTool,
  Compass,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function MobileNav() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { href: '/hoje', label: 'Hoje', icon: CalendarDays },
    { href: '/jornada', label: 'Jornada', icon: Compass },
    { href: '/plano', label: 'Plano', icon: ListTree },
    { href: '/memoria', label: 'Memória', icon: Brain },
  ];

  const moreTabs = [
    { href: '/performance', label: 'Performance', icon: TrendingUp },
    { href: '/discursiva', label: 'Discursiva', icon: PenTool },
    { href: '/biblioteca', label: 'Biblioteca', icon: BookMarked },
    { href: '/erros', label: 'Caderno de Erros', icon: AlertOctagon },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* "Mais" Bottom Sheet Drawer */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex flex-col justify-end">
          <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs uppercase font-bold text-zinc-400">Outras Áreas</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold',
                      isActive
                        ? 'border-zinc-200 bg-zinc-800 text-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
                    )}
                  >
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-md px-2 py-1.5 flex items-center justify-around">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/hoje' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors',
                isActive ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Icon className={cn('w-4 h-4 mb-0.5', isActive ? 'text-white' : 'text-zinc-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowMoreMenu(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5 text-zinc-400" />
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
}
