import { AIProvider } from './provider';
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
import { LLMAIProvider, AIConfigurationError } from './llm-provider';

export class MockAIProvider implements AIProvider {
  constructor(private isTestMode: boolean = false) {}

  async generateWeeklyAnalysis(input: WeeklyAnalysisInput): Promise<WeeklyAnalysisResult> {
    if (this.isTestMode || process.env.NODE_ENV === 'test') {
      return {
        summary: 'Semana com bom ritmo de estudo e evolução consistente em questões.',
        details: [
          `Total de ${input.totalStudyMinutes} minutos dedicados.`,
          `Precisão líquida mantida em ${input.accuracyRate.toFixed(1)}%.`,
        ],
        recommendations: [
          'Aumentar o volume de questões na disciplina de menor rendimento.',
          'Zerar o backlog de revisões FSRS.',
        ],
        strongAreas: ['Língua Portuguesa'],
        weakAreas: ['Regimento Interno da Câmara dos Deputados'],
        focusPriority: 'HIGH',
        balanceAnalysis: {
          theory: 'Carga teórica adequada para a fase inicial.',
          questions: 'Volume de questões dentro da meta diária.',
          memory: 'Revisões FSRS em dia.',
          discursive: 'Recomenda-se iniciar ao menos 1 treino semanal de P3.',
        },
        provider: 'mock-test',
        model: 'mock-test-model',
        generatedAt: new Date().toISOString(),
      };
    }

    throw new AIConfigurationError('IA ainda não configurada. Configure AI_API_KEY no servidor.');
  }

  async analyzeErrorPatterns(input: ErrorPatternInput): Promise<ErrorPatternResult> {
    if (this.isTestMode || process.env.NODE_ENV === 'test') {
      return {
        summary: 'Padrão predominante de erros decorrentes de pegadinhas Cebraspe em prazos e quóruns.',
        patterns: [
          {
            pattern: 'Inversão de Quórum Regimental',
            possibleCause: 'Confusão entre maioria absoluta e maioria simples.',
            recurrence: 3,
            cebraspeTrap: 'A banca costuma trocar maioria simples por maioria absoluta em votações ordinárias.',
            suggestedReview: 'Revisar tabela de quóruns no Regimento Interno.',
            recommendFlashcard: true,
          },
        ],
        recommendations: [
          'Criar cartões de memorização para os quóruns constitucionais e regimentais.',
          'Atenção às palavras absolutistas (apenas, exclusivamente) nas questões.',
        ],
        provider: 'mock-test',
        model: 'mock-test-model',
        generatedAt: new Date().toISOString(),
      };
    }

    throw new AIConfigurationError('IA ainda não configurada. Configure AI_API_KEY no servidor.');
  }

  async generateFlashcards(input: FlashcardGenerationInput): Promise<FlashcardDraft[]> {
    if (this.isTestMode || process.env.NODE_ENV === 'test') {
      return [
        {
          front: `[${input.topicName}] Qual a regra geral para aprovação de matéria ordinária?`,
          back: 'Maioria simples dos votos, presente a maioria absoluta dos membros da Casa.',
          cardType: 'RULE',
          examPriority: input.priority,
          reasoning: 'Regra basilar de processo legislativo.',
        },
      ];
    }

    throw new AIConfigurationError('IA ainda não configurada. Configure AI_API_KEY no servidor.');
  }

  async suggestStudyAdjustment(input: StudyAdjustmentInput): Promise<StudyAdjustmentResult> {
    if (this.isTestMode || process.env.NODE_ENV === 'test') {
      return {
        summary: `Faltam ${input.daysUntilExam} dias para a prova. Recomenda-se calibrar a carga prática.`,
        justification: 'Com tópicos em risco pendentes, a calibragem fortalece a precisão em questões da Cebraspe.',
        strategicAdvice: [
          'Dedicar 40% do tempo a questões e resolução comentada.',
          'Manter 25% em teoria de alta prioridade e 20% em FSRS.',
        ],
        suggestedDistribution: {
          theoryPercent: 25,
          questionsPercent: 40,
          reviewPercent: 20,
          discursivePercent: 15,
        },
        focusSubjects: ['Regimento Interno', 'Direito Constitucional'],
        p3InclusionRecommended: true,
        provider: 'mock-test',
        model: 'mock-test-model',
        generatedAt: new Date().toISOString(),
      };
    }

    throw new AIConfigurationError('IA ainda não configurada. Configure AI_API_KEY no servidor.');
  }

  async explainHighlightAndDraftFlashcard(
    input: HighlightExplanationInput
  ): Promise<HighlightExplanationResult> {
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

    throw new AIConfigurationError('IA ainda não configurada. Configure AI_API_KEY no servidor.');
  }
}

/**
 * Retorna o provedor de IA apropriado de forma dinâmica.
 * Se AI_API_KEY estiver configurada, instancia LLMAIProvider.
 * Em ambiente de teste com mock, instancia MockAIProvider(true).
 * Caso contrário, instancia MockAIProvider(false) que lança AIConfigurationError sem fabricar dados.
 */
export function getAIProvider(): AIProvider {
  const apiKey = process.env.AI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    return new LLMAIProvider();
  }
  if (process.env.NODE_ENV === 'test') {
    return new MockAIProvider(true);
  }
  return new MockAIProvider(false);
}

export const aiProvider: AIProvider = getAIProvider();
