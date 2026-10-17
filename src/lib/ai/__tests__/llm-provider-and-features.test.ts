import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LLMAIProvider,
  AIConfigurationError,
  AIProviderError,
  extractAndValidateJson,
} from '../llm-provider';
import {
  WeeklyAnalysisResultSchema,
  ErrorPatternResultSchema,
  StudyAdjustmentResultSchema,
  FlashcardDraftsArraySchema,
  HighlightExplanationResultSchema,
} from '../types';
import { getAIProvider, MockAIProvider } from '../mock-provider';

describe('LLMAIProvider & Parsing Robustness (Requirement 18)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // 1. Sem API key
  it('lança AIConfigurationError quando a API key não está configurada', async () => {
    const provider = new LLMAIProvider({ apiKey: '' });
    expect(provider.isConfigured()).toBe(false);

    await expect(
      provider.explainHighlightAndDraftFlashcard({
        topicId: 'top-1',
        topicName: 'Topic',
        subjectName: 'Subject',
        priority: 'HIGH',
        syllabusItems: [],
        pageNumber: 1,
        selectedText: 'Texto exemplo',
      })
    ).rejects.toThrow(AIConfigurationError);
  });

  // 2. Extração e validação de JSON com markdown fences ```json ... ```
  it('consegue parsear e validar JSON envolvido em blocos markdown ```json ... ```', () => {
    const rawContent = '```json\n{\n  "shouldCreateFlashcard": true,\n  "explanation": "Explicação válida",\n  "keyPoint": "Ponto chave",\n  "confidence": "HIGH",\n  "draft": {\n    "front": "Pergunta",\n    "back": "Resposta",\n    "cardType": "CONTENT",\n    "examPriority": "HIGH"\n  }\n}\n```';
    const result = extractAndValidateJson(rawContent, HighlightExplanationResultSchema.omit({ provider: true, model: true }));
    expect(result.shouldCreateFlashcard).toBe(true);
    expect(result.explanation).toBe('Explicação válida');
  });

  // 3. Extração de JSON no meio de texto introdutório
  it('consegue extrair objeto JSON mesmo se houver texto antes ou depois', () => {
    const rawContent = 'Aqui está a resposta solicitada:\n{"summary":"Resumo semanal","details":["detalhe"],"recommendations":["rec"],"strongAreas":["Português"],"weakAreas":["Direito"],"focusPriority":"HIGH","balanceAnalysis":{"theory":"boa","questions":"ótimo","memory":"ok","discursive":"iniciar"}}\nEspero ter ajudado!';
    const result = extractAndValidateJson(rawContent, WeeklyAnalysisResultSchema.omit({ provider: true, model: true, generatedAt: true }));
    expect(result.summary).toBe('Resumo semanal');
    expect(result.strongAreas).toContain('Português');
  });

  // 4. Erro com JSON inválido
  it('lança AIProviderError quando o conteúdo não contém JSON decodificável', () => {
    const rawContent = 'Este texto não possui nenhum JSON formatado { chave quebrada ...';
    expect(() =>
      extractAndValidateJson(rawContent, WeeklyAnalysisResultSchema)
    ).toThrow(AIProviderError);
  });

  // 5. Erro com Schema Zod inválido
  it('lança AIProviderError com detalhes quando o JSON viola o contrato Zod', () => {
    const rawContent = JSON.stringify({
      summary: 'Resumo',
      // Faltam campos obrigatórios details, recommendations, etc.
    });
    expect(() =>
      extractAndValidateJson(rawContent, WeeklyAnalysisResultSchema)
    ).toThrow('não atende ao contrato de dados');
  });

  // 6. Resposta vazia
  it('lança AIProviderError em resposta vazia', () => {
    expect(() => extractAndValidateJson('', WeeklyAnalysisResultSchema)).toThrow(
      'Resposta vazia recebida do provedor de IA'
    );
  });

  // 7. Mapeamento de erro 401
  it('mapeia status 401 para mensagem amigável de credencial inválida', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API key',
    });
    vi.stubGlobal('fetch', mockFetch);

    const provider = new LLMAIProvider({ apiKey: 'sk-invalid' });
    await expect(
      provider.generateWeeklyAnalysis({
        userId: 'u-1',
        totalStudyMinutes: 120,
        questionsSolved: 30,
        accuracyRate: 80,
        netScore: 18,
      })
    ).rejects.toThrow('Credencial da IA inválida ou sem autorização.');
  });

  // 8. Mapeamento de erro 429
  it('mapeia status 429 para limite temporário', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'Rate limit exceeded',
    });
    vi.stubGlobal('fetch', mockFetch);

    const provider = new LLMAIProvider({ apiKey: 'sk-test' });
    await expect(
      provider.generateWeeklyAnalysis({
        userId: 'u-1',
        totalStudyMinutes: 120,
        questionsSolved: 30,
        accuracyRate: 80,
        netScore: 18,
      })
    ).rejects.toThrow('O provedor de IA atingiu o limite temporário.');
  });

  // 9. Mapeamento de erro 500
  it('mapeia status 500 para indisponibilidade temporária', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error',
    });
    vi.stubGlobal('fetch', mockFetch);

    const provider = new LLMAIProvider({ apiKey: 'sk-test' });
    await expect(
      provider.generateWeeklyAnalysis({
        userId: 'u-1',
        totalStudyMinutes: 120,
        questionsSolved: 30,
        accuracyRate: 80,
        netScore: 18,
      })
    ).rejects.toThrow('O provedor de IA está temporariamente indisponível.');
  });

  // 10. Normalização da URL
  it('remove barras finais e duplicadas na URL base', () => {
    const provider1 = new LLMAIProvider({ baseUrl: 'https://api.xkiro.com/v1///' });
    expect((provider1 as any).baseUrl).toBe('https://api.xkiro.com/v1');

    const provider2 = new LLMAIProvider({ provider: 'xkiro' });
    expect((provider2 as any).baseUrl).toBe('https://api.xkiro.com/v1');
  });
});

