import { Priority, DomainConfidence, RecommendedMaterialType, CrossRelevance } from './database';

export type DomainBand = 
  | 'FRACO'
  | 'EM_CONSTRUCAO'
  | 'RAZOAVEL'
  | 'BOM'
  | 'DOMINADO'
  | 'DOMINIO_ALTO';

export interface DomainCalculationResult {
  domainScore: number;
  domainConfidence: DomainConfidence;
  domainBand: DomainBand;
  components: {
    performanceScore: number | null;
    retentionScore: number | null;
    recencyScore: number;
    coverageScore: number;
  };
  weightsUsed: {
    performance: number;
    retention: number;
    recency: number;
    coverage: number;
  };
  sampleFactor: number;
}

export interface StudyScoreResult {
  studyScore: number;
  breakdown: {
    priorityScore: number;
    masteryGap: number;
    reviewUrgency: number;
    stageUrgency: number;
    confidenceGap: number;
  };
  boostersApplied: {
    name: string;
    value: number;
  }[];
}

export interface TodayTask {
  id: string;
  topicId: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  examBlockCode?: 'P1' | 'P2';
  priority: Priority;
  recommendedMaterialType: RecommendedMaterialType;
  actionType: 'READ_MATERIAL' | 'TEC_QUESTIONS' | 'REVIEW_ERRORS' | 'MEMORY_REVIEW';
  actionLabel: string;
  reason: string;
  estimatedMinutes: number;
  studyScore: number;
  domainScore: number | null;
  domainConfidence: DomainConfidence | null;
  crossRelevance?: CrossRelevance;
  isDiscursiveRelevant?: boolean;
  targetQuestions?: number;
}

export interface TodayPlanSummary {
  availableMinutes: number;
  blocks: {
    theoryMinutes: number;
    questionsMinutes: number;
    memoryMinutes: number;
    bufferMinutes: number;
  };
  tasks: TodayTask[];
  reviewsDueCount: number;
  reviewsDueMinutes: number;
  alerts: string[];
}

export interface DashboardKPIs {
  daysUntilExam: number;
  weeklyTargetMinutes: number;
  weeklyStudiedMinutes: number;
  weeklyProgressPercent: number;
  totalQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  blankQuestions: number;
  netPointsCebraspe: number;
  accuracyRate: number;
  retentionRate: number;
  atRiskTopicsCount: number;
  awaitingQuestionsCount: number;
  completedMaterialsCount: number;
}

export interface DiscursiveKPIs {
  totalSessions: number;
  question20Count: number;
  technicalPieceCount: number;
  averageScore: number;
  totalLinesWritten: number;
  averageLanguageErrors: number;
}

export interface BlockPerformanceSummary {
  blockCode: 'P1' | 'P2';
  totalQuestions: number;
  correct: number;
  wrong: number;
  blank: number;
  netPoints: number;
  accuracyRate: number;
  coveragePercent: number;
  averageDomainScore: number;
  studyTimeSeconds: number;
}
