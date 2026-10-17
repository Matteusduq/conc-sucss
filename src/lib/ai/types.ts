import { z } from 'zod';
import { Priority } from '@/types/database';

// ============================================================================
// FLASHCARD GENERATION SCHEMAS
// ============================================================================

export const FlashcardDraftSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  cardType: z.enum(['CONTENT', 'RULE', 'COMPARISON', 'CEBRASPE_TRUE_FALSE']),
  examPriority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  reasoning: z.string().optional(),
});

export const FlashcardDraftsArraySchema = z.array(FlashcardDraftSchema).max(10);

export type FlashcardDraft = z.infer<typeof FlashcardDraftSchema>;

export interface FlashcardGenerationInput {
  topicId: string;
  topicName: string;
  subjectName: string;
  priority: Priority;
  materialTextSnippet?: string;
  targetCount?: number;
}

// ============================================================================
// WEEKLY ANALYSIS SCHEMAS
// ============================================================================

export interface WeeklyAnalysisInput {
  userId: string;
  examId?: string;
  weekStartDate?: string;
  totalStudyMinutes: number;
  questionsSolved: number;
  accuracyRate: number;
  netScore: number;
  topWeakTopics?: { name: string; domainScore: number }[];
  materialsCompleted?: number;
  materialsTotal?: number;
  fsrsDueCards?: number;
  fsrsReviewedCards?: number;
  discursiveSessionsCount?: number;
  daysStudiedCount?: number;
}

export const WeeklyAnalysisResultSchema = z.object({
  summary: z.string().min(1),
  details: z.array(z.string()),
  recommendations: z.array(z.string()),
  strongAreas: z.array(z.string()),
  weakAreas: z.array(z.string()),
  focusPriority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'ALL']),
  balanceAnalysis: z.object({
    theory: z.string(),
    questions: z.string(),
    memory: z.string(),
    discursive: z.string(),
  }),
  provider: z.string(),
  model: z.string(),
  generatedAt: z.string(),
});

export type WeeklyAnalysisResult = z.infer<typeof WeeklyAnalysisResultSchema>;

// ============================================================================
// ERROR PATTERN SCHEMAS
// ============================================================================

export interface ErrorPatternInput {
  userId: string;
  topicId?: string;
  topicName?: string;
  totalErrors?: number;
  errorCountsByType: Record<string, number>;
  recentErrors: { summary: string; correctRule?: string; errorType?: string; topicName?: string }[];
}

export const ErrorPatternResultSchema = z.object({
  summary: z.string().min(1),
  patterns: z.array(
    z.object({
      pattern: z.string(),
      possibleCause: z.string(),
      recurrence: z.number().int().nonnegative(),
      cebraspeTrap: z.string().nullable().optional(),
      suggestedReview: z.string(),
      recommendFlashcard: z.boolean(),
    })
  ),
  recommendations: z.array(z.string()),
  provider: z.string(),
  model: z.string(),
  generatedAt: z.string(),
});

export type ErrorPatternResult = z.infer<typeof ErrorPatternResultSchema>;

// ============================================================================
// STUDY ADJUSTMENT SCHEMAS
// ============================================================================

export interface StudyAdjustmentInput {
  userId: string;
  daysUntilExam: number;
  currentWeeklyHours: number;
  uncoveredTopicsCount: number;
  atRiskTopicsCount: number;
  fsrsBacklogCount?: number;
  p1Accuracy?: number;
  p2Accuracy?: number;
  p3SessionsCount?: number;
}

export const StudyAdjustmentResultSchema = z.object({
  summary: z.string().min(1),
  justification: z.string().min(1),
  strategicAdvice: z.array(z.string()),
  suggestedDistribution: z.object({
    theoryPercent: z.number(),
    questionsPercent: z.number(),
    reviewPercent: z.number(),
    discursivePercent: z.number(),
  }),
  focusSubjects: z.array(z.string()),
  p3InclusionRecommended: z.boolean(),
  provider: z.string(),
  model: z.string(),
  generatedAt: z.string(),
});

export type StudyAdjustmentResult = z.infer<typeof StudyAdjustmentResultSchema>;

// ============================================================================
// GENERIC AI INSIGHT OUTPUT
// ============================================================================

export interface AIInsightOutput {
  id: string;
  type: string;
  summary: string;
  details: string[];
  recommendations: string[];
  provider: string;
  model: string;
  generatedAt: string;
  payload?: Record<string, unknown>;
}

// ============================================================================
// HIGHLIGHT EXPLANATION & AI FLASHCARD SCHEMAS (Zod & TS)
// ============================================================================

export const HighlightExplanationInputSchema = z.object({
  topicId: z.string(),
  topicName: z.string(),
  subjectName: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  syllabusItems: z.array(
    z.object({
      officialCode: z.string().nullable(),
      officialText: z.string(),
    })
  ),
  pageNumber: z.number().int().positive(),
  selectedText: z.string().min(1),
  contextBefore: z.string().optional(),
  contextAfter: z.string().optional(),
});

export type HighlightExplanationInput = z.infer<typeof HighlightExplanationInputSchema>;

export const HighlightExplanationDraftSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  cardType: z.enum(['CONTENT', 'RULE', 'COMPARISON', 'CEBRASPE_TRUE_FALSE']),
  examPriority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const HighlightExplanationResultSchema = z.object({
  shouldCreateFlashcard: z.boolean(),
  explanation: z.string().min(1),
  keyPoint: z.string().min(1),
  cebraspeTrap: z.string().nullable().optional(),
  draft: HighlightExplanationDraftSchema.nullable().optional(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  reason: z.string().nullable().optional(),
  provider: z.string(),
  model: z.string(),
});

export type HighlightExplanationResult = z.infer<typeof HighlightExplanationResultSchema>;
