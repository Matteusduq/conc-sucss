import { describe, it, expect } from 'vitest';
import {
  getDefaultStore,
  recordQuestionSessionAction,
  reviewFlashcardAction,
  updateMaterialProgressAction,
  recordDiscursiveSessionAction,
  recordMockExamAction,
  recordStudySessionAction,
  migrateV2ToV3,
  AppStoreData,
} from '@/lib/data/store';
import {
  GAMIFICATION_RULES,
  getLevel,
  getLevelProgress,
} from '../xp';
import {
  calculateJourneyPhase,
  calculateAcademicProgress,
  COVERAGE_CONSOLIDATION_THRESHOLD,
} from '../journey';
import {
  isMeaningfulStudyDay,
  calculateStreaks,
  calculateWeeklyConsistency,
} from '../streak';
import {
  generateDailyMissions,
  getOrCreateDailyMissions,
  updateMissionsProgress,
} from '../missions';
import {
  calculateMockExamScore,
  buildMockExamRecord,
  qualifiesForWeeklyBoss,
} from '../mock-exam';
import { processGamification } from '../engine';
import { evaluateAchievements } from '../achievements';
import { Rating } from 'ts-fsrs';
import { generateDailyPlan } from '@/lib/study-engine/recommendations';
import { DailyMission } from '../types';
import { Flashcard, DiscursiveSession } from '@/types/database';

