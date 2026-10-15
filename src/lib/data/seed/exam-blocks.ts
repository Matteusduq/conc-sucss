import { ExamBlock } from '@/types/database';
import { SEED_EXAM } from './exam';

export const SEED_EXAM_BLOCKS: ExamBlock[] = [
  {
    id: 'block-p1',
    user_id: 'local-user',
    exam_id: SEED_EXAM.id,
    code: 'P1',
    name: 'Conhecimentos Básicos',
    block_type: 'OBJECTIVE',
    total_items: 90,
    max_points: 90,
    minimum_points: 18,
    duration_minutes: null, // Provas P1 e P2 juntas duram 300 min pela manhã
    display_order: 1,
    created_at: '2026-10-14T00:00:00Z',
    updated_at: '2026-10-14T00:00:00Z',
  },
  {
    id: 'block-p2',
    user_id: 'local-user',
    exam_id: SEED_EXAM.id,
    code: 'P2',
    name: 'Conhecimentos Específicos',
    block_type: 'OBJECTIVE',
    total_items: 90,
    max_points: 90,
    minimum_points: 27,
    duration_minutes: null,
    display_order: 2,
    created_at: '2026-10-14T00:00:00Z',
    updated_at: '2026-10-14T00:00:00Z',
  },
  {
    id: 'block-p3',
    user_id: 'local-user',
    exam_id: SEED_EXAM.id,
    code: 'P3',
    name: 'Prova Discursiva',
    block_type: 'DISCURSIVE',
    total_items: null,
    max_points: 60,
    minimum_points: 30,
    duration_minutes: 180, // 3 horas no turno da tarde
    display_order: 3,
    created_at: '2026-10-14T00:00:00Z',
    updated_at: '2026-10-14T00:00:00Z',
  },
];
