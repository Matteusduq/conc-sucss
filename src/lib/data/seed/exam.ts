import { Exam } from '@/types/database';

export const SEED_EXAM: Exam = {
  id: 'exam-camara-2027',
  user_id: 'local-user',
  name: 'Câmara dos Deputados 2027',
  institution: 'Câmara dos Deputados',
  role: 'Analista Legislativo — Especialidade: Registro e Redação',
  exam_board: 'Cebraspe',
  exam_date: '2027-01-17',
  question_model: 'Certo / Errado',
  correct_points: 1,
  wrong_points: -1,
  blank_points: 0,
  objective_duration_minutes: 300, // 5 horas (turno da manhã)
  discursive_duration_minutes: 180, // 3 horas (turno da tarde)
  p1_items: 90,
  p2_items: 90,
  p1_min_points: 18,
  p2_min_points: 27,
  objective_total_min_points: 54,
  p3_max_points: 60,
  p3_min_points: 30,
  official_notice_date: '2026-10-02',
  tiebreaker_rules: [
    'Critério legal de idade (Estatuto do Idoso)',
    'Maior nota na Prova Objetiva de Conhecimentos Específicos (P2)',
    'Maior número de acertos na Prova Objetiva de Conhecimentos Específicos (P2)',
    'Maior nota na Prova Discursiva (P3)',
    'Maior número de acertos na Prova Objetiva de Conhecimentos Básicos (P1)',
  ],
  active: true,
  created_at: '2026-10-14T00:00:00Z',
  updated_at: '2026-10-14T00:00:00Z',
};
