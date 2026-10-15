import React from 'react';
import { cn } from '@/lib/utils/cn';

interface StudyScoreBadgeProps {
  score: number;
  className?: string;
}

export function StudyScoreBadge({ score, className }: StudyScoreBadgeProps) {
  const getStyle = (val: number) => {
    if (val >= 80) return 'bg-rose-950/80 text-rose-300 border-rose-800 font-bold';
    if (val >= 60) return 'bg-amber-950/80 text-amber-300 border-amber-800 font-semibold';
    if (val >= 40) return 'bg-blue-950/80 text-blue-300 border-blue-800';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs border font-mono tracking-tight',
        getStyle(score),
        className
      )}
      title="Study Score: Índice de prioridade dinâmica calculado pelo algoritmo (0-100)"
    >
      Score: {score}
    </div>
  );
}
