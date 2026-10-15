// Study Score Engine: "O que estudar agora?"

import { Priority, TopicStatus, DomainConfidence, QuestionSession, Topic } from '@/types/database';
import { StudyScoreResult } from '@/types/study';

export interface StudyScoreInputs {
  priority: Priority;
  domainScore?: number | null;
  domainConfidence?: DomainConfidence | null;
  status: TopicStatus;
  overdueCardsCount?: number;
  recentSessions?: QuestionSession[];
  lastStudiedAt?: string | null;
  awaitingQuestionsSinceDays?: number;
  examBlockCode?: 'P1' | 'P2' | null;
  discursiveEligible?: boolean;
  discursiveSynergy?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
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
  const masteryGap = getMasteryGap(inputs.domainScore ?? null);
  const stageUrgency = getStageUrgency(inputs.status, inputs.priority);
  const confidenceGap = getConfidenceGap(inputs.domainConfidence ?? null);

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
  const currentDomain = inputs.domainScore ?? null;
  if (inputs.priority === 'HIGH' && (currentDomain === null || currentDomain < 60)) {
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

  // Booster 6 (Estratégico Normativo): +3 se Conhecimento Específico (P2)
  // Motivo: 90 itens com mínimo mais alto (27 pts vs 18 pts) e critério primário de desempate
  if (inputs.examBlockCode === 'P2') {
    boostersApplied.push({ name: 'Relevância estratégica do bloco específico (P2)', value: 3 });
    totalBoost += 3;
  }

  // Booster 7 (Sinergia Discursiva P3): +3 para HIGH, +2 para MEDIUM, +1 para elegível
  // Motivo: A prova P3 (60 pts) cobra conhecimentos específicos do Cargo 11
  if (inputs.discursiveSynergy === 'HIGH') {
    boostersApplied.push({ name: 'Alta sinergia com a prova discursiva e peça técnica (P3)', value: 3 });
    totalBoost += 3;
  } else if (inputs.discursiveSynergy === 'MEDIUM') {
    boostersApplied.push({ name: 'Média sinergia com a prova discursiva (P3)', value: 2 });
    totalBoost += 2;
  } else if (inputs.discursiveEligible && inputs.examBlockCode === 'P2') {
    boostersApplied.push({ name: 'Conteúdo elegível para a prova discursiva (P3)', value: 1 });
    totalBoost += 1;
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

/**
 * Deterministic Comparator for Study Queue and Ranking.
 * Follows the 8 explicit tie-breaking criteria in order:
 * 1. Situação de risco (AT_RISK > AWAITING_QUESTIONS > NOT_STARTED/LEARNING > CONSOLIDATING > MAINTENANCE > MASTERED)
 * 2. Prioridade pedagógica (HIGH > MEDIUM > LOW)
 * 3. Sinergia com P3 (HIGH > MEDIUM > LOW/eligible > none)
 * 4. Relevância estratégica do bloco (P2 > P1)
 * 5. Menor domínio / menor confiança (maior deficiência vem primeiro)
 * 6. Menor cobertura (NOT_STARTED precede tópicos parcialmente estudados)
 * 7. Tempo sem estudar (last_studied_at mais antigo ou nunca estudado vem primeiro)
 * 8. Identificador / display_order (último desempate técnico determinístico)
 */
export function compareTopicsForQueue(a: Topic, b: Topic): number {
  // 0. Primary: Study Score (descending)
  const scoreDiff = (b.study_score ?? 0) - (a.study_score ?? 0);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  // 1. Situação de risco
  const getRiskWeight = (status: TopicStatus): number => {
    switch (status) {
      case 'AT_RISK':
        return 6;
      case 'AWAITING_QUESTIONS':
        return 5;
      case 'NOT_STARTED':
        return 4;
      case 'LEARNING':
        return 3;
      case 'CONSOLIDATING':
        return 2;
      case 'MAINTENANCE':
        return 1;
      case 'MASTERED':
        return 0;
      default:
        return 3;
    }
  };
  const riskDiff = getRiskWeight(b.status) - getRiskWeight(a.status);
  if (riskDiff !== 0) {
    return riskDiff;
  }

  // 2. Prioridade pedagógica (HIGH > MEDIUM > LOW)
  const getPriorityWeight = (priority: Priority): number => {
    switch (priority) {
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'LOW':
        return 1;
      default:
        return 0;
    }
  };
  const prioDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  if (prioDiff !== 0) {
    return prioDiff;
  }

  // 3. Sinergia com P3
  const getDiscursiveWeight = (t: Topic): number => {
    if (t.discursive_synergy === 'HIGH') return 4;
    if (t.discursive_synergy === 'MEDIUM') return 3;
    if (t.discursive_synergy === 'LOW') return 2;
    if (t.discursive_eligible) return 1;
    return 0;
  };
  const discDiff = getDiscursiveWeight(b) - getDiscursiveWeight(a);
  if (discDiff !== 0) {
    return discDiff;
  }

  // 4. Relevância estratégica do bloco (P2 > P1)
  const getBlockWeight = (block?: string | null): number => {
    if (block === 'P2') return 2;
    if (block === 'P1') return 1;
    return 0;
  };
  const blockDiff = getBlockWeight(b.exam_block_code) - getBlockWeight(a.exam_block_code);
  if (blockDiff !== 0) {
    return blockDiff;
  }

  // 5. Menor domínio / menor confiança (maior deficiência requer atenção prioritária)
  const domainA = a.domain_score ?? 0;
  const domainB = b.domain_score ?? 0;
  if (domainA !== domainB) {
    return domainA - domainB; // Menor domínio vem primeiro
  }

  const getConfidenceWeight = (conf: DomainConfidence | null): number => {
    switch (conf) {
      case 'LOW':
        return 1;
      case 'MEDIUM':
        return 2;
      case 'HIGH':
        return 3;
      default:
        return 0; // null/não avaliado = menor confiança
    }
  };
  const confDiff = getConfidenceWeight(a.domain_confidence) - getConfidenceWeight(b.domain_confidence);
  if (confDiff !== 0) {
    return confDiff; // Menor confiança vem primeiro
  }

  // 6. Menor cobertura (NOT_STARTED precede tópicos com progresso prévio)
  if (a.status === 'NOT_STARTED' && b.status !== 'NOT_STARTED') return -1;
  if (b.status === 'NOT_STARTED' && a.status !== 'NOT_STARTED') return 1;

  // 7. Tempo sem estudar (last_studied_at mais antigo ou nulo tem prioridade)
  const timeA = a.last_studied_at ? new Date(a.last_studied_at).getTime() : 0;
  const timeB = b.last_studied_at ? new Date(b.last_studied_at).getTime() : 0;
  if (timeA !== timeB) {
    return timeA - timeB; // Mais antigo vem primeiro
  }

  // 8. Identificador / display_order (último desempate técnico determinístico)
  const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
  if (orderDiff !== 0) {
    return orderDiff;
  }

  return a.id.localeCompare(b.id);
}

/**
 * Returns 2-4 concrete factual factors that justify why a topic was placed in the strategic queue.
 */
export function getTopicStrategicFactors(topic: Topic): string[] {
  const factors: string[] = [];

  if (topic.priority === 'HIGH') {
    factors.push('Alta prioridade pedagógica no edital (peso 3.0)');
  } else if (topic.priority === 'MEDIUM') {
    factors.push('Prioridade intermediária no edital (peso 2.0)');
  } else {
    factors.push('Prioridade complementar (peso 1.0)');
  }

  if (topic.exam_block_code === 'P2') {
    factors.push('Conhecimento específico (P2) — 90 itens, corte de 27 pts e critério primário de desempate');
  } else {
    factors.push('Conhecimento básico (P1) — 90 itens e corte eliminatório mínimo de 18 pontos');
  }

  if (topic.discursive_synergy === 'HIGH') {
    factors.push('Alta sinergia com a Prova Discursiva (P3 — 2 questões e 1 peça técnica)');
  } else if (topic.discursive_synergy === 'MEDIUM') {
    factors.push('Sinergia moderada com a Prova Discursiva (P3)');
  } else if (topic.discursive_eligible) {
    factors.push('Conteúdo elegível para cobrança na Prova Discursiva (P3)');
  }

  if (topic.status === 'NOT_STARTED') {
    factors.push('Tópico ainda não iniciado — oportunidade máxima para construir domínio inicial');
  } else if (topic.status === 'AT_RISK') {
    factors.push('Tópico classificado em risco — prioridade urgente de recuperação');
  } else if (topic.status === 'AWAITING_QUESTIONS') {
    factors.push('Teoria finalizada — pendente validação prática imediata no TEC Concursos');
  } else if (topic.status === 'CONSOLIDATING') {
    factors.push('Em fase de consolidação — meta de atingir 85% de acurácia líquida');
  }

  return factors;
}

/**
 * Computes deterministic initial StudyScores for a list of topics.
 */
export function computeInitialStudyScores(topics: Topic[]): Topic[] {
  return topics.map((t) => {
    const res = calculateStudyScore({
      priority: t.priority,
      domainScore: t.domain_score,
      domainConfidence: t.domain_confidence,
      status: t.status,
      lastStudiedAt: t.last_studied_at,
      examBlockCode: t.exam_block_code,
      discursiveEligible: t.discursive_eligible,
      discursiveSynergy: t.discursive_synergy,
    });
    return {
      ...t,
      study_score: res.studyScore,
    };
  });
}
