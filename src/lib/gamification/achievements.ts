import { Achievement } from './types';
import { AppStoreData } from '@/lib/data/store';
import { getAllMeaningfulStudyDates, calculateWeeklyConsistency } from './streak';
import { getLocalDateString } from '@/lib/utils/date';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_mission',
    title: 'Primeiros Passos',
    description: 'Concluiu sua primeira missão diária de estudo.',
    category: 'CONSISTENCY',
    icon: 'Footprints',
    xp_reward: 50,
    criteria_text: 'Completar 1 missão diária',
  },
  {
    id: 'first_battery',
    title: 'Primeira Bateria',
    description: 'Registrou uma sessão de questões com pelo menos 15 itens.',
    category: 'QUESTIONS',
    icon: 'Target',
    xp_reward: 50,
    criteria_text: 'Sessão com >= 15 questões',
  },
  {
    id: 'questions_100',
    title: 'Centurião de Questões',
    description: 'Alcançou a marca de 100 questões registradas.',
    category: 'QUESTIONS',
    icon: 'Award',
    xp_reward: 50,
    criteria_text: 'Acumular 100 questões',
  },
  {
    id: 'questions_500',
    title: '500 Questões',
    description: 'Alcançou 500 questões resolvidas na preparação.',
    category: 'QUESTIONS',
    icon: 'Zap',
    xp_reward: 100,
    criteria_text: 'Acumular 500 questões',
  },
  {
    id: 'questions_1000',
    title: 'Milheiro Cebraspe',
    description: 'Ultrapassou a marca histórica de 1.000 questões analisadas.',
    category: 'QUESTIONS',
    icon: 'Flame',
    xp_reward: 150,
    criteria_text: 'Acumular 1.000 questões',
  },
  {
    id: 'errors_10',
    title: 'Transformando Erros',
    description: 'Marcou 10 erros como resolvidos no Caderno de Erros.',
    category: 'ERRORS',
    icon: 'CheckCircle2',
    xp_reward: 50,
    criteria_text: 'Resolver 10 erros',
  },
  {
    id: 'memory_5_days',
    title: 'Memória em Dia',
    description: 'Zerou revisões vencidas do FSRS em 5 dias diferentes.',
    category: 'MEMORY',
    icon: 'Brain',
    xp_reward: 50,
    criteria_text: 'Zerar fila em 5 dias distintos',
  },
  {
    id: 'first_mastered',
    title: 'Primeiro Tópico Dominado',
    description: 'Alcançou o status MASTERED em qualquer tópico do edital.',
    category: 'COVERAGE',
    icon: 'Crown',
    xp_reward: 50,
    criteria_text: '1 tópico com status MASTERED',
  },
  {
    id: 'p3_started',
    title: 'P3 Começou',
    description: 'Registrou sua primeira sessão de prova discursiva.',
    category: 'DISCURSIVE',
    icon: 'PenTool',
    xp_reward: 50,
    criteria_text: '1 sessão de discursiva registrada',
  },
  {
    id: 'technical_piece',
    title: 'Peça Técnica',
    description: 'Concluiu sua primeira Peça Técnica de até 50 linhas.',
    category: 'DISCURSIVE',
    icon: 'FileText',
    xp_reward: 100,
    criteria_text: '1 Peça Técnica de 50 linhas concluída',
  },
  {
    id: 'coverage_25',
    title: 'Cobertura 25%',
    description: 'Iniciou o estudo de pelo menos 25% dos tópicos do edital.',
    category: 'COVERAGE',
    icon: 'Compass',
    xp_reward: 50,
    criteria_text: '25% dos tópicos iniciados',
  },
  {
    id: 'coverage_50',
    title: 'Cobertura 50%',
    description: 'Alcançou metade do edital com tópicos iniciados.',
    category: 'COVERAGE',
    icon: 'Shield',
    xp_reward: 75,
    criteria_text: '50% dos tópicos iniciados',
  },
  {
    id: 'coverage_75',
    title: 'Cobertura 75%',
    description: 'Cobriu três quartos de todas as unidades temáticas.',
    category: 'COVERAGE',
    icon: 'Sparkles',
    xp_reward: 100,
    criteria_text: '75% dos tópicos iniciados',
  },
  {
    id: 'coverage_100',
    title: 'Edital Percorrido',
    description: '100% dos 76 tópicos foram iniciados pelo menos uma vez.',
    category: 'COVERAGE',
    icon: 'Trophy',
    xp_reward: 200,
    criteria_text: '100% dos tópicos iniciados',
  },
  {
    id: 'weekly_consistency',
    title: 'Consistência de Aço',
    description: 'Cumpriu 6 dias significativos numa mesma semana.',
    category: 'CONSISTENCY',
    icon: 'CalendarCheck',
    xp_reward: 100,
    criteria_text: '6 dias significativos na semana',
  },
  {
    id: 'boss_defeated',
    title: 'Boss Derrotado',
    description: 'Completou seu primeiro Checkpoint Semanal (Boss da Semana).',
    category: 'BOSS',
    icon: 'Swords',
    xp_reward: 100,
    criteria_text: 'Completar 1 simulado ou checkpoint semanal',
  },
];

