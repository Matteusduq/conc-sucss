import { getLocalDateString, getWeekStartAndEnd, getCalendarDaysDiff } from '@/lib/utils/date';
import {
  QuestionSession,
  MaterialProgress,
  FlashcardReview,
  DiscursiveSession,
  MockExam,
} from '@/types/database';

export const MEANINGFUL_STUDY_RULES = {
  MIN_QUESTIONS_SESSION: 10,
  MIN_MATERIAL_STUDY_SECONDS: 1200, // 20 minutes
  MIN_FLASHCARD_REVIEWS: 10,
  MIN_DISCURSIVE_SESSIONS: 1,
  MIN_MOCK_EXAMS: 1,
  DEFAULT_WEEKLY_TARGET_DAYS: 6,
} as const;

export interface MeaningfulStudyContext {
  questionSessions: QuestionSession[];
  materialProgress: Record<string, MaterialProgress>;
  reviews: FlashcardReview[];
  discursiveSessions: DiscursiveSession[];
  mockExams: MockExam[];
}

/**
 * Determines whether a specific date (YYYY-MM-DD in America/Sao_Paulo)
 * qualifies as a Meaningful Study Day.
 *
 * Rules: Requires at least ONE substantial pedagogical activity:
 * 1. Question session with >= 10 items
 * 2. Study of material >= 20 minutes OR material completed on that date
 * 3. >= 10 due FSRS reviews on that date
 * 4. 1 discursive session on that date
 * 5. 1 mock exam / checkpoint on that date
 */
export function isMeaningfulStudyDay(
  targetDate: string,
  context: MeaningfulStudyContext
): boolean {
  // 1. Question sessions >= 10 questions
  const hasSubstantialQuestions = context.questionSessions.some((s) => {
    const sDate = getLocalDateString(s.performed_at);
    return sDate === targetDate && s.total_questions >= MEANINGFUL_STUDY_RULES.MIN_QUESTIONS_SESSION;
  });
  if (hasSubstantialQuestions) return true;

  // 2. Material progress >= 20 minutes OR completed on that day
  const hasSubstantialMaterial = Object.values(context.materialProgress).some((mp) => {
    if (mp.completed_at && getLocalDateString(mp.completed_at) === targetDate) {
      return true;
    }
    if (mp.last_opened_at && getLocalDateString(mp.last_opened_at) === targetDate) {
      return mp.total_study_seconds >= MEANINGFUL_STUDY_RULES.MIN_MATERIAL_STUDY_SECONDS;
    }
    return false;
  });
  if (hasSubstantialMaterial) return true;

  // 3. >= 10 Flashcard reviews
  const reviewsOnDate = context.reviews.filter(
    (r) => getLocalDateString(r.reviewed_at) === targetDate
  );
  if (reviewsOnDate.length >= MEANINGFUL_STUDY_RULES.MIN_FLASHCARD_REVIEWS) {
    return true;
  }

  // 4. Discursive session
  const hasDiscursive = context.discursiveSessions.some(
    (ds) => getLocalDateString(ds.performed_at) === targetDate
  );
  if (hasDiscursive) return true;

  // 5. Mock exam
  const hasMockExam = context.mockExams.some(
    (me) => getLocalDateString(me.performed_at) === targetDate
  );
  if (hasMockExam) return true;

  return false;
}

/**
 * Extracts all distinct YYYY-MM-DD dates that qualify as meaningful study days.
 */
export function getAllMeaningfulStudyDates(context: MeaningfulStudyContext): string[] {
  const datesSet = new Set<string>();

  // Gather candidate dates from all activities
  context.questionSessions.forEach((s) => datesSet.add(getLocalDateString(s.performed_at)));
  Object.values(context.materialProgress).forEach((mp) => {
    if (mp.last_opened_at) datesSet.add(getLocalDateString(mp.last_opened_at));
    if (mp.completed_at) datesSet.add(getLocalDateString(mp.completed_at));
  });
  context.reviews.forEach((r) => datesSet.add(getLocalDateString(r.reviewed_at)));
  context.discursiveSessions.forEach((ds) => datesSet.add(getLocalDateString(ds.performed_at)));
  context.mockExams.forEach((me) => datesSet.add(getLocalDateString(me.performed_at)));

  const meaningfulDates: string[] = [];
  datesSet.forEach((d) => {
    if (isMeaningfulStudyDay(d, context)) {
      meaningfulDates.push(d);
    }
  });

  return meaningfulDates.sort();
}

