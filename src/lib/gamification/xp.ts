import { XpTransaction, GamificationProfile } from './types';
import { getLocalDateString } from '@/lib/utils/date';

export const XP_PER_LEVEL = 1000;

export const GAMIFICATION_RULES = {
  QUESTIONS: {
    XP_PER_QUESTION: 2,
    MAX_XP_PER_SESSION: 60, // equivalent to 30 questions
    DAILY_VOLUME_CAP: 120, // max 120 XP/day from question volume
    MIN_QUESTIONS_FOR_BONUS: 15,
    SESSION_COMPLETION_BONUS: 20,
  },
  MATERIAL: {
    MIN_SECONDS_FOR_PROGRESS: 1200, // 20 minutes
    XP_PROGRESS_SESSION: 30,
    DAILY_PROGRESS_CAP: 60,
    XP_TOPIC_COMPLETION_ONE_TIME: 80,
  },
  FLASHCARDS: {
    XP_PER_DUE_REVIEW: 1,
    DAILY_UNIT_REVIEW_CAP: 30, // max 30 XP/day for individual reviews
    QUEUE_CLEARED_DAILY_BONUS: 15, // once per day when all due cards cleared
  },
  ERRORS: {
    XP_PER_ERROR_LOGGED: 5,
    DAILY_LOG_CAP: 25, // max 5 errors logged per day for XP
    XP_ERROR_RESOLVED_ONE_TIME: 10,
  },
  DISCURSIVE: {
    XP_QUESTION_20_LINES: 60,
    XP_TECHNICAL_PIECE: 100,
  },
  SIMULADOS: {
    XP_WEEKLY_CHECKPOINT: 120,
    XP_FULL_MOCK: 200,
    XP_PARTIAL_MOCK: 60,
    MIN_QUESTIONS_FOR_PARTIAL: 30,
  },
  MISSIONS: {
    XP_DAILY_MISSION_COMPLETED: 25,
    XP_ALL_DAILY_MISSIONS_BONUS: 40,
  },
  ACHIEVEMENTS: {
    DEFAULT_ACHIEVEMENT_XP: 50,
  },
} as const;

export function getLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return 1 + Math.floor(totalXp / XP_PER_LEVEL);
}

export function getLevelProgress(totalXp: number): {
  level: number;
  currentXpInLevel: number;
  xpNeededForNext: number;
  progressPercent: number;
  totalXp: number;
} {
  const level = getLevel(totalXp);
  const currentXpInLevel = Math.max(0, totalXp % XP_PER_LEVEL);
  const xpNeededForNext = XP_PER_LEVEL - currentXpInLevel;
  const progressPercent = Math.min(100, Math.round((currentXpInLevel / XP_PER_LEVEL) * 100));

  return {
    level,
    currentXpInLevel,
    xpNeededForNext,
    progressPercent,
    totalXp,
  };
}

export function createDefaultGamificationProfile(userId: string = 'local-user'): GamificationProfile {
  const today = getLocalDateString();
  return {
    user_id: userId,
    total_xp: 0,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
    meaningful_days: 0,
    last_meaningful_study_date: null,
    achievements_unlocked: [],
    weekly_consistency_days: 0,
    current_week_start: today,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Checks whether an XP transaction with the specified rule_id and source_event_id
 * has already been executed.
 */
export function isTransactionProcessed(
  transactions: XpTransaction[],
  ruleId: string,
  sourceEventId: string
): boolean {
  return transactions.some(
    (t) => t.rule_id === ruleId && t.source_event_id === sourceEventId
  );
}

/**
 * Calculates current day's accumulated XP for a specific category/rule prefix
 * to enforce daily anti-farming caps.
 */
export function getDailyXpForCategory(
  transactions: XpTransaction[],
  rulePrefix: string,
  dateIso: string
): number {
  const targetDateStr = getLocalDateString(dateIso);
  return transactions
    .filter((t) => {
      if (!t.rule_id.startsWith(rulePrefix)) return false;
      const txDateStr = getLocalDateString(t.created_at);
      return txDateStr === targetDateStr;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}
