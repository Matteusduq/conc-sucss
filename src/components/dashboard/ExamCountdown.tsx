'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { getDaysUntilExam } from '@/lib/utils/date';

interface ExamCountdownProps {
  examName?: string;
  role?: string;
  examDate?: string;
}

export function ExamCountdown({
  examName = 'Câmara dos Deputados',
  role = 'Analista Legislativo — Registro e Redação',
  examDate = '2027-01-17',
}: ExamCountdownProps) {
  const daysLeft = getDaysUntilExam(`${examDate}T08:00:00-03:00`);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {examName}
          </h1>
        </div>
        <p className="text-xs md:text-sm text-zinc-400 font-medium">
          {role} • Banca: <span className="text-zinc-300">Cebraspe</span>
        </p>
      </div>

      <div className="flex items-center gap-3 bg-zinc-950/80 px-4 py-2.5 rounded-xl border border-zinc-800/90">
        <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
          <Calendar className="w-5 h-5 text-zinc-200" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {daysLeft}
            </span>
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              dias até a prova
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">17 de janeiro de 2027</p>
        </div>
      </div>
    </div>
  );
}