describe('AI Features & Deterministic Integrity (Requirement 19)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('Weekly Analysis aceita dados agregados reais e retorna estrutura Zod válida', async () => {
    const provider = new MockAIProvider(true);
    const result = await provider.generateWeeklyAnalysis({
      userId: 'user-test',
      totalStudyMinutes: 450,
      questionsSolved: 120,
      accuracyRate: 78.5,
      netScore: 68,
      topWeakTopics: [{ name: 'Regimento Interno', domainScore: 42 }],
      materialsCompleted: 4,
      materialsTotal: 12,
      fsrsDueCards: 15,
      fsrsReviewedCards: 30,
      discursiveSessionsCount: 1,
      daysStudiedCount: 5,
    });

    const parsed = WeeklyAnalysisResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    expect(result.summary.length).toBeGreaterThan(5);
    expect(result.balanceAnalysis.theory).toBeDefined();
  });

  it('Error Pattern Analysis retorna diagnóstico com Zod válido e Cebraspe trap', async () => {
    const provider = new MockAIProvider(true);
    const result = await provider.analyzeErrorPatterns({
      userId: 'user-test',
      errorCountsByType: { INTERPRETACAO: 4, REGRA_ESQUECIDA: 2 },
      recentErrors: [
        {
          summary: 'Confundiu quórum de lei complementar com lei ordinária',
          correctRule: 'Art. 69 da CF: maioria absoluta',
          errorType: 'REGRA_ESQUECIDA',
        },
      ],
    });

    const parsed = ErrorPatternResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns[0].cebraspeTrap).toBeDefined();
  });

  it('Study Adjustment é puramente consultivo e não altera estado determinístico nem concede XP', async () => {
    const provider = new MockAIProvider(true);
    const result = await provider.suggestStudyAdjustment({
      userId: 'user-test',
      daysUntilExam: 457,
      currentWeeklyHours: 20,
      uncoveredTopicsCount: 30,
      atRiskTopicsCount: 8,
      fsrsBacklogCount: 10,
      p1Accuracy: 82,
      p2Accuracy: 65,
      p3SessionsCount: 2,
    });

    const parsed = StudyAdjustmentResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);

    const sumPercentages =
      result.suggestedDistribution.theoryPercent +
      result.suggestedDistribution.questionsPercent +
      result.suggestedDistribution.reviewPercent +
      result.suggestedDistribution.discursivePercent;
    expect(sumPercentages).toBe(100);

    // O objeto de resultado não possui campos de mutação de banco/XP
    expect((result as any).xpGranted).toBeUndefined();
    expect((result as any).newTopicStatus).toBeUndefined();
  });

  it('Flashcards gerados são apenas rascunhos atômicos com limite máximo', async () => {
    const provider = new MockAIProvider(true);
    const drafts = await provider.generateFlashcards({
      topicId: 'top-1',
      topicName: 'Processo Legislativo',
      subjectName: 'Regimento Interno',
      priority: 'HIGH',
      materialTextSnippet: 'Aprovação de lei ordinária por maioria simples.',
      targetCount: 3,
    });

    const parsed = FlashcardDraftsArraySchema.safeParse(drafts);
    expect(parsed.success).toBe(true);
    expect(drafts.length).toBeLessThanOrEqual(10);
    expect(drafts[0].cardType).toBe('RULE');
  });

  it('getAIProvider retorna LLMAIProvider quando AI_API_KEY existe e MockAIProvider em testes', () => {
    vi.stubEnv('AI_API_KEY', 'sk-real-test-key');
    const p1 = getAIProvider();
    expect(p1).toBeInstanceOf(LLMAIProvider);

    vi.stubEnv('AI_API_KEY', '');
    vi.stubEnv('NODE_ENV', 'test');
    const p2 = getAIProvider();
    expect(p2).toBeInstanceOf(MockAIProvider);
  });
});
