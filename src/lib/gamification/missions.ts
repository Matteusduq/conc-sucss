import { DailyMission, MissionType, MissionStatus } from './types';
import { AppStoreData } from '@/lib/data/store';
import { generateDailyPlan } from '@/lib/study-engine/recommendations';
import { getDueFlashcards } from '@/lib/data/store';
import { getLocalDateString } from '@/lib/utils/date';
import { GAMIFICATION_RULES } from './xp';

/**
 * Generates deterministic daily missions according to the strategic edital priority
 * and user's available time.
 */
export function generateDailyMissions(
  targetDate: string,
  store: AppStoreData
): DailyMission[] {
  const availableMinutes = store.settings.today_available_minutes || 120;
  const dueCards = getDueFlashcards(store);
  const plan = generateDailyPlan({
    topics: store.topics,
    subjects: store.subjects,
    materials: store.materials,
    errors: store.errorLogs,
    overdueCardsCount: dueCards.length,
    availableMinutesToday: availableMinutes,
    weeklyTargetMinutes: store.settings.weekly_study_target_minutes,
  });

  const missions: DailyMission[] = [];
  const subjectMap = new Map(store.subjects.map((s) => [s.id, s.name]));

  // 1. MISSÃO PRINCIPAL (Always born from Task #1 of strategic plan)
  const task1 = plan.tasks[0];
  if (task1) {
    const isTheory = task1.actionType === 'READ_MATERIAL';
    const mainType: MissionType = isTheory ? 'CORE_STUDY' : 'QUESTIONS';
    const targetVal = isTheory
      ? Math.min(45, Math.max(20, task1.estimatedMinutes))
      : (task1.targetQuestions || 20);
    const unit = isTheory ? 'min' : 'questões';

    const reasonsList =
      task1.strategicReasons && task1.strategicReasons.length > 0
        ? task1.strategicReasons.join(' • ')
        : task1.reason;

    missions.push({
      id: `mis-${targetDate}-main`,
      date: targetDate,
      type: mainType,
      title: `[${task1.examBlockCode || 'P2'}] ${task1.topicName}`,
      description: isTheory
        ? `Estudar ${targetVal} minutos de conteúdo prioritário e avançar na teoria.`
        : `Resolver ${targetVal} questões Cebraspe no TEC sobre este tópico prioritário.`,
      topic_id: task1.topicId,
      subject_id: task1.subjectId,
      target_value: targetVal,
      current_value: 0,
      unit,
      xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
      status: 'PENDING',
      reason: reasonsList,
      source: 'Plano Estratégico do Edital (Task #1)',
      is_main: true,
      cta_url: `/estudar/${task1.topicId}`,
      cta_label: isTheory ? 'Estudar Tópico' : 'Resolver Questões',
      created_at: new Date().toISOString(),
    });
  }

  // 2. MISSÕES DE APOIO (Adapted to available time)
  // Support Mission A: Memory Review (if due cards > 0, or standard 10 cards)
  const memoryTarget = Math.max(5, Math.min(25, dueCards.length > 0 ? dueCards.length : 10));
  missions.push({
    id: `mis-${targetDate}-memory`,
    date: targetDate,
    type: 'MEMORY',
    title: 'Manutenção de Memória FSRS',
    description: `Revisar ${memoryTarget} flashcards devidos para garantir retenção de longo prazo.`,
    target_value: memoryTarget,
    current_value: 0,
    unit: 'cards',
    xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
    status: 'PENDING',
    reason: 'Repetição espaçada com algoritmo FSRS para evitar o declínio da curva de esquecimento.',
    source: 'Motor de Memória FSRS',
    is_main: false,
    cta_url: '/memoria',
    cta_label: 'Revisar Memória',
    created_at: new Date().toISOString(),
  });

  // Support Mission B: Consolidação / Questões do Bloco Complementar
  // If Main was P2, support task 2 is usually P1
  const task2 = plan.tasks.find((t) => t.id !== task1?.id);
  if (task2 && availableMinutes > 45) {
    missions.push({
      id: `mis-${targetDate}-consolidation`,
      date: targetDate,
      type: 'QUESTIONS',
      title: `Consolidação: ${task2.topicName}`,
      description: `Resolver ${task2.targetQuestions || 15} itens no modelo Cebraspe com foco em pontuação líquida.`,
      topic_id: task2.topicId,
      subject_id: task2.subjectId,
      target_value: task2.targetQuestions || 15,
      current_value: 0,
      unit: 'questões',
      xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
      status: 'PENDING',
      reason: `Interleaving curricular: equilíbrio entre blocos P1 e P2 (StudyScore ${task2.studyScore}).`,
      source: 'Plano Estratégico (Task #2)',
      is_main: false,
      cta_url: `/estudar/${task2.topicId}`,
      cta_label: 'Fazer Questões',
      created_at: new Date().toISOString(),
    });
  }

  // Support Mission C: Recuperação de Erros (If user has pending unresolved errors and > 90 min)
  const unresolvedErrors = store.errorLogs.filter((e) => !e.resolved);
  if (availableMinutes > 90 && unresolvedErrors.length > 0) {
    const errorTarget = Math.min(3, unresolvedErrors.length);
    missions.push({
      id: `mis-${targetDate}-errors`,
      date: targetDate,
      type: 'ERROR_REVIEW',
      title: 'Caderno de Erros: Blindagem',
      description: `Analisar e marcar ${errorTarget} erro(s) pendente(s) como resolvido(s).`,
      target_value: errorTarget,
      current_value: 0,
      unit: 'erros',
      xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
      status: 'PENDING',
      reason: 'Transformar falhas em aprendizado concreto: erro corrigido vale +10 XP.',
      source: 'Caderno de Erros',
      is_main: false,
      cta_url: '/erros',
      cta_label: 'Abrir Erros',
      created_at: new Date().toISOString(),
    });
  }

  // Support Mission D: Discursiva P3 (When availableMinutes > 150)
  if (availableMinutes > 150) {
    const p3Topic = store.topics.find((t) => t.discursive_eligible && t.discursive_synergy === 'HIGH');
    missions.push({
      id: `mis-${targetDate}-discursive`,
      date: targetDate,
      type: 'DISCURSIVE',
      title: 'Treino Discursivo P3',
      description: `Registrar 1 questão discursiva (até 20 linhas) ou peça técnica (até 50 linhas).`,
      topic_id: p3Topic?.id,
      subject_id: p3Topic?.subject_id,
      target_value: 1,
      current_value: 0,
      unit: 'treino',
      xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
      status: 'PENDING',
      reason: 'A prova discursiva vale 60 pontos com nota mínima de 30 pontos no Edital nº 1/2026.',
      source: 'Prova P3 (Discursiva)',
      is_main: false,
      cta_url: '/discursiva',
      cta_label: 'Treinar Discursiva',
      created_at: new Date().toISOString(),
    });
  }

  return missions;
}

