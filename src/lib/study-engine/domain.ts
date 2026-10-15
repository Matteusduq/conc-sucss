// Domain Calculation and Status Transition Engine

import { QuestionSession, TopicStatus, DomainConfidence, Priority } from '@/types/database';
import { DomainBand, DomainCalculationResult } from '@/types/study';

export function calculateAccuracyRate(correct: number, wrong: number): number {
  const answered = correct + wrong;
  if (answered <= 0) return 0;
  return correct / answered;
}

export function calculateNetPoints(correct: number, wrong: number): number {
  return correct - wrong;
}

export function calculateNetRate(correct: number, wrong: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return calculateNetPoints(correct, wrong) / totalQuestions;
}

export function calculateCebraspeSessionPerformance(
  correct: number,
  wrong: number,
  totalQuestions: number
): number {
  const accuracyRate = calculateAccuracyRate(correct, wrong);
  const accuracyComponent = accuracyRate * 100;

  const netRate = calculateNetRate(correct, wrong, totalQuestions);
  // Normalizes Cebraspe netRate (-1 to +1) to (0 to 100)
  const cebraspeNetComponent = ((netRate + 1) / 2) * 100;

  return accuracyComponent * 0.45 + cebraspeNetComponent * 0.55;
}

export function calculateAggregatePerformance(sessions: QuestionSession[]): number | null {
  if (!sessions || sessions.length === 0) return null;

  // Sort sessions chronologically (oldest to newest)
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
  );

  let totalWeightedScore = 0;
  let totalWeight = 0;

  sorted.forEach((session, idx) => {
    // Recent sessions get higher weights: linearly from 1 to 2
    const weight = 1 + (idx / Math.max(1, sorted.length - 1));
    const score = calculateCebraspeSessionPerformance(
      session.correct,
      session.wrong,
      session.total_questions
    );
    totalWeightedScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalWeightedScore / totalWeight : null;
}

export function calculateDomainConfidence(sessions: QuestionSession[]): DomainConfidence {
  if (!sessions || sessions.length === 0) return 'LOW';

  const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
  const distinctDays = new Set(
    sessions.map((s) => new Date(s.performed_at).toISOString().split('T')[0])
  ).size;

  if (totalQuestions >= 80 && distinctDays >= 3) {
    return 'HIGH';
  }
  if (totalQuestions >= 20 && distinctDays >= 2) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export function calculateRecencyScore(sessions: QuestionSession[]): number {
  if (!sessions || sessions.length <= 1) return 100;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
  );

  // Historical = all but last 2
  const recentSessions = sorted.slice(-2);
  const historicalSessions = sorted.slice(0, -2);

  if (historicalSessions.length === 0) return 100;

  const historicalPerf = calculateAggregatePerformance(historicalSessions) ?? 100;
  const recentPerf = calculateAggregatePerformance(recentSessions) ?? 100;

  const drop = historicalPerf - recentPerf;

  if (drop <= 0) return 100; // Recent >= Historical
  if (drop <= 8) return 75;  // Mild drop
  if (drop <= 18) return 50; // Relevant drop
  return 25;                 // Severe drop
}

export function getDomainBand(score: number): DomainBand {
  if (score < 40) return 'FRACO';
  if (score < 60) return 'EM_CONSTRUCAO';
  if (score < 75) return 'RAZOAVEL';
  if (score < 85) return 'BOM';
  if (score < 95) return 'DOMINADO';
  return 'DOMINIO_ALTO';
}

export interface DomainCalculationParams {
  sessions: QuestionSession[];
  retentionRate?: number | null; // 0 - 100
  coveragePercent?: number;       // 0 - 100
}

export function calculateTopicDomain(params: DomainCalculationParams): DomainCalculationResult {
  const { sessions, retentionRate, coveragePercent = 0 } = params;

  const performanceScore = calculateAggregatePerformance(sessions);
  const retentionScore = typeof retentionRate === 'number' && !isNaN(retentionRate) ? retentionRate : null;
  const recencyScore = calculateRecencyScore(sessions);
  const coverageScore = Math.min(100, Math.max(0, coveragePercent));

  // Base weights:
  // performance: 0.50, retention: 0.25, recency: 0.15, coverage: 0.10
  const availableWeights: {
    performance: number;
    retention: number;
    recency: number;
    coverage: number;
  } = {
    performance: performanceScore !== null ? 0.50 : 0,
    retention: retentionScore !== null ? 0.25 : 0,
    recency: 0.15,
    coverage: 0.10,
  };

  const totalAvailableWeight =
    availableWeights.performance +
    availableWeights.retention +
    availableWeights.recency +
    availableWeights.coverage;

  const normalizedWeights = {
    performance: totalAvailableWeight > 0 ? availableWeights.performance / totalAvailableWeight : 0,
    retention: totalAvailableWeight > 0 ? availableWeights.retention / totalAvailableWeight : 0,
    recency: totalAvailableWeight > 0 ? availableWeights.recency / totalAvailableWeight : 0,
    coverage: totalAvailableWeight > 0 ? availableWeights.coverage / totalAvailableWeight : 0,
  };

  const domainScore = Math.round(
    (performanceScore !== null ? performanceScore * normalizedWeights.performance : 0) +
    (retentionScore !== null ? retentionScore * normalizedWeights.retention : 0) +
    recencyScore * normalizedWeights.recency +
    coverageScore * normalizedWeights.coverage
  );

  const totalQuestions = sessions ? sessions.reduce((acc, s) => acc + s.total_questions, 0) : 0;
  const sampleFactor = Math.min(1, totalQuestions / 80);
  const domainConfidence = calculateDomainConfidence(sessions);
  const domainBand = getDomainBand(domainScore);

  return {
    domainScore: Math.min(100, Math.max(0, domainScore)),
    domainConfidence,
    domainBand,
    components: {
      performanceScore,
      retentionScore,
      recencyScore,
      coverageScore,
    },
    weightsUsed: normalizedWeights,
    sampleFactor,
  };
}

export interface TransitionStatusParams {
  currentStatus: TopicStatus;
  priority: Priority;
  materialOpened: boolean;
  materialCompleted: boolean;
  sessions: QuestionSession[];
  domainScore: number | null;
  domainConfidence: DomainConfidence | null;
  overdueFlashcardsCount?: number;
}

export function evaluateTopicStatus(params: TransitionStatusParams): TopicStatus {
  const {
    currentStatus,
    priority,
    materialOpened,
    materialCompleted,
    sessions,
    domainScore,
    domainConfidence,
    overdueFlashcardsCount = 0,
  } = params;

  // 1. AT_RISK checks
  if (sessions && sessions.length > 0) {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
    );
    const recent = sorted.slice(-2);
    const recentPerf = calculateAggregatePerformance(recent) ?? 100;
    const historicalPerf = calculateAggregatePerformance(sorted.slice(0, -2)) ?? recentPerf;

    const recentDrop = historicalPerf - recentPerf;

    if (priority === 'HIGH' && recentPerf < 65) {
      return 'AT_RISK';
    }
    if (recentDrop >= 15) {
      return 'AT_RISK';
    }
    if (overdueFlashcardsCount >= 8 && priority === 'HIGH') {
      return 'AT_RISK';
    }
  }

  // 2. Progression transitions
  if (currentStatus === 'NOT_STARTED') {
    if (materialCompleted) return 'AWAITING_QUESTIONS';
    if (materialOpened) return 'LEARNING';
    return 'NOT_STARTED';
  }

  if (currentStatus === 'LEARNING') {
    if (materialCompleted) {
      if (sessions && sessions.length > 0) return 'CONSOLIDATING';
      return 'AWAITING_QUESTIONS';
    }
    return 'LEARNING';
  }

  if (currentStatus === 'AWAITING_QUESTIONS') {
    if (sessions && sessions.length > 0) {
      return 'CONSOLIDATING';
    }
    return 'AWAITING_QUESTIONS';
  }

  if (currentStatus === 'CONSOLIDATING') {
    if (
      domainScore !== null &&
      domainScore >= 85 &&
      domainConfidence &&
      domainConfidence !== 'LOW'
    ) {
      return 'MASTERED';
    }
    return 'CONSOLIDATING';
  }

  if (currentStatus === 'MASTERED') {
    if (domainScore !== null && domainScore >= 85) {
      return 'MAINTENANCE';
    }
    if (domainScore !== null && domainScore < 85) {
      return 'CONSOLIDATING';
    }
    return 'MASTERED';
  }

  return currentStatus;
}
