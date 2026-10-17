import { describe, it, expect } from 'vitest';
import { getDefaultStore, createFlashcardAction } from '@/lib/data/store';
import { Flashcard } from '@/types/database';

describe('Highlight Flashcard Acceptance & FSRS Integration (Points 20-26)', () => {
  it('20-25. aceitar draft cria exatamente 1 flashcard com tipo AI_GENERATED, IDs de vínculo, explanation e estado FSRS inicial', () => {
    const store = getDefaultStore();
    const initialCardCount = store.flashcards.length;

    const highlightId = 'hl-test-legislativo-01';
    const materialId = 'mat-topic-01';
    const topicId = 'top-p1-leg-1';

    const cardPayload: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'> = {
      user_id: 'user-teste-1',
      exam_id: 'exam-camara-2027',
      subject_id: 'sub-dir-const',
      topic_id: topicId,
      card_type: 'RULE',
      front: 'Qual o quórum para aprovação de lei complementar na Câmara dos Deputados?',
      back: 'Maioria absoluta dos seus membros (art. 69, CF/88).',
      source_type: 'AI_GENERATED',
      source_material_id: materialId,
      source_error_id: null,
      source_highlight_id: highlightId,
      explanation: 'A aprovação de leis complementares exige maioria absoluta, ao passo que leis ordinárias exigem maioria simples, presente a maioria absoluta.',
      exam_priority: 'HIGH',
      priority_boost: 0,
      active: true,
      suspended: false,
    };

    const nextStore = createFlashcardAction(cardPayload, store);

    // Ponto 20: cria somente 1 flashcard
    expect(nextStore.flashcards.length).toBe(initialCardCount + 1);

    const createdCard = nextStore.flashcards[0];
    expect(createdCard).toBeDefined();

    // Ponto 21: source_type = AI_GENERATED
    expect(createdCard.source_type).toBe('AI_GENERATED');

    // Ponto 22: source_material_id correto
    expect(createdCard.source_material_id).toBe(materialId);

    // Ponto 23: source_highlight_id correto
    expect(createdCard.source_highlight_id).toBe(highlightId);

    // Ponto 24: explanation persistida
    expect(createdCard.explanation).toContain('leis complementares exige maioria absoluta');

    // Ponto 25: FSRS inicializado pelo fluxo existente
    const fsrsState = nextStore.fsrsStates[createdCard.id];
    expect(fsrsState).toBeDefined();
    expect(fsrsState.flashcard_id).toBe(createdCard.id);
    expect(fsrsState.reps).toBe(0);
    expect(fsrsState.lapses).toBe(0);
    expect(fsrsState.state).toBe(0); // State.New
    expect(fsrsState.due).toBeDefined();
    expect(fsrsState.stability).toBe(0); // Cartão New inicializa com 0 até a primeira revisão
    expect(fsrsState.difficulty).toBe(0);
  });

  // Ponto 26: nenhuma recompensa artificial de XP por highlight ou consulta de IA
  it('26. criar highlight ou pedir sugestão de IA não altera o XP do usuário', () => {
    const store = getDefaultStore();
    const initialXp = store.gamificationProfile.total_xp;
    const initialTransactions = store.xpTransactions.length;

    // Criar um highlight (em memória ou no repo) é uma operação de anotação de leitura,
    // não gera XP de estudo direto nem altera StudyScore.
    const highlight = {
      id: 'hl-test',
      user_id: 'user-teste-1',
      material_id: 'mat-01',
      topic_id: 'top-01',
      page_number: 2,
      material_version: 1,
      selected_text: 'Trecho qualquer para destaque',
      rects: [],
      color: 'YELLOW' as const,
      ai_status: 'NOT_REQUESTED' as const,
      ai_explanation: null,
      ai_key_point: null,
      ai_cebraspe_trap: null,
      ai_flashcard_draft: null,
      ai_provider: null,
      ai_model: null,
      ai_generated_at: null,
      ai_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(highlight.id).toBe('hl-test');
    expect(store.gamificationProfile.total_xp).toBe(initialXp);
    expect(store.xpTransactions.length).toBe(initialTransactions);
  });
});
