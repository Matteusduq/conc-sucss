import React from 'react';
import { DomainConfidence } from '@/types/database';
import { cn } from '@/lib/utils/cn';

interface DomainScoreProps {
  score: number | null;
  confidence: DomainConfidence | null;
  showBand?: boolean;
  className?: string;
}

export function DomainScore({
  score,
  confidence,
  showBand = true,
  className,
}: DomainScoreProps) {
  if (score === null || isNaN(score)) {
    return (
      <div className={cn('flex flex-col', className)}>
        <span className="text-xs text-zinc-500 font-mono">-</span>
        <span className="text-[10px] text-zinc-500">Sem dados</span>
      </div>
    );
  }

  const getBandLabel = (val: number) => {
    if (val < 40) return { label: 'Fraco', color: 'text-rose-400' };
    if (val < 60) return { label: 'Em construção', color: 'text-amber-400' };
    if (val < 75) return { label: 'Razoável', color: 'text-yellow-400' };
    if (val < 85) return { label: 'Bom', color: 'text-blue-400' };
    if (val < 95) return { label: 'Dominado', color: 'text-emerald-400' };
    return { label: 'Domínio alto', color: 'text-emerald-300 font-bold' };
  };

  const confidenceLabel = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
  }[confidence || 'LOW'];

  const band = getBandLabel(score);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-sm font-semibold font-mono', band.color)}>
          {score}%
        </span>
        {showBand && (
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            ({band.label})
          </span>
        )}
      </div>
      <span className="text-[10px] text-zinc-400">
        Confiança: <span className="text-zinc-300 font-medium">{confidenceLabel}</span>
      </span>
    </div>
  );
}