/**
 * Updates daily missions' progress based on verified real user actions on that date.
 * Does not overwrite completed missions or arbitrarily change topics.
 */
export function updateMissionsProgress(
  missions: DailyMission[],
  store: AppStoreData,
  targetDate: string
): DailyMission[] {
  return missions.map((mission) => {
    let currentValue = 0;

    switch (mission.type) {
      case 'QUESTIONS': {
        // Sessions on targetDate matching mission.topic_id if specified, or all sessions
        const matchingSessions = store.questionSessions.filter((s) => {
          const sDate = getLocalDateString(s.performed_at);
          if (sDate !== targetDate) return false;
          if (mission.topic_id) {
            return s.topic_id === mission.topic_id;
          }
          return true;
        });
        currentValue = matchingSessions.reduce((sum, s) => sum + s.total_questions, 0);
        break;
      }

      case 'CORE_STUDY': {
        if (mission.topic_id) {
          // Check material progress
          const material = store.materials.find((m) => m.topic_id === mission.topic_id);
          const prog = material ? store.materialProgress[material.id] : undefined;
          if (prog && prog.last_opened_at && getLocalDateString(prog.last_opened_at) === targetDate) {
            currentValue = Math.round(prog.total_study_seconds / 60);
          }
        }
        // Also check if any question sessions or explicit study sessions occurred
        const sessions = store.questionSessions.filter(
          (s) => s.topic_id === mission.topic_id && getLocalDateString(s.performed_at) === targetDate
        );
        const sessionMins = Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60);
        currentValue = Math.max(currentValue, sessionMins);
        break;
      }

      case 'MEMORY': {
        const reviewsOnDate = store.reviews.filter(
          (r) => getLocalDateString(r.reviewed_at) === targetDate
        );
        currentValue = reviewsOnDate.length;
        break;
      }

      case 'ERROR_REVIEW': {
        const resolvedOnDate = store.errorLogs.filter(
          (e) => e.resolved && e.resolved_at && getLocalDateString(e.resolved_at) === targetDate
        );
        currentValue = resolvedOnDate.length;
        break;
      }

      case 'DISCURSIVE': {
        const discursivesOnDate = (store.discursiveSessions || []).filter(
          (d) => getLocalDateString(d.performed_at) === targetDate
        );
        currentValue = discursivesOnDate.length;
        break;
      }

      case 'WEEKLY_BOSS':
      case 'MOCK_EXAM': {
        const mocksOnDate = (store.mockExams || []).filter(
          (m) => getLocalDateString(m.performed_at) === targetDate
        );
        currentValue = mocksOnDate.length;
        break;
      }
    }

    const isCompleted = currentValue >= mission.target_value;
    const prevStatus = mission.status;
    let newStatus: MissionStatus = 'PENDING';

    if (isCompleted) {
      newStatus = 'COMPLETED';
    } else if (currentValue > 0) {
      newStatus = 'IN_PROGRESS';
    }

    return {
      ...mission,
      current_value: currentValue,
      status: newStatus,
      completed_at:
        newStatus === 'COMPLETED' && prevStatus !== 'COMPLETED'
          ? new Date().toISOString()
          : mission.completed_at,
    };
  });
}

/**
 * Stable getter/creator:
 * If missions for `date` already exist in store, updates their progress and returns them.
 * If not, creates them, stores them, and returns them.
 */
export function getOrCreateDailyMissions(
  date: string,
  store: AppStoreData
): {
  missions: DailyMission[];
  store: AppStoreData;
} {
  const existing = store.dailyMissions && store.dailyMissions[date];

  if (existing && existing.length > 0) {
    const updated = updateMissionsProgress(existing, store, date);
    const updatedStore: AppStoreData = {
      ...store,
      dailyMissions: {
        ...store.dailyMissions,
        [date]: updated,
      },
    };
    return {
      missions: updated,
      store: updatedStore,
    };
  }

  // Generate new missions
  const fresh = generateDailyMissions(date, store);
  const updated = updateMissionsProgress(fresh, store, date);

  const updatedStore: AppStoreData = {
    ...store,
    dailyMissions: {
      ...(store.dailyMissions || {}),
      [date]: updated,
    },
  };

  return {
    missions: updated,
    store: updatedStore,
  };
}
