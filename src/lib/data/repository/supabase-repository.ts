import { SupabaseClient } from '@supabase/supabase-js';
import { AppStoreData } from '../store';
import { ensureUserStudyData } from '../bootstrap-user';
import {
  mapExamFromDb,
  mapExamBlockFromDb,
  mapSubjectFromDb,
  mapTopicFromDb,
  mapSyllabusItemFromDb,
  mapTopicSyllabusItemFromDb,
  mapStudyMaterialFromDb,
  mapMaterialProgressFromDb,
  mapStudySessionFromDb,
  mapQuestionSessionFromDb,
  mapErrorLogFromDb,
  mapFlashcardFromDb,
  mapFlashcardFsrsStateFromDb,
  mapFlashcardReviewFromDb,
  mapDiscursiveSessionFromDb,
  mapUserStudySettingsFromDb,
  mapMockExamFromDb,
  mapStudyEventFromDb,
  mapGamificationProfileFromDb,
  mapXpTransactionFromDb,
  mapDailyMissionFromDb,
  mapDailyMissionToDb,
} from '../mappers';
import {
  Exam,
  QuestionSession,
  ErrorLog,
  Flashcard,
  FlashcardFsrsState,
  FlashcardReview,
  StudySession,
  MaterialProgress,
  DiscursiveSession,
  MockExam,
  Topic,
  UserStudySettings,
  StudyEvent,
} from '@/types/database';
import {
  GamificationProfile,
  XpTransaction,
  DailyMission,
} from '@/lib/gamification/types';

export class PersistenceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'PersistenceError';
  }
}

