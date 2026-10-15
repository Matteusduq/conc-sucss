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

/**
 * Returns YYYY-MM-DD formatted string in America/Sao_Paulo timezone.
 * Prevents UTC midnight boundary shifts where a 22:00 BRT event would leak into the next day.
 */
export function getLocalDateString(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Calculates start of the week (Monday) and end of the week (Sunday) in YYYY-MM-DD.
 */
export function getWeekStartAndEnd(dateInput: Date | string = new Date()): { weekStart: string; weekEnd: string } {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  
  // Get date in local representation
  const localStr = getLocalDateString(d);
  const [year, month, day] = localStr.split('-').map(Number);
  
  // Create a local date object
  const localDate = new Date(year, month - 1, day);
  // In JS: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfWeek = localDate.getDay();
  // We want Monday as start of study week (dayOfWeek 1 -> offset 0, Sunday 0 -> offset -6)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatYmd = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayOfMonth}`;
  };

  return {
    weekStart: formatYmd(monday),
    weekEnd: formatYmd(sunday),
  };
}

/**
 * Computes difference in calendar days between two dates in America/Sao_Paulo.
 */
export function getCalendarDaysDiff(dateA: string, dateB: string): number {
  const [yA, mA, dA] = dateA.split('-').map(Number);
  const [yB, mB, dB] = dateB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

