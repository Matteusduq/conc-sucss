import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  Card,
  RecordLogItem,
  FSRSParameters,
} from 'ts-fsrs';
import { CardWithMetadata, ScheduledIntervalPreview } from './types';
import { FsrsRating } from '@/types/database';

export function getFsrsInstance(desiredRetention: number = 0.90) {
  const params: FSRSParameters = generatorParameters({
    request_retention: desiredRetention,
  });
  return fsrs(params);
}

export function createInitialFsrsCard(): Card {
  return createEmptyCard();
}

export function dbStateToFsrsCard(dbState: CardWithMetadata['fsrs_state']): Card {
  if (!dbState) {
    return createEmptyCard();
  }

  return {
    due: new Date(dbState.due),
    stability: Number(dbState.stability),
    difficulty: Number(dbState.difficulty),
    elapsed_days: Number(dbState.elapsed_days),
    scheduled_days: Number(dbState.scheduled_days),
    learning_steps: Number(dbState.learning_steps),
    reps: Number(dbState.reps),
    lapses: Number(dbState.lapses),
    state: Number(dbState.state),
    last_review: dbState.last_review ? new Date(dbState.last_review) : undefined,
  };
}

export function formatIntervalPreview(nextDue: Date, now: Date = new Date()): string {
  const diffMs = nextDue.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${Math.max(1, diffMinutes)}m`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays < 30) {
    return `${diffDays}d`;
  }
  const months = Math.round(diffDays / 30);
  return `${months}mês`;
}

export function getScheduledIntervals(
  card: Card,
  desiredRetention: number = 0.90,
  now: Date = new Date()
): ScheduledIntervalPreview[] {
  const f = getFsrsInstance(desiredRetention);
  const schedulingRecord = f.repeat(card, now);

  const mappings: {
    rating: FsrsRating;
    ratingValue: Rating;
    label: string;
    shortcut: string;
  }[] = [
    { rating: 'AGAIN', ratingValue: Rating.Again, label: 'Errei', shortcut: '1' },
    { rating: 'HARD', ratingValue: Rating.Hard, label: 'Difícil', shortcut: '2' },
    { rating: 'GOOD', ratingValue: Rating.Good, label: 'Acertei', shortcut: '3' },
    { rating: 'EASY', ratingValue: Rating.Easy, label: 'Muito fácil', shortcut: '4' },
  ];

  const recordMap = schedulingRecord as unknown as Record<number, RecordLogItem>;

  return mappings.map((m) => {
    const item = recordMap[m.ratingValue];
    const nextDue = item.card.due;
    return {
      rating: m.rating,
      ratingValue: m.ratingValue,
      label: m.label,
      shortcut: m.shortcut,
      intervalText: formatIntervalPreview(nextDue, now),
      nextDue,
    };
  });
}

export function processReview(
  card: Card,
  rating: Rating,
  desiredRetention: number = 0.90,
  now: Date = new Date()
): RecordLogItem {
  const f = getFsrsInstance(desiredRetention);
  const schedulingRecord = f.repeat(card, now) as unknown as Record<number, RecordLogItem>;
  return schedulingRecord[rating];
}

/**
 * Priority-Aware Spaced Repetition Ordering
 * FSRS decides when cards are due.
 * The system orders cards that are ALREADY DUE:
 * 1. Error cards (card_type === 'ERROR')
 * 2. Topic priority === HIGH
 * 3. Lowest stability (most fragile memory)
 * 4. Largest overdue delay
 * 5. Topic priority === MEDIUM
 * 6. Topic priority === LOW
 */
export function sortDueCards(cards: CardWithMetadata[], now: Date = new Date()): CardWithMetadata[] {
  return [...cards].sort((a, b) => {
    // 1. Error cards first
    const aIsError = a.card_type === 'ERROR' ? 1 : 0;
    const bIsError = b.card_type === 'ERROR' ? 1 : 0;
    if (aIsError !== bIsError) {
      return bIsError - aIsError;
    }

    // 2. Exam priority weight
    const priorityWeight = (p: string) => (p === 'HIGH' ? 3 : p === 'MEDIUM' ? 2 : 1);
    const aPriority = priorityWeight(a.exam_priority) + (a.priority_boost || 0);
    const bPriority = priorityWeight(b.exam_priority) + (b.priority_boost || 0);
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    // 3. Lowest stability (fragile memory gets addressed first)
    const aStability = a.fsrs_state?.stability ?? 0;
    const bStability = b.fsrs_state?.stability ?? 0;
    if (aStability !== bStability) {
      return aStability - bStability;
    }

    // 4. Overdue delay (most overdue first)
    const aDue = a.fsrs_state?.due ? new Date(a.fsrs_state.due).getTime() : now.getTime();
    const bDue = b.fsrs_state?.due ? new Date(b.fsrs_state.due).getTime() : now.getTime();
    return aDue - bDue;
  });
}
