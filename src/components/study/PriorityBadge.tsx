import React from 'react';
import { Priority } from '@/types/database';
import { Badge } from '@/components/ui/Badge';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  switch (priority) {
    case 'HIGH':
      return <Badge variant="high" className={className}>ALTA</Badge>;
    case 'MEDIUM':
      return <Badge variant="medium" className={className}>MÉDIA</Badge>;
    case 'LOW':
      return <Badge variant="low" className={className}>BAIXA</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{priority}</Badge>;
  }
}
