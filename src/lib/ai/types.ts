import { z } from 'zod';
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
