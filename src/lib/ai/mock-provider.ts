/* eslint-disable @typescript-eslint/no-unused-vars */
import { AIProvider } from './provider';
import {
  WeeklyAnalysisInput,
  ErrorPatternInput,
  FlashcardGenerationInput,
  FlashcardDraft,
  StudyAdjustmentInput,
  AIInsightOutput,
} from './types';

export class MockAIProvider implements AIProvider {
  async generateWeeklyAnalysis(_input: WeeklyAnalysisInput): Promise<AIInsightOutput> {
    return {
      id: 'mock-insight',
      type: 'WEEKLY_ANALYSIS',
      summary: 'IA ainda não configurada.',
      details: ['Configure a chave de API e provedor no arquivo .env.local para habilitar análises generativas.'],
      recommendations: [],
      provider: 'none',
      model: 'none',
      generatedAt: new Date().toISOString(),
    };
  }

  async analyzeErrorPatterns(_input: ErrorPatternInput): Promise<AIInsightOutput> {
    return {
      id: 'mock-error-analysis',
      type: 'ERROR_ANALYSIS',
      summary: 'IA ainda não configurada.',
      details: ['Os padrões de erro são agregados deterministicamente pelo sistema na tela de Erros.'],
      recommendations: [],
      provider: 'none',
      model: 'none',
      generatedAt: new Date().toISOString(),
    };
  }

  async generateFlashcards(_input: FlashcardGenerationInput): Promise<FlashcardDraft[]> {
    // Returns empty array to prevent inserting fake flashcards
    return [];
  }

  async suggestStudyAdjustment(_input: StudyAdjustmentInput): Promise<AIInsightOutput> {
    return {
      id: 'mock-adjustment',
      type: 'STUDY_RECOMMENDATION',
      summary: 'IA ainda não configurada.',
      details: ['O planejamento diário e distribuição de tempo são calculados pelo motor determinístico do sistema.'],
      recommendations: [],
      provider: 'none',
      model: 'none',
      generatedAt: new Date().toISOString(),
    };
  }
}

export const aiProvider: AIProvider = new MockAIProvider();
