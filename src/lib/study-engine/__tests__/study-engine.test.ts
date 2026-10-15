import { describe, it, expect } from 'vitest';
import {
  calculateAccuracyRate,
  calculateNetPoints,
  calculateNetRate,
  calculateCebraspeSessionPerformance,
  calculateDomainConfidence,
  calculateTopicDomain,
  evaluateTopicStatus,
} from '../domain';
import { calculateStudyScore } from '../study-score';
import { QuestionSession } from '@/types/database';

describe('1. Accuracy Rate & Cebraspe Net Calculations', () => {
  it('calculates accuracy_rate correctly', () => {
    expect(calculateAccuracyRate(70, 30)).toBe(0.7);
    expect(calculateAccuracyRate(0, 0)).toBe(0);
    expect(calculateAccuracyRate(10, 0)).toBe(1);
  });

  it('calculates net_points correctly for Cebraspe (1 wrong cancels 1 right)', () => {
    // 70 right, 20 wrong, 10 blank -> 70 - 20 = 50 net points
    expect(calculateNetPoints(70, 20)).toBe(50);
    expect(calculateNetPoints(10, 15)).toBe(-5);
  });

  it('calculates net_rate correctly', () => {
    // 50 net points / 100 questions = 0.50
    expect(calculateNetRate(70, 20, 100)).toBe(0.5);
    expect(calculateNetRate(50, 50, 100)).toBe(0);
  });

  it('calculates Cebraspe session performance balanced between accuracy and net rate', () => {
    const perf = calculateCebraspeSessionPerformance(70, 20, 100);
    // accuracy = 70/90 = 77.77%
    // netRate = 50/100 = 0.50 -> normalized = ((0.50 + 1) / 2) * 100 = 75%
    // score = 77.77 * 0.45 + 75 * 0.55 = 35 + 41.25 = 76.25
    expect(perf).toBeGreaterThan(70);
    expect(perf).toBeLessThan(80);
  });

  it('validates total questions sum constraint: correct + wrong + blank = total', () => {
    const total = 100;
    const correct = 65;
    const wrong = 25;
    const blank = 10;
    expect(correct + wrong + blank).toBe(total);
  });
});

describe('2. Domain Score & Weight Redistribution', () => {
  const mockSessions: QuestionSession[] = [
    {
      id: 's1',
      user_id: 'u1',
      exam_id: 'e1',
      subject_id: 'sub1',
      topic_id: 'top1',
      performed_at: '2026-10-01T10:00:00Z',
      total_questions: 30,
      correct: 25,
      wrong: 5,
      blank: 0,
      duration_seconds: 1800,
      subjective_feeling: 'REASONABLE',
      notes: null,
      accuracy_rate: 0.833,
      net_points: 20,
      net_rate: 0.667,
      had_conceptual_error: false,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
    },
    {
      id: 's2',
      user_id: 'u1',
      exam_id: 'e1',
      subject_id: 'sub1',
      topic_id: 'top1',
      performed_at: '2026-10-03T10:00:00Z',
      total_questions: 30,
      correct: 27,
      wrong: 3,
      blank: 0,
      duration_seconds: 1800,
      subjective_feeling: 'MASTERED',
      notes: null,
      accuracy_rate: 0.9,
      net_points: 24,
      net_rate: 0.8,
      had_conceptual_error: false,
      created_at: '2026-10-03T10:00:00Z',
      updated_at: '2026-10-03T10:00:00Z',
    },
  ];

  it('calculates domain score when all components exist', () => {
    const result = calculateTopicDomain({
      sessions: mockSessions,
      retentionRate: 90,
      coveragePercent: 100,
    });

    expect(result.domainScore).toBeGreaterThan(70);
    expect(result.components.performanceScore).not.toBeNull();
    expect(result.components.retentionScore).toBe(90);
    expect(result.weightsUsed.performance).toBeCloseTo(0.50);
    expect(result.weightsUsed.retention).toBeCloseTo(0.25);
  });

  it('redistributes weights proportionally when retention component is missing', () => {
    const result = calculateTopicDomain({
      sessions: mockSessions,
      retentionRate: null, // No flashcards yet
      coveragePercent: 100,
    });

    expect(result.components.retentionScore).toBeNull();
    // Sum of available weights = 0.50 + 0.15 + 0.10 = 0.75
    // performance should be 0.50 / 0.75 = 0.6667
    expect(result.weightsUsed.performance).toBeCloseTo(0.50 / 0.75, 2);
    expect(result.weightsUsed.retention).toBe(0);
    expect(result.weightsUsed.recency).toBeCloseTo(0.15 / 0.75, 2);
    expect(result.weightsUsed.coverage).toBeCloseTo(0.10 / 0.75, 2);
  });

  it('redistributes weights when performance is also missing (new topic)', () => {
    const result = calculateTopicDomain({
      sessions: [],
      retentionRate: null,
      coveragePercent: 100,
    });

    expect(result.components.performanceScore).toBeNull();
    expect(result.components.retentionScore).toBeNull();
    // Only recency (0.15) and coverage (0.10) exist -> total 0.25
    expect(result.weightsUsed.coverage).toBeCloseTo(0.10 / 0.25, 2);
    expect(result.weightsUsed.recency).toBeCloseTo(0.15 / 0.25, 2);
  });
});