export class SupabaseStudyRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Carrega todos os dados do estudante de forma segura e paralela via Supabase.
   * Se o usuário ainda não tiver sido inicializado, executa o bootstrap curricular antes.
   */
  async loadAll(userId: string): Promise<AppStoreData> {
    if (!userId) {
      throw new PersistenceError('userId obrigatório para carregar dados do Supabase.');
    }

    // 1. Garante que os 76 Topics e 182 SyllabusItems existem no backend
    const bootRes = await ensureUserStudyData(userId, this.supabase);
    if (!bootRes.success) {
      throw new PersistenceError(`Falha no bootstrap curricular: ${bootRes.error}`);
    }

    // 2. Consulta paralela otimizada de todas as coleções
    const [
      examsRes,
      blocksRes,
      subjectsRes,
      topicsRes,
      sylRes,
      topicSylRes,
      materialsRes,
      matProgRes,
      studySessionsRes,
      questionSessionsRes,
      errorLogsRes,
      flashcardsRes,
      fsrsRes,
      reviewsRes,
      discursiveRes,
      settingsRes,
      mockExamsRes,
      eventsRes,
      gamProfileRes,
      xpTxRes,
      missionsRes,
      achievementsRes,
    ] = await Promise.all([
      this.supabase.from('exams').select('*').eq('user_id', userId).limit(1),
      this.supabase.from('exam_blocks').select('*').eq('user_id', userId).order('display_order'),
      this.supabase.from('subjects').select('*').eq('user_id', userId).order('display_order'),
      this.supabase.from('topics').select('*').eq('user_id', userId).order('display_order'),
      this.supabase.from('syllabus_items').select('*').eq('user_id', userId).order('display_order'),
      this.supabase.from('topic_syllabus_items').select('*').eq('user_id', userId),
      this.supabase.from('study_materials').select('*').eq('user_id', userId),
      this.supabase.from('material_progress').select('*').eq('user_id', userId),
      this.supabase.from('study_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }),
      this.supabase.from('question_sessions').select('*').eq('user_id', userId).order('performed_at', { ascending: false }),
      this.supabase.from('error_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      this.supabase.from('flashcards').select('*').eq('user_id', userId),
      this.supabase.from('flashcard_fsrs_state').select('*').eq('user_id', userId),
      this.supabase.from('flashcard_reviews').select('*').eq('user_id', userId).order('reviewed_at', { ascending: false }),
      this.supabase.from('discursive_sessions').select('*').eq('user_id', userId).order('performed_at', { ascending: false }),
      this.supabase.from('user_study_settings').select('*').eq('user_id', userId).limit(1),
      this.supabase.from('mock_exams').select('*').eq('user_id', userId).order('performed_at', { ascending: false }),
      this.supabase.from('study_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      this.supabase.from('gamification_profiles').select('*').eq('user_id', userId).limit(1),
      this.supabase.from('xp_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      this.supabase.from('daily_missions').select('*').eq('user_id', userId),
      this.supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
    ]);

    // Verificar se qualquer SELECT retornou erro
    const selectChecks: Array<{ table: string; error: any }> = [
      { table: 'exams', error: examsRes.error },
      { table: 'exam_blocks', error: blocksRes.error },
      { table: 'subjects', error: subjectsRes.error },
      { table: 'topics', error: topicsRes.error },
      { table: 'syllabus_items', error: sylRes.error },
      { table: 'topic_syllabus_items', error: topicSylRes.error },
      { table: 'study_materials', error: materialsRes.error },
      { table: 'material_progress', error: matProgRes.error },
      { table: 'study_sessions', error: studySessionsRes.error },
      { table: 'question_sessions', error: questionSessionsRes.error },
      { table: 'error_logs', error: errorLogsRes.error },
      { table: 'flashcards', error: flashcardsRes.error },
      { table: 'flashcard_fsrs_state', error: fsrsRes.error },
      { table: 'flashcard_reviews', error: reviewsRes.error },
      { table: 'discursive_sessions', error: discursiveRes.error },
      { table: 'user_study_settings', error: settingsRes.error },
      { table: 'mock_exams', error: mockExamsRes.error },
      { table: 'study_events', error: eventsRes.error },
      { table: 'gamification_profiles', error: gamProfileRes.error },
      { table: 'xp_transactions', error: xpTxRes.error },
      { table: 'daily_missions', error: missionsRes.error },
      { table: 'user_achievements', error: achievementsRes.error },
    ];

    for (const check of selectChecks) {
      if (check.error) {
        throw new PersistenceError(`Falha ao consultar tabela ${check.table}: ${check.error.message || JSON.stringify(check.error)}`, check.error);
      }
    }

    // Mapeamento e montagem do AppStoreData
    const examRow = examsRes.data?.[0];
    if (!examRow) {
      throw new PersistenceError('Registro principal de exame não encontrado após bootstrap.');
    }
    const exam = mapExamFromDb(examRow);

    const examBlocks = (blocksRes.data || []).map(mapExamBlockFromDb);
    const subjects = (subjectsRes.data || []).map(mapSubjectFromDb);
    const topics = (topicsRes.data || []).map(mapTopicFromDb);
    const syllabusItems = (sylRes.data || []).map(mapSyllabusItemFromDb);
    const topicSyllabusItems = (topicSylRes.data || []).map(mapTopicSyllabusItemFromDb);
    const materials = (materialsRes.data || []).map(mapStudyMaterialFromDb);

    const materialProgress: Record<string, MaterialProgress> = {};
    for (const row of matProgRes.data || []) {
      const prog = mapMaterialProgressFromDb(row);
      materialProgress[prog.material_id] = prog;
    }

    const studySessions = (studySessionsRes.data || []).map(mapStudySessionFromDb);
    const questionSessions = (questionSessionsRes.data || []).map(mapQuestionSessionFromDb);
    const errorLogs = (errorLogsRes.data || []).map(mapErrorLogFromDb);
    const flashcards = (flashcardsRes.data || []).map(mapFlashcardFromDb);

    const fsrsStates: Record<string, FlashcardFsrsState> = {};
    for (const row of fsrsRes.data || []) {
      const fsrs = mapFlashcardFsrsStateFromDb(row);
      fsrsStates[fsrs.flashcard_id] = fsrs;
    }

    const reviews = (reviewsRes.data || []).map(mapFlashcardReviewFromDb);
    const discursiveSessions = (discursiveRes.data || []).map(mapDiscursiveSessionFromDb);

    const settingsRow = settingsRes.data?.[0];
    const settings = settingsRow
      ? mapUserStudySettingsFromDb(settingsRow)
      : {
          user_id: userId,
          weekly_study_target_minutes: 1200,
          default_high_questions: 20,
          default_medium_questions: 15,
          default_low_questions: 10,
          memory_daily_minutes: 20,
          desired_retention: 0.90,
          today_available_minutes: null,
          gamification_show_animations: true,
          gamification_show_xp_toast: true,
          gamification_show_streak: true,
          gamification_weekly_target_days: 5,
          updated_at: new Date().toISOString(),
        };

    const mockExams = (mockExamsRes.data || []).map(mapMockExamFromDb);
    const events = (eventsRes.data || []).map(mapStudyEventFromDb);

    const gamRow = gamProfileRes.data?.[0];
    const gamificationProfile = gamRow
      ? mapGamificationProfileFromDb(gamRow)
      : {
          user_id: userId,
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          meaningful_days: 0,
          last_meaningful_study_date: null,
          weekly_consistency_days: 0,
          current_week_start: new Date().toISOString().split('T')[0],
          achievements_unlocked: [],
          updated_at: new Date().toISOString(),
        };

    const unlockedAchievements = (achievementsRes.data || []).map((a: { achievement_id: string }) => a.achievement_id);
    gamificationProfile.achievements_unlocked = unlockedAchievements;

    const xpTransactions = (xpTxRes.data || []).map(mapXpTransactionFromDb);

    const dailyMissions: Record<string, DailyMission[]> = {};
    for (const row of missionsRes.data || []) {
      const mission = mapDailyMissionFromDb(row);
      if (!dailyMissions[mission.date]) {
        dailyMissions[mission.date] = [];
      }
      dailyMissions[mission.date].push(mission);
    }

    return {
      exam,
      examBlocks,
      subjects,
      topics,
      syllabusItems,
      topicSyllabusItems,
      materials,
      materialProgress,
      questionSessions,
      errorLogs,
      flashcards,
      fsrsStates,
      reviews,
      discursiveSessions,
      studySessions,
      settings,
      mockExams,
      events,
      gamificationProfile,
      xpTransactions,
      dailyMissions,
      unlockedAchievements,
    };
  }

  async loadUserData(userId: string): Promise<AppStoreData> {
    return this.loadAll(userId);
  }

  // ==========================================================================
  // PERSISTÊNCIA INCREMENTAL (Erros não são engolidos — lançam PersistenceError)
  // ==========================================================================

  async persistQuestionSession(userId: string, session: QuestionSession): Promise<void> {
    const { error } = await this.supabase.from('question_sessions').upsert({
      user_id: userId,
      id: session.id,
      exam_id: session.exam_id,
      subject_id: session.subject_id,
      topic_id: session.topic_id,
      performed_at: session.performed_at,
      total_questions: session.total_questions,
      correct: session.correct,
      wrong: session.wrong,
      blank: session.blank,
      duration_seconds: session.duration_seconds,
      subjective_feeling: session.subjective_feeling,
      notes: session.notes,
      accuracy_rate: session.accuracy_rate,
      net_points: session.net_points,
      net_rate: session.net_rate,
      had_conceptual_error: session.had_conceptual_error,
    }, { onConflict: 'user_id, id' });
    if (error) throw new PersistenceError(`Erro ao persistir question session: ${error.message}`, error);
  }

  async deleteQuestionSession(userId: string, sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('question_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('id', sessionId);
    if (error) throw new PersistenceError(`Erro ao excluir question session: ${error.message}`, error);
  }

  async persistErrorLog(userId: string, err: ErrorLog): Promise<void> {
    const { error } = await this.supabase.from('error_logs').upsert({
      user_id: userId,
      id: err.id,
      exam_id: err.exam_id,
      subject_id: err.subject_id,
      topic_id: err.topic_id,
      question_session_id: err.question_session_id,
      error_type: err.error_type,
      summary: err.summary,
      correct_rule: err.correct_rule,
      personal_note: err.personal_note,
      severity: err.severity,
      resolved: err.resolved,
      resolved_at: err.resolved_at,
    }, { onConflict: 'user_id, id' });
    if (error) throw new PersistenceError(`Erro ao persistir error log: ${error.message}`, error);
  }

  async deleteErrorLog(userId: string, errorId: string): Promise<void> {
    const { error } = await this.supabase
      .from('error_logs')
      .delete()
      .eq('user_id', userId)
      .eq('id', errorId);
    if (error) throw new PersistenceError(`Erro ao excluir error log: ${error.message}`, error);
  }

  async persistFlashcard(userId: string, card: Flashcard, fsrsState?: FlashcardFsrsState): Promise<void> {
    const { error: cardErr } = await this.supabase.from('flashcards').upsert({
      user_id: userId,
      id: card.id,
      exam_id: card.exam_id,
      subject_id: card.subject_id,
      topic_id: card.topic_id,
      card_type: card.card_type,
      front: card.front,
      back: card.back,
      source_type: card.source_type,
      source_material_id: card.source_material_id,
      source_error_id: card.source_error_id,
      exam_priority: card.exam_priority,
      priority_boost: card.priority_boost,
      active: card.active,
      suspended: card.suspended,
    }, { onConflict: 'user_id, id' });
    if (cardErr) throw new PersistenceError(`Erro ao persistir flashcard: ${cardErr.message}`, cardErr);

    if (fsrsState) {
      const { error: fsrsErr } = await this.supabase.from('flashcard_fsrs_state').upsert({
        user_id: userId,
        flashcard_id: fsrsState.flashcard_id,
        due: fsrsState.due,
        stability: fsrsState.stability,
        difficulty: fsrsState.difficulty,
        elapsed_days: fsrsState.elapsed_days,
        scheduled_days: fsrsState.scheduled_days,
        learning_steps: fsrsState.learning_steps,
        reps: fsrsState.reps,
        lapses: fsrsState.lapses,
        state: fsrsState.state,
        last_review: fsrsState.last_review,
      }, { onConflict: 'user_id, flashcard_id' });
      if (fsrsErr) throw new PersistenceError(`Erro ao persistir fsrs state: ${fsrsErr.message}`, fsrsErr);
    }
  }

  async deleteFlashcard(userId: string, flashcardId: string): Promise<void> {
    const { error } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('user_id', userId)
      .eq('id', flashcardId);
    if (error) throw new PersistenceError(`Erro ao excluir flashcard: ${error.message}`, error);
  }

  async persistFlashcardReview(
    userId: string,
    review: FlashcardReview,
    fsrsState: FlashcardFsrsState
  ): Promise<void> {
    const { error: revErr } = await this.supabase.from('flashcard_reviews').upsert({
      user_id: userId,
      id: review.id,
      flashcard_id: review.flashcard_id,
      reviewed_at: review.reviewed_at,
      rating: review.rating,
      response_time_ms: review.response_time_ms,
      state_before: review.state_before,
      state_after: review.state_after,
      fsrs_log: review.fsrs_log,
      was_due_at_review: review.was_due_at_review,
    }, { onConflict: 'user_id, id' });
    if (revErr) throw new PersistenceError(`Erro ao persistir review: ${revErr.message}`, revErr);

    const { error: fsrsErr } = await this.supabase.from('flashcard_fsrs_state').upsert({
      user_id: userId,
      flashcard_id: fsrsState.flashcard_id,
      due: fsrsState.due,
      stability: fsrsState.stability,
      difficulty: fsrsState.difficulty,
      elapsed_days: fsrsState.elapsed_days,
      scheduled_days: fsrsState.scheduled_days,
      learning_steps: fsrsState.learning_steps,
      reps: fsrsState.reps,
      lapses: fsrsState.lapses,
      state: fsrsState.state,
      last_review: fsrsState.last_review,
    }, { onConflict: 'user_id, flashcard_id' });
    if (fsrsErr) throw new PersistenceError(`Erro ao atualizar fsrs state: ${fsrsErr.message}`, fsrsErr);
  }

  async persistStudySession(userId: string, session: StudySession): Promise<void> {
    const { error } = await this.supabase.from('study_sessions').upsert({
      user_id: userId,
      id: session.id,
      exam_id: session.exam_id,
      subject_id: session.subject_id,
      topic_id: session.topic_id,
      material_id: session.material_id,
      session_type: session.session_type,
      started_at: session.started_at,
      ended_at: session.ended_at,
      duration_seconds: session.duration_seconds,
      notes: session.notes,
    }, { onConflict: 'user_id, id' });
    if (error) throw new PersistenceError(`Erro ao persistir study session: ${error.message}`, error);
  }

  async persistMaterialProgress(userId: string, prog: MaterialProgress): Promise<void> {
    const { error } = await this.supabase.from('material_progress').upsert({
      user_id: userId,
      id: prog.id,
      material_id: prog.material_id,
      topic_id: prog.topic_id,
      current_page: prog.current_page,
      max_page_reached: prog.max_page_reached,
      progress_percent: prog.progress_percent,
      completed: prog.completed,
      first_opened_at: prog.first_opened_at,
      last_opened_at: prog.last_opened_at,
      completed_at: prog.completed_at,
      total_study_seconds: prog.total_study_seconds,
      notes_by_page: prog.notes_by_page,
      bookmarks: prog.bookmarks,
    }, { onConflict: 'user_id, material_id' });
    if (error) throw new PersistenceError(`Erro ao persistir material progress: ${error.message}`, error);
  }

  async persistDiscursiveSession(userId: string, session: DiscursiveSession): Promise<void> {
    const { error } = await this.supabase.from('discursive_sessions').upsert({
      user_id: userId,
      id: session.id,
      exam_id: session.exam_id,
      type: session.type,
      performed_at: session.performed_at,
      title: session.title,
      prompt_summary: session.prompt_summary,
      related_subject_id: session.related_subject_id,
      related_topic_id: session.related_topic_id,
      duration_seconds: session.duration_seconds,
      lines_written: session.lines_written,
      content_score: session.content_score,
      language_errors: session.language_errors,
      calculated_score: session.calculated_score,
      notes: session.notes,
    }, { onConflict: 'user_id, id' });
    if (error) throw new PersistenceError(`Erro ao persistir discursive session: ${error.message}`, error);
  }

  async deleteDiscursiveSession(userId: string, sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('discursive_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('id', sessionId);
    if (error) throw new PersistenceError(`Erro ao excluir discursive session: ${error.message}`, error);
  }

  async persistMockExam(userId: string, mock: MockExam): Promise<void> {
    const { error } = await this.supabase.from('mock_exams').upsert({
      user_id: userId,
      id: mock.id,
      exam_id: mock.exam_id,
      type: mock.type,
      performed_at: mock.performed_at,
      total_questions: mock.total_questions,
      correct: mock.correct,
      wrong: mock.wrong,
      blank: mock.blank,
      net_points: mock.net_points,
      p1_correct: mock.p1_correct,
      p1_wrong: mock.p1_wrong,
      p1_blank: mock.p1_blank,
      p1_net: mock.p1_net,
      p2_correct: mock.p2_correct,
      p2_wrong: mock.p2_wrong,
      p2_blank: mock.p2_blank,
      p2_net: mock.p2_net,
      duration_seconds: mock.duration_seconds,
      notes: mock.notes,
    }, { onConflict: 'user_id, id' });
    if (error) throw new PersistenceError(`Erro ao persistir mock exam: ${error.message}`, error);
  }

  async persistTopic(userId: string, topic: Topic): Promise<void> {
    const { error } = await this.supabase.from('topics').update({
      status: topic.status,
      domain_score: topic.domain_score,
      domain_confidence: topic.domain_confidence,
      study_score: topic.study_score,
      last_studied_at: topic.last_studied_at,
      next_recommended_at: topic.next_recommended_at,
      priority: topic.priority,
      priority_weight: topic.priority_weight,
    }).eq('user_id', userId).eq('id', topic.id);
    if (error) throw new PersistenceError(`Erro ao persistir topic: ${error.message}`, error);
  }

  async persistTopics(userId: string, topics: Topic[]): Promise<void> {
    const updates = topics.map((t) => ({
      user_id: userId,
      id: t.id,
      status: t.status,
      domain_score: t.domain_score,
      domain_confidence: t.domain_confidence,
      study_score: t.study_score,
      last_studied_at: t.last_studied_at,
      next_recommended_at: t.next_recommended_at,
      priority: t.priority,
      priority_weight: t.priority_weight,
    }));

    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      const { error } = await this.supabase.from('topics').upsert(chunk, {
        onConflict: 'user_id, id',
      });
      if (error) throw new PersistenceError(`Erro ao atualizar chunk de topics: ${error.message}`, error);
    }
  }

  async updateExam(userId: string, exam: Partial<Exam> & { id: string }): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (exam.exam_date !== undefined) payload.exam_date = exam.exam_date;
    if (exam.name !== undefined) payload.name = exam.name;
    if (exam.active !== undefined) payload.active = exam.active;
    payload.updated_at = new Date().toISOString();

    const { error } = await this.supabase
      .from('exams')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', exam.id);
    if (error) throw new PersistenceError(`Erro ao atualizar exame: ${error.message}`, error);
  }

  async persistDailyMissions(userId: string, missions: DailyMission[]): Promise<void> {
    if (missions.length === 0) return;
    const rows = missions.map((m) => mapDailyMissionToDb(m, userId));
    const { error } = await this.supabase
      .from('daily_missions')
      .upsert(rows, { onConflict: 'user_id, date, id' });
    if (error) throw new PersistenceError(`Erro ao persistir missões diárias: ${error.message}`, error);
  }

  async persistGamification(
    userId: string,
    profile: GamificationProfile,
    xpTransactions: XpTransaction[] = [],
    unlockedAchievements: string[] = [],
    dailyMissionsMap?: Record<string, DailyMission[]>
  ): Promise<void> {
    // 1. Profile
    const { error: profErr } = await this.supabase.from('gamification_profiles').upsert({
      user_id: userId,
      total_xp: profile.total_xp,
      level: profile.level,
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      meaningful_days: profile.meaningful_days,
      last_meaningful_study_date: profile.last_meaningful_study_date,
      weekly_consistency_days: profile.weekly_consistency_days,
      current_week_start: profile.current_week_start,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (profErr) throw new PersistenceError(`Erro ao persistir gamification profile: ${profErr.message}`, profErr);

    // 2. XP Transactions (Idempotente via unique constraint)
    if (xpTransactions.length > 0) {
      const txRows = xpTransactions.map((tx) => ({
        user_id: userId,
        id: tx.id,
        amount: tx.amount,
        rule_id: tx.rule_id,
        source_event_id: tx.source_event_id,
        source_type: tx.source_type,
        source_entity_id: tx.source_entity_id || null,
        description: tx.description,
        created_at: tx.created_at,
      }));
      const { error: txErr } = await this.supabase.from('xp_transactions').upsert(txRows, {
        onConflict: 'user_id, rule_id, source_event_id',
      });
      if (txErr) throw new PersistenceError(`Erro ao persistir xp transactions: ${txErr.message}`, txErr);
    }

    // 3. User Achievements
    if (unlockedAchievements.length > 0) {
      const achRows = unlockedAchievements.map((achId) => ({
        user_id: userId,
        achievement_id: achId,
      }));
      const { error: achErr } = await this.supabase.from('user_achievements').upsert(achRows, {
        onConflict: 'user_id, achievement_id',
      });
      if (achErr) throw new PersistenceError(`Erro ao persistir user achievements: ${achErr.message}`, achErr);
    }

    // 4. Daily missions if provided
    if (dailyMissionsMap) {
      const allMissions: DailyMission[] = [];
      for (const date of Object.keys(dailyMissionsMap)) {
        for (const m of dailyMissionsMap[date]) {
          allMissions.push(m);
        }
      }
      if (allMissions.length > 0) {
        await this.persistDailyMissions(userId, allMissions);
      }
    }
  }

  async persistSettings(userId: string, settings: UserStudySettings): Promise<void> {
    const { error } = await this.supabase.from('user_study_settings').upsert({
      user_id: userId,
      weekly_study_target_minutes: settings.weekly_study_target_minutes,
      default_high_questions: settings.default_high_questions,
      default_medium_questions: settings.default_medium_questions,
      default_low_questions: settings.default_low_questions,
      memory_daily_minutes: settings.memory_daily_minutes,
      desired_retention: settings.desired_retention,
      today_available_minutes: settings.today_available_minutes,
      gamification_show_animations: settings.gamification_show_animations !== false,
      gamification_show_xp_toast: settings.gamification_show_xp_toast !== false,
      gamification_show_streak: settings.gamification_show_streak !== false,
      gamification_weekly_target_days: settings.gamification_weekly_target_days || 5,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw new PersistenceError(`Erro ao persistir settings: ${error.message}`, error);
  }

  async persistEvent(userId: string, ev: StudyEvent): Promise<void> {
    const { error } = await this.supabase.from('study_events').upsert({
      user_id: userId,
      id: ev.id,
      event_type: ev.event_type,
      entity_type: ev.entity_type,
      entity_id: ev.entity_id,
      payload: ev.payload,
      created_at: ev.created_at,
    }, { onConflict: 'user_id, id' });
    if (error) throw new PersistenceError(`Erro ao persistir study event: ${error.message}`, error);
  }

  // ==========================================================================
  // STATUS E EXECUÇÃO DE MIGRAÇÃO LOCAL V3
  // ==========================================================================

  async isV3ImportCompleted(userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('user_migrations')
      .select('migration_key')
      .eq('user_id', userId)
      .eq('migration_key', 'local_store_v3_import')
      .maybeSingle();

    return Boolean(data);
  }

  async markV3ImportCompleted(userId: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const { error } = await this.supabase.from('user_migrations').upsert({
      user_id: userId,
      migration_key: 'local_store_v3_import',
      completed_at: new Date().toISOString(),
      metadata,
    }, { onConflict: 'user_id, migration_key' });
    if (error) throw new PersistenceError(`Erro ao marcar import V3: ${error.message}`, error);
  }
}
