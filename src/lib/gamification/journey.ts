import { JourneyPhase, AcademicProgressResult } from './types';
import { Topic, DiscursiveSession } from '@/types/database';

export const COVERAGE_CONSOLIDATION_THRESHOLD = 65; // 65% of topics initiated

export interface JourneyPhaseContext {
  daysUntilExam: number;
  totalTopics: number;
  startedTopics: number;
  masteredTopics: number;
  atRiskTopics: number;
  p1StartedTopics: number;
  p1TotalTopics: number;
  p2StartedTopics: number;
  p2TotalTopics: number;
  averageDomainScore: number;
  totalQuestions: number;
  discursiveSessionsCount: number;
  mockExamsCount: number;
}

export interface JourneyPhaseInfo {
  phase: JourneyPhase;
  phaseNumber: number; // 1 to 4
  title: string;
  tagline: string;
  description: string;
  pedagogicalFocus: string;
  priorities: string[];
  discursiveWeeklyTarget: number;
  weeklyBossRecommendation: {
    targetQuestions: number;
    p1Target: number;
    p2Target: number;
    description: string;
    xpReward: number;
  };
  coveragePercent: number;
  p1CoveragePercent: number;
  p2CoveragePercent: number;
}

/**
 * Deterministically calculates the current journey phase based on
 * days until exam and user's actual progress/coverage.
 */
export function calculateJourneyPhase(context: JourneyPhaseContext): JourneyPhaseInfo {
  const {
    daysUntilExam,
    totalTopics,
    startedTopics,
    p1StartedTopics,
    p1TotalTopics,
    p2StartedTopics,
    p2TotalTopics,
  } = context;

  const coveragePercent = totalTopics > 0 ? Math.round((startedTopics / totalTopics) * 100) : 0;
  const p1CoveragePercent = p1TotalTopics > 0 ? Math.round((p1StartedTopics / p1TotalTopics) * 100) : 0;
  const p2CoveragePercent = p2TotalTopics > 0 ? Math.round((p2StartedTopics / p2TotalTopics) * 100) : 0;

  let phase: JourneyPhase;
  let phaseNumber: number;

  if (daysUntilExam <= 0) {
    phase = 'POST_EXAM';
    phaseNumber = 4;
  } else if (daysUntilExam <= 14) {
    phase = 'FINAL_SPRINT';
    phaseNumber = 4;
  } else if (daysUntilExam >= 15 && daysUntilExam <= 30) {
    phase = 'EXAM_MODE';
    phaseNumber = 3;
  } else if (daysUntilExam <= 60 || coveragePercent >= COVERAGE_CONSOLIDATION_THRESHOLD) {
    phase = 'CONSOLIDATION';
    phaseNumber = 2;
  } else {
    phase = 'BASE';
    phaseNumber = 1;
  }

  const phaseDetails = getPhaseDetails(phase, coveragePercent, p1CoveragePercent, p2CoveragePercent);

  return {
    phase,
    phaseNumber,
    ...phaseDetails,
  };
}

