import React from 'react';
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
