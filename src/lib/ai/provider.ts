import {
  WeeklyAnalysisInput,
  ErrorPatternInput,
  FlashcardGenerationInput,
  FlashcardDraft,
  StudyAdjustmentInput,
  AIInsightOutput,
} from './types';

export interface AIProvider {
  generateWeeklyAnalysis(input: WeeklyAnalysisInput): Promise<AIInsightOutput>;
  analyzeErrorPatterns(input: ErrorPatternInput): Promise<AIInsightOutput>;
  generateFlashcards(input: FlashcardGenerationInput): Promise<FlashcardDraft[]>;
  suggestStudyAdjustment(input: StudyAdjustmentInput): Promise<AIInsightOutput>;
}
