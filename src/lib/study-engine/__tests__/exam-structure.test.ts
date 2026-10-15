import { describe, it, expect } from 'vitest';
import {
  P1_SUBJECT_COUNT,
  P2_SUBJECT_COUNT,
  P1_ITEM_COUNT,
  P2_ITEM_COUNT,
  P3_MAX_POINTS,
  P1_MIN_POINTS,
  P2_MIN_POINTS,
  OBJECTIVE_TOTAL_MIN_POINTS,
  P3_MIN_POINTS,
} from '@/types/database';
import { INITIAL_SEED_DATA } from '@/lib/data/seed';
import { calculateDiscursiveScore, validateDiscursiveInput } from '../discursive';
import { calculateNetPoints } from '../domain';
import { migrateV1ToV2 } from '@/lib/data/store';

describe('1. Verificação Normativa do Edital nº 1/2026 (Constantes Oficiais)', () => {
  it('confirms the official exam parameters strictly according to Edital nº 1/2026', () => {
    expect(P1_SUBJECT_COUNT).toBe(5);
    expect(P2_SUBJECT_COUNT).toBe(4);
    expect(P1_ITEM_COUNT).toBe(90);
    expect(P2_ITEM_COUNT).toBe(90);
    expect(P3_MAX_POINTS).toBe(60);
    expect(P1_MIN_POINTS).toBe(18);
    expect(P2_MIN_POINTS).toBe(27);
    expect(OBJECTIVE_TOTAL_MIN_POINTS).toBe(54);
    expect(P3_MIN_POINTS).toBe(30);
  });
});

describe('2. Integridade Estrutural das Provas (P1, P2 e P3)', () => {
  it('contains exactly 3 exam blocks: P1, P2 and P3', () => {
    expect(INITIAL_SEED_DATA.examBlocks).toHaveLength(3);
    const codes = INITIAL_SEED_DATA.examBlocks.map((b) => b.code);
    expect(codes).toContain('P1');
    expect(codes).toContain('P2');
    expect(codes).toContain('P3');

    const p1 = INITIAL_SEED_DATA.examBlocks.find((b) => b.code === 'P1');
    const p2 = INITIAL_SEED_DATA.examBlocks.find((b) => b.code === 'P2');
    const p3 = INITIAL_SEED_DATA.examBlocks.find((b) => b.code === 'P3');

    expect(p1?.total_items).toBe(90);
    expect(p1?.minimum_points).toBe(18);
    expect(p1?.block_type).toBe('OBJECTIVE');

    expect(p2?.total_items).toBe(90);
    expect(p2?.minimum_points).toBe(27);
    expect(p2?.block_type).toBe('OBJECTIVE');

    expect(p3?.max_points).toBe(60);
    expect(p3?.minimum_points).toBe(30);
    expect(p3?.block_type).toBe('DISCURSIVE');
  });

  it('contains exactly 5 subjects in P1 and 4 subjects in P2', () => {
    const p1Subjects = INITIAL_SEED_DATA.subjects.filter((s) => s.exam_block_code === 'P1');
    const p2Subjects = INITIAL_SEED_DATA.subjects.filter((s) => s.exam_block_code === 'P2');

    expect(p1Subjects).toHaveLength(P1_SUBJECT_COUNT);
    expect(p2Subjects).toHaveLength(P2_SUBJECT_COUNT);
    expect(INITIAL_SEED_DATA.subjects).toHaveLength(9);
  });

  it('guarantees every topic in P1/P2 has a valid exam_block_id and exam_block_code', () => {
    for (const topic of INITIAL_SEED_DATA.topics) {
      expect(['P1', 'P2']).toContain(topic.exam_block_code);
      expect(topic.exam_block_id).toBeDefined();
      expect(topic.exam_block_id!.length).toBeGreaterThan(0);
      expect(topic.priority).toMatch(/^(HIGH|MEDIUM|LOW)$/);
      expect(topic.recommended_material_type).toMatch(/^(FULL_PDF|SIMPLIFIED_PDF|SUMMARY)$/);
    }
  });

  it('guarantees 1 material placeholder per topic (not per microitem)', () => {
    expect(INITIAL_SEED_DATA.materials).toHaveLength(INITIAL_SEED_DATA.topics.length);
    for (const material of INITIAL_SEED_DATA.materials) {
      expect(material.status).toBe('PENDING');
      const topic = INITIAL_SEED_DATA.topics.find((t) => t.id === material.topic_id);
      expect(topic).toBeDefined();
    }
  });
});

