import { DiscursiveSession, DiscursiveType } from '@/types/database';
import { DiscursiveKPIs } from '@/types/study';

export interface DiscursiveScoreCalculation {
  calculatedScore: number;
  maxScore: number;
  contentScore: number;
  languageDeduction: number;
  effectiveLines: number;
  isValid: boolean;
  errors: string[];
}

/**
 * Calculates official Cebraspe score for discursive tasks:
 *
 * 1. Questão discursiva (até 20 linhas):
 *    NQi = NCi - 3 * NEi / TLi
 *    NCi <= 15, Clamp min 0
 *
 * 2. Peça técnica (até 50 linhas):
 *    NPT = NC - 6 * NE / TL
 *    NC <= 30, Clamp min 0
 */
export function calculateDiscursiveScore(
  type: DiscursiveType,
  contentScore: number,
  languageErrors: number,
  linesWritten: number
): DiscursiveScoreCalculation {
  const errors: string[] = [];

  const maxLines = type === 'QUESTION_20_LINES' ? 20 : 50;
  const maxScore = type === 'QUESTION_20_LINES' ? 15 : 30;
  const penaltyMultiplier = type === 'QUESTION_20_LINES' ? 3 : 6;

  if (contentScore < 0 || contentScore > maxScore) {
    errors.push(`Nota de conteúdo deve estar entre 0 e ${maxScore}.`);
  }

  if (languageErrors < 0) {
    errors.push('Erros de linguagem não podem ser negativos.');
  }

  if (linesWritten < 0 || linesWritten > maxLines) {
    errors.push(`Número de linhas escritas deve estar entre 1 e ${maxLines}.`);
  }

  const safeContent = Math.max(0, Math.min(maxScore, contentScore));
  const safeErrors = Math.max(0, languageErrors);

  let languageDeduction = 0;
  let calculatedScore = 0;

  if (linesWritten > 0) {
    languageDeduction = (penaltyMultiplier * safeErrors) / linesWritten;
    const rawScore = safeContent - languageDeduction;
    calculatedScore = Math.max(0, Number(rawScore.toFixed(3)));
  }

  return {
    calculatedScore,
    maxScore,
    contentScore: safeContent,
    languageDeduction: Number(languageDeduction.toFixed(3)),
    effectiveLines: linesWritten,
    isValid: errors.length === 0,
    errors,
  };
}

export function validateDiscursiveInput(
  type: DiscursiveType,
  contentScore: number,
  languageErrors: number,
  linesWritten: number
): { valid: boolean; errors: string[] } {
  const result = calculateDiscursiveScore(type, contentScore, languageErrors, linesWritten);
  return {
    valid: result.isValid,
    errors: result.errors,
  };
}


export function computeDiscursiveKPIs(sessions: DiscursiveSession[]): DiscursiveKPIs {
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      question20Count: 0,
      technicalPieceCount: 0,
      averageScore: 0,
      totalLinesWritten: 0,
      averageLanguageErrors: 0,
    };
  }

  let q20Count = 0;
  let pieceCount = 0;
  let totalScore = 0;
  let totalLines = 0;
  let totalErrors = 0;

  for (const s of sessions) {
    if (s.type === 'QUESTION_20_LINES') {
      q20Count++;
    } else {
      pieceCount++;
    }
    totalScore += s.calculated_score;
    totalLines += s.lines_written;
    totalErrors += s.language_errors;
  }

  return {
    totalSessions: sessions.length,
    question20Count: q20Count,
    technicalPieceCount: pieceCount,
    averageScore: Number((totalScore / sessions.length).toFixed(2)),
    totalLinesWritten: totalLines,
    averageLanguageErrors: Number((totalErrors / sessions.length).toFixed(2)),
  };
}
