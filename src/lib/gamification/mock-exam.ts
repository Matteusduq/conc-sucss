import { MockExam, MockExamType, P1_MIN_POINTS, P2_MIN_POINTS, OBJECTIVE_TOTAL_MIN_POINTS } from '@/types/database';

export interface MockExamInput {
  p1_correct: number;
  p1_wrong: number;
  p1_blank: number;
  p2_correct: number;
  p2_wrong: number;
  p2_blank: number;
  type?: MockExamType;
  duration_seconds?: number | null;
  notes?: string | null;
  performed_at?: string;
  user_id?: string;
  exam_id?: string;
}

export interface MockExamEvaluation {
  p1_correct: number;
  p1_wrong: number;
  p1_blank: number;
  p1_total: number;
  p1_net: number;
  p1_min_points: number;
  isP1AboveMinimum: boolean;

  p2_correct: number;
  p2_wrong: number;
  p2_blank: number;
  p2_total: number;
  p2_net: number;
  p2_min_points: number;
  isP2AboveMinimum: boolean;

  total_questions: number;
  total_correct: number;
  total_wrong: number;
  total_blank: number;
  net_points: number;
  objective_total_min_points: number;
  isTotalAboveMinimum: boolean;

  isAboveEliminatoryThreshold: boolean;
  statusLabel: string;
  statusDescription: string;
}

/**
 * Calculates Cebraspe net points and evaluates official edital eliminatory thresholds.
 * Official thresholds:
 * - P1 net points >= 18
 * - P2 net points >= 27
 * - Total net points >= 54
 */
export function calculateMockExamScore(input: MockExamInput): MockExamEvaluation {
  const p1_correct = Math.max(0, input.p1_correct || 0);
  const p1_wrong = Math.max(0, input.p1_wrong || 0);
  const p1_blank = Math.max(0, input.p1_blank || 0);
  const p1_total = p1_correct + p1_wrong + p1_blank;
  const p1_net = p1_correct - p1_wrong;
  const isP1AboveMinimum = p1_net >= P1_MIN_POINTS;

  const p2_correct = Math.max(0, input.p2_correct || 0);
  const p2_wrong = Math.max(0, input.p2_wrong || 0);
  const p2_blank = Math.max(0, input.p2_blank || 0);
  const p2_total = p2_correct + p2_wrong + p2_blank;
  const p2_net = p2_correct - p2_wrong;
  const isP2AboveMinimum = p2_net >= P2_MIN_POINTS;

  const total_correct = p1_correct + p2_correct;
  const total_wrong = p1_wrong + p2_wrong;
  const total_blank = p1_blank + p2_blank;
  const total_questions = p1_total + p2_total;
  const net_points = p1_net + p2_net;
  const isTotalAboveMinimum = net_points >= OBJECTIVE_TOTAL_MIN_POINTS;

  const isAboveEliminatoryThreshold = isP1AboveMinimum && isP2AboveMinimum && isTotalAboveMinimum;

  let statusLabel: string;
  let statusDescription: string;

  if (isAboveEliminatoryThreshold) {
    statusLabel = 'Acima do mínimo eliminatório do edital';
    statusDescription =
      'Seu desempenho atingiu os critérios mínimos eliminatórios do Edital nº 1/2026 (P1 >= 18, P2 >= 27 e Total >= 54). Lembre-se: atingir o corte elimina a desclassificação imediata, mas a classificação final depende da pontuação competitiva e da prova discursiva (P3).';
  } else {
    statusLabel = 'Abaixo do mínimo eliminatório do edital';
    const deficiencies: string[] = [];
    if (!isP1AboveMinimum) deficiencies.push(`P1 líquida (${p1_net} < 18)`);
    if (!isP2AboveMinimum) deficiencies.push(`P2 líquida (${p2_net} < 27)`);
    if (!isTotalAboveMinimum) deficiencies.push(`Total líquido (${net_points} < 54)`);
    statusDescription = `Abaixo dos critérios mínimos eliminatórios em: ${deficiencies.join(', ')}. No modelo Cebraspe, cada erro anula um acerto. Analise os chutes com cautela.`;
  }

  return {
    p1_correct,
    p1_wrong,
    p1_blank,
    p1_total,
    p1_net,
    p1_min_points: P1_MIN_POINTS,
    isP1AboveMinimum,

    p2_correct,
    p2_wrong,
    p2_blank,
    p2_total,
    p2_net,
    p2_min_points: P2_MIN_POINTS,
    isP2AboveMinimum,

    total_questions,
    total_correct,
    total_wrong,
    total_blank,
    net_points,
    objective_total_min_points: OBJECTIVE_TOTAL_MIN_POINTS,
    isTotalAboveMinimum,

    isAboveEliminatoryThreshold,
    statusLabel,
    statusDescription,
  };
}

