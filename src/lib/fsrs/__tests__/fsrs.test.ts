import { describe, it, expect } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import {
  createInitialFsrsCard,
  getScheduledIntervals,
  processReview,
  sortDueCards,
} from '../scheduler';
import { CardWithMetadata } from '../types';

describe('FSRS Scheduling and Priority-Aware Card Ordering', () => {
  it('creates an empty initial FSRS card in New state', () => {
    const card = createInitialFsrsCard();
    expect(card.state).toBe(State.New);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it('calculates intervals for all 4 ratings in Portuguese', () => {
    const card = createInitialFsrsCard();
    const intervals = getScheduledIntervals(card, 0.90);

    expect(intervals).toHaveLength(4);
    expect(intervals[0].label).toBe('Errei');
    expect(intervals[0].shortcut).toBe('1');
    expect(intervals[1].label).toBe('Difícil');
    expect(intervals[1].shortcut).toBe('2');
    expect(intervals[2].label).toBe('Acertei');
    expect(intervals[2].shortcut).toBe('3');
    expect(intervals[3].label).toBe('Muito fácil');
    expect(intervals[3].shortcut).toBe('4');

    // Interval strings are formatted
    expect(intervals[0].intervalText).toBeDefined();
    expect(intervals[2].intervalText).toBeDefined();
  });

  it('advances card state upon review', () => {
    const card = createInitialFsrsCard();
    const reviewResult = processReview(card, Rating.Good, 0.90);

    expect(reviewResult.card.reps).toBe(1);
    expect(reviewResult.card.stability).toBeGreaterThan(0);
    expect(reviewResult.card.due.getTime()).toBeGreaterThan(Date.now());
  });

  it('orders due cards with Priority-Aware algorithm: ERROR cards first, then HIGH priority', () => {
    const now = new Date('2026-10-14T10:00:00Z');

    const cardHighContent: CardWithMetadata = {
      id: 'c1',
      front: 'Front 1',
      back: 'Back 1',
      card_type: 'CONTENT',
      topic_id: 't1',
      exam_priority: 'HIGH',
      priority_boost: 0,
      fsrs_state: {
        due: '2026-10-14T08:00:00Z',
        stability: 3.5,
        difficulty: 3,
        elapsed_days: 2,
        scheduled_days: 2,
        learning_steps: 1,
        reps: 2,
        lapses: 0,
        state: 2,
        last_review: '2026-10-12T08:00:00Z',
      },
    };

    const cardLowError: CardWithMetadata = {
      id: 'c2',
      front: 'Front 2',
      back: 'Back 2',
      card_type: 'ERROR', // Caderno de erros card
      topic_id: 't2',
      exam_priority: 'LOW',
      priority_boost: 0,
      fsrs_state: {
        due: '2026-10-14T09:00:00Z',
        stability: 1.0,
        difficulty: 5,
        elapsed_days: 1,
        scheduled_days: 1,
        learning_steps: 1,
        reps: 1,
        lapses: 0,
        state: 1,
        last_review: '2026-10-13T09:00:00Z',
      },
    };

    const cardLowContent: CardWithMetadata = {
      id: 'c3',
      front: 'Front 3',
      back: 'Back 3',
      card_type: 'CONTENT',
      topic_id: 't3',
      exam_priority: 'LOW',
      priority_boost: 0,
      fsrs_state: {
        due: '2026-10-14T07:00:00Z',
        stability: 5.0,
        difficulty: 2,
        elapsed_days: 5,
        scheduled_days: 5,
        learning_steps: 1,
        reps: 3,
        lapses: 0,
        state: 2,
        last_review: '2026-10-09T07:00:00Z',
      },
    };

    const sorted = sortDueCards([cardLowContent, cardHighContent, cardLowError], now);

    // cardLowError MUST be first because it is an ERROR card
    expect(sorted[0].id).toBe('c2');
    // cardHighContent MUST be second because exam_priority is HIGH
    expect(sorted[1].id).toBe('c1');
    // cardLowContent MUST be last
    expect(sorted[2].id).toBe('c3');
  });
});