describe('3. Integridade do Edital (SyllabusItems & Mapeamento)', () => {
  it('guarantees all SyllabusItems have a valid subject and exam_block_id', () => {
    for (const item of INITIAL_SEED_DATA.syllabusItems) {
      expect(item.subject_id).toBeDefined();
      const subject = INITIAL_SEED_DATA.subjects.find((s) => s.id === item.subject_id);
      expect(subject).toBeDefined();
      expect(item.exam_block_id).toBeDefined();
      expect(item.official_text).toBeDefined();
      expect(item.official_text.length).toBeGreaterThan(5);
    }
  });

  it('guarantees every active SyllabusItem is associated with at least one Topic', () => {
    const activeItems = INITIAL_SEED_DATA.syllabusItems.filter((i) => i.active);
    for (const item of activeItems) {
      const links = INITIAL_SEED_DATA.topicSyllabusItems.filter((l) => l.syllabus_item_id === item.id);
      expect(links.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('guarantees every Topic is associated with at least one SyllabusItem (no orphans)', () => {
    for (const topic of INITIAL_SEED_DATA.topics) {
      const links = INITIAL_SEED_DATA.topicSyllabusItems.filter((l) => l.topic_id === topic.id);
      expect(links.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('4. Regra de Pontuação Cebraspe (+1 / -1 / 0)', () => {
  it('calculates net points strictly according to Cebraspe model', () => {
    // 1 acerto = +1, 1 erro = -1, branco/dupla = 0
    expect(calculateNetPoints(80, 10)).toBe(70);
    expect(calculateNetPoints(45, 45)).toBe(0);
    expect(calculateNetPoints(30, 40)).toBe(-10);
    expect(calculateNetPoints(0, 0)).toBe(0);
  });
});

describe('5. Fórmulas Oficiais da Prova Discursiva (P3)', () => {
  it('calculates Questão Discursiva de 20 linhas (NQi = NCi - 3*NEi/TLi)', () => {
    // NC = 12, NE = 2, TL = 20 -> 12 - 3*(2/20) = 12 - 0.3 = 11.7
    const score = calculateDiscursiveScore('QUESTION_20_LINES', 12, 2, 20);
    expect(score.calculatedScore).toBeCloseTo(11.7, 2);
    expect(score.isValid).toBe(true);
  });

  it('calculates Peça Técnica de 50 linhas (NPT = NC - 6*NE/TL)', () => {
    // NC = 28, NE = 4, TL = 48 -> 28 - 6*(4/48) = 28 - 0.5 = 27.5
    const score = calculateDiscursiveScore('TECHNICAL_PIECE_50_LINES', 28, 4, 48);
    expect(score.calculatedScore).toBeCloseTo(27.5, 2);
    expect(score.isValid).toBe(true);
  });

  it('clamps discursive score at minimum 0 if penalties exceed content', () => {
    // Heavy errors that drive formula negative
    const qScore = calculateDiscursiveScore('QUESTION_20_LINES', 2, 20, 15);
    expect(qScore.calculatedScore).toBe(0);

    const ptScore = calculateDiscursiveScore('TECHNICAL_PIECE_50_LINES', 5, 50, 40);
    expect(ptScore.calculatedScore).toBe(0);
  });

  it('handles division by zero gracefully without throwing', () => {
    const score = calculateDiscursiveScore('QUESTION_20_LINES', 10, 2, 0);
    expect(score.calculatedScore).toBe(0);
  });

  it('validates limits for Q20 (<= 20 lines, content <= 15) and Peça (<= 50 lines, content <= 30)', () => {
    // Q20 valid
    const valQ = validateDiscursiveInput('QUESTION_20_LINES', 14, 1, 19);
    expect(valQ.valid).toBe(true);

    // Q20 invalid lines
    const valQExceedLines = validateDiscursiveInput('QUESTION_20_LINES', 14, 1, 21);
    expect(valQExceedLines.valid).toBe(false);

    // Q20 invalid content score
    const valQExceedScore = validateDiscursiveInput('QUESTION_20_LINES', 16, 0, 20);
    expect(valQExceedScore.valid).toBe(false);

    // Peça valid
    const valPt = validateDiscursiveInput('TECHNICAL_PIECE_50_LINES', 28, 2, 45);
    expect(valPt.valid).toBe(true);

    // Peça invalid lines
    const valPtExceedLines = validateDiscursiveInput('TECHNICAL_PIECE_50_LINES', 28, 2, 52);
    expect(valPtExceedLines.valid).toBe(false);

    // Peça invalid content score
    const valPtExceedScore = validateDiscursiveInput('TECHNICAL_PIECE_50_LINES', 32, 0, 50);
    expect(valPtExceedScore.valid).toBe(false);
  });
});

describe('6. Migração Local v1 -> v2 e Consolidação de Tópicos', () => {
  it('migrates legacy store v1 without loss of sessions, errors, flashcards and consolidates IT topics', () => {
    const legacyV1Data: any = {
      exam: {
        id: 'exam-camara-2027',
        name: 'Câmara dos Deputados 2027',
        exam_date: '2027-01-17',
      },
      subjects: [
        { id: 'sub-portugues', name: 'Língua Portuguesa' },
        { id: 'sub-constitucional', name: 'Direito Constitucional' },
        { id: 'sub-administrativo', name: 'Direito Administrativo' },
        { id: 'sub-ti', name: 'Tecnologia da Informação e Dados' },
      ],
      topics: [],
      materials: [],
      questionSessions: [
        {
          id: 'qs-legacy-1',
          user_id: 'local-user',
          exam_id: 'exam-camara-2027',
          subject_id: 'sub-ti',
          topic_id: 'top-ti-histograma', // Legacy microtopic
          total_questions: 10,
          correct: 8,
          wrong: 2,
          blank: 0,
          net_points: 6,
        },
        {
          id: 'qs-legacy-2',
          user_id: 'local-user',
          exam_id: 'exam-camara-2027',
          subject_id: 'sub-ti',
          topic_id: 'top-ti-phishing', // Legacy microtopic
          total_questions: 15,
          correct: 14,
          wrong: 1,
          blank: 0,
          net_points: 13,
        },
      ],
      errorLogs: [
        {
          id: 'err-legacy-1',
          user_id: 'local-user',
          exam_id: 'exam-camara-2027',
          subject_id: 'sub-ti',
          topic_id: 'top-ti-histograma',
          error_type: 'CONCEPT_CONFUSION',
          summary: 'Confundi histograma com gráfico de barras',
        },
      ],
      flashcards: [
        {
          id: 'card-legacy-1',
          user_id: 'local-user',
          topic_id: 'top-ti-histograma',
          front: 'O que mede o histograma?',
          back: 'Distribuição de frequências de variável contínua.',
        },
      ],
      fsrsStates: {
        'card-legacy-1': { reps: 2, stability: 5.4, difficulty: 4.1 },
      },
      reviews: [
        {
          id: 'rev-legacy-1',
          card_id: 'card-legacy-1',
          rating: 3,
        },
      ],
    };

    const migrated = migrateV1ToV2(legacyV1Data);

    // 1. Structure updated to v2
    expect(migrated.examBlocks).toHaveLength(3);
    expect(migrated.subjects).toHaveLength(9);
    expect(migrated.topics).toHaveLength(76);
    expect(migrated.syllabusItems).toHaveLength(81);

    // 2. Question sessions preserved and consolidated
    expect(migrated.questionSessions).toHaveLength(2);
    const histSession = migrated.questionSessions.find((s) => s.id === 'qs-legacy-1');
    expect(histSession?.topic_id).toBe('top-p1-ti-8'); // Consolidated into Visualização e storytelling de dados

    const secSession = migrated.questionSessions.find((s) => s.id === 'qs-legacy-2');
    expect(secSession?.topic_id).toBe('top-p1-ti-4'); // Consolidated into Segurança da informação

    // 3. Error logs preserved and consolidated
    expect(migrated.errorLogs).toHaveLength(1);
    expect(migrated.errorLogs[0].topic_id).toBe('top-p1-ti-8');

    // 4. Flashcards preserved and consolidated
    expect(migrated.flashcards).toHaveLength(1);
    expect(migrated.flashcards[0].topic_id).toBe('top-p1-ti-8');

    // 5. FSRS states and reviews preserved
    expect(migrated.fsrsStates['card-legacy-1']).toBeDefined();
    expect(migrated.fsrsStates['card-legacy-1'].stability).toBe(5.4);
    expect(migrated.reviews).toHaveLength(1);
  });
});