function getPhaseDetails(
  phase: JourneyPhase,
  coveragePercent: number,
  p1CoveragePercent: number,
  p2CoveragePercent: number
) {
  switch (phase) {
    case 'BASE':
      return {
        title: 'Fase A — Base e Cobertura',
        tagline: 'Construção de Fundamentos e Cobertura do Edital',
        description:
          'Contato estruturado com o edital, priorizando tópicos não iniciados de maior StudyScore, materiais didáticos de alta prioridade, primeiras baterias de questões e início gradual de P3.',
        pedagogicalFocus: 'Teoria inicial + Fixação ativa imediata',
        priorities: [
          'Tópicos não iniciados de maior StudyScore (ênfase P2)',
          'Primeiras baterias de questões no modelo Cebraspe',
          'Criação do hábito de FSRS para retenção contínua',
          'Início gradual de P3 (1 oportunidade/semana)',
        ],
        discursiveWeeklyTarget: 1,
        weeklyBossRecommendation: {
          targetQuestions: 30,
          p1Target: 15,
          p2Target: 15,
          description: 'Checkpoint Semanal de Fixação (30 itens: 15 P1 + 15 P2)',
          xpReward: 120,
        },
        coveragePercent,
        p1CoveragePercent,
        p2CoveragePercent,
      };

    case 'CONSOLIDATION':
      return {
        title: 'Fase B — Consolidação',
        tagline: 'Transformando Conteúdo em Desempenho e Domínio',
        description:
          'Transição focada em questões, correção sistemática de erros, revisão FSRS diária e avanço em P3. Teoria nova é reduzida proporcionalmente para consolidar o aprendido.',
        pedagogicalFocus: 'Baterias de questões + Caderno de Erros + FSRS',
        priorities: [
          'Volume de questões por disciplina e tópicos estudados',
          'Resolução ativa de pendências do Caderno de Erros',
          'Elevação dos DomainScores rumo a BOM e DOMINADO',
          '2 sessões semanais de P3 (Q20 e Peça Técnica)',
        ],
        discursiveWeeklyTarget: 2,
        weeklyBossRecommendation: {
          targetQuestions: 60,
          p1Target: 30,
          p2Target: 30,
          description: 'Checkpoint Semanal Intermediário (60 itens: 30 P1 + 30 P2)',
          xpReward: 120,
        },
        coveragePercent,
        p1CoveragePercent,
        p2CoveragePercent,
      };

    case 'EXAM_MODE':
      return {
        title: 'Fase C — Ritmo de Prova',
        tagline: 'Simulações e Ajuste Fino da Estratégia Cebraspe',
        description:
          'Questões misturadas, controle rigoroso de tempo, cálculo de pontos líquidos (+1/-1/0), gestão de brancos, manutenção dos conteúdos dominados e simulados parciais.',
        pedagogicalFocus: 'Simulação realística de prova + Estratégia de corte de risco',
        priorities: [
          'Questões mistas e baterias cronometradas',
          'Treino de estratégia Cebraspe: pontuação líquida e brancos',
          'Simulados periódicos e análise minuciosa de distratores',
          'P3 integrada no ritmo semanal com limite estrito de linhas',
        ],
        discursiveWeeklyTarget: 2,
        weeklyBossRecommendation: {
          targetQuestions: 90,
          p1Target: 45,
          p2Target: 45,
          description: 'Simulado Parcial de Ritmo (90 itens: 45 P1 + 45 P2)',
          xpReward: 120,
        },
        coveragePercent,
        p1CoveragePercent,
        p2CoveragePercent,
      };

    case 'FINAL_SPRINT':
      return {
        title: 'Fase D — Reta Final',
        tagline: 'Blindagem de Pontos Críticos e Revisão Estratégica',
        description:
          'Últimos 14 dias antes da prova. Prioridade máxima para erros recorrentes, flashcards vencidos, tópicos AT_RISK e simulados completos planejados. Evitar abrir materiais extensos novos.',
        pedagogicalFocus: 'Retenção de curto prazo + Estabilidade emocional e técnica',
        priorities: [
          'Revisão intensiva de flashcards e resumos de bolso',
          'Recuperação de tópicos AT_RISK e erros frequentes',
          'Simulado completo final no padrão oficial (180 itens + P3)',
          'Fixação cirúrgica de regimentos e jurisprudência',
        ],
        discursiveWeeklyTarget: 1,
        weeklyBossRecommendation: {
          targetQuestions: 180,
          p1Target: 90,
          p2Target: 90,
          description: 'Simulado Completo do Edital nº 1/2026 (180 itens)',
          xpReward: 200,
        },
        coveragePercent,
        p1CoveragePercent,
        p2CoveragePercent,
      };

    case 'POST_EXAM':
    default:
      return {
        title: 'Pós-Prova',
        tagline: 'Ciclo Concluído',
        description: 'Prova realizada no dia 17/01/2027. Momento de análise de gabarito e recursos.',
        pedagogicalFocus: 'Análise pós-edital',
        priorities: ['Conferência de gabarito preliminar', 'Análise de recursos tempestivos'],
        discursiveWeeklyTarget: 0,
        weeklyBossRecommendation: {
          targetQuestions: 0,
          p1Target: 0,
          p2Target: 0,
          description: 'Ciclo concluído',
          xpReward: 0,
        },
        coveragePercent,
        p1CoveragePercent,
        p2CoveragePercent,
      };
  }
}

