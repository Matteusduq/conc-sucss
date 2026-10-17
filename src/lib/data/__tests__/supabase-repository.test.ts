import { describe, it, expect, vi } from 'vitest';
import { ensureUserStudyData } from '../bootstrap-user';
import { importV3DataToSupabase } from '../migrate-v3-to-supabase';
import { getDefaultStore, AppStoreData } from '../store';
import { SEED_TOPICS, SEED_SYLLABUS_ITEMS } from '../seed';

describe('FASE 3 — SUPABASE REPOSITORY & DATA MIGRATION', () => {
  const userId = 'user-test-uuid-1234';

  it('1. Bootstrap curricular: cria exatamente 76 tópicos e 182 syllabus items idempotentemente', async () => {
    const dbMock: Record<string, any[]> = {};
    const mockSupabase: any = {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn((col1: string, val1: any) => ({
            eq: vi.fn((col2: string, val2: any) => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: (dbMock[table] || []).find((r) => r[col1] === val1 && r[col2] === val2) || null,
                error: null,
              }),
            })),
          })),
        })),
        upsert: vi.fn((data: any) => {
          if (!dbMock[table]) dbMock[table] = [];
          if (Array.isArray(data)) {
            dbMock[table].push(...data);
          } else {
            dbMock[table].push(data);
          }
          return Promise.resolve({ error: null });
        }),
      })),
    };

    const res = await ensureUserStudyData(userId, mockSupabase);
    expect(res.success).toBe(true);
    expect(res.created).toBe(true);

    // Confirma 76 tópicos e 182 syllabus items
    expect(dbMock['topics']).toHaveLength(76);
    expect(dbMock['syllabus_items']).toHaveLength(182);

    // Confirma que starter_rank foi preservado
    const lingTopic = dbMock['topics'].find((t) => t.id === 'top-p2-ling-3');
    expect(lingTopic).toBeDefined();
    expect(lingTopic.starter_rank).toBe(1);
    expect(lingTopic.user_id).toBe(userId);

    // Re-execução quando curriculum_bootstrap_v1 já existe é idempotente
    const resIdempotent = await ensureUserStudyData(userId, mockSupabase);
    expect(resIdempotent.success).toBe(true);
    expect(resIdempotent.created).toBe(false);
  });

  it('2. Migração V3 -> Supabase: preserva IDs textuais, substitui user_id e é idempotente', async () => {
    const v3Store: AppStoreData = {
      ...getDefaultStore(),
      questionSessions: [
        {
          id: 'qs-101',
          user_id: 'local-user',
          exam_id: 'cd-2026',
          subject_id: 'sub-p1-port',
          topic_id: 'top-p1-port-1',
          performed_at: '2026-10-15T12:00:00Z',
          total_questions: 20,
          correct: 18,
          wrong: 2,
          blank: 0,
          duration_seconds: 1200,
          subjective_feeling: 'MASTERED',
          notes: 'Treino de interpretação',
          accuracy_rate: 90,
          net_points: 16,
          net_rate: 80,
          had_conceptual_error: false,
          created_at: '2026-10-15T12:00:00Z',
          updated_at: '2026-10-15T12:00:00Z',
        },
      ],
      flashcards: [
        {
          id: 'fc-201',
          user_id: 'local-user',
          exam_id: 'cd-2026',
          subject_id: 'sub-p1-port',
          topic_id: 'top-p1-port-1',
          card_type: 'CONTENT',
          front: 'O que é coesão referencial?',
          back: 'Mecanismo de remissão a termos no texto.',
          source_type: 'MANUAL',
          source_material_id: null,
          source_error_id: null,
          source_highlight_id: null,
          explanation: null,
          exam_priority: 'HIGH',
          priority_boost: 0,
          active: true,
          suspended: false,
          created_at: '2026-10-15T12:00:00Z',
          updated_at: '2026-10-15T12:00:00Z',
        },
      ],
      gamificationProfile: {
        user_id: 'local-user',
        total_xp: 150,
        level: 2,
        current_streak: 3,
        longest_streak: 3,
        meaningful_days: 3,
        last_meaningful_study_date: '2026-10-15',
        weekly_consistency_days: 3,
        current_week_start: '2026-10-12',
        achievements_unlocked: ['first_session'],
        updated_at: '2026-10-15T12:00:00Z',
      },
    };

    const databaseState: Record<string, any[]> = {};

    const mockSupabase: any = {
      from: vi.fn((table: string) => ({
        upsert: vi.fn((rows: any) => {
          if (!databaseState[table]) databaseState[table] = [];
          const list = Array.isArray(rows) ? rows : [rows];
          for (const item of list) {
            const existingIdx = databaseState[table].findIndex(
              (r) => (r.id && r.id === item.id) || (r.migration_key && r.migration_key === item.migration_key)
            );
            if (existingIdx >= 0) {
              databaseState[table][existingIdx] = item;
            } else {
              databaseState[table].push(item);
            }
          }
          return Promise.resolve({ error: null });
        }),
      })),
    };

    // Primeira execução do import
    const res1 = await importV3DataToSupabase(userId, v3Store, mockSupabase);
    expect(res1.success).toBe(true);
    expect(res1.imported).toBe(true);
    expect(res1.counts?.questionSessions).toBe(1);
    expect(res1.counts?.flashcards).toBe(1);
    expect(res1.counts?.xp).toBe(150);

    // Confirma que user_id foi convertido de 'local-user' para auth.uid()
    expect(databaseState['question_sessions'][0].user_id).toBe(userId);
    expect(databaseState['question_sessions'][0].id).toBe('qs-101');
    expect(databaseState['flashcards'][0].user_id).toBe(userId);
    expect(databaseState['flashcards'][0].id).toBe('fc-201');
    expect(databaseState['user_migrations'][0].migration_key).toBe('local_store_v3_import');

    // Segunda execução da migração (Idempotência sem duplicação)
    const res2 = await importV3DataToSupabase(userId, v3Store, mockSupabase);
    expect(res2.success).toBe(true);
    expect(databaseState['question_sessions']).toHaveLength(1);
    expect(databaseState['flashcards']).toHaveLength(1);
    expect(databaseState['user_migrations']).toHaveLength(1);
  });
});