/**
 * Pure evaluation function that checks which achievements are newly unlocked.
 */
export function evaluateAchievements(
  store: AppStoreData,
  unlockedIds: string[]
): {
  newlyUnlocked: Achievement[];
  allUnlockedIds: string[];
} {
  const unlockedSet = new Set(unlockedIds);
  const newlyUnlocked: Achievement[] = [];

  const totalQuestions = store.questionSessions.reduce((sum, s) => sum + s.total_questions, 0);
  const resolvedErrorsCount = store.errorLogs.filter((e) => e.resolved).length;
  const startedTopicsCount = store.topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const totalTopics = store.topics.length || 76;
  const coveragePercent = Math.round((startedTopicsCount / totalTopics) * 100);
  const masteredCount = store.topics.filter((t) => t.status === 'MASTERED').length;
  const discursiveSessions = store.discursiveSessions || [];
  const technicalPiecesCount = discursiveSessions.filter((d) => d.type === 'TECHNICAL_PIECE_50_LINES').length;

  // Count completed missions across all stored dates
  let completedMissionsCount = 0;
  if (store.dailyMissions) {
    Object.values(store.dailyMissions).forEach((dayMissions) => {
      completedMissionsCount += dayMissions.filter((m) => m.status === 'COMPLETED').length;
    });
  }

  // Count days where queue was cleared
  const queueClearedDatesCount = (store.events || []).filter(
    (ev) => ev.event_type === 'FLASHCARD_QUEUE_CLEARED'
  ).length;

  // Check weekly consistency
  const meaningfulDates = getAllMeaningfulStudyDates({
    questionSessions: store.questionSessions,
    materialProgress: store.materialProgress,
    reviews: store.reviews,
    discursiveSessions: store.discursiveSessions || [],
    mockExams: store.mockExams || [],
  });
  const todayStr = getLocalDateString();
  const weeklyRhythm = calculateWeeklyConsistency(meaningfulDates, todayStr, 6);

  // Check mock exams or checkpoints
  const completedCheckpointsCount = (store.mockExams || []).filter(
    (me) => me.type === 'WEEKLY_CHECKPOINT' || me.type === 'FULL_MOCK'
  ).length;

  // Criteria evaluator map
  const criteriaMap: Record<string, () => boolean> = {
    first_mission: () => completedMissionsCount >= 1,
    first_battery: () => store.questionSessions.some((s) => s.total_questions >= 15),
    questions_100: () => totalQuestions >= 100,
    questions_500: () => totalQuestions >= 500,
    questions_1000: () => totalQuestions >= 1000,
    errors_10: () => resolvedErrorsCount >= 10,
    memory_5_days: () => queueClearedDatesCount >= 5,
    first_mastered: () => masteredCount >= 1,
    p3_started: () => discursiveSessions.length >= 1,
    technical_piece: () => technicalPiecesCount >= 1,
    coverage_25: () => coveragePercent >= 25,
    coverage_50: () => coveragePercent >= 50,
    coverage_75: () => coveragePercent >= 75,
    coverage_100: () => startedTopicsCount === totalTopics && totalTopics > 0,
    weekly_consistency: () => weeklyRhythm.daysStudiedThisWeek >= 6,
    boss_defeated: () => completedCheckpointsCount >= 1,
  };

  for (const ach of ALL_ACHIEVEMENTS) {
    if (unlockedSet.has(ach.id)) continue;
    const evaluator = criteriaMap[ach.id];
    if (evaluator && evaluator()) {
      unlockedSet.add(ach.id);
      newlyUnlocked.push({
        ...ach,
        unlocked_at: new Date().toISOString(),
      });
    }
  }

  return {
    newlyUnlocked,
    allUnlockedIds: Array.from(unlockedSet),
  };
}