/**
 * Builds a structured MockExam object from input.
 */
export function buildMockExamRecord(
  input: MockExamInput,
  id: string = `mock-${Date.now()}`
): MockExam {
  const evalResult = calculateMockExamScore(input);

  return {
    id,
    user_id: input.user_id || 'local-user',
    exam_id: input.exam_id || 'exam-camara-2027',
    type: input.type || 'WEEKLY_CHECKPOINT',
    performed_at: input.performed_at || new Date().toISOString(),
    total_questions: evalResult.total_questions,
    correct: evalResult.total_correct,
    wrong: evalResult.total_wrong,
    blank: evalResult.total_blank,
    net_points: evalResult.net_points,
    p1_correct: evalResult.p1_correct,
    p1_wrong: evalResult.p1_wrong,
    p1_blank: evalResult.p1_blank,
    p1_net: evalResult.p1_net,
    p2_correct: evalResult.p2_correct,
    p2_wrong: evalResult.p2_wrong,
    p2_blank: evalResult.p2_blank,
    p2_net: evalResult.p2_net,
    duration_seconds: input.duration_seconds || null,
    notes: input.notes || null,
    created_at: new Date().toISOString(),
  };
}

export interface WeeklyBossQualificationResult {
  qualifies: boolean;
  missingP1: number;
  missingP2: number;
  missingTotal: number;
  reason?: string;
}

/**
 * Detailed evaluation of whether a given mock exam qualifies to defeat the Weekly Boss of a journey phase.
 */
export function evaluateWeeklyBossQualification(
  mock: MockExam,
  bossRecommendation: {
    targetQuestions: number;
    p1Target: number;
    p2Target: number;
  }
): WeeklyBossQualificationResult {
  const p1Total = (mock.p1_correct ?? 0) + (mock.p1_wrong ?? 0) + (mock.p1_blank ?? 0);
  const p2Total = (mock.p2_correct ?? 0) + (mock.p2_wrong ?? 0) + (mock.p2_blank ?? 0);
  const total = mock.total_questions || (p1Total + p2Total);

  if (mock.type === 'FULL_MOCK') {
    const missingP1 = Math.max(0, 90 - p1Total);
    const missingP2 = Math.max(0, 90 - p2Total);
    const missingTotal = Math.max(0, 180 - total);
    const qualifies = p1Total === 90 && p2Total === 90 && total === 180;
    return {
      qualifies,
      missingP1,
      missingP2,
      missingTotal,
      reason: qualifies
        ? undefined
        : `Simulado registrado, mas não completou o Checkpoint Semanal. Faltaram ${missingP1} itens de P1 e ${missingP2} itens de P2.`,
    };
  }

  const missingP1 = Math.max(0, bossRecommendation.p1Target - p1Total);
  const missingP2 = Math.max(0, bossRecommendation.p2Target - p2Total);
  const missingTotal = Math.max(0, bossRecommendation.targetQuestions - total);
  const qualifies = missingP1 === 0 && missingP2 === 0 && missingTotal === 0;

  return {
    qualifies,
    missingP1,
    missingP2,
    missingTotal,
    reason: qualifies
      ? undefined
      : `Simulado registrado, mas não completou o Checkpoint Semanal. Faltaram ${missingP1} itens de P1 e ${missingP2} itens de P2.`,
  };
}

/**
 * Validates whether a given mock exam qualifies to defeat the Weekly Boss of a journey phase.
 * Rules:
 * - FULL_MOCK must have exactly 90 P1 items and 90 P2 items (total 180).
 * - WEEKLY_CHECKPOINT / PARTIAL_MOCK must meet or exceed phase target: total_questions, p1Target, and p2Target.
 */
export function qualifiesForWeeklyBoss(
  mock: MockExam,
  bossRecommendation: {
    targetQuestions: number;
    p1Target: number;
    p2Target: number;
  }
): boolean {
  return evaluateWeeklyBossQualification(mock, bossRecommendation).qualifies;
}

