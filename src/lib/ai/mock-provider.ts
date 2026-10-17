import { AIProvider } from './provider';
import {
  WeeklyAnalysisInput,
  ErrorPatternInput,
  FlashcardGenerationInput,
  FlashcardDraft,
  StudyAdjustmentInput,
  AIInsightOutput,
  HighlightExplanationInput,
  HighlightExplanationResult,
} from './types';
import { LLMAIProvider, AIConfigurationError } from './llm-provider';

export class MockAIProvider implements AIProvider {
  constructor(private isTestMode: boolean = false) {}

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

  async explainHighlightAndDraftFlashcard(
    input: HighlightExplanationInput
  ): Promise<HighlightExplanationResult> {
    // Em testes automatizados, provê retorno determinístico
    if (this.isTestMode || process.env.NODE_ENV === 'test') {
      const lowerText = input.selectedText.toLowerCase();
      if (
        input.selectedText.includes('INTRODUCTORY_ONLY') ||
        lowerText.includes('introdutóri') ||
        lowerText.includes('generalidades')
      ) {
        return {
          shouldCreateFlashcard: false,
          explanation: 'O trecho selecionado é meramente introdutório e não contém uma unidade atômica de memorização.',
          keyPoint: 'Trecho introdutório de contextualização.',
          cebraspeTrap: null,
          draft: null,
          confidence: 'LOW',
          reason: 'Este trecho é útil como contexto, mas não contém uma unidade de memorização suficientemente atômica.',
          provider: 'mock-test',
          model: 'mock-test-model',
        };
      }

      return {
        shouldCreateFlashcard: true,
        explanation: `Explicação didática sobre "${input.selectedText.slice(0, 60)}...". Foco nas regras e diretrizes cobradas pela banca Cebraspe.`,
        keyPoint: 'Conceito essencial e distinção mandatória para a prova.',
        cebraspeTrap: 'A banca Cebraspe costuma inverter hipóteses de aplicabilidade da regra.',
        draft: {
          front: `Em relação a ${input.topicName}, qual o efeito prático do trecho?`,
          back: input.selectedText.slice(0, 100),
          cardType: 'RULE',
          examPriority: input.priority,
        },
        confidence: 'HIGH',
        reason: null,
        provider: 'mock-test',
        model: 'mock-test-model',
      };
    }

    // Em produção, se não houver credencial configurada, nunca fabrica dados falsos
    throw new AIConfigurationError('IA ainda não configurada. Configure AI_API_KEY no servidor.');
  }
}

export function getAIProvider(): AIProvider {
  if (process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0) {
    return new LLMAIProvider();
  }
  return new MockAIProvider();
}

export const aiProvider: AIProvider = getAIProvider();
