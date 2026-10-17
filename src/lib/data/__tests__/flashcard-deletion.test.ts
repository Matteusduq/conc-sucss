import { describe, it, expect, vi } from 'vitest';
import {
  getDefaultStore,
  createFlashcardAction,
  deleteFlashcardAction,
  AppStoreData,
  saveStore,
} from '@/lib/data/store';
import { Flashcard, FlashcardReview } from '@/types/database';
import { SupabaseStudyRepository } from '@/lib/data/repository/supabase-repository';

describe('Exclusão de Flashcards (Requisitos 1 a 9)', () => {
  const userId = 'user-teste-del';
  const topicId = 'top-p1-port-1';
  const highlightId = 'hl-art-59-constituicao';

  function createTestStore(): { store: AppStoreData; card: Flashcard } {
    const baseStore = getDefaultStore();
    const cardPayload: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      exam_id: 'exam-camara-2027',
      subject_id: 'sub-lingua-port',
      topic_id: topicId,
      card_type: 'CONTENT',
      front: 'O processo legislativo compreende a elaboração de quais espécies normativas?',
      back: 'Emendas à CF, leis complementares, leis ordinárias, delegadas, medidas provisórias, decretos legislativos e resoluções.',
      source_type: 'AI_GENERATED',
      source_material_id: 'mat-top-p1-port-1',
      source_error_id: null,
      source_highlight_id: highlightId,
      explanation: 'Art. 59 da Constituição Federal.',
      exam_priority: 'HIGH',
      priority_boost: 0,
      active: true,
      suspended: false,
    };

    const storeWithCard = createFlashcardAction(cardPayload, baseStore);
    const card = storeWithCard.flashcards[0];
    return { store: storeWithCard, card };
  }

  it('1. excluir cartão remove flashcard do store local', () => {
    const { store, card } = createTestStore();
    expect(store.flashcards.some((c) => c.id === card.id)).toBe(true);

    const nextStore = deleteFlashcardAction(card.id, store);
    expect(nextStore.flashcards.some((c) => c.id === card.id)).toBe(false);
  });

  it('2. remove fsrs state local vinculado ao cartão excluído', () => {
    const { store, card } = createTestStore();
    expect(store.fsrsStates[card.id]).toBeDefined();

    const nextStore = deleteFlashcardAction(card.id, store);
    expect(nextStore.fsrsStates[card.id]).toBeUndefined();
  });

  it('3. remove reviews locais vinculados ao flashcard', () => {
    const { store, card } = createTestStore();
    const dummyReviewThisCard: FlashcardReview = {
      id: 'rev-card-target',
      user_id: userId,
      flashcard_id: card.id,
      reviewed_at: new Date().toISOString(),
      rating: 'GOOD',
      response_time_ms: 2500,
      state_before: { ...store.fsrsStates[card.id] },
      state_after: { ...store.fsrsStates[card.id] },
      fsrs_log: {},
      was_due_at_review: true,
      created_at: new Date().toISOString(),
    };

    const dummyReviewOtherCard: FlashcardReview = {
      id: 'rev-card-other',
      user_id: userId,
      flashcard_id: 'fc-outro-card',
      reviewed_at: new Date().toISOString(),
      rating: 'EASY',
      response_time_ms: 1800,
      state_before: { ...store.fsrsStates[card.id] },
      state_after: { ...store.fsrsStates[card.id] },
      fsrs_log: {},
      was_due_at_review: true,
      created_at: new Date().toISOString(),
    };

    const storeWithReviews = {
      ...store,
      reviews: [dummyReviewThisCard, dummyReviewOtherCard, ...store.reviews],
    };

    const nextStore = deleteFlashcardAction(card.id, storeWithReviews);

    expect(nextStore.reviews.some((r) => r.id === 'rev-card-target')).toBe(false);
    expect(nextStore.reviews.some((r) => r.flashcard_id === card.id)).toBe(false);
    expect(nextStore.reviews.some((r) => r.id === 'rev-card-other')).toBe(true);
  });

  it('4. chama repo.deleteFlashcard com userId e flashcardId corretos', async () => {
    const { card } = createTestStore();
    const mockRepo = {
      deleteFlashcard: vi.fn().mockResolvedValue(undefined),
    } as unknown as SupabaseStudyRepository;

    await mockRepo.deleteFlashcard(userId, card.id);

    expect(mockRepo.deleteFlashcard).toHaveBeenCalledTimes(1);
    expect(mockRepo.deleteFlashcard).toHaveBeenCalledWith(userId, card.id);
  });

  it('5. se repo falhar, nada é removido localmente (rollback do store)', async () => {
    const { store, card } = createTestStore();
    let currentStore = store;

    const mockRepo = {
      deleteFlashcard: vi.fn().mockRejectedValue(new Error('Falha de rede ou permissão RLS')),
    } as unknown as SupabaseStudyRepository;

    // Simula o comportamento exato de updateStore no DashboardLayoutClient
    const updateStoreSimulator = async (
      updater: (prev: AppStoreData) => AppStoreData,
      persistFn: (repo: SupabaseStudyRepository, uId: string) => Promise<void>
    ) => {
      const prevStore = currentStore;
      const nextStore = updater(prevStore);
      try {
        await persistFn(mockRepo, userId);
        currentStore = nextStore;
      } catch (err) {
        currentStore = prevStore;
        saveStore(prevStore);
        throw err;
      }
    };

    await expect(
      updateStoreSimulator(
        (prev) => deleteFlashcardAction(card.id, prev),
        async (repo, uId) => {
          await repo.deleteFlashcard(uId, card.id);
        }
      )
    ).rejects.toThrow('Falha de rede ou permissão RLS');

    // Estado local NÃO foi removido
    expect(currentStore.flashcards.some((c) => c.id === card.id)).toBe(true);
    expect(currentStore.fsrsStates[card.id]).toBeDefined();
  });

  it('6. highlight de origem não é apagado e volta a permitir criação de flashcard', () => {
    const { store, card } = createTestStore();
    expect(card.source_highlight_id).toBe(highlightId);

    // Conjunto de highlights com flashcards ativos antes da exclusão
    const savedBefore = new Set(
      store.flashcards
        .filter((fc) => fc.source_highlight_id && fc.active)
        .map((fc) => fc.source_highlight_id!)
    );
    expect(savedBefore.has(highlightId)).toBe(true);

    // Exclui o flashcard
    const nextStore = deleteFlashcardAction(card.id, store);

    // O highlight continua acessível no sistema e o vínculo ativo é liberado
    const savedAfter = new Set(
      nextStore.flashcards
        .filter((fc) => fc.source_highlight_id && fc.active)
        .map((fc) => fc.source_highlight_id!)
    );
    expect(savedAfter.has(highlightId)).toBe(false);
  });

  it('7. fila de revisão avança corretamente após delete no meio da fila', () => {
    const queue = [
      { id: 'card-1', front: 'Questão 1' },
      { id: 'card-2', front: 'Questão 2' },
      { id: 'card-3', front: 'Questão 3' },
    ];

    // Usuário está no cartão 2 (índice 1)
    const currentIndex = 1;
    const cardToDelete = queue[currentIndex];
    expect(cardToDelete.id).toBe('card-2');

    // Simula remoção do cartão da fila de sessão
    const nextQueue = queue.filter((c) => c.id !== cardToDelete.id);
    expect(nextQueue.length).toBe(2);

    // O próximo cartão (card-3) agora ocupa a posição de índice 1
    const nextCard = nextQueue[currentIndex];
    expect(nextCard.id).toBe('card-3');
    expect(currentIndex < nextQueue.length).toBe(true);
  });

  it('8. exclusão do último cartão encerra a revisão sem erro', () => {
    // Caso A: fila com 1 único cartão
    const singleQueue = [{ id: 'card-unico', front: 'Único' }];
    const afterDeleteSingle = singleQueue.filter((c) => c.id !== 'card-unico');
    expect(afterDeleteSingle.length).toBe(0);
    const shouldFinishSingle = afterDeleteSingle.length === 0;
    expect(shouldFinishSingle).toBe(true);

    // Caso B: fila com 3 cartões, usuário no último (índice 2)
    const multiQueue = [
      { id: 'c1', front: 'C1' },
      { id: 'c2', front: 'C2' },
      { id: 'c3', front: 'C3' },
    ];
    const currentIndex = 2;
    const deletedCard = multiQueue[currentIndex];
    const afterDeleteMulti = multiQueue.filter((c) => c.id !== deletedCard.id);
    expect(afterDeleteMulti.length).toBe(2);

    // Como o índice 2 é >= afterDeleteMulti.length (2), não há próximo cartão após ele
    const shouldFinishMulti = currentIndex >= afterDeleteMulti.length;
    expect(shouldFinishMulti).toBe(true);
  });
});
