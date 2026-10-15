import { Topic } from '@/types/database';
import { SEED_EXAM } from './exam';
import { SEED_EXAM_BLOCKS } from './exam-blocks';
import { SEED_SUBJECTS } from './subjects';
import { P1_PORTUGUES_TOPICS } from './p1-portugues';
import { P1_INGLES_TOPICS } from './p1-ingles';
import { P1_ADMINISTRATIVO_TOPICS } from './p1-administrativo';
import { P1_CONSTITUCIONAL_TOPICS } from './p1-constitucional';
import { P1_TI_TOPICS } from './p1-ti';
import { P2_LINGUISTICA_TOPICS } from './p2-linguistica';
import { P2_TRANSCRICAO_IA_TOPICS } from './p2-transcricao-ia';
import { P2_PROCESSO_LEGISLATIVO_TOPICS } from './p2-processo-legislativo';
import { P2_CIENCIA_POLITICA_TOPICS } from './p2-ciencia-politica';
import { SEED_SYLLABUS_ITEMS, SEED_TOPIC_SYLLABUS_ITEMS } from './syllabus-items';
import { generateSeedMaterials } from './materials';

export { SEED_EXAM } from './exam';
export { SEED_EXAM_BLOCKS } from './exam-blocks';
export { SEED_SUBJECTS } from './subjects';
export { SEED_SYLLABUS_ITEMS, SEED_TOPIC_SYLLABUS_ITEMS } from './syllabus-items';

export const SEED_TOPICS: Topic[] = [
  // P1 — Conhecimentos Básicos (42 tópicos)
  ...P1_PORTUGUES_TOPICS,
  ...P1_INGLES_TOPICS,
  ...P1_ADMINISTRATIVO_TOPICS,
  ...P1_CONSTITUCIONAL_TOPICS,
  ...P1_TI_TOPICS,

  // P2 — Conhecimentos Específicos (34 tópicos)
  ...P2_LINGUISTICA_TOPICS,
  ...P2_TRANSCRICAO_IA_TOPICS,
  ...P2_PROCESSO_LEGISLATIVO_TOPICS,
  ...P2_CIENCIA_POLITICA_TOPICS,
];

export const SEED_MATERIALS = generateSeedMaterials(SEED_TOPICS);

export const INITIAL_SEED_DATA = {
  exam: SEED_EXAM,
  examBlocks: SEED_EXAM_BLOCKS,
  subjects: SEED_SUBJECTS,
  topics: SEED_TOPICS,
  materials: SEED_MATERIALS,
  syllabusItems: SEED_SYLLABUS_ITEMS,
  topicSyllabusItems: SEED_TOPIC_SYLLABUS_ITEMS,
};
