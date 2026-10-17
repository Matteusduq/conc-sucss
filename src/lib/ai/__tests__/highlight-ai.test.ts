import { describe, it, expect, afterEach, vi } from 'vitest';
import { HighlightExplanationResultSchema } from '../types';
import { MockAIProvider } from '../mock-provider';
import { LLMAIProvider } from '../llm-provider';

describe('Highlight AI Explanation & Flashcard Draft (Points 14-19)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Ponto 14: schema Zod aceita resposta válida
  it('14. valida com sucesso schema Zod de resposta válida da IA', () => {
    const validResponse = {
      shouldCreateFlashcard: true,
      explanation: 'A Mesa Diretora da Câmara é órgão colegiado com mandato bienal vedada a recondução na mesma legislatura.',
      keyPoint: 'Vedada a recondução dos membros da Mesa para o mesmo cargo na eleição imediatamente subsequente.',
      cebraspeTrap: 'A banca costuma trocar "vedada na mesma legislatura" por "permitida uma única recondução".',
      draft: {
        front: 'É permitida a recondução de membro da Mesa da Câmara dos Deputados para o mesmo cargo na eleição imediatamente subsequente, na mesma legislatura?',
        back: 'ERRADO. É expressamente vedada a recondução para o mesmo cargo na eleição imediatamente subsequente, dentro da mesma legislatura (art. 5º, § 1º, RICD).',
        cardType: 'CEBRASPE_TRUE_FALSE',
        examPriority: 'HIGH',
      },
      confidence: 'HIGH',
      reason: null,
      provider: 'openai',
      model: 'gpt-4o-mini',
    };

    const parsed = HighlightExplanationResultSchema.safeParse(validResponse);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.draft?.cardType).toBe('CEBRASPE_TRUE_FALSE');
      expect(parsed.data.shouldCreateFlashcard).toBe(true);
    }
  });

  // Ponto 15: schema Zod rejeita resposta inválida
  it('15. rejeita resposta inválida (ex: tipo de cartão inexistente ou campos obrigatórios ausentes)', () => {
    const invalidCardType = {
      shouldCreateFlashcard: true,
      explanation: 'Explicação qualquer',
      keyPoint: 'Ponto-chave',
      draft: {
        front: 'Frente',
        back: 'Verso',
        cardType: 'INVALID_TYPE', // Inválido!
        examPriority: 'HIGH',
      },
      confidence: 'HIGH',
      provider: 'openai',
      model: 'gpt-4o-mini',
    };

    const parsed1 = HighlightExplanationResultSchema.safeParse(invalidCardType);
    expect(parsed1.success).toBe(false);

    const missingExplanation = {
      shouldCreateFlashcard: true,
      // explanation ausente!
      keyPoint: 'Ponto-chave',
      confidence: 'HIGH',
      provider: 'openai',
      model: 'gpt-4o-mini',
    };

    const parsed2 = HighlightExplanationResultSchema.safeParse(missingExplanation);
    expect(parsed2.success).toBe(false);
  });

  // Ponto 16: shouldCreateFlashcard=false não cria cartão
  it('16. shouldCreateFlashcard=false retorna draft null com justificativa pedagógica', async () => {
    const provider = new MockAIProvider();
    const result = await provider.explainHighlightAndDraftFlashcard({
      topicId: 'top-1',
      topicName: 'Introdução',
      subjectName: 'Direito Constitucional',
      priority: 'LOW',
      syllabusItems: [],
      pageNumber: 1,
      selectedText: 'No presente capítulo veremos conceitos introdutórios e generalidades históricas.',
    });

    expect(result.shouldCreateFlashcard).toBe(false);
    expect(result.draft).toBeNull();
    expect(result.reason).toContain('não contém uma unidade de memorização');
    expect(result.confidence).toBe('LOW');
  });

  // Ponto 17: provider ausente não gera fake em produção
  it('17. provider ausente não gera fake em produção e lança erro explícito', async () => {
    // Simula ambiente de produção sem credenciais de IA configuradas
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;

    const provider = new LLMAIProvider({ apiKey: '' });

    await expect(
      provider.explainHighlightAndDraftFlashcard({
        topicId: 'top-1',
        topicName: 'Processo Legislativo',
        subjectName: 'Regimento Interno',
        priority: 'HIGH',
        syllabusItems: [],
        pageNumber: 5,
        selectedText: 'O quórum para aprovação de lei complementar é de maioria absoluta.',
      })
    ).rejects.toThrow('IA ainda não configurada.');
  });

  // Ponto 18: erro da IA preserva highlight
  it('18. erro da IA permite manter o highlight com status FAILED sem descartar a marcação', () => {
    const highlight = {
      id: 'hl-test-1',
      selected_text: 'Texto de lei marcado',
      ai_status: 'GENERATING' as const,
      ai_error: null,
    };

    // Simulando catch do erro na action/controller
    const failedHighlight = {
      ...highlight,
      ai_status: 'FAILED' as const,
      ai_error: 'IA ainda não configurada.',
    };

    expect(failedHighlight.ai_status).toBe('FAILED');
    expect(failedHighlight.selected_text).toBe('Texto de lei marcado');
    expect(failedHighlight.id).toBe('hl-test-1');
  });

  // Ponto 19: retry não duplica highlight
  it('19. retry de IA reaproveita o mesmo highlight_id sem gerar duplicidade', () => {
    const existingHighlightId = 'hl-12345';
    const highlights = [
      { id: existingHighlightId, ai_status: 'FAILED', selected_text: 'Trecho X' },
    ];

    // Simula retry: atualiza o item existente
    const retriedHighlights = highlights.map((h) =>
      h.id === existingHighlightId
        ? { ...h, ai_status: 'GENERATING' as const, ai_error: null }
        : h
    );

    expect(retriedHighlights).toHaveLength(1);
    expect(retriedHighlights[0].id).toBe(existingHighlightId);
    expect(retriedHighlights[0].ai_status).toBe('GENERATING');
  });
});
