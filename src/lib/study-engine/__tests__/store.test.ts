import { describe, it, expect } from 'vitest';
import {
  loadStore,
  recordQuestionSessionAction,
  recordErrorLogAction,
  createFlashcardAction,
  reviewFlashcardAction,
  getDueFlashcards,
} from '@/lib/data/store';
import { Rating } from 'ts-fsrs';

describe('Data Store & Business Workflows Integration', () => {
  it('loads store with 94 Camara topics and 4 subjects by default', () => {
    const store = loadStore();
    expect(store.subjects).toHaveLength(4);
    expect(store.topics).toHaveLength(94);
    expect(store.materials).toHaveLength(94);
    expect(store.exam.name).toBe('Câmara dos Deputados 2027');
  });

  it('records a TEC question session and automatically recalculates domain and study score', () => {
    const store = loadStore();
    const topicId = 'top-adm-1'; // Lei 14.133 visão geral

    const updatedStore = recordQuestionSessionAction(
      {
        user_id: 'local-user',
        exam_id: store.exam.id,
        subject_id: 'sub-administrativo',
        topic_id: topicId,
        performed_at: new Date().toISOString(),
        total_questions: 30,
        correct: 25,
        wrong: 5,
        blank: 0,
        duration_seconds: 1800,
        subjective_feeling: 'REASONABLE',
        notes: 'Treino de licitações Cebraspe',
        accuracy_rate: 25 / 30,
        net_points: 20,
        net_rate: 20 / 30,
        had_conceptual_error: false,
      },
      store
    );

    expect(updatedStore.questionSessions).toHaveLength(1);
    const updatedTopic = updatedStore.topics.find((t) => t.id === topicId);
    expect(updatedTopic).toBeDefined();
    expect(updatedTopic?.status).toBe('CONSOLIDATING');
    expect(updatedTopic?.domain_score).toBeGreaterThan(60);
    expect(updatedTopic?.domain_confidence).toBe('LOW'); // only 1 session
  });

  it('records an error log and allows converting to a flashcard', () => {
    const store = loadStore();
    const topicId = 'top-adm-7'; // Dispensa de licitação

    const { store: storeWithError, errorId } = recordErrorLogAction(
      {
        user_id: 'local-user',
        exam_id: store.exam.id,
        subject_id: 'sub-administrativo',
        topic_id: topicId,
        question_session_id: null,
        error_type: 'CONCEPT_CONFUSION',
        summary: 'Confundi dispensa com inexigibilidade no valor de pequeno porte',
        correct_rule: 'Art. 75, I e II da Lei 14.133 trata de dispensa por valor.',
        personal_note: 'Inexigibilidade é sempre inviabilidade de competição (Art. 74).',
        severity: 'HIGH',
        resolved: false,
        resolved_at: null,
      },
      store
    );

    expect(storeWithError.errorLogs).toHaveLength(1);
    expect(storeWithError.errorLogs[0].id).toBe(errorId);

    // Convert to flashcard
    const storeWithCard = createFlashcardAction(
      {
        user_id: 'local-user',
        exam_id: store.exam.id,
        subject_id: 'sub-administrativo',
        topic_id: topicId,
        card_type: 'ERROR',
        front: 'Qual o fundamento para contratação por valor de pequeno porte: dispensa ou inexigibilidade?',
        back: 'Dispensa de licitação (art. 75 da Lei 14.133/2021).',
        source_type: 'ERROR_LOG',
        source_material_id: null,
        source_error_id: errorId,
        exam_priority: 'HIGH',
        priority_boost: 0,
        active: true,
        suspended: false,
      },
      storeWithError
    );

    expect(storeWithCard.flashcards).toHaveLength(1);
    const cardId = storeWithCard.flashcards[0].id;
    expect(storeWithCard.fsrsStates[cardId]).toBeDefined();

    // Check due cards: newly created card is due immediately
    const dueCards = getDueFlashcards(storeWithCard, new Date(Date.now() + 1000));
    expect(dueCards.length).toBeGreaterThanOrEqual(1);

    // Review the card with Good
    const reviewedStore = reviewFlashcardAction(cardId, Rating.Good, 4200, storeWithCard);
    expect(reviewedStore.reviews).toHaveLength(1);
    expect(reviewedStore.fsrsStates[cardId].reps).toBe(1);
  });
});