/**
 * Calculates academic preparation progress (Progresso da Preparação).
 * Distinct from XP, this measures actual curricular maturity according to edital requirements.
 *
 * Formula components:
 * - Edital Coverage (35%): started topics / 76
 * - Domain Mastery (30%): average domain score of studied topics
 * - FSRS Retention (15%): retention rate or default 90%
 * - Discursive Practice (10%): min(100, sessions * 25)
 * - Risk Management (10%): max(0, 100 - atRisk * 20)
 */
export function calculateAcademicProgress(
  topics: Topic[],
  discursiveSessions: DiscursiveSession[],
  retentionRate: number | null
): AcademicProgressResult {
  const totalTopics = topics.length || 76;
  const startedTopics = topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const p1Topics = topics.filter((t) => t.exam_block_code === 'P1');
  const p2Topics = topics.filter((t) => t.exam_block_code === 'P2');

  const p1Started = p1Topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const p2Started = p2Topics.filter((t) => t.status !== 'NOT_STARTED').length;

  const atRiskCount = topics.filter((t) => t.status === 'AT_RISK').length;
  const masteredCount = topics.filter((t) => t.status === 'MASTERED').length;

  const editalCoveragePercent = Math.round((startedTopics / totalTopics) * 100);
  const p1CoveragePercent = p1Topics.length > 0 ? Math.round((p1Started / p1Topics.length) * 100) : 0;
  const p2CoveragePercent = p2Topics.length > 0 ? Math.round((p2Started / p2Topics.length) * 100) : 0;

  // Average domain score of studied topics
  const studiedWithScore = topics.filter((t) => t.domain_score !== null && t.domain_score !== undefined);
  const averageDomainScore =
    studiedWithScore.length > 0
      ? Math.round(studiedWithScore.reduce((sum, t) => sum + (t.domain_score || 0), 0) / studiedWithScore.length)
      : 0;

  const retention = retentionRate !== null ? retentionRate : 90;
  const discursiveSessionsCount = discursiveSessions ? discursiveSessions.length : 0;

  // Components (0-100)
  const coverageComponent = editalCoveragePercent;
  const domainComponent = averageDomainScore;
  const retentionComponent = Math.min(100, Math.max(0, retention));
  const discursiveComponent = Math.min(100, discursiveSessionsCount * 25);
  const riskComponent = Math.max(0, 100 - atRiskCount * 20);

  const weights = {
    coverage: 0.35,
    domain: 0.30,
    retention: 0.15,
    discursive: 0.10,
    risk: 0.10,
  };

  const overallIndex = Math.round(
    coverageComponent * weights.coverage +
      domainComponent * weights.domain +
      retentionComponent * weights.retention +
      discursiveComponent * weights.discursive +
      riskComponent * weights.risk
  );

  return {
    overallIndex: Math.min(100, Math.max(0, overallIndex)),
    editalCoveragePercent,
    p1CoveragePercent,
    p2CoveragePercent,
    averageDomainScore,
    retentionRate: retention,
    discursiveSessionsCount,
    atRiskTopicsCount: atRiskCount,
    masteredTopicsCount: masteredCount,
    breakdown: {
      coverageComponent,
      domainComponent,
      retentionComponent,
      discursiveComponent,
      riskComponent,
    },
    weights,
  };
}