describe('3. Domain Confidence', () => {
  it('returns LOW confidence for less than 20 questions or single session', () => {
    const session1: QuestionSession = {
      id: '1', user_id: 'u', exam_id: 'e', subject_id: 's', topic_id: 't',
      performed_at: '2026-10-01T10:00:00Z', total_questions: 15, correct: 15, wrong: 0, blank: 0,
      duration_seconds: 600, subjective_feeling: 'MASTERED', notes: null, accuracy_rate: 1, net_points: 15, net_rate: 1, had_conceptual_error: false,
      created_at: '', updated_at: '',
    };
    expect(calculateDomainConfidence([session1])).toBe('LOW');
  });

  it('returns MEDIUM confidence for 20-79 questions with at least 2 distinct days', () => {
    const session1: QuestionSession = {
      id: '1', user_id: 'u', exam_id: 'e', subject_id: 's', topic_id: 't',
      performed_at: '2026-10-01T10:00:00Z', total_questions: 20, correct: 18, wrong: 2, blank: 0,
      duration_seconds: 600, subjective_feeling: 'REASONABLE', notes: null, accuracy_rate: 0.9, net_points: 16, net_rate: 0.8, had_conceptual_error: false,
      created_at: '', updated_at: '',
    };
    const session2: QuestionSession = {
      id: '2', user_id: 'u', exam_id: 'e', subject_id: 's', topic_id: 't',
      performed_at: '2026-10-02T10:00:00Z', total_questions: 20, correct: 18, wrong: 2, blank: 0,
      duration_seconds: 600, subjective_feeling: 'REASONABLE', notes: null, accuracy_rate: 0.9, net_points: 16, net_rate: 0.8, had_conceptual_error: false,
      created_at: '', updated_at: '',
    };
    expect(calculateDomainConfidence([session1, session2])).toBe('MEDIUM');
  });

  it('returns HIGH confidence for 80+ questions with at least 3 distinct days', () => {
    const makeSession = (day: string, q: number): QuestionSession => ({
      id: day, user_id: 'u', exam_id: 'e', subject_id: 's', topic_id: 't',
      performed_at: `2026-10-${day}T10:00:00Z`, total_questions: q, correct: q - 2, wrong: 2, blank: 0,
      duration_seconds: 600, subjective_feeling: 'MASTERED', notes: null, accuracy_rate: 0.9, net_points: q - 4, net_rate: 0.8, had_conceptual_error: false,
      created_at: '', updated_at: '',
    });

    const sessions = [makeSession('01', 30), makeSession('02', 30), makeSession('03', 30)];
    expect(calculateDomainConfidence(sessions)).toBe('HIGH');
  });
});

