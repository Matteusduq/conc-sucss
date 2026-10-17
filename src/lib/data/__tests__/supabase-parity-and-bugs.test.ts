import { describe, it, expect, vi } from 'vitest';
import {
  mapExamFromDb,
  mapExamToDb,
  mapExamBlockFromDb,
  mapExamBlockToDb,
  mapTopicFromDb,
  mapTopicToDb,
  mapErrorLogFromDb,
  mapErrorLogToDb,
  mapFlashcardReviewFromDb,
  mapFlashcardReviewToDb,
  mapUserStudySettingsFromDb,
  mapUserStudySettingsToDb,
  mapDailyMissionFromDb,
  mapDailyMissionToDb,
  mapGamificationProfileFromDb,
  mapGamificationProfileToDb,
  mapDiscursiveSessionFromDb,
  mapMockExamFromDb,
} from '../mappers';
import { SupabaseStudyRepository, PersistenceError } from '../repository/supabase-repository';
import { ensureUserStudyData } from '../bootstrap-user';
import { SEED_TOPICS, SEED_SYLLABUS_ITEMS, SEED_EXAM } from '../seed';
import { Topic, ErrorLog, FlashcardReview, ExamBlock, UserStudySettings } from '@/types/database';
import { DailyMission } from '@/lib/gamification/types';

