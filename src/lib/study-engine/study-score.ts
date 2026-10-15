// Study Score Engine: "O que estudar agora?"

import { Priority, TopicStatus, DomainConfidence, QuestionSession } from '@/types/database';
import { StudyScoreResult } from '@/types/study';

export interface StudyScoreInputs {
  priority: Priority;
  domainScore: number | null;
  domainConfidence: DomainConfidence | null;
  status: TopicStatus;
  overdueCardsCount?: number;
  recentSessions?: QuestionSession[];
  lastStudiedAt?: string | null;
  awaitingQuestionsSinceDays?: number;
}

export function getPriorityScore(priority: Priority): number {
  switch (priority) {
    case 'HIGH':
      return 100;
    case 'MEDIUM':
      return 65;
    case 'LOW':
      return 35;
    default:
      return 50;
  }
}

export function getMasteryGap(domainScore: number | null): number {
  if (domainScore === null || isNaN(domainScore)) {
    return 70; // Standard default when no domain data exists yet
  }
  return Math.max(0, 100 - domainScore);
}

export function getConfidenceGap(confidence: DomainConfidence | null): number {
  if (!confidence) return 75;
  switch (confidence) {
    case 'LOW':
      return 100;
    case 'MEDIUM':
      return 50;
    case 'HIGH':
      return 10;
    default:
      return 75;
  }
}

export function getStageUrgency(status: TopicStatus, priority: Priority): number {
  switch (status) {
    case 'AT_RISK':
      return 100;
    case 'AWAITING_QUESTIONS':
      return 100;
    case 'NOT_STARTED':
      return priority === 'HIGH' ? 90 : priority === 'MEDIUM' ? 60 : 35;
    case 'LEARNING':
      return 70;
    case 'CONSOLIDATING':
      return 65;
    case 'MAINTENANCE':
      return 35;
    case 'MASTERED':
      return 25;
    default:
      return 50;
  }
}

export function calculateReviewUrgency(params: {
  overdueCardsCount?: number;
  status: TopicStatus;
  lastStudiedAt?: string | null;
  recentLowScore?: boolean;
}): number {
  const { overdueCardsCount = 0, status, lastStudiedAt, recentLowScore = false } = params;

  let urgency = 20;

  if (status === 'AT_RISK') {
    urgency += 45;
  }

  if (overdueCardsCount > 0) {
    urgency += Math.min(40, overdueCardsCount * 8);
  }

  if (recentLowScore) {
    urgency += 25;
  }

  if (lastStudiedAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastStudiedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 14) urgency += 20;
    else if (daysSince > 7) urgency += 10;
  } else {
    // Never studied
    urgency += 15;
  }

  return Math.min(100, Math.max(0, urgency));
}

export function calculateStudyScore(inputs: StudyScoreInputs): StudyScoreResult {
  const priorityScore = getPriorityScore(inputs.priority);
  const masteryGap = getMasteryGap(inputs.domainScore);
  const stageUrgency = getStageUrgency(inputs.status, inputs.priority);
  const confidenceGap = getConfidenceGap(inputs.domainConfidence);

  const hasRecentLowSessions =
    inputs.recentSessions &&
    inputs.recentSessions.length >= 2 &&
    inputs.recentSessions.slice(-2).every((s) => {
      const net = (s.correct - s.wrong) / Math.max(1, s.total_questions);
      return net < 0.2; // roughly < 60% Cebraspe performance
    });

  const reviewUrgency = calculateReviewUrgency({
    overdueCardsCount: inputs.overdueCardsCount,
    status: inputs.status,
    lastStudiedAt: inputs.lastStudiedAt,
    recentLowScore: Boolean(hasRecentLowSessions),
  });

  // Base weighted formula:
  // priority (35%) + masteryGap (30%) + reviewUrgency (20%) + stageUrgency (10%) + confidenceGap (5%)
  const baseScore =
    priorityScore * 0.35 +
    masteryGap * 0.30 +
    reviewUrgency * 0.20 +
    stageUrgency * 0.10 +
    confidenceGap * 0.05;

  const boostersApplied: { name: string; value: number }[] = [];
  let totalBoost = 0;

  // Booster 1: +10 se HIGH e domain_score < 60
  if (inputs.priority === 'HIGH' && (inputs.domainScore === null || inputs.domainScore < 60)) {
    boostersApplied.push({ name: 'Alta prioridade com domínio fraco', value: 10 });
    totalBoost += 10;
  }

  // Booster 2: +10 se duas sessões recentes < 60
  if (hasRecentLowSessions) {
    boostersApplied.push({ name: 'Queda recente em duas sessões consecutivas', value: 10 });
    totalBoost += 10;
  }

  // Booster 3: +8 se HIGH e NOT_STARTED
  if (inputs.priority === 'HIGH' && inputs.status === 'NOT_STARTED') {
    boostersApplied.push({ name: 'Alta prioridade não iniciada', value: 8 });
    totalBoost += 8;
  }

  // Booster 4: +8 se revisão muito atrasada (overdue > 5)
  if ((inputs.overdueCardsCount ?? 0) >= 5) {
    boostersApplied.push({ name: 'Backlog relevante de revisões', value: 8 });
    totalBoost += 8;
  }

  // Booster 5: +5 se AWAITING_QUESTIONS
  if (inputs.status === 'AWAITING_QUESTIONS' && (inputs.awaitingQuestionsSinceDays ?? 1) >= 2) {
    boostersApplied.push({ name: 'Aguardando validação prática no TEC', value: 5 });
    totalBoost += 5;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(baseScore + totalBoost)));

  return {
    studyScore: finalScore,
    breakdown: {
      priorityScore,
      masteryGap,
      reviewUrgency,
      stageUrgency,
      confidenceGap,
    },
    boostersApplied,
  };
}
