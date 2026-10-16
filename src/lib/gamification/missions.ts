import { DailyMission, MissionType, MissionStatus } from './types';
import { AppStoreData } from '@/lib/data/store';
import { generateDailyPlan } from '@/lib/study-engine/recommendations';
import { getDueFlashcards } from '@/lib/data/store';
import { getLocalDateString, getWeekStartAndEnd, getCalendarDaysDiff } from '@/lib/utils/date';
import { calculateJourneyPhase } from './journey';
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

  // 1. MISSÃO PRINCIPAL
  // Select first task from strategic plan. If waiting for material, look for next actionable task.
  let selectedTask = plan.tasks[0];
  let isExecutable = true;

  if (selectedTask && selectedTask.actionType === 'WAITING_MATERIAL') {
    const nextActionable = plan.tasks.find(
      (t) =>
        t.actionType === 'READ_MATERIAL' ||
        t.actionType === 'TEC_QUESTIONS' ||
        t.actionType === 'REVIEW_ERRORS'
    );
    if (nextActionable) {
      selectedTask = nextActionable;
      isExecutable = true;
    } else {
      isExecutable = false;
    }
  }

  if (selectedTask) {
    if (isExecutable && selectedTask.actionType !== 'WAITING_MATERIAL') {
      const isTheory = selectedTask.actionType === 'READ_MATERIAL';
      const mainType: MissionType = isTheory ? 'CORE_STUDY' : 'QUESTIONS';
      const targetVal = isTheory
        ? Math.min(45, Math.max(20, selectedTask.estimatedMinutes))
        : (selectedTask.targetQuestions || 20);
      const unit = isTheory ? 'min' : 'questões';

      const reasonsList =
        selectedTask.strategicReasons && selectedTask.strategicReasons.length > 0
          ? selectedTask.strategicReasons.join(' • ')
          : selectedTask.reason;

      missions.push({
        id: `mis-${targetDate}-main`,
        date: targetDate,
        type: mainType,
        title: `[${selectedTask.examBlockCode || 'P2'}] ${selectedTask.topicName}`,
        description: isTheory
          ? `Estudar ${targetVal} minutos de conteúdo prioritário e avançar na teoria.`
          : `Resolver ${targetVal} questões Cebraspe no TEC sobre este tópico prioritário.`,
        topic_id: selectedTask.topicId,
        subject_id: selectedTask.subjectId,
        target_value: targetVal,
        current_value: 0,
        unit,
        xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
        status: 'PENDING',
        reason: reasonsList,
        source: 'Plano Estratégico do Edital (Task #1)',
        is_main: true,
        is_executable: true,
        cta_url: `/estudar/${selectedTask.topicId}`,
        cta_label: isTheory ? 'Estudar Tópico' : 'Resolver Questões',
        created_at: new Date().toISOString(),
      });
    } else {
      // Waiting material state without fake action
      missions.push({
        id: `mis-${targetDate}-main`,
        date: targetDate,
        type: 'CORE_STUDY',
        title: `Próximo Conteúdo: ${selectedTask.topicName}`,
        description: 'Sua trilha estratégica já está definida. Os materiais ainda estão sendo preparados. Este tópico já está priorizado e será liberado assim que o PDF correspondente for inserido.',
        topic_id: selectedTask.topicId,
        subject_id: selectedTask.subjectId,
        target_value: 0,
        current_value: 0,
        unit: 'min',
        xp_reward: 0,
        status: 'PENDING',
        reason: 'Material didático aguardando upload. Nenhuma tarefa substitutiva artificial recomendada.',
        source: 'Plano Estratégico do Edital',
        is_main: true,
        is_executable: false,
        cta_url: `/estudar/${selectedTask.topicId}`,
        cta_label: 'Ver Tópico',
        created_at: new Date().toISOString(),
      });

      const hasHistory =
        (store.questionSessions || []).length > 0 ||
        (store.reviews || []).length > 0 ||
        (store.discursiveSessions || []).length > 0 ||
        (store.mockExams || []).length > 0 ||
        dueCards.length > 0;

      // Section 1 Rule: Se nenhum Topic possuir material e não houver histórico, não gerar missões acadêmicas artificiais.
      if (!hasHistory) {
        return missions;
      }
    }
  }

  // 2. MISSÕES DE APOIO (Adapted to available time)
  // Support Mission A: Memory Review (ONLY if there are actual due cards)
  if (dueCards.length > 0) {
    const memoryTarget = Math.min(25, dueCards.length);
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
      is_executable: true,
      cta_url: '/memoria',
      cta_label: 'Revisar Memória',
      created_at: new Date().toISOString(),
    });
  }

  // Support Mission B: Consolidação / Questões do Bloco Complementar
  const task2 = plan.tasks.find(
    (t) =>
      t.id !== selectedTask?.id &&
      (t.actionType === 'TEC_QUESTIONS' || t.actionType === 'READ_MATERIAL')
  );
  if (task2 && availableMinutes > 45 && task2.actionType !== 'WAITING_MATERIAL') {
    const isTheory2 = task2.actionType === 'READ_MATERIAL';
    missions.push({
      id: `mis-${targetDate}-consolidation`,
      date: targetDate,
      type: isTheory2 ? 'CORE_STUDY' : 'QUESTIONS',
      title: `Consolidação: ${task2.topicName}`,
      description: isTheory2
        ? `Estudar ${Math.min(30, task2.estimatedMinutes)} minutos de material didático disponível.`
        : `Resolver ${task2.targetQuestions || 15} itens no modelo Cebraspe com foco em pontuação líquida.`,
      topic_id: task2.topicId,
      subject_id: task2.subjectId,
      target_value: isTheory2 ? Math.min(30, task2.estimatedMinutes) : (task2.targetQuestions || 15),
      current_value: 0,
      unit: isTheory2 ? 'min' : 'questões',
      xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
      status: 'PENDING',
      reason: `Interleaving curricular: equilíbrio entre blocos P1 e P2 (StudyScore ${task2.studyScore}).`,
      source: 'Plano Estratégico (Apoio)',
      is_main: false,
      is_executable: true,
      cta_url: `/estudar/${task2.topicId}`,
      cta_label: isTheory2 ? 'Estudar Tópico' : 'Fazer Questões',
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
      is_executable: true,
      cta_url: '/erros',
      cta_label: 'Abrir Erros',
      created_at: new Date().toISOString(),
    });
  }

  // Support Mission D: Discursiva P3 (Respeita discursiveWeeklyTarget e dias da semana)
  const phaseInfo = calculateJourneyPhase({
    daysUntilExam: getCalendarDaysDiff(targetDate, '2027-01-17'),
    totalTopics: store.topics.length,
    startedTopics: store.topics.filter((t) => t.status !== 'NOT_STARTED').length,
    meaningfulStartedTopics: store.topics.filter((t) =>
      ['AWAITING_QUESTIONS', 'CONSOLIDATING', 'MASTERED', 'MAINTENANCE', 'AT_RISK'].includes(t.status)
    ).length,
    masteredTopics: store.topics.filter((t) => t.status === 'MASTERED').length,
    atRiskTopics: store.topics.filter((t) => t.status === 'AT_RISK').length,
    p1StartedTopics: store.topics.filter((t) => t.exam_block_code === 'P1' && t.status !== 'NOT_STARTED').length,
    p1TotalTopics: store.topics.filter((t) => t.exam_block_code === 'P1').length,
    p2StartedTopics: store.topics.filter((t) => t.exam_block_code === 'P2' && t.status !== 'NOT_STARTED').length,
    p2TotalTopics: store.topics.filter((t) => t.exam_block_code === 'P2').length,
    averageDomainScore: 0,
    totalQuestions: (store.questionSessions || []).reduce((sum, s) => sum + s.total_questions, 0),
    discursiveSessionsCount: (store.discursiveSessions || []).length,
    mockExamsCount: (store.mockExams || []).length,
  });

  const weekBounds = getWeekStartAndEnd(targetDate);
  const doneThisWeek = (store.discursiveSessions || []).filter((ds) => {
    const dStr = getLocalDateString(ds.performed_at);
    return dStr >= weekBounds.weekStart && dStr <= weekBounds.weekEnd;
  }).length;

  if (doneThisWeek < phaseInfo.discursiveWeeklyTarget && availableMinutes >= 60) {
    const isQ20 = phaseInfo.phase === 'BASE' || doneThisWeek % 2 === 0;
    const title = isQ20 ? 'Treino P3 — Questão de até 20 linhas' : 'Treino P3 — Peça Técnica de até 50 linhas';
    const description = isQ20
      ? 'Elaborar e registrar 1 questão discursiva (até 20 linhas) com padrão de resposta oficial.'
      : 'Elaborar e registrar 1 peça técnica (até 50 linhas) com fundamentação regimental/legislativa.';

    const p3Topic =
      store.topics.find((t) => t.discursive_eligible && t.discursive_synergy === 'HIGH') ||
      store.topics.find((t) => t.discursive_eligible);

    missions.push({
      id: `mis-${targetDate}-discursive`,
      date: targetDate,
      type: 'DISCURSIVE',
      title,
      description,
      topic_id: p3Topic?.id,
      subject_id: p3Topic?.subject_id,
      target_value: 1,
      current_value: 0,
      unit: 'treino',
      xp_reward: GAMIFICATION_RULES.MISSIONS.XP_DAILY_MISSION_COMPLETED,
      status: 'PENDING',
      reason: `Meta da fase: ${phaseInfo.discursiveWeeklyTarget} treinos/semana (${doneThisWeek} realizado(s)). A discursiva vale 60 pontos no edital.`,
      source: 'Prova P3 (Discursiva)',
      is_main: false,
      is_executable: true,
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
  arg2: AppStoreData | string,
  arg3: AppStoreData | string
): DailyMission[] {
  const store = (typeof arg2 === 'object' ? arg2 : arg3) as AppStoreData;
  const targetDate = (typeof arg2 === 'string' ? arg2 : arg3) as string;

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
        // Sum StudySession of type MATERIAL on targetDate
        const matchingSessions = (store.studySessions || []).filter((ss) => {
          if (ss.session_type !== 'MATERIAL') return false;
          const sDate = getLocalDateString(ss.started_at);
          if (sDate !== targetDate) return false;
          if (mission.topic_id) {
            return ss.topic_id === mission.topic_id;
          }
          return true;
        });
        currentValue = Math.round(
          matchingSessions.reduce((sum, ss) => sum + ss.duration_seconds, 0) / 60
        );
        break;
      }

      case 'MEMORY': {
        // Only count reviews of cards that were actually due
        const dueReviewsOnDate = store.reviews.filter((r) => {
          const rDate = getLocalDateString(r.reviewed_at);
          return rDate === targetDate && r.was_due_at_review !== false;
        });
        currentValue = dueReviewsOnDate.length;
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

    const isCompleted = mission.target_value > 0 && currentValue >= mission.target_value;
    const prevStatus = mission.status;

    let nextStatus: MissionStatus = prevStatus;
    if (isCompleted) {
      nextStatus = 'COMPLETED';
    } else if (currentValue > 0) {
      nextStatus = 'IN_PROGRESS';
    } else {
      nextStatus = 'PENDING';
    }

    return {
      ...mission,
      current_value: currentValue,
      status: nextStatus,
      completed_at: isCompleted && prevStatus !== 'COMPLETED' ? new Date().toISOString() : mission.completed_at,
    };
  });
}

/**
 * Retrieves existing missions for target date or generates and persists them deterministically.
 */
export function getOrCreateDailyMissions(
  targetDate: string,
  store: AppStoreData
): { missions: DailyMission[]; store: AppStoreData } {
  const existing = store.dailyMissions[targetDate];
  if (existing && existing.length > 0) {
    const updated = updateMissionsProgress(existing, targetDate, store);
    return {
      missions: updated,
      store: {
        ...store,
        dailyMissions: {
          ...store.dailyMissions,
          [targetDate]: updated,
        },
      },
    };
  }

  const generated = generateDailyMissions(targetDate, store);
  const updated = updateMissionsProgress(generated, targetDate, store);
  return {
    missions: updated,
    store: {
      ...store,
      dailyMissions: {
        ...store.dailyMissions,
        [targetDate]: updated,
      },
    },
  };
}