function makeFlashcard(id: string, overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id,
    user_id: 'local-user',
    exam_id: 'cd-2026',
    subject_id: 'p1-port',
    topic_id: 'top-p1-port-1',
    card_type: 'CONTENT',
    front: 'Q',
    back: 'A',
    source_type: 'MANUAL',
    source_material_id: null,
    source_error_id: null,
    source_highlight_id: null,
    explanation: null,
    exam_priority: 'HIGH',
    priority_boost: 0,
    active: true,
    suspended: false,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function makeDiscursiveSession(id: string, calculated_score: number): DiscursiveSession {
  return {
    id,
    user_id: 'local-user',
    exam_id: 'exam-camara-2027',
    type: 'QUESTION_20_LINES',
    title: 'Tema Teste',
    prompt_summary: 'Resumo prompt',
    related_subject_id: null,
    related_topic_id: null,
    duration_seconds: 1800,
    lines_written: 15,
    content_score: 2,
    language_errors: 0,
    calculated_score,
    notes: null,
    performed_at: new Date().toISOString(),
    created_at: '',
    updated_at: '',
  };
}

describe('FASE 2 — JORNADA GAMIFICADA E SISTEMA ADAPTATIVO (Testes Obrigatórios)', () => {
  // Test 1: XP não é concedido por abrir página
  it('1. XP não é concedido por abrir página ou carregar loja', () => {
    const store = getDefaultStore();
    expect(store.gamificationProfile.total_xp).toBe(0);
    expect(store.xpTransactions).toHaveLength(0);

    // Simulated page visit by running processGamification with no new study events
    const { store: updated } = processGamification(store);
    expect(updated.gamificationProfile.total_xp).toBe(0);
    expect(updated.xpTransactions).toHaveLength(0);
  });

  // Test 2: QuestionSession válida gera XP
  it('2. QuestionSession válida gera XP (2 XP por questão + bônus se >= 15)', () => {
    let store = getDefaultStore();
    const sessionDate = '2026-10-15T10:00:00-03:00';

    // 10 questions -> 20 XP (no completion bonus)
    store = recordQuestionSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        subject_id: 'sub-portugues',
        topic_id: 'top-p1-port-1',
        performed_at: sessionDate,
        total_questions: 10,
        correct: 8,
        wrong: 2,
        blank: 0,
        duration_seconds: 600,
        subjective_feeling: 'REASONABLE',
        notes: null,
        accuracy_rate: 0.8,
        net_points: 6,
        net_rate: 0.6,
        had_conceptual_error: false,
      },
      store
    );

    expect(store.gamificationProfile.total_xp).toBe(20);
    expect(store.xpTransactions).toHaveLength(1);
    expect(store.xpTransactions[0].amount).toBe(20);

    // Add session with 20 questions -> 40 XP volume + 20 XP bonus = 60 XP
    store = recordQuestionSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        subject_id: 'sub-portugues',
        topic_id: 'top-p1-port-2',
        performed_at: sessionDate,
        total_questions: 20,
        correct: 16,
        wrong: 4,
        blank: 0,
        duration_seconds: 1200,
        subjective_feeling: 'MASTERED',
        notes: null,
        accuracy_rate: 0.8,
        net_points: 12,
        net_rate: 0.6,
        had_conceptual_error: false,
      },
      store
    );

    // 20 (session 1) + 40 (session 2 volume) + 20 (session 2 bonus >= 15) = 80 XP
    // + 50 XP from 'first_battery' achievement unlock (first session with >= 15 questions) = 130 XP
    expect(store.gamificationProfile.total_xp).toBe(130);
    expect(store.gamificationProfile.achievements_unlocked).toContain('first_battery');
  });

  // Test 3: Mesmo QuestionSession não gera XP duas vezes
  it('3. Mesmo QuestionSession não gera XP duas vezes (Idempotência)', () => {
    let store = getDefaultStore();
    store = recordQuestionSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        subject_id: 'sub-portugues',
        topic_id: 'top-p1-port-1',
        performed_at: '2026-10-15T12:00:00-03:00',
        total_questions: 15,
        correct: 12,
        wrong: 3,
        blank: 0,
        duration_seconds: 900,
        subjective_feeling: 'REASONABLE',
        notes: null,
        accuracy_rate: 0.8,
        net_points: 9,
        net_rate: 0.6,
        had_conceptual_error: false,
      },
      store
    );

    const xpAfterFirst = store.gamificationProfile.total_xp;
    const txCountAfterFirst = store.xpTransactions.length;

    // Running processGamification repeatedly with the same store
    const { store: processedAgain } = processGamification(store);
    expect(processedAgain.gamificationProfile.total_xp).toBe(xpAfterFirst);
    expect(processedAgain.xpTransactions.length).toBe(txCountAfterFirst);
  });

  // Test 4: Reload não duplica XP
  it('4. Reload / migração não duplica XP', () => {
    let store = getDefaultStore();
    store = recordQuestionSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        subject_id: 'sub-portugues',
        topic_id: 'top-p1-port-1',
        performed_at: '2026-10-15T14:00:00-03:00',
        total_questions: 10,
        correct: 8,
        wrong: 2,
        blank: 0,
        duration_seconds: 600,
        subjective_feeling: 'REASONABLE',
        notes: null,
        accuracy_rate: 0.8,
        net_points: 6,
        net_rate: 0.6,
        had_conceptual_error: false,
      },
      store
    );

    const initialXp = store.gamificationProfile.total_xp;

    // Simulate reload via migrateV2ToV3
    const reloaded = migrateV2ToV3(store);
    expect(reloaded.gamificationProfile.total_xp).toBe(initialXp);
  });

  // Test 5: Material completion gera bônus apenas uma vez
  it('5. Material completion gera bônus (+80 XP) apenas uma vez', () => {
    let store = getDefaultStore();
    const materialId = store.materials[0].id;
    const topicId = store.materials[0].topic_id;

    // 1st completion
    store = updateMaterialProgressAction(
      {
        material_id: materialId,
        topic_id: topicId,
        user_id: 'local-user',
        current_page: 50,
        max_page_reached: 50,
        progress_percent: 100,
        completed: true,
        total_study_seconds: 1800,
      },
      store
    );

    const completionTx = store.xpTransactions.filter(
      (t) => t.rule_id === `MATERIAL_COMPLETED_${topicId}`
    );
    expect(completionTx).toHaveLength(1);
    expect(completionTx[0].amount).toBe(80);

    // Reopen material and save again
    store = updateMaterialProgressAction(
      {
        material_id: materialId,
        topic_id: topicId,
        user_id: 'local-user',
        current_page: 50,
        completed: true,
        total_study_seconds: 2400,
      },
      store
    );

    const completionTxAfter = store.xpTransactions.filter(
      (t) => t.rule_id === `MATERIAL_COMPLETED_${topicId}`
    );
    expect(completionTxAfter).toHaveLength(1);
  });

  // Test 6: Flashcard devido gera XP dentro dos limites
  it('6. Flashcard devido gera XP dentro dos limites (1 XP, cap 30/dia)', () => {
    let store = getDefaultStore();
    // Create flashcard
    store = {
      ...store,
      flashcards: [
        {
          id: 'fc-test-1',
          user_id: 'local-user',
          exam_id: 'exam-camara-2027',
          subject_id: 'sub-portugues',
          topic_id: 'top-p1-port-1',
          card_type: 'CONTENT',
          front: 'Q',
          back: 'A',
          source_type: 'MANUAL',
          source_material_id: null,
          source_error_id: null,
          source_highlight_id: null,
          explanation: null,
          exam_priority: 'HIGH',
          priority_boost: 0,
          active: true,
          suspended: false,
          created_at: '',
          updated_at: '',
        },
      ],
      fsrsStates: {
        'fc-test-1': {
          flashcard_id: 'fc-test-1',
          user_id: 'local-user',
          due: new Date(Date.now() - 3600000).toISOString(),
          stability: 2,
          difficulty: 5,
          elapsed_days: 1,
          scheduled_days: 1,
          learning_steps: 0,
          reps: 1,
          lapses: 0,
          state: 1,
          last_review: null,
          updated_at: '',
        },
      },
    };

    store = reviewFlashcardAction('fc-test-1', Rating.Good, 1500, store);

    const cardTx = store.xpTransactions.filter((t) => t.source_type === 'flashcard_review');
    expect(cardTx.length).toBeGreaterThanOrEqual(1);
    expect(cardTx[0].amount).toBe(1);
  });

  // Test 7: Revisão repetida não permite farming indevido
  it('7. Revisão repetida não permite farming indevido além do daily cap', () => {
    let store = getDefaultStore();
    // Simulate 35 reviews on the same day
    const testDate = '2026-10-15T09:00:00-03:00';
    const fakeReviews = Array.from({ length: 35 }).map((_, i) => ({
      id: `rev-farm-${i}`,
      user_id: 'local-user',
      flashcard_id: `fc-dummy-${i}`,
      reviewed_at: testDate,
      rating: 'GOOD' as const,
      response_time_ms: 1000,
      state_before: {},
      state_after: {},
      fsrs_log: null,
      created_at: testDate,
    }));

    store = {
      ...store,
      reviews: fakeReviews,
    };

    const { store: processed } = processGamification(store, testDate);
    const reviewXp = processed.xpTransactions
      .filter((t) => t.rule_id.startsWith('FLASHCARD_DUE_REVIEW'))
      .reduce((sum, t) => sum + t.amount, 0);

    // Cannot exceed 30 XP per day
    expect(reviewXp).toBe(GAMIFICATION_RULES.FLASHCARDS.DAILY_UNIT_REVIEW_CAP);
  });

  // Test 8: DiscursiveSession gera XP correto
  it('8. DiscursiveSession gera XP correto (60 XP Q20, 100 XP Peça)', () => {
    let store = getDefaultStore();

    // 20-line question
    const resQ = recordDiscursiveSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        type: 'QUESTION_20_LINES',
        performed_at: '2026-10-15T15:00:00-03:00',
        title: 'Controle de Constitucionalidade',
        prompt_summary: 'Discorra sobre...',
        related_subject_id: 'sub-constitucional',
        related_topic_id: 'top-p1-const-1',
        duration_seconds: 1800,
        lines_written: 18,
        content_score: 13,
        language_errors: 1,
        notes: null,
      },
      store
    );
    store = resQ.store;

    const qTx = store.xpTransactions.find((t) => t.source_type === 'discursive_session');
    expect(qTx?.amount).toBe(60);

    // 50-line technical piece
    const resPiece = recordDiscursiveSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        type: 'TECHNICAL_PIECE_50_LINES',
        performed_at: '2026-10-15T16:00:00-03:00',
        title: 'Parecer sobre Tramitação de PEC',
        prompt_summary: 'Elabore parecer...',
        related_subject_id: 'sub-processo-legislativo',
        related_topic_id: 'top-p2-leg-1',
        duration_seconds: 3600,
        lines_written: 46,
        content_score: 28,
        language_errors: 2,
        notes: null,
      },
      store
    );
    store = resPiece.store;

    const pieceTx = store.xpTransactions.find((t) => t.amount === 100);
    expect(pieceTx).toBeDefined();
    expect(pieceTx?.amount).toBe(100);
  });

  // Test 9: Achievement só desbloqueia uma vez
  it('9. Achievement só desbloqueia uma vez e emite XP único', () => {
    let store = getDefaultStore();
    // Simulate completing 1 mission
    store = {
      ...store,
      dailyMissions: {
        '2026-10-15': [
          {
            id: 'mis-test-1',
            date: '2026-10-15',
            type: 'CORE_STUDY',
            title: 'Missão Teste',
            description: '',
            target_value: 10,
            current_value: 10,
            unit: 'min',
            xp_reward: 25,
            status: 'COMPLETED',
            reason: '',
            source: '',
            created_at: '',
          },
        ],
      },
    };

    const firstEval = evaluateAchievements(store, []);
    expect(firstEval.newlyUnlocked.some((a) => a.id === 'first_mission')).toBe(true);

    const secondEval = evaluateAchievements(store, firstEval.allUnlockedIds);
    expect(secondEval.newlyUnlocked).toHaveLength(0);
  });

  // Test 10: Level sobe corretamente
  it('10. Level sobe corretamente conforme acúmulo de XP', () => {
    expect(getLevel(0)).toBe(1);
    expect(getLevel(500)).toBe(1);
    expect(getLevel(1000)).toBe(2);
    expect(getLevel(2500)).toBe(3);

    const progress = getLevelProgress(2500);
    expect(progress.level).toBe(3);
    expect(progress.currentXpInLevel).toBe(500);
    expect(progress.xpNeededForNext).toBe(500);
    expect(progress.progressPercent).toBe(50);
  });

  // Test 11: Level nunca diminui
  it('11. Level nunca diminui mesmo se recalcular com eventos estáticos', () => {
    const store = getDefaultStore();
    store.gamificationProfile.total_xp = 3500;
    store.gamificationProfile.level = 4;

    const { store: processed } = processGamification(store);
    expect(processed.gamificationProfile.level).toBeGreaterThanOrEqual(4);
  });

  // Test 12: Streak depende de meaningful study
  it('12. Streak depende de meaningful study (sessão >= 10 questões ou estudo >= 20 min)', () => {
    const today = '2026-10-15';
    const yesterday = '2026-10-14';

    const ctxEmpty = {
      questionSessions: [],
      materialProgress: {},
      reviews: [],
      discursiveSessions: [],
      mockExams: [],
    };
    expect(isMeaningfulStudyDay(today, ctxEmpty)).toBe(false);

    // 5 questions -> NOT meaningful
    const ctx5Q = {
      ...ctxEmpty,
      questionSessions: [
        {
          id: 'qs-1',
          user_id: 'u1',
          exam_id: 'e1',
          subject_id: 's1',
          topic_id: 't1',
          performed_at: `${today}T10:00:00-03:00`,
          total_questions: 5,
          correct: 4,
          wrong: 1,
          blank: 0,
          duration_seconds: 300,
          subjective_feeling: 'REASONABLE' as const,
          notes: null,
          accuracy_rate: 0.8,
          net_points: 3,
          net_rate: 0.6,
          had_conceptual_error: false,
          created_at: '',
          updated_at: '',
        },
      ],
    };
    expect(isMeaningfulStudyDay(today, ctx5Q)).toBe(false);

    // 10 questions -> meaningful!
    const ctx10Q = {
      ...ctxEmpty,
      questionSessions: [
        {
          ...ctx5Q.questionSessions[0],
          total_questions: 10,
        },
      ],
    };
    expect(isMeaningfulStudyDay(today, ctx10Q)).toBe(true);

    // Streaks calculation
    const streaks = calculateStreaks([yesterday, today], today);
    expect(streaks.currentStreak).toBe(2);
    expect(streaks.longestStreak).toBe(2);
  });

  // Test 13: Login isolado não mantém streak
  it('13. Login isolado não mantém streak sem atividade substancial', () => {
    const today = '2026-10-15';
    const twoDaysAgo = '2026-10-13';

    // Last meaningful study was 2 days ago, today only logged in
    const streaks = calculateStreaks([twoDaysAgo], today);
    expect(streaks.currentStreak).toBe(0);
  });

  // Test 14: Consistência semanal é calculada corretamente
  it('14. Consistência semanal (Ritmo da Semana) é calculada corretamente', () => {
    const today = '2026-10-15'; // Thursday
    const meaningfulDates = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15']; // Mon, Tue, Wed, Thu

    const rhythm = calculateWeeklyConsistency(meaningfulDates, today, 6);
    expect(rhythm.daysStudiedThisWeek).toBe(4);
    expect(rhythm.targetDays).toBe(6);
    expect(rhythm.isTargetMet).toBe(false);
  });

  // Test 15: Missão diária é estável no mesmo dia
  it('15. Missão diária é estável e não se altera ao recarregar a mesma data', () => {
    const store = getDefaultStore();
    // Provide available material for top starter topic so it has stable executable daily missions
    store.materials = store.materials.map((m) =>
      m.topic_id === 'top-p2-ling-3' ? { ...m, status: 'AVAILABLE', storage_path: '/p.pdf' } : m
    );
    const today = '2026-10-15';

    const { missions: firstRun, store: store1 } = getOrCreateDailyMissions(today, store);
    expect(firstRun.length).toBeGreaterThanOrEqual(2);

    const firstMainTitle = firstRun[0].title;

    // Call again with store1 containing dailyMissions[today]
    const { missions: secondRun } = getOrCreateDailyMissions(today, store1);
    expect(secondRun[0].title).toBe(firstMainTitle);
    expect(secondRun[0].id).toBe(firstRun[0].id);
  });

  // Test 16: Missão principal respeita generateDailyPlan
  it('16. Missão principal nasce estritamente de generateDailyPlan().tasks[0]', () => {
    const store = getDefaultStore();
    const plan = generateDailyPlan({
      topics: store.topics,
      subjects: store.subjects,
      materials: store.materials,
      errors: store.errorLogs,
      overdueCardsCount: 0,
    });

    const missions = generateDailyMissions('2026-10-15', store);
    const mainMission = missions.find((m) => m.is_main);

    expect(mainMission).toBeDefined();
    expect(mainMission?.topic_id).toBe(plan.tasks[0].topicId);
  });

  // Test 17: Mudança de StudyScore influencia próximo plano
  it('17. Mudança de StudyScore / AT_RISK influencia próximo plano e novas missões', () => {
    let store = getDefaultStore();

    // Mark a P1 topic as AT_RISK
    store = {
      ...store,
      topics: store.topics.map((t) =>
        t.id === 'top-p1-port-1'
          ? {
              ...t,
              status: 'AT_RISK' as const,
              domain_score: 30,
              domain_confidence: 'MEDIUM' as const,
              study_score: 99,
            }
          : t
      ),
    };

    // Fresh date should generate main mission with top-p1-port-1
    const nextDate = '2026-10-16';
    const missions = generateDailyMissions(nextDate, store);
    expect(missions[0].topic_id).toBe('top-p1-port-1');
  });

  // Test 18: Mission completion deriva dos eventos reais
  it('18. Conclusão de missões deriva automaticamente dos eventos reais', () => {
    let store = getDefaultStore();
    // Set first starter topic to AWAITING_QUESTIONS so it generates a QUESTIONS mission
    store.topics = store.topics.map((t) =>
      t.id === 'top-p2-ling-3' ? { ...t, status: 'AWAITING_QUESTIONS' } : t
    );

    const today = '2026-10-15';
    const { missions } = getOrCreateDailyMissions(today, store);

    // Initial status should be PENDING
    expect(missions[0].status).toBe('PENDING');
    expect(missions[0].type).toBe('QUESTIONS');

    // Simulate user completing questions matching mission 1
    const targetQ = missions[0].target_value;
    store = recordQuestionSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        subject_id: missions[0].subject_id || 'sub-linguistica',
        topic_id: missions[0].topic_id || 'top-p2-ling-3',
        performed_at: `${today}T11:00:00-03:00`,
        total_questions: targetQ,
        correct: targetQ,
        wrong: 0,
        blank: 0,
        duration_seconds: 1200,
        subjective_feeling: 'MASTERED',
        notes: null,
        accuracy_rate: 1.0,
        net_points: targetQ,
        net_rate: 1.0,
        had_conceptual_error: false,
      },
      store
    );

    // Recheck mission progress with (missions, today, store)
    const updatedMissions = updateMissionsProgress(missions, today, store);
    expect(updatedMissions[0].current_value).toBeGreaterThanOrEqual(targetQ);
    expect(updatedMissions[0].status).toBe('COMPLETED');
  });

  // Test 19: WEEKLY_BOSS funciona
  it('19. WEEKLY_BOSS / Checkpoint Semanal funciona e concede 120 XP', () => {
    let store = getDefaultStore();

    const res = recordMockExamAction(
      {
        p1_correct: 12,
        p1_wrong: 3,
        p1_blank: 0,
        p2_correct: 12,
        p2_wrong: 3,
        p2_blank: 0,
        type: 'WEEKLY_CHECKPOINT',
        performed_at: '2026-10-15T18:00:00-03:00',
        duration_seconds: 3600,
        notes: 'Checkpoint semanal concluído',
      },
      store
    );
    store = res.store;

    const bossTx = store.xpTransactions.find((t) => t.source_type === 'mock_exam');
    expect(bossTx).toBeDefined();
    expect(bossTx?.amount).toBe(GAMIFICATION_RULES.SIMULADOS.XP_WEEKLY_CHECKPOINT);
  });

  // Test 20: MockExam calcula P1, P2 e total líquidos
  it('20. MockExam calcula P1, P2 e total líquidos com precisão Cebraspe', () => {
    // P1: 50 C, 20 E, 20 B -> P1 net = 30
    // P2: 60 C, 15 E, 15 B -> P2 net = 45
    // Total net = 75
    const evaluation = calculateMockExamScore({
      p1_correct: 50,
      p1_wrong: 20,
      p1_blank: 20,
      p2_correct: 60,
      p2_wrong: 15,
      p2_blank: 15,
    });

    expect(evaluation.p1_net).toBe(30);
    expect(evaluation.p2_net).toBe(45);
    expect(evaluation.net_points).toBe(75);
    expect(evaluation.total_questions).toBe(180);
    expect(evaluation.isAboveEliminatoryThreshold).toBe(true);
    expect(evaluation.statusLabel).toContain('Acima do mínimo eliminatório');
  });

  // Test 21: Thresholds 18/27/54 estão corretos
  it('21. Thresholds oficiais do edital (P1 >= 18, P2 >= 27, Total >= 54) são respeitados', () => {
    // Case 1: Below P1 minimum (P1 net = 17, P2 net = 40, Total net = 57)
    const belowP1 = calculateMockExamScore({
      p1_correct: 25,
      p1_wrong: 8, // net = 17 (< 18)
      p1_blank: 57,
      p2_correct: 50,
      p2_wrong: 10, // net = 40 (>= 27)
      p2_blank: 30,
    });
    expect(belowP1.isP1AboveMinimum).toBe(false);
    expect(belowP1.isAboveEliminatoryThreshold).toBe(false);
    expect(belowP1.statusLabel).toContain('Abaixo do mínimo');

    // Case 2: Below P2 minimum (P1 net = 25, P2 net = 26, Total net = 51)
    const belowP2 = calculateMockExamScore({
      p1_correct: 30,
      p1_wrong: 5, // net = 25
      p1_blank: 55,
      p2_correct: 36,
      p2_wrong: 10, // net = 26 (< 27)
      p2_blank: 44,
    });
    expect(belowP2.isP2AboveMinimum).toBe(false);
    expect(belowP2.isAboveEliminatoryThreshold).toBe(false);

    // Case 3: Exactly on boundaries (P1 = 18, P2 = 27, Total = 54 -> wait 18+27 = 45 < 54 total!)
    // Both blocks at minimum sum to 45, which fails total minimum of 54!
    const atMinBlocks = calculateMockExamScore({
      p1_correct: 18,
      p1_wrong: 0, // net = 18
      p1_blank: 72,
      p2_correct: 27,
      p2_wrong: 0, // net = 27
      p2_blank: 63,
    });
    expect(atMinBlocks.isP1AboveMinimum).toBe(true);
    expect(atMinBlocks.isP2AboveMinimum).toBe(true);
    expect(atMinBlocks.isTotalAboveMinimum).toBe(false); // 45 < 54
    expect(atMinBlocks.isAboveEliminatoryThreshold).toBe(false);

    // Case 4: Passing all three (P1 = 20, P2 = 35 -> Total = 55 >= 54)
    const passAll = calculateMockExamScore({
      p1_correct: 25,
      p1_wrong: 5, // net = 20
      p1_blank: 60,
      p2_correct: 40,
      p2_wrong: 5, // net = 35
      p2_blank: 45,
    });
    expect(passAll.isP1AboveMinimum).toBe(true);
    expect(passAll.isP2AboveMinimum).toBe(true);
    expect(passAll.isTotalAboveMinimum).toBe(true);
    expect(passAll.isAboveEliminatoryThreshold).toBe(true);
  });

  // Test 22: JourneyPhase muda corretamente pelo tempo
  it('22. JourneyPhase muda determinísticamente conforme dias para a prova', () => {
    const baseContext = {
      daysUntilExam: 94,
      totalTopics: 76,
      startedTopics: 10,
      masteredTopics: 0,
      atRiskTopics: 0,
      p1StartedTopics: 5,
      p1TotalTopics: 42,
      p2StartedTopics: 5,
      p2TotalTopics: 34,
      averageDomainScore: 40,
      totalQuestions: 100,
      discursiveSessionsCount: 0,
      mockExamsCount: 0,
    };

    // > 60 days, low coverage -> BASE
    const basePhase = calculateJourneyPhase(baseContext);
    expect(basePhase.phase).toBe('BASE');
    expect(basePhase.phaseNumber).toBe(1);

    // 45 days -> CONSOLIDATION
    const consolPhase = calculateJourneyPhase({ ...baseContext, daysUntilExam: 45 });
    expect(consolPhase.phase).toBe('CONSOLIDATION');
    expect(consolPhase.phaseNumber).toBe(2);

    // 25 days -> EXAM_MODE
    const examModePhase = calculateJourneyPhase({ ...baseContext, daysUntilExam: 25 });
    expect(examModePhase.phase).toBe('EXAM_MODE');
    expect(examModePhase.phaseNumber).toBe(3);

    // 10 days -> FINAL_SPRINT
    const sprintPhase = calculateJourneyPhase({ ...baseContext, daysUntilExam: 10 });
    expect(sprintPhase.phase).toBe('FINAL_SPRINT');
    expect(sprintPhase.phaseNumber).toBe(4);

    // 0 days -> POST_EXAM
    const postExam = calculateJourneyPhase({ ...baseContext, daysUntilExam: 0 });
    expect(postExam.phase).toBe('POST_EXAM');
  });

  // Test 23: Cobertura alta pode antecipar CONSOLIDATION
  it('23. Cobertura relevante (>= 65%) antecipa CONSOLIDATION mesmo com > 60 dias para a prova', () => {
    const highCoverageContext = {
      daysUntilExam: 94, // Far away from exam
      totalTopics: 76,
      startedTopics: 55, // ~72% coverage (> 65%)
      masteredTopics: 10,
      atRiskTopics: 2,
      p1StartedTopics: 30,
      p1TotalTopics: 42,
      p2StartedTopics: 25,
      p2TotalTopics: 34,
      averageDomainScore: 65,
      totalQuestions: 800,
      discursiveSessionsCount: 5,
      mockExamsCount: 3,
    };

    const phaseInfo = calculateJourneyPhase(highCoverageContext);
    expect(phaseInfo.coveragePercent).toBeGreaterThanOrEqual(COVERAGE_CONSOLIDATION_THRESHOLD);
    expect(phaseInfo.phase).toBe('CONSOLIDATION');
  });

  // Test 24: <= 14 dias entra em FINAL_SPRINT
  it('24. Com <= 14 dias entra incondicionalmente em FINAL_SPRINT', () => {
    const sprintInfo = calculateJourneyPhase({
      daysUntilExam: 14,
      totalTopics: 76,
      startedTopics: 20,
      masteredTopics: 2,
      atRiskTopics: 1,
      p1StartedTopics: 10,
      p1TotalTopics: 42,
      p2StartedTopics: 10,
      p2TotalTopics: 34,
      averageDomainScore: 50,
      totalQuestions: 200,
      discursiveSessionsCount: 1,
      mockExamsCount: 1,
    });

    expect(sprintInfo.phase).toBe('FINAL_SPRINT');
  });

  // Test 25: Migração V2 -> V3 preserva dados
  it('25. Migração V2 -> V3 preserva integralmente sessões, erros, flashcards e discursivas', () => {
    const v2MockData: Partial<AppStoreData> = {
      questionSessions: [
        {
          id: 'qs-v2-1',
          user_id: 'local-user',
          exam_id: 'exam-camara-2027',
          subject_id: 'sub-portugues',
          topic_id: 'top-p1-port-1',
          performed_at: '2026-10-14T10:00:00-03:00',
          total_questions: 15,
          correct: 12,
          wrong: 3,
          blank: 0,
          duration_seconds: 900,
          subjective_feeling: 'REASONABLE',
          notes: null,
          accuracy_rate: 0.8,
          net_points: 9,
          net_rate: 0.6,
          had_conceptual_error: false,
          created_at: '2026-10-14T10:00:00-03:00',
          updated_at: '2026-10-14T10:00:00-03:00',
        },
      ],
      errorLogs: [
        {
          id: 'err-v2-1',
          user_id: 'local-user',
          exam_id: 'exam-camara-2027',
          subject_id: 'sub-portugues',
          topic_id: 'top-p1-port-1',
          question_session_id: null,
          error_type: 'CONCEPT_CONFUSION',
          summary: 'Dúvida crase',
          correct_rule: 'Regra geral',
          personal_note: null,
          severity: 'MEDIUM',
          resolved: true,
          resolved_at: '2026-10-14T12:00:00-03:00',
          created_at: '2026-10-14T11:00:00-03:00',
          updated_at: '2026-10-14T12:00:00-03:00',
        },
      ],
      discursiveSessions: [
        {
          id: 'disc-v2-1',
          user_id: 'local-user',
          exam_id: 'exam-camara-2027',
          type: 'QUESTION_20_LINES',
          performed_at: '2026-10-14T14:00:00-03:00',
          title: 'Discursiva teste',
          prompt_summary: null,
          related_subject_id: null,
          related_topic_id: null,
          duration_seconds: 1200,
          lines_written: 19,
          content_score: 12,
          language_errors: 1,
          calculated_score: 11.84,
          notes: null,
          created_at: '2026-10-14T14:00:00-03:00',
          updated_at: '2026-10-14T14:00:00-03:00',
        },
      ],
    };

    const migrated = migrateV2ToV3(v2MockData);

    expect(migrated.questionSessions).toHaveLength(1);
    expect(migrated.errorLogs).toHaveLength(1);
    expect(migrated.discursiveSessions).toHaveLength(1);
    expect(migrated.gamificationProfile).toBeDefined();
    expect(migrated.gamificationProfile.total_xp).toBeGreaterThan(0);
  });

  // Test 26: 182 SyllabusItems continuam existentes
  it('26. Mantém exatamente 182 SyllabusItems sem regressão', () => {
    const store = getDefaultStore();
    expect(store.syllabusItems).toHaveLength(182);
  });

  // Test 27: 76 Topics continuam existentes
  it('27. Mantém exatamente 76 Topics sem regressão', () => {
    const store = getDefaultStore();
    expect(store.topics).toHaveLength(76);
  });

  // Test 28: P1 continua com 42 Topics
  it('28. P1 continua com exatamente 42 Topics', () => {
    const store = getDefaultStore();
    const p1 = store.topics.filter((t) => t.exam_block_code === 'P1');
    expect(p1).toHaveLength(42);
  });

  // Test 29: P2 continua com 34 Topics
  it('29. P2 continua com exatamente 34 Topics', () => {
    const store = getDefaultStore();
    const p2 = store.topics.filter((t) => t.exam_block_code === 'P2');
    expect(p2).toHaveLength(34);
  });

  // Test 30: Academic progress calculation is distinct from XP and documented with dynamic weights
  it('30. Academic progress (Progresso da Preparação) calcula índice pedagógico real e distinto do XP', () => {
    const store = getDefaultStore();
    const result = calculateAcademicProgress(store.topics, store.discursiveSessions, null);

    expect(result.overallIndex).toBe(0);
    expect(result.preparationConfidence).toBe('NO_DATA');
    expect(result.domainScore).toBeNull();
    expect(result.retentionRate).toBeNull();
    expect(result.discursiveReadiness).toBeNull();
    expect(result.weights.coverage).toBe(1); // Coverage is the only available component with 0% data
    expect(result.riskPenalty).toBe(0);
  });
});

