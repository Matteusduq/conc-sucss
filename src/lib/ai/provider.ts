import {
  WeeklyAnalysisInput,
  WeeklyAnalysisResult,
  ErrorPatternInput,
  ErrorPatternResult,
  FlashcardGenerationInput,
  FlashcardDraft,
  StudyAdjustmentInput,
  StudyAdjustmentResult,
  HighlightExplanationInput,
  HighlightExplanationResult,
} from './types';

export interface AIProvider {
  generateWeeklyAnalysis(input: WeeklyAnalysisInput): Promise<WeeklyAnalysisResult>;
  analyzeErrorPatterns(input: ErrorPatternInput): Promise<ErrorPatternResult>;
  generateFlashcards(input: FlashcardGenerationInput): Promise<FlashcardDraft[]>;
  suggestStudyAdjustment(input: StudyAdjustmentInput): Promise<StudyAdjustmentResult>;
  explainHighlightAndDraftFlashcard(input: HighlightExplanationInput): Promise<HighlightExplanationResult>;
}