/**
 * Calculates current streak, longest streak, and total meaningful days.
 * Streak counts consecutive meaningful study days.
 * If user hasn't studied yet today, but yesterday was meaningful, the streak is maintained.
 */
export function calculateStreaks(
  meaningfulDates: string[],
  todayStr: string = getLocalDateString()
): {
  currentStreak: number;
  longestStreak: number;
  totalMeaningfulDays: number;
  lastMeaningfulDate: string | null;
} {
  if (meaningfulDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalMeaningfulDays: 0,
      lastMeaningfulDate: null,
    };
  }

  const sortedDates = Array.from(new Set(meaningfulDates)).sort();
  const lastMeaningfulDate = sortedDates[sortedDates.length - 1];

  let longestStreak = 0;
  let currentStreak = 0;

  // Compute longest streak across all history
  let running = 0;
  let prevDate: string | null = null;

  for (const d of sortedDates) {
    if (!prevDate) {
      running = 1;
    } else {
      const diff = getCalendarDaysDiff(prevDate, d);
      if (diff === 1) {
        running += 1;
      } else if (diff > 1) {
        running = 1;
      }
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
    prevDate = d;
  }

  // Compute current streak relative to todayStr
  const isTodayStudied = sortedDates.includes(todayStr);
  const diffFromLast = getCalendarDaysDiff(lastMeaningfulDate, todayStr);

  // If last study was today: streak is unbroken ending today
  // If last study was yesterday (diff == 1): streak is active pending today
  // If last study was 2 or more days ago: streak broke -> 0
  if (isTodayStudied || diffFromLast <= 1) {
    // Count backwards from lastMeaningfulDate
    let count = 0;
    let expected = lastMeaningfulDate;
    const dateSet = new Set(sortedDates);

    while (dateSet.has(expected)) {
      count++;
      // Get previous calendar day
      const [y, m, day] = expected.split('-').map(Number);
      const prev = new Date(y, m - 1, day - 1);
      const prevY = prev.getFullYear();
      const prevM = String(prev.getMonth() + 1).padStart(2, '0');
      const prevD = String(prev.getDate()).padStart(2, '0');
      expected = `${prevY}-${prevM}-${prevD}`;
    }
    currentStreak = count;
  } else {
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalMeaningfulDays: sortedDates.length,
    lastMeaningfulDate,
  };
}

/**
 * Calculates consistency for the current week (Monday to Sunday).
 */
export function calculateWeeklyConsistency(
  meaningfulDates: string[],
  referenceDateStr: string = getLocalDateString(),
  weeklyTargetDays: number = MEANINGFUL_STUDY_RULES.DEFAULT_WEEKLY_TARGET_DAYS
): {
  daysStudiedThisWeek: number;
  targetDays: number;
  weekStart: string;
  weekEnd: string;
  daysStatuses: { date: string; dayName: string; completed: boolean; isToday: boolean }[];
  isTargetMet: boolean;
} {
  const { weekStart, weekEnd } = getWeekStartAndEnd(referenceDateStr);
  const meaningfulSet = new Set(meaningfulDates);

  const daysStatuses: { date: string; dayName: string; completed: boolean; isToday: boolean }[] = [];
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const [y, m, d] = weekStart.split('-').map(Number);
  const startDate = new Date(y, m - 1, d);

  let daysStudiedThisWeek = 0;

  for (let i = 0; i < 7; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);

    const curY = cur.getFullYear();
    const curM = String(cur.getMonth() + 1).padStart(2, '0');
    const curD = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${curY}-${curM}-${curD}`;

    const completed = meaningfulSet.has(dateStr);
    if (completed) {
      daysStudiedThisWeek++;
    }

    daysStatuses.push({
      date: dateStr,
      dayName: dayNames[i],
      completed,
      isToday: dateStr === referenceDateStr,
    });
  }

  return {
    daysStudiedThisWeek,
    targetDays: weeklyTargetDays,
    weekStart,
    weekEnd,
    daysStatuses,
    isTargetMet: daysStudiedThisWeek >= weeklyTargetDays,
  };
}