describe('PATCH 2.1 — Motor Adaptativo, Integridade Acadêmica e Bootstrap Pedagógico', () => {
  // 1. Fluxo Teoria -> Questão
  it('1. Fluxo Teoria: NOT_STARTED com material PENDING nunca gera TEC_QUESTIONS como missão', () => {
    const store = getDefaultStore();
    // In brand-new store, all materials are PENDING
    const plan = generateDailyPlan({
      topics: store.topics,
      subjects: store.subjects,
      materials: store.materials,
      errors: store.errorLogs,
      overdueCardsCount: 0,
      availableMinutesToday: 120,
    });

    const waitingTasks = plan.tasks.filter((t) => t.actionType === 'WAITING_MATERIAL');
    expect(waitingTasks.length).toBeGreaterThan(0);
    plan.tasks.forEach((t) => {
      expect(t.actionType).not.toBe('TEC_QUESTIONS');
      expect(t.actionType).toBe('WAITING_MATERIAL');
    });

    // Daily missions should not produce an executable mission if everything is waiting
    const { missions } = getOrCreateDailyMissions('2026-10-15', store);
    const executableMissions = missions.filter((m) => m.is_executable !== false);
    expect(executableMissions).toHaveLength(0);
    expect(missions[0].description).toContain('Os materiais ainda estão sendo preparados');
  });

  it('2. Fluxo Teoria: NOT_STARTED com material AVAILABLE gera READ_MATERIAL; concluído gera AWAITING_QUESTIONS -> TEC', () => {
    let store = getDefaultStore();
    // Simulate top starter topic having available material
    const topTopicId = 'top-p2-ling-3';
    store.materials = store.materials.map((m) =>
      m.topic_id === topTopicId ? { ...m, status: 'AVAILABLE', storage_path: '/materials/ling3.pdf' } : m
    );

    const plan = generateDailyPlan({
      topics: store.topics,
      subjects: store.subjects,
      materials: store.materials,
      errors: store.errorLogs,
      overdueCardsCount: 0,
      availableMinutesToday: 120,
    });

    const task1 = plan.tasks.find((t) => t.topicId === topTopicId);
    expect(task1).toBeDefined();
    expect(task1!.actionType).toBe('READ_MATERIAL');

    // Conclude material
    store = updateMaterialProgressAction(
      {
        material_id: store.materials.find((m) => m.topic_id === topTopicId)!.id,
        topic_id: topTopicId,
        user_id: 'local-user',
        completed: true,
        progress_percent: 100,
      },
      store
    );

    const updatedTopic = store.topics.find((t) => t.id === topTopicId);
    expect(updatedTopic!.status).toBe('AWAITING_QUESTIONS');

    const planAfterRead = generateDailyPlan({
      topics: store.topics,
      subjects: store.subjects,
      materials: store.materials,
      errors: store.errorLogs,
      overdueCardsCount: 0,
      availableMinutesToday: 120,
    });
    const taskAfterRead = planAfterRead.tasks.find((t) => t.topicId === topTopicId);
    expect(taskAfterRead!.actionType).toBe('TEC_QUESTIONS');
  });

  // 2. Memória / Flashcards
  it('3. Memória: zero cards ou zero due cards não geram missão MEMORY; due > 0 gera target = min(25, due)', () => {
    const store = getDefaultStore();
    expect(store.flashcards).toHaveLength(0);

    const missionsZeroCards = generateDailyMissions('2026-10-15', store);
    expect(missionsZeroCards.some((m) => m.type === 'MEMORY')).toBe(false);

    // Add a card that is due in the future (not due today)
    const futureStore: AppStoreData = {
      ...store,
      flashcards: [makeFlashcard('card-1')],
      fsrsStates: {
        'card-1': {
          flashcard_id: 'card-1',
          user_id: 'local-user',
          due: new Date(Date.now() + 86400000).toISOString(),
          stability: 2,
          difficulty: 3,
          elapsed_days: 0,
          scheduled_days: 1,
          learning_steps: 0,
          reps: 1,
          lapses: 0,
          state: 1,
          last_review: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    };

    const missionsNotDue = generateDailyMissions('2026-10-15', futureStore);
    expect(missionsNotDue.some((m) => m.type === 'MEMORY')).toBe(false);

    // 8 due cards -> target 8
    const store8Due: AppStoreData = {
      ...store,
      flashcards: Array.from({ length: 8 }, (_, i) => makeFlashcard(`c-${i}`)),
      fsrsStates: Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => [
          `c-${i}`,
          {
            flashcard_id: `c-${i}`,
            user_id: 'local-user',
            due: new Date(Date.now() - 1000).toISOString(),
            stability: 2,
            difficulty: 3,
            elapsed_days: 0,
            scheduled_days: 1,
            learning_steps: 0,
            reps: 1,
            lapses: 0,
            state: 1,
            last_review: null,
            updated_at: new Date().toISOString(),
          },
        ])
      ),
    };

    const missions8 = generateDailyMissions('2026-10-15', store8Due);
    const memory8 = missions8.find((m) => m.type === 'MEMORY');
    expect(memory8).toBeDefined();
    expect(memory8!.target_value).toBe(8);

    // 40 due cards -> target clamped to 25
    const store40Due: AppStoreData = {
      ...store,
      flashcards: Array.from({ length: 40 }, (_, i) => makeFlashcard(`c-${i}`)),
      fsrsStates: Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => [
          `c-${i}`,
          {
            flashcard_id: `c-${i}`,
            user_id: 'local-user',
            due: new Date(Date.now() - 1000).toISOString(),
            stability: 2,
            difficulty: 3,
            elapsed_days: 0,
            scheduled_days: 1,
            learning_steps: 0,
            reps: 1,
            lapses: 0,
            state: 1,
            last_review: null,
            updated_at: new Date().toISOString(),
          },
        ])
      ),
    };

    const missions40 = generateDailyMissions('2026-10-15', store40Due);
    const memory40 = missions40.find((m) => m.type === 'MEMORY');
    expect(memory40).toBeDefined();
    expect(memory40!.target_value).toBe(25);
  });

  // 3. Preparação Acadêmica
  it('4. Preparação: store zerado = 0%, retention = null, sem bônus de risco, 4 P3 ruins não geram 100%', () => {
    const store = getDefaultStore();
    const freshProgress = calculateAcademicProgress(store.topics, [], null);

    expect(freshProgress.overallIndex).toBe(0);
    expect(freshProgress.preparationConfidence).toBe('NO_DATA');
    expect(freshProgress.retentionRate).toBeNull();
    expect(freshProgress.domainScore).toBeNull();
    expect(freshProgress.riskPenalty).toBe(0);

    // 4 poor P3 sessions (score 2.0 out of 15 for Q20)
    const poorP3Sessions = [1, 2, 3, 4].map((i) => makeDiscursiveSession(`p3-${i}`, 2));

    const progressWithP3 = calculateAcademicProgress(store.topics, poorP3Sessions, null);
    expect(progressWithP3.discursiveReadiness).toBeDefined();
    expect(progressWithP3.discursiveReadiness!).toBeLessThan(50);
  });

  // 4. Boss Semanal & Simulado
  it('5. Boss Semanal: mock 5+5 não derrota, 15+15 na Base derrota, FULL_MOCK 90+90 válido, 89+90 inválido', () => {
    const baseBoss = { targetQuestions: 30, p1Target: 15, p2Target: 15 };

    const mock55 = buildMockExamRecord({
      p1_correct: 5,
      p1_wrong: 0,
      p1_blank: 0,
      p2_correct: 5,
      p2_wrong: 0,
      p2_blank: 0,
      type: 'WEEKLY_CHECKPOINT',
    });
    expect(qualifiesForWeeklyBoss(mock55, baseBoss)).toBe(false);

    const mock1515 = buildMockExamRecord({
      p1_correct: 15,
      p1_wrong: 0,
      p1_blank: 0,
      p2_correct: 15,
      p2_wrong: 0,
      p2_blank: 0,
      type: 'WEEKLY_CHECKPOINT',
    });
    expect(qualifiesForWeeklyBoss(mock1515, baseBoss)).toBe(true);

    const fullMock9090 = buildMockExamRecord({
      p1_correct: 80,
      p1_wrong: 10,
      p1_blank: 0,
      p2_correct: 85,
      p2_wrong: 5,
      p2_blank: 0,
      type: 'FULL_MOCK',
    });
    expect(qualifiesForWeeklyBoss(fullMock9090, baseBoss)).toBe(true);

    const fullMock8990 = buildMockExamRecord({
      p1_correct: 79,
      p1_wrong: 10,
      p1_blank: 0, // 89 items in P1
      p2_correct: 85,
      p2_wrong: 5,
      p2_blank: 0,
      type: 'FULL_MOCK',
    });
    expect(qualifiesForWeeklyBoss(fullMock8990, baseBoss)).toBe(false);

    // PARTIAL_MOCK with small volume does not get boss XP
    const store = getDefaultStore();
    const { store: storeWithSmallMock } = recordMockExamAction(
      {
        p1_correct: 5,
        p1_wrong: 0,
        p1_blank: 0,
        p2_correct: 5,
        p2_wrong: 0,
        p2_blank: 0,
        type: 'PARTIAL_MOCK',
      },
      store
    );
    // Should get 0 XP because questions < 30 and does not qualify for boss
    expect(storeWithSmallMock.gamificationProfile.total_xp).toBe(0);
  });

  // 5. P3 Agenda Semanal
  it('6. P3 Agenda: respeita discursiveWeeklyTarget, não gera todo dia, disponível com >= 60 min, alterna Q20/Peça', () => {
    const store = getDefaultStore();
    // Topic with available material so daily plan is active
    store.materials = store.materials.map((m) =>
      m.topic_id === 'top-p2-ling-3' ? { ...m, status: 'AVAILABLE', storage_path: '/p.pdf' } : m
    );
    store.settings.today_available_minutes = 90; // Between 60 and 150 min

    const missions1 = generateDailyMissions('2026-10-15', store);
    const p3Mission1 = missions1.find((m) => m.type === 'DISCURSIVE');
    expect(p3Mission1).toBeDefined();
    expect(p3Mission1!.title).toContain('Questão de até 20 linhas');

    // Simulate user completed the Q20 session this week
    store.discursiveSessions = [makeDiscursiveSession('sess-q20', 11.8)];

    // In BASE phase, target is 1 session/week. Since 1 is done, next day should not generate P3!
    const missionsNextDay = generateDailyMissions('2026-10-16', store);
    const p3MissionNextDay = missionsNextDay.find((m) => m.type === 'DISCURSIVE');
    expect(p3MissionNextDay).toBeUndefined();
  });

  // 6. Meaningful Coverage Trigger
  it('7. Meaningful Coverage: 50 tópicos em LEARNING não disparam CONSOLIDATION; 65% concluídos disparam', () => {
    // 50 topics in LEARNING out of 76 is ~65.7% started, but 0% meaningful
    const phaseLearning = calculateJourneyPhase({
      daysUntilExam: 100,
      totalTopics: 76,
      startedTopics: 50,
      masteredTopics: 0,
      atRiskTopics: 0,
      meaningfulStartedTopics: 0,
      p1StartedTopics: 25,
      p1TotalTopics: 42,
      p2StartedTopics: 25,
      p2TotalTopics: 34,
      averageDomainScore: 0,
      totalQuestions: 0,
      discursiveSessionsCount: 0,
      mockExamsCount: 0,
    });
    expect(phaseLearning.phase).toBe('BASE');

    // 50 topics with first-pass completed (CONSOLIDATING/MASTERED)
    const phaseConsolidating = calculateJourneyPhase({
      daysUntilExam: 100,
      totalTopics: 76,
      startedTopics: 50,
      masteredTopics: 10,
      atRiskTopics: 0,
      meaningfulStartedTopics: 50,
      p1StartedTopics: 28,
      p1TotalTopics: 42,
      p2StartedTopics: 22,
      p2TotalTopics: 34,
      averageDomainScore: 70,
      totalQuestions: 500,
      discursiveSessionsCount: 2,
      mockExamsCount: 1,
    });
    expect(phaseConsolidating.phase).toBe('CONSOLIDATION');
  });

  // 7. StudySession & Material Time
  it('8. StudySession: 40 min ontem + 1 min hoje não conta como 41 min hoje e streak não ativa com 1 min', () => {
    const store = getDefaultStore();
    const yesterday = '2026-10-14';
    const today = '2026-10-15';

    // Session yesterday: 40 min (2400 s)
    const { store: s1 } = recordStudySessionAction(
      {
        user_id: 'local-user',
        topic_id: 'top-p1-port-1',
        material_id: 'mat-1',
        session_type: 'MATERIAL',
        started_at: `${yesterday}T10:00:00Z`,
        ended_at: `${yesterday}T10:40:00Z`,
        duration_seconds: 2400,
      },
      store
    );

    // Session today: 1 min (60 s)
    const { store: s2 } = recordStudySessionAction(
      {
        user_id: 'local-user',
        topic_id: 'top-p1-port-1',
        material_id: 'mat-1',
        session_type: 'MATERIAL',
        started_at: `${today}T10:00:00Z`,
        ended_at: `${today}T10:01:00Z`,
        duration_seconds: 60,
      },
      s1
    );

    // Today is NOT a meaningful study day based on 1 min
    expect(
      isMeaningfulStudyDay(today, {
        questionSessions: s2.questionSessions,
        materialProgress: s2.materialProgress,
        reviews: s2.reviews,
        studySessions: s2.studySessions,
        discursiveSessions: s2.discursiveSessions,
        mockExams: s2.mockExams,
      })
    ).toBe(false);

    // Mission CORE_STUDY on today only counts today's studySessions (1 min, not 41 min)
    const mockMission: DailyMission = {
      id: 'm-core',
      date: today,
      title: 'Estudo Teórico',
      description: '',
      type: 'CORE_STUDY',
      target_value: 30,
      current_value: 0,
      unit: 'min',
      status: 'PENDING',
      reason: 'Teoria',
      source: 'planner',
      xp_reward: 40,
      topic_id: 'top-p1-port-1',
      created_at: '',
    };

    const updated = updateMissionsProgress([mockMission], today, s2);
    expect(updated[0].current_value).toBe(1); // 60 seconds = 1 minute
  });

  it('9. StudySession: duas sessões de 20 min no mesmo dia respeitam daily cap de 60 XP', () => {
    const store = getDefaultStore();
    const today = '2026-10-15';

    // First session: 20 min -> 30 XP
    const { store: s1 } = recordStudySessionAction(
      {
        user_id: 'local-user',
        topic_id: 'top-p1-port-1',
        material_id: 'mat-1',
        session_type: 'MATERIAL',
        started_at: `${today}T10:00:00Z`,
        ended_at: `${today}T10:20:00Z`,
        duration_seconds: 1200,
      },
      store
    );
    expect(s1.gamificationProfile.total_xp).toBe(30);

    // Second session: 20 min -> +30 XP (total 60 XP)
    const { store: s2 } = recordStudySessionAction(
      {
        user_id: 'local-user',
        topic_id: 'top-p1-port-2',
        material_id: 'mat-2',
        session_type: 'MATERIAL',
        started_at: `${today}T11:00:00Z`,
        ended_at: `${today}T11:20:00Z`,
        duration_seconds: 1200,
      },
      s1
    );
    expect(s2.gamificationProfile.total_xp).toBe(60);

    // Third session: 20 min -> cap is 60 XP/day, total stays 60 XP
    const { store: s3 } = recordStudySessionAction(
      {
        user_id: 'local-user',
        topic_id: 'top-p1-port-3',
        material_id: 'mat-3',
        session_type: 'MATERIAL',
        started_at: `${today}T14:00:00Z`,
        ended_at: `${today}T14:20:00Z`,
        duration_seconds: 1200,
      },
      s2
    );
    expect(s3.gamificationProfile.total_xp).toBe(60);
  });

  // 8. Flashcard XP
  it('10. Flashcard XP: review devido concede 1 XP, review antecipado concede 0 XP', () => {
    let store = getDefaultStore();
    store.flashcards = [
      makeFlashcard('card-due-1'),
      makeFlashcard('card-due-2'),
      makeFlashcard('card-early'),
    ];

    store.fsrsStates = {
      'card-due-1': {
        flashcard_id: 'card-due-1',
        user_id: 'local-user',
        due: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        stability: 2,
        difficulty: 3,
        elapsed_days: 0,
        scheduled_days: 1,
        learning_steps: 0,
        reps: 1,
        lapses: 0,
        state: 1,
        last_review: null,
        updated_at: new Date().toISOString(),
      },
      'card-due-2': {
        flashcard_id: 'card-due-2',
        user_id: 'local-user',
        due: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        stability: 2,
        difficulty: 3,
        elapsed_days: 0,
        scheduled_days: 1,
        learning_steps: 0,
        reps: 1,
        lapses: 0,
        state: 1,
        last_review: null,
        updated_at: new Date().toISOString(),
      },
      'card-early': {
        flashcard_id: 'card-early',
        user_id: 'local-user',
        due: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        stability: 2,
        difficulty: 3,
        elapsed_days: 0,
        scheduled_days: 1,
        learning_steps: 0,
        reps: 1,
        lapses: 0,
        state: 1,
        last_review: null,
        updated_at: new Date().toISOString(),
      },
    };

    // Review due card -> +1 XP (queue not cleared because card-due-2 is still due)
    store = reviewFlashcardAction('card-due-1', Rating.Good, 1500, store);
    expect(store.gamificationProfile.total_xp).toBe(1);

    // Review early card -> 0 XP (reviewed before due date)
    store = reviewFlashcardAction('card-early', Rating.Good, 1500, store);
    expect(store.gamificationProfile.total_xp).toBe(1);
  });

  // 9. Starter Mode
  it('11. Starter Mode: store zerado recomenda Rank 1 Linguística (leitura/coerência) e Rank 2 Português (interpretação)', () => {
    const store = getDefaultStore();
    const plan = generateDailyPlan({
      topics: store.topics,
      subjects: store.subjects,
      materials: store.materials,
      errors: store.errorLogs,
      overdueCardsCount: 0,
    });

    expect(plan.tasks[0].topicId).toBe('top-p2-ling-3'); // Rank 1: Leitura, compreensão, coesão, coerência e inferência
    expect(plan.tasks[1].topicId).toBe('top-p1-port-1'); // Rank 2: Interpretação, compreensão, tipos e gêneros textuais
  });
});