describe('4. Study Score & Boosters', () => {
  it('calculates base study score and applies boosters', () => {
    const result = calculateStudyScore({
      priority: 'HIGH',
      domainScore: 45,
      domainConfidence: 'LOW',
      status: 'NOT_STARTED',
      overdueCardsCount: 6,
    });

    // High priority (100 * 0.35 = 35)
    // masteryGap (100 - 45 = 55 * 0.30 = 16.5)
    // reviewUrgency with overdue cards
    // stageUrgency for NOT_STARTED HIGH (90 * 0.10 = 9)
    // confidenceGap for LOW (100 * 0.05 = 5)
    // Boosters:
    // +10 (HIGH & domain < 60)
    // +8 (HIGH & NOT_STARTED)
    // +8 (overdue >= 5)
    expect(result.boostersApplied.length).toBeGreaterThanOrEqual(3);
    expect(result.studyScore).toBeGreaterThan(80);
    expect(result.studyScore).toBeLessThanOrEqual(100);
  });

  it('clamps study score between 0 and 100', () => {
    const lowResult = calculateStudyScore({
      priority: 'LOW',
      domainScore: 98,
      domainConfidence: 'HIGH',
      status: 'MASTERED',
      overdueCardsCount: 0,
    });
    expect(lowResult.studyScore).toBeGreaterThanOrEqual(0);
    expect(lowResult.studyScore).toBeLessThan(40);
  });
});

describe('5. Status Transitions', () => {
  it('transitions NOT_STARTED to LEARNING when material opened', () => {
    expect(
      evaluateTopicStatus({
        currentStatus: 'NOT_STARTED',
        priority: 'HIGH',
        materialOpened: true,
        materialCompleted: false,
        sessions: [],
        domainScore: null,
        domainConfidence: null,
      })
    ).toBe('LEARNING');
  });

  it('transitions LEARNING to AWAITING_QUESTIONS when material completed', () => {
    expect(
      evaluateTopicStatus({
        currentStatus: 'LEARNING',
        priority: 'HIGH',
        materialOpened: true,
        materialCompleted: true,
        sessions: [],
        domainScore: null,
        domainConfidence: null,
      })
    ).toBe('AWAITING_QUESTIONS');
  });

  it('transitions AWAITING_QUESTIONS to CONSOLIDATING when first session recorded', () => {
    const session: QuestionSession = {
      id: '1', user_id: 'u', exam_id: 'e', subject_id: 's', topic_id: 't',
      performed_at: '2026-10-01T10:00:00Z', total_questions: 20, correct: 15, wrong: 5, blank: 0,
      duration_seconds: 900, subjective_feeling: 'REASONABLE', notes: null, accuracy_rate: 0.75, net_points: 10, net_rate: 0.5, had_conceptual_error: false,
      created_at: '', updated_at: '',
    };
    expect(
      evaluateTopicStatus({
        currentStatus: 'AWAITING_QUESTIONS',
        priority: 'HIGH',
        materialOpened: true,
        materialCompleted: true,
        sessions: [session],
        domainScore: 60,
        domainConfidence: 'LOW',
      })
    ).toBe('CONSOLIDATING');
  });

  it('transitions CONSOLIDATING to MASTERED only when domain_score >= 85 and confidence is not LOW', () => {
    // Score 88 but LOW confidence -> stays CONSOLIDATING
    expect(
      evaluateTopicStatus({
        currentStatus: 'CONSOLIDATING',
        priority: 'HIGH',
        materialOpened: true,
        materialCompleted: true,
        sessions: [],
        domainScore: 88,
        domainConfidence: 'LOW',
      })
    ).toBe('CONSOLIDATING');

    // Score 88 with MEDIUM confidence -> reaches MASTERED
    expect(
      evaluateTopicStatus({
        currentStatus: 'CONSOLIDATING',
        priority: 'HIGH',
        materialOpened: true,
        materialCompleted: true,
        sessions: [],
        domainScore: 88,
        domainConfidence: 'MEDIUM',
      })
    ).toBe('MASTERED');
  });

  it('transitions to AT_RISK when HIGH priority topic has recent performance < 65', () => {
    const lowPerfSession: QuestionSession = {
      id: '1', user_id: 'u', exam_id: 'e', subject_id: 's', topic_id: 't',
      performed_at: '2026-10-01T10:00:00Z', total_questions: 20, correct: 8, wrong: 12, blank: 0,
      duration_seconds: 900, subjective_feeling: 'VERY_WEAK', notes: null, accuracy_rate: 0.4, net_points: -4, net_rate: -0.2, had_conceptual_error: true,
      created_at: '', updated_at: '',
    };

    expect(
      evaluateTopicStatus({
        currentStatus: 'CONSOLIDATING',
        priority: 'HIGH',
        materialOpened: true,
        materialCompleted: true,
        sessions: [lowPerfSession],
        domainScore: 50,
        domainConfidence: 'LOW',
      })
    ).toBe('AT_RISK');
  });
});