describe('PARIDADE DE SCHEMA & CORREÇÃO DE BUGS DO SUPABASE', () => {
  const userId = 'user-test-uuid-9999';

  // 1. BUG BLOQUEADOR — cross_relevance
  it('BUG 5: cross_relevance P1_P2_P3 persiste e volta como P1_P2_P3 losslessly', () => {
    const topic: Topic = {
      id: 'top-p2-ling-3',
      user_id: userId,
      exam_id: 'cd-2026',
      subject_id: 'sub-p2-ling',
      parent_topic_id: null,
      name: 'Coesão e Coerência',
      slug: 'coesao-e-coerencia',
      description: null,
      priority: 'HIGH',
      priority_label: 'Alta',
      priority_weight: 1.5,
      priority_source: 'Edital',
      cross_relevance: 'P1_P2_P3',
      discursive_eligible: true,
      is_discursive_relevant: true,
      discursive_synergy: 'HIGH',
      recommended_material_type: 'SIMPLIFIED_PDF',
      status: 'LEARNING',
      display_order: 1,
      estimated_minutes: 90,
      domain_score: 75,
      domain_confidence: 'HIGH',
      study_score: 82.5,
      starter_rank: 1,
      last_studied_at: '2026-10-15T10:00:00Z',
      next_recommended_at: '2026-10-17T10:00:00Z',
      tec_filter_hint: 'Caderno 102',
      created_at: '2026-10-14T00:00:00Z',
      updated_at: '2026-10-15T10:00:00Z',
    };

    const row = mapTopicToDb(topic);
    expect(row.cross_relevance).toBe('P1_P2_P3');

    const roundtrip = mapTopicFromDb(row);
    expect(roundtrip.cross_relevance).toBe('P1_P2_P3');
    expect(roundtrip.name).toBe('Coesão e Coerência');
    expect(roundtrip.starter_rank).toBe(1);
  });

  // 2. BUG BLOQUEADOR — P3 e exam_blocks.total_items
  it('BUG 6: ExamBlock P3 aceita total_items null sem violar integridade', () => {
    const blockP3: ExamBlock = {
      id: 'block-p3',
      user_id: userId,
      exam_id: 'exam-camara-2027',
      code: 'P3',
      name: 'Prova Discursiva',
      block_type: 'DISCURSIVE',
      total_items: null,
      max_points: 60,
      minimum_points: 30,
      duration_minutes: 180,
      display_order: 3,
      created_at: '2026-10-14T00:00:00Z',
      updated_at: '2026-10-14T00:00:00Z',
    };

    const row = mapExamBlockToDb(blockP3);
    expect(row.total_items).toBeNull();
    expect(row.block_type).toBe('DISCURSIVE');

    const roundtrip = mapExamBlockFromDb(row);
    expect(roundtrip.total_items).toBeNull();
    expect(roundtrip.code).toBe('P3');
    expect(roundtrip.max_points).toBe(60);
  });

  // 3. BUG BLOQUEADOR — flashcard_reviews.rating
  it('BUG 7: flashcard review GOOD persiste como string e volta como GOOD', () => {
    const review: FlashcardReview = {
      id: 'rev-301',
      user_id: userId,
      flashcard_id: 'fc-101',
      reviewed_at: '2026-10-16T14:00:00Z',
      rating: 'GOOD',
      response_time_ms: 3200,
      state_before: { reps: 1, difficulty: 5 },
      state_after: { reps: 2, difficulty: 4.8 },
      fsrs_log: { scheduled_days: 3 },
      was_due_at_review: true,
      created_at: '2026-10-16T14:00:00Z',
    };

    const row = mapFlashcardReviewToDb(review);
    expect(row.rating).toBe('GOOD');

    const roundtrip = mapFlashcardReviewFromDb(row);
    expect(roundtrip.rating).toBe('GOOD');
    expect(roundtrip.flashcard_id).toBe('fc-101');
  });

  // 4. BUG — error_logs.correct_rule nullable
  it('BUG 8: error_logs.correct_rule aceita null sem converter para string "null"', () => {
    const errorLog: ErrorLog = {
      id: 'err-501',
      user_id: userId,
      exam_id: 'cd-2026',
      subject_id: 'sub-p1-port',
      topic_id: 'top-p1-port-1',
      question_session_id: null,
      error_type: 'INATTENTION',
      summary: 'Confundiu exceto com correto',
      correct_rule: null,
      personal_note: 'Ler enunciado com mais calma',
      severity: 'LOW',
      resolved: false,
      resolved_at: null,
      created_at: '2026-10-16T10:00:00Z',
      updated_at: '2026-10-16T10:00:00Z',
    };

    const row = mapErrorLogToDb(errorLog);
    expect(row.correct_rule).toBeNull();

    const roundtrip = mapErrorLogFromDb(row);
    expect(roundtrip.correct_rule).toBeNull();
    expect(roundtrip.summary).toBe('Confundiu exceto com correto');
  });

  // 5. BUG — daily missions persistência e idempotência
  it('BUG 9: DailyMission persiste todos os campos e permite round-trip', () => {
    const mission: DailyMission = {
      id: 'mis-2026-10-16-questions',
      date: '2026-10-16',
      type: 'QUESTIONS',
      title: 'Resolver 20 itens Cebraspe',
      description: 'Foco em Regimento Interno',
      topic_id: 'top-p2-reg-1',
      subject_id: 'sub-p2-reg',
      target_value: 20,
      current_value: 12,
      unit: 'itens',
      xp_reward: 50,
      status: 'IN_PROGRESS',
      reason: 'Prioridade alta do edital',
      source: 'STUDY_ENGINE',
      is_main: true,
      is_executable: true,
      created_at: '2026-10-16T00:00:00Z',
      completed_at: undefined,
    };

    const row = mapDailyMissionToDb(mission, userId);
    expect(row.user_id).toBe(userId);
    expect(row.current_value).toBe(12);

    const roundtrip = mapDailyMissionFromDb(row);
    expect(roundtrip.id).toBe('mis-2026-10-16-questions');
    expect(roundtrip.current_value).toBe(12);
    expect(roundtrip.status).toBe('IN_PROGRESS');
    expect(roundtrip.is_main).toBe(true);
  });

  // 6. BUG — exclusão de discursiva
  it('BUG 10: deleteDiscursiveSession executa delete remoto por (user_id, id)', async () => {
    let deletedQuery: any = null;
    const mockSupabase: any = {
      from: vi.fn((table: string) => ({
        delete: vi.fn(() => ({
          eq: vi.fn((col1: string, val1: any) => ({
            eq: vi.fn((col2: string, val2: any) => {
              deletedQuery = { table, [col1]: val1, [col2]: val2 };
              return Promise.resolve({ error: null });
            }),
          })),
        })),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    await repo.deleteDiscursiveSession(userId, 'disc-test-123');

    expect(deletedQuery).toEqual({
      table: 'discursive_sessions',
      user_id: userId,
      id: 'disc-test-123',
    });
  });

  // 7. BUG — alteração de exam_date
  it('BUG 11: updateExam persiste nova exam_date no banco', async () => {
    let updateQuery: any = null;
    const mockSupabase: any = {
      from: vi.fn((table: string) => ({
        update: vi.fn((payload: any) => ({
          eq: vi.fn((col1: string, val1: any) => ({
            eq: vi.fn((col2: string, val2: any) => {
              updateQuery = { table, payload, [col1]: val1, [col2]: val2 };
              return Promise.resolve({ error: null });
            }),
          })),
        })),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    await repo.updateExam(userId, { id: 'exam-camara-2027', exam_date: '2027-02-15' });

    expect(updateQuery.table).toBe('exams');
    expect(updateQuery.payload.exam_date).toBe('2027-02-15');
    expect(updateQuery.user_id).toBe(userId);
    expect(updateQuery.id).toBe('exam-camara-2027');
  });

  // 8. BUG — gamification settings sobrevivem
  it('BUG 12: gamification settings são mapeadas e sobrevivem round-trip', () => {
    const settings: UserStudySettings = {
      user_id: userId,
      weekly_study_target_minutes: 1500,
      default_high_questions: 25,
      default_medium_questions: 18,
      default_low_questions: 12,
      memory_daily_minutes: 30,
      desired_retention: 0.92,
      today_available_minutes: 180,
      gamification_show_animations: true,
      gamification_show_xp_toast: true,
      gamification_show_streak: false,
      gamification_weekly_target_days: 6,
      updated_at: '2026-10-16T15:00:00Z',
    };

    const row = mapUserStudySettingsToDb(settings);
    expect(row.gamification_show_streak).toBe(false);
    expect(row.gamification_weekly_target_days).toBe(6);

    const roundtrip = mapUserStudySettingsFromDb(row);
    expect(roundtrip.gamification_show_streak).toBe(false);
    expect(roundtrip.gamification_weekly_target_days).toBe(6);
    expect(roundtrip.gamification_show_animations).toBe(true);
  });

  // 9. BUG GRAVE — erros de banco não são engolidos
  it('BUG 13: mutations lançam PersistenceError e não silenciam falhas de rede/banco', async () => {
    const mockSupabaseError: any = {
      from: vi.fn(() => ({
        upsert: vi.fn().mockResolvedValue({
          error: { message: 'relation "question_sessions" does not exist' },
        }),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabaseError);
    await expect(
      repo.persistQuestionSession(userId, {
        id: 'qs-err-1',
        user_id: userId,
        exam_id: 'cd-2026',
        subject_id: 'sub-p1-port',
        topic_id: 'top-1',
        performed_at: '2026-10-16T12:00:00Z',
        total_questions: 10,
        correct: 8,
        wrong: 2,
        blank: 0,
        duration_seconds: 600,
        subjective_feeling: 'MASTERED',
        notes: null,
        accuracy_rate: 80,
        net_points: 6,
        net_rate: 60,
        had_conceptual_error: false,
        created_at: '2026-10-16T12:00:00Z',
        updated_at: '2026-10-16T12:00:00Z',
      })
    ).rejects.toThrow(PersistenceError);
  });

  // 10. Bootstrap idempotente com marcador curriculum_bootstrap_v1
  it('BUG 15 & 16: bootstrap completa dados faltantes e grava curriculum_bootstrap_v1', async () => {
    const dbState: Record<string, any[]> = {};

    const mockSupabase: any = {
      from: vi.fn((table: string) => ({
        select: vi.fn((cols: string) => ({
          eq: vi.fn((col1: string, val1: any) => ({
            eq: vi.fn((col2: string, val2: any) => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: (dbState[table] || []).find((r) => r[col1] === val1 && r[col2] === val2) || null,
                error: null,
              }),
            })),
          })),
        })),
        upsert: vi.fn((data: any) => {
          if (!dbState[table]) dbState[table] = [];
          if (Array.isArray(data)) {
            dbState[table].push(...data);
          } else {
            dbState[table].push(data);
          }
          return Promise.resolve({ error: null });
        }),
      })),
    };

    // Primeira execução: cria tudo e grava marcador
    const res = await ensureUserStudyData(userId, mockSupabase);
    expect(res.success).toBe(true);
    expect(res.created).toBe(true);

    expect(dbState['topics']).toHaveLength(76);
    expect(dbState['syllabus_items']).toHaveLength(182);
    expect(dbState['study_materials']).toHaveLength(76);

    const marker = dbState['user_migrations']?.find((m) => m.migration_key === 'curriculum_bootstrap_v1');
    expect(marker).toBeDefined();
    expect(marker.user_id).toBe(userId);

    // Segunda execução: detecta curriculum_bootstrap_v1 e não repete upserts
    const res2 = await ensureUserStudyData(userId, mockSupabase);
    expect(res2.success).toBe(true);
    expect(res2.created).toBe(false);
  });
});
