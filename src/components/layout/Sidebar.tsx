'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  LogOut,
  User as UserIcon,
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

interface SidebarProps {
  userEmail?: string | null;
  onSignOut?: () => void;
}

export function Sidebar({ userEmail, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; provider: string; model: string } | null>(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((data) => setAiStatus(data))
      .catch(() => setAiStatus({ configured: false, provider: 'none', model: 'none' }));
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 min-h-screen justify-between">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="px-3 py-2">
          <Link href="/hoje" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 p-0.5 shrink-0 group-hover:border-zinc-700 transition-colors">
              <Image
                src="/logo.png"
                alt="Logo Câmara 2027"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight leading-tight group-hover:text-white transition-colors">
                Câmara 2027
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                Cockpit de Estudos
              </span>
            </div>
          </Link>
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

      <div className="space-y-3">
        {/* User Account / Sair */}
        {userEmail && (
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-200 truncate" title={userEmail}>
                  {userEmail}
                </p>
                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Supabase RLS
                </span>
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* AI Module Status indicator */}
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className={cn("w-3.5 h-3.5", aiStatus?.configured ? "text-amber-400" : "text-zinc-500")} />
              Módulo IA
            </span>
            <span
              className={cn(
                "text-[9px] uppercase px-1.5 py-0.5 rounded font-mono",
                aiStatus?.configured
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 text-zinc-400"
              )}
            >
              {aiStatus === null
                ? '...'
                : aiStatus.configured
                ? 'Conectada'
                : 'Não configurada'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            {aiStatus?.configured
              ? `${aiStatus.provider === 'xkiro' ? 'Xkiro' : aiStatus.provider} · ${aiStatus.model.includes('qwen') ? 'Qwen' : aiStatus.model}`
              : 'Motor determinístico ativo.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
