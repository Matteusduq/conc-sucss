import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-800/80">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
