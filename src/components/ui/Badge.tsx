import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  const variantStyles = {
    neutral: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    high: 'bg-rose-950/70 text-rose-300 border-rose-800/80 font-semibold',
    medium: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    low: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-800',
    info: 'bg-blue-950/60 text-blue-300 border-blue-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs border tracking-wide uppercase font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
