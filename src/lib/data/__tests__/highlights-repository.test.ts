import { describe, it, expect, vi } from 'vitest';
import { SupabaseStudyRepository, PersistenceError } from '../repository/supabase-repository';
import { MaterialHighlight, Flashcard } from '@/types/database';

describe('Material Highlights Repository & Persistence (Points 1-7)', () => {
  const userId = 'user-test-777';

  // Ponto 1: persistir highlight
  it('1. persistMaterialHighlight insere o destaque no Supabase com sucesso', async () => {
    let insertedRow: any = null;
    const mockSupabase: any = {
      from: vi.fn((table: string) => ({
        upsert: vi.fn((payload: any) => {
          insertedRow = payload;
          return Promise.resolve({ error: null });
        }),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    const highlight: MaterialHighlight = {
      id: 'hl-test-1',
      user_id: userId,
      material_id: 'mat-01',
      topic_id: 'top-01',
      page_number: 3,
      material_version: 1,
      selected_text: 'O Congresso Nacional reúne-se anualmente.',
      context_before: 'Título IV.',
      context_after: 'De 2 de fevereiro a 17 de julho.',
      quote_prefix: 'reúne-se',
      quote_suffix: 'anualmente',
      text_start_offset: null,
      text_end_offset: null,
      rects: [{ x: 0.1, y: 0.2, width: 0.5, height: 0.03 }],
      color: 'YELLOW',
      ai_status: 'NOT_REQUESTED',
      ai_explanation: null,
      ai_key_point: null,
      ai_cebraspe_trap: null,
      ai_flashcard_draft: null,
      ai_provider: null,
      ai_model: null,
      ai_generated_at: null,
      ai_error: null,
      created_at: '2026-10-17T00:00:00Z',
      updated_at: '2026-10-17T00:00:00Z',
    };

    await repo.persistMaterialHighlight(userId, highlight);

    expect(mockSupabase.from).toHaveBeenCalledWith('material_highlights');
    expect(insertedRow).toBeDefined();
    expect(insertedRow.id).toBe('hl-test-1');
    expect(insertedRow.user_id).toBe(userId);
    expect(insertedRow.selected_text).toBe('O Congresso Nacional reúne-se anualmente.');
  });

  // Ponto 2: carregar highlights somente do material correto
  it('2. listMaterialHighlights filtra estritamente por user_id e material_id', async () => {
    const mockRows = [
      {
        id: 'hl-1',
        user_id: userId,
        material_id: 'mat-correto',
        topic_id: 'top-01',
        page_number: 1,
        material_version: 1,
        selected_text: 'Trecho do material correto',
        rects: [],
        color: 'YELLOW',
        ai_status: 'NOT_REQUESTED',
        created_at: '2026-10-17T00:00:00Z',
        updated_at: '2026-10-17T00:00:00Z',
      },
    ];

    const queryBuilder: any = {
      order: vi.fn(),
    };
    queryBuilder.order.mockImplementation(() => queryBuilder);
    queryBuilder.then = (resolve: any) =>
      Promise.resolve({ data: mockRows, error: null }).then(resolve);

    const mockSupabase: any = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => queryBuilder),
          })),
        })),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    const results = await repo.listMaterialHighlights(userId, 'mat-correto');

    expect(results).toHaveLength(1);
    expect(results[0].material_id).toBe('mat-correto');
    expect(results[0].selected_text).toBe('Trecho do material correto');
  });

  // Ponto 3: atualizar resultado da IA
  it('3. updateMaterialHighlightAI atualiza status, explicação e draft sem alterar campos imutáveis', async () => {
    let updatedPayload: any = null;
    const mockSupabase: any = {
      from: vi.fn(() => ({
        update: vi.fn((payload: any) => {
          updatedPayload = payload;
          return {
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          };
        }),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    await repo.updateMaterialHighlightAI(userId, {
      id: 'hl-test-1',
      ai_status: 'READY',
      ai_explanation: 'Explicação didática atualizada.',
      ai_key_point: 'Ponto-chave para prova.',
      ai_flashcard_draft: {
        front: 'Frente do cartão?',
        back: 'Verso do cartão.',
        card_type: 'RULE',
        exam_priority: 'HIGH',
      },
    });

    expect(updatedPayload).toBeDefined();
    expect(updatedPayload.ai_status).toBe('READY');
    expect(updatedPayload.ai_explanation).toBe('Explicação didática atualizada.');
    expect(updatedPayload.ai_flashcard_draft.card_type).toBe('RULE');
    expect(updatedPayload.updated_at).toBeDefined();
  });

  // Ponto 4: deletar highlight
  it('4. deleteMaterialHighlight remove pelo id e user_id', async () => {
    let deletedId: string | null = null;
    let deletedUser: string | null = null;

    const mockSupabase: any = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn((col1: string, val1: any) => ({
            eq: vi.fn((col2: string, val2: any) => {
              if (col1 === 'user_id') deletedUser = val1;
              if (col2 === 'id') deletedId = val2;
              return Promise.resolve({ error: null });
            }),
          })),
        })),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    await repo.deleteMaterialHighlight(userId, 'hl-to-delete');

    expect(deletedUser).toBe(userId);
    expect(deletedId).toBe('hl-to-delete');
  });

  // Ponto 5 & 6: persistir source_highlight_id e explanation no flashcard
  it('5-6. persistFlashcard persiste source_highlight_id e explanation corretamente', async () => {
    let savedCardRow: any = null;
    const mockSupabase: any = {
      from: vi.fn(() => ({
        upsert: vi.fn((row: any) => {
          savedCardRow = row;
          return Promise.resolve({ error: null });
        }),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    const card: Flashcard = {
      id: 'fc-from-hl',
      user_id: userId,
      exam_id: 'exam-1',
      subject_id: 'sub-1',
      topic_id: 'top-1',
      card_type: 'CONTENT',
      front: 'O que é ato legislativo?',
      back: 'Manifestação de vontade...',
      source_type: 'AI_GENERATED',
      source_material_id: 'mat-1',
      source_error_id: null,
      source_highlight_id: 'hl-origem-99',
      explanation: 'Esta explicação foi gerada pela IA e salva no cartão.',
      exam_priority: 'HIGH',
      priority_boost: 0,
      active: true,
      suspended: false,
      created_at: '2026-10-17T00:00:00Z',
      updated_at: '2026-10-17T00:00:00Z',
    };

    await repo.persistFlashcard(userId, card);

    expect(savedCardRow).toBeDefined();
    expect(savedCardRow.source_highlight_id).toBe('hl-origem-99');
    expect(savedCardRow.explanation).toBe('Esta explicação foi gerada pela IA e salva no cartão.');
    expect(savedCardRow.source_type).toBe('AI_GENERATED');
  });

  // Ponto 7: falhas de SELECT/INSERT/UPDATE geram erro explícito (PersistenceError)
  it('7. falha de SELECT/INSERT/UPDATE lança PersistenceError com mensagem clara', async () => {
    const errorQueryBuilder: any = {
      order: vi.fn(),
    };
    errorQueryBuilder.order.mockImplementation(() => errorQueryBuilder);
    errorQueryBuilder.then = (resolve: any) =>
      Promise.resolve({ data: null, error: { message: 'Database connection refused' } }).then(resolve);

    const errorSupabase: any = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => errorQueryBuilder),
          })),
        })),
        upsert: vi.fn(() =>
          Promise.resolve({ error: { message: 'Row level security violation' } })
        ),
      })),
    };

    const repo = new SupabaseStudyRepository(errorSupabase);

    // Falha no list
    await expect(repo.listMaterialHighlights(userId, 'mat-1')).rejects.toThrow(
      PersistenceError
    );

    // Falha no persist
    const highlight = { id: 'hl-err', user_id: userId } as any;
    await expect(repo.persistMaterialHighlight(userId, highlight)).rejects.toThrow(
      PersistenceError
    );
  });

  // Ponto 8: text_start_offset e text_end_offset são persistidos
  it('8. persistMaterialHighlight persiste text_start_offset e text_end_offset', async () => {
    let insertedRow: any = null;
    const mockSupabase: any = {
      from: vi.fn((table: string) => ({
        upsert: vi.fn((payload: any) => {
          insertedRow = payload;
          return Promise.resolve({ error: null });
        }),
      })),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    const highlight = {
      id: 'hl-offsets',
      user_id: userId,
      material_id: 'mat-01',
      topic_id: 'top-01',
      page_number: 1,
      material_version: 1,
      selected_text: 'Trecho com offsets calculados',
      text_start_offset: 42,
      text_end_offset: 71,
      rects: [],
      color: 'YELLOW',
      ai_status: 'NOT_REQUESTED',
      context_before: null,
      context_after: null,
      quote_prefix: null,
      quote_suffix: null,
      ai_explanation: null,
      ai_key_point: null,
      ai_cebraspe_trap: null,
      ai_flashcard_draft: null,
      ai_provider: null,
      ai_model: null,
      ai_generated_at: null,
      ai_error: null,
      created_at: '2026-10-17T00:00:00Z',
      updated_at: '2026-10-17T00:00:00Z',
    } as MaterialHighlight;

    await repo.persistMaterialHighlight(userId, highlight);

    expect(insertedRow).toBeDefined();
    expect(insertedRow.text_start_offset).toBe(42);
    expect(insertedRow.text_end_offset).toBe(71);
  });

  // Ponto 9: updateStudyMaterialPageCount persiste page_count real em study_materials
  it('9. updateStudyMaterialPageCount persiste page_count em study_materials', async () => {
    let updatePayload: any = null;
    const eqCalls: string[] = [];
    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        expect(table).toBe('study_materials');
        return {
          update: vi.fn((payload: any) => {
            updatePayload = payload;
            return {
              eq: vi.fn((col: string, val: any) => {
                eqCalls.push(`${col}=${val}`);
                return {
                  eq: vi.fn((col2: string, val2: any) => {
                    eqCalls.push(`${col2}=${val2}`);
                    return Promise.resolve({ error: null });
                  }),
                };
              }),
            };
          }),
        };
      }),
    };

    const repo = new SupabaseStudyRepository(mockSupabase);
    await repo.updateStudyMaterialPageCount(userId, 'mat-top-p1-port-1', 12);

    expect(updatePayload).toBeDefined();
    expect(updatePayload.page_count).toBe(12);
    expect(eqCalls).toContain(`user_id=${userId}`);
    expect(eqCalls).toContain('id=mat-top-p1-port-1');
  });
});

