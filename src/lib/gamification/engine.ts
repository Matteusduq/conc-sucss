import { AppStoreData } from '@/lib/data/store';
import {
  XpTransaction,
  GamificationProfile,
  GamificationNotification,
} from './types';
import {
  GAMIFICATION_RULES,
  getLevel,
  createDefaultGamificationProfile,
} from './xp';
import {
  getAllMeaningfulStudyDates,
  calculateStreaks,
  calculateWeeklyConsistency,
} from './streak';
import { evaluateAchievements } from './achievements';
import { updateMissionsProgress } from './missions';
import { getLocalDateString } from '@/lib/utils/date';

/**
 * Pure, deterministic central engine for gamification.
 * Reconciles study events and actions into idempotent XP transactions,
 * updates GamificationProfile, streaks, achievements, mission progress,
 * and detects level ups and milestones.
 */
export function processGamification(
  store: AppStoreData,
  currentDateIso: string = new Date().toISOString()
): {
  store: AppStoreData;
  notifications: GamificationNotification[];
} {
  const todayStr = getLocalDateString(currentDateIso);
  const notifications: GamificationNotification[] = [];

  // 1. Ensure gamification structures are initialized
  const profile: GamificationProfile = store.gamificationProfile
    ? { ...store.gamificationProfile }
    : createDefaultGamificationProfile();

  const existingTransactions = [...(store.xpTransactions || [])];
  const processedRuleKeys = new Set(
    existingTransactions.map((t) => `${t.rule_id}::${t.source_event_id}`)
  );

  const newTransactions: XpTransaction[] = [];

  const addTransaction = (
    ruleId: string,
    sourceEventId: string,
    amount: number,
    sourceType: string,
    description: string,
    sourceEntityId?: string,
    createdAt: string = currentDateIso
  ) => {
    const key = `${ruleId}::${sourceEventId}`;
    if (processedRuleKeys.has(key)) return;
    if (amount <= 0) return;

    processedRuleKeys.add(key);
    const tx: XpTransaction = {
      id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: profile.user_id,
      amount,
      rule_id: ruleId,
      source_event_id: sourceEventId,
      source_type: sourceType,
      source_entity_id: sourceEntityId,
      description,
      created_at: createdAt,
    };
    newTransactions.push(tx);
    existingTransactions.push(tx);
  };

  // -----------------------------------------------------------
  // 2. QUESTION SESSIONS
  // -----------------------------------------------------------
  // Track daily volume cap per calendar date
  const questionXpByDate: Record<string, number> = {};
  existingTransactions
    .filter((t) => t.rule_id.startsWith('QUESTIONS_VOLUME'))
    .forEach((t) => {
      const d = getLocalDateString(t.created_at);
      questionXpByDate[d] = (questionXpByDate[d] || 0) + t.amount;
    });

  // Sort sessions chronologically
  const sortedSessions = [...(store.questionSessions || [])].sort(
    (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
  );

  for (const session of sortedSessions) {
    if (!session.total_questions || session.total_questions <= 0) continue;
    const sessionDate = getLocalDateString(session.performed_at);

    // Rule: Volume XP
    const currentDayXp = questionXpByDate[sessionDate] || 0;
    const availableUnderCap = Math.max(
      0,
      GAMIFICATION_RULES.QUESTIONS.DAILY_VOLUME_CAP - currentDayXp
    );

    if (availableUnderCap > 0) {
      const potentialXp = Math.min(
        GAMIFICATION_RULES.QUESTIONS.MAX_XP_PER_SESSION,
        session.total_questions * GAMIFICATION_RULES.QUESTIONS.XP_PER_QUESTION
      );
      const awarded = Math.min(potentialXp, availableUnderCap);
      if (awarded > 0) {
        addTransaction(
          `QUESTIONS_VOLUME_${session.id}`,
          session.id,
          awarded,
          'question_session',
          `${session.total_questions} questões respondidas (+${awarded} XP)`,
          session.topic_id,
          session.performed_at
        );
        questionXpByDate[sessionDate] = currentDayXp + awarded;
      }
    }

    // Rule: Bonus >= 15 questions
    if (session.total_questions >= GAMIFICATION_RULES.QUESTIONS.MIN_QUESTIONS_FOR_BONUS) {
      addTransaction(
        `QUESTIONS_SESSION_15_BONUS_${session.id}`,
        session.id,
        GAMIFICATION_RULES.QUESTIONS.SESSION_COMPLETION_BONUS,
        'question_session',
        `Bônus por bateria consistente com >= 15 questões (+${GAMIFICATION_RULES.QUESTIONS.SESSION_COMPLETION_BONUS} XP)`,
        session.topic_id,
        session.performed_at
      );
    }
  }

  // -----------------------------------------------------------
  // 3. STUDY MATERIALS
  // -----------------------------------------------------------
  for (const [materialId, prog] of Object.entries(store.materialProgress || {})) {
    // 3a. Study progress session >= 20 min
    if (prog.total_study_seconds >= GAMIFICATION_RULES.MATERIAL.MIN_SECONDS_FOR_PROGRESS) {
      const eventDate = prog.last_opened_at || currentDateIso;
      addTransaction(
        `MATERIAL_PROGRESS_${materialId}`,
        materialId,
        GAMIFICATION_RULES.MATERIAL.XP_PROGRESS_SESSION,
        'material_progress',
        `Estudo aprofundado de material didático (>= 20 min) (+${GAMIFICATION_RULES.MATERIAL.XP_PROGRESS_SESSION} XP)`,
        prog.topic_id,
        eventDate
      );
    }

    // 3b. One-time Topic completion bonus
    if (prog.completed) {
      const completionDate = prog.completed_at || currentDateIso;
      addTransaction(
        `MATERIAL_COMPLETED_${prog.topic_id}`,
        prog.topic_id,
        GAMIFICATION_RULES.MATERIAL.XP_TOPIC_COMPLETION_ONE_TIME,
        'material_completion',
        `Conclusão do material teórico do tópico (+${GAMIFICATION_RULES.MATERIAL.XP_TOPIC_COMPLETION_ONE_TIME} XP)`,
        prog.topic_id,
        completionDate
      );
    }
  }

  // -----------------------------------------------------------
  // 4. FLASHCARD REVIEWS (FSRS)
  // -----------------------------------------------------------
  const flashcardXpByDate: Record<string, number> = {};
  existingTransactions
    .filter((t) => t.rule_id.startsWith('FLASHCARD_DUE_REVIEW'))
    .forEach((t) => {
      const d = getLocalDateString(t.created_at);
      flashcardXpByDate[d] = (flashcardXpByDate[d] || 0) + t.amount;
    });

  const sortedReviews = [...(store.reviews || [])].sort(
    (a, b) => new Date(a.reviewed_at).getTime() - new Date(b.reviewed_at).getTime()
  );

  for (const review of sortedReviews) {
    const reviewDate = getLocalDateString(review.reviewed_at);
    const dayXp = flashcardXpByDate[reviewDate] || 0;

    if (dayXp < GAMIFICATION_RULES.FLASHCARDS.DAILY_UNIT_REVIEW_CAP) {
      addTransaction(
        `FLASHCARD_DUE_REVIEW_${review.id}`,
        review.id,
        GAMIFICATION_RULES.FLASHCARDS.XP_PER_DUE_REVIEW,
        'flashcard_review',
        `Revisão de flashcard FSRS (+1 XP)`,
        review.flashcard_id,
        review.reviewed_at
      );
      flashcardXpByDate[reviewDate] = dayXp + GAMIFICATION_RULES.FLASHCARDS.XP_PER_DUE_REVIEW;
    }
  }

  // 4b. Queue Cleared Bonus
  (store.events || [])
    .filter((ev) => ev.event_type === 'FLASHCARD_QUEUE_CLEARED')
    .forEach((ev) => {
      const evDate = getLocalDateString(ev.created_at);
      addTransaction(
        `FLASHCARD_QUEUE_CLEARED_${evDate}`,
        ev.id,
        GAMIFICATION_RULES.FLASHCARDS.QUEUE_CLEARED_DAILY_BONUS,
        'study_event',
        `Fila de memória zerada no dia (+${GAMIFICATION_RULES.FLASHCARDS.QUEUE_CLEARED_DAILY_BONUS} XP)`,
        undefined,
        ev.created_at
      );
    });

  // -----------------------------------------------------------
  // 5. ERROR LOGS & RESOLUTIONS
  // -----------------------------------------------------------
  const errorLogXpByDate: Record<string, number> = {};
  existingTransactions
    .filter((t) => t.rule_id.startsWith('ERROR_LOGGED'))
    .forEach((t) => {
      const d = getLocalDateString(t.created_at);
      errorLogXpByDate[d] = (errorLogXpByDate[d] || 0) + t.amount;
    });

  const sortedErrors = [...(store.errorLogs || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const err of sortedErrors) {
    const errDate = getLocalDateString(err.created_at);
    const dayXp = errorLogXpByDate[errDate] || 0;

    // 5a. Log error (up to daily cap)
    if (dayXp < GAMIFICATION_RULES.ERRORS.DAILY_LOG_CAP) {
      addTransaction(
        `ERROR_LOGGED_${err.id}`,
        err.id,
        GAMIFICATION_RULES.ERRORS.XP_PER_ERROR_LOGGED,
        'error_log',
        `Registro reflexivo no Caderno de Erros (+5 XP)`,
        err.topic_id,
        err.created_at
      );
      errorLogXpByDate[errDate] = dayXp + GAMIFICATION_RULES.ERRORS.XP_PER_ERROR_LOGGED;
    }

    // 5b. Resolve error (one-time per error)
    if (err.resolved) {
      const resDate = err.resolved_at || currentDateIso;
      addTransaction(
        `ERROR_RESOLVED_${err.id}`,
        err.id,
        GAMIFICATION_RULES.ERRORS.XP_ERROR_RESOLVED_ONE_TIME,
        'error_resolved',
        `Erro analisado e marcado como resolvido (+10 XP)`,
        err.topic_id,
        resDate
      );
    }
  }

  // -----------------------------------------------------------
  // 6. DISCURSIVE SESSIONS (P3)
  // -----------------------------------------------------------
  for (const ds of store.discursiveSessions || []) {
    const isTechPiece = ds.type === 'TECHNICAL_PIECE_50_LINES';
    const xpAmt = isTechPiece
      ? GAMIFICATION_RULES.DISCURSIVE.XP_TECHNICAL_PIECE
      : GAMIFICATION_RULES.DISCURSIVE.XP_QUESTION_20_LINES;
    const label = isTechPiece ? 'Peça Técnica (50 linhas)' : 'Questão Discursiva (20 linhas)';

    addTransaction(
      `DISCURSIVE_${ds.id}`,
      ds.id,
      xpAmt,
      'discursive_session',
      `Treino de ${label} registrado (+${xpAmt} XP)`,
      ds.related_topic_id || undefined,
      ds.performed_at
    );
  }

  // -----------------------------------------------------------
  // 7. MOCK EXAMS & WEEKLY CHECKPOINTS
  // -----------------------------------------------------------
  for (const mock of store.mockExams || []) {
    const isFullMock = mock.type === 'FULL_MOCK';
    const xpAmt = isFullMock
      ? GAMIFICATION_RULES.SIMULADOS.XP_FULL_MOCK
      : GAMIFICATION_RULES.SIMULADOS.XP_WEEKLY_CHECKPOINT;
    const label = isFullMock ? 'Simulado Completo' : 'Checkpoint Semanal (Boss)';

    addTransaction(
      `MOCK_EXAM_${mock.id}`,
      mock.id,
      xpAmt,
      'mock_exam',
      `${label} registrado (+${xpAmt} XP)`,
      undefined,
      mock.performed_at
    );
  }

  // -----------------------------------------------------------
  // 8. DAILY MISSIONS REWARDS & PROGRESS UPDATE
  // -----------------------------------------------------------
  const updatedDailyMissions = { ...(store.dailyMissions || {}) };

  // Update progress for all dates that have registered missions
  for (const [dateKey, missionsList] of Object.entries(updatedDailyMissions)) {
    const refreshed = updateMissionsProgress(missionsList, store, dateKey);
    updatedDailyMissions[dateKey] = refreshed;

    // Check completed missions for XP
    for (const m of refreshed) {
      if (m.status === 'COMPLETED') {
        const compDate = m.completed_at || currentDateIso;
        addTransaction(
          `MISSION_COMPLETED_${m.id}`,
          m.id,
          m.xp_reward,
          'daily_mission',
          `Missão cumprida: ${m.title} (+${m.xp_reward} XP)`,
          m.topic_id,
          compDate
        );
      }
    }

    // Check all essential missions bonus
    const allCompleted = refreshed.length > 0 && refreshed.every((m) => m.status === 'COMPLETED');
    if (allCompleted) {
      addTransaction(
        `DAILY_ALL_MISSIONS_${dateKey}`,
        `all-missions-${dateKey}`,
        GAMIFICATION_RULES.MISSIONS.XP_ALL_DAILY_MISSIONS_BONUS,
        'daily_mission_bonus',
        `Bônus por cumprir todas as missões do dia (+${GAMIFICATION_RULES.MISSIONS.XP_ALL_DAILY_MISSIONS_BONUS} XP)`,
        undefined,
        currentDateIso
      );
    }
  }

  // -----------------------------------------------------------
  // 9. ACHIEVEMENTS EVALUATION
  // -----------------------------------------------------------
  // Create temporary store reference to evaluate achievements
  const tempStore: AppStoreData = {
    ...store,
    dailyMissions: updatedDailyMissions,
  };

  const { newlyUnlocked, allUnlockedIds } = evaluateAchievements(
    tempStore,
    profile.achievements_unlocked || []
  );

  for (const ach of newlyUnlocked) {
    addTransaction(
      `ACHIEVEMENT_${ach.id}`,
      ach.id,
      ach.xp_reward,
      'achievement',
      `Conquista desbloqueada: ${ach.title} (+${ach.xp_reward} XP)`,
      undefined,
      ach.unlocked_at || currentDateIso
    );

    notifications.push({
      id: `notif-ach-${ach.id}`,
      type: 'ACHIEVEMENT_UNLOCKED',
      title: `Conquista Desbloqueada: ${ach.title}`,
      message: ach.description,
      xpAmount: ach.xp_reward,
      achievementId: ach.id,
      timestamp: ach.unlocked_at || currentDateIso,
    });
  }

  // -----------------------------------------------------------
  // 10. RECALCULATE PROFILE (XP, LEVEL, STREAK)
  // -----------------------------------------------------------
  const totalXp = existingTransactions.reduce((sum, t) => sum + t.amount, 0);
  const previousLevel = profile.level || 1;
  const newLevel = getLevel(totalXp);

  if (newLevel > previousLevel) {
    notifications.push({
      id: `notif-lvl-${newLevel}`,
      type: 'LEVEL_UP',
      title: `Subiu para o Nível ${newLevel}!`,
      message: `Você alcançou o Nível ${newLevel} da Jornada de Preparação.`,
      newLevel,
      timestamp: currentDateIso,
    });
  }

  // Meaningful study days & streaks
  const meaningfulDates = getAllMeaningfulStudyDates({
    questionSessions: store.questionSessions,
    materialProgress: store.materialProgress,
    reviews: store.reviews,
    discursiveSessions: store.discursiveSessions || [],
    mockExams: store.mockExams || [],
  });

  const streakStats = calculateStreaks(meaningfulDates, todayStr);
  const weeklyStats = calculateWeeklyConsistency(
    meaningfulDates,
    todayStr,
    store.settings.gamification_weekly_target_days || 6
  );

  const updatedProfile: GamificationProfile = {
    user_id: profile.user_id,
    total_xp: totalXp,
    level: Math.max(previousLevel, newLevel), // Never lose level
    current_streak: streakStats.currentStreak,
    longest_streak: Math.max(profile.longest_streak, streakStats.longestStreak),
    meaningful_days: streakStats.totalMeaningfulDays,
    last_meaningful_study_date: streakStats.lastMeaningfulDate,
    achievements_unlocked: allUnlockedIds,
    weekly_consistency_days: weeklyStats.daysStudiedThisWeek,
    current_week_start: weeklyStats.weekStart,
    updated_at: currentDateIso,
  };

  // Add XP notification for fresh transactions if any
  if (newTransactions.length > 0) {
    const totalNewXp = newTransactions.reduce((sum, t) => sum + t.amount, 0);
    notifications.unshift({
      id: `notif-xp-${Date.now()}`,
      type: 'XP_AWARDED',
      title: `+${totalNewXp} XP Conquistados`,
      message: newTransactions[0].description,
      xpAmount: totalNewXp,
      timestamp: currentDateIso,
    });
  }

  const updatedStore: AppStoreData = {
    ...store,
    gamificationProfile: updatedProfile,
    xpTransactions: existingTransactions,
    dailyMissions: updatedDailyMissions,
    unlockedAchievements: allUnlockedIds,
  };

  return {
    store: updatedStore,
    notifications,
  };
}
