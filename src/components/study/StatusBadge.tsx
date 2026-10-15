import React from 'react';
import { TopicStatus } from '@/types/database';
import { Badge } from '@/components/ui/Badge';

interface StatusBadgeProps {
  status: TopicStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case 'NOT_STARTED':
      return <Badge variant="neutral" className={className}>Não iniciado</Badge>;
    case 'LEARNING':
      return <Badge variant="info" className={className}>Lendo teoria</Badge>;
    case 'AWAITING_QUESTIONS':
      return <Badge variant="warning" className={className}>Aguardando TEC</Badge>;
    case 'CONSOLIDATING':
      return <Badge variant="warning" className={className}>Consolidando</Badge>;
    case 'MASTERED':
      return <Badge variant="success" className={className}>Dominado</Badge>;
    case 'MAINTENANCE':
      return <Badge variant="success" className={className}>Manutenção</Badge>;
    case 'AT_RISK':
      return <Badge variant="danger" className={className}>Em risco</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{status}</Badge>;
  }
}
