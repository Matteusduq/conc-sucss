export const EXAM_DATE_ISO = '2027-01-17T08:00:00-03:00';
export const TIMEZONE = 'America/Sao_Paulo';

export function getDaysUntilExam(targetDateIso: string = EXAM_DATE_ISO): number {
  const target = new Date(targetDateIso).getTime();
  const now = new Date().getTime();
  const diffMs = target - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatDateBr(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTimeBr(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDurationSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }
  return `${minutes} min`;
}

export function formatDurationMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ''}`.trim();
  }
  return `${minutes} min`;
}
