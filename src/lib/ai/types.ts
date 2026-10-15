import { Priority, CardType } from '@/types/database';

export interface WeeklyAnalysisInput {
  userId: string;
  examId: string;
  weekStartDate: string;
  totalStudyMinutes: number;
  questionsSolved: number;
  accuracyRate: number;
  netScore: number;
  topWeakTopics: { name: string; domainScore: number }[];
}

export interface ErrorPatternInput {
  userId: string;
  topicId: string;
  errorCountsByType: Record<string, number>;
  recentErrors: { summary: string; correctRule?: string }[];
}

export interface FlashcardGenerationInput {
  topicId: string;
  topicName: string;
  subjectName: string;
  priority: Priority;
  materialTextSnippet?: string;
  targetCount?: number;
}

export interface FlashcardDraft {
  front: string;
  back: string;
  cardType: CardType;
  examPriority: Priority;
  reasoning?: string;
}

export interface StudyAdjustmentInput {
  userId: string;
  daysUntilExam: number;
  currentWeeklyHours: number;
  uncoveredTopicsCount: number;
  atRiskTopicsCount: number;
}

export interface AIInsightOutput {
  id: string;
  type: string;
  summary: string;
  details: string[];
  recommendations: string[];
  provider: string;
  model: string;
  generatedAt: string;
}
