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
} from '../mappers';
import {
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

export class SupabaseStudyRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Carrega todos os dados do estudante de forma segura e paralela via Supabase.
   * Se o usuário ainda não tiver sido inicializado, executa o bootstrap curricular antes.
   */
  async loadAll(userId: string): Promise<AppStoreData> {
    if (!userId) {
      throw new Error('userId obrigatório para carregar dados do Supabase.');
    }

    // 1. Garante que os 76 Topics e 182 SyllabusItems existem no backend
    await ensureUserStudyData(userId, this.supabase);

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

    // Mapeamento e montagem do AppStoreData
    const examRow = examsRes.data?.[0];
    const exam = examRow ? mapExamFromDb(examRow) : ({} as any);

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

  // ==========================================================================
  // PERSISTÊNCIA INCREMENTAL (Chamada após updates puros do domínio)
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
    if (error) console.error('Erro ao persistir question session:', error.message);
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
    if (error) console.error('Erro ao persistir error log:', error.message);
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
    if (cardErr) console.error('Erro ao persistir flashcard:', cardErr.message);

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
      if (fsrsErr) console.error('Erro ao persistir fsrs state:', fsrsErr.message);
    }
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
    if (revErr) console.error('Erro ao persistir review:', revErr.message);

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
    if (fsrsErr) console.error('Erro ao atualizar fsrs state:', fsrsErr.message);
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
    if (error) console.error('Erro ao persistir study session:', error.message);
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
    if (error) console.error('Erro ao persistir material progress:', error.message);
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
    if (error) console.error('Erro ao persistir discursive session:', error.message);
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
    if (error) console.error('Erro ao persistir mock exam:', error.message);
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
    if (error) console.error('Erro ao persistir topic:', error.message);
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
      if (error) console.error('Erro ao atualizar chunk de topics:', error.message);
    }
  }

  async persistGamification(
    userId: string,
    profile: GamificationProfile,
    xpTransactions: XpTransaction[] = [],
    unlockedAchievements: string[] = [],
    dailyMissionsMap?: Record<string, DailyMission[]>
  ): Promise<void> {
    // 1. Profile
    await this.supabase.from('gamification_profiles').upsert({
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
      await this.supabase.from('xp_transactions').upsert(txRows, {
        onConflict: 'user_id, rule_id, source_event_id',
      });
    }

    // 3. User Achievements
    if (unlockedAchievements.length > 0) {
      const achRows = unlockedAchievements.map((achId) => ({
        user_id: userId,
        achievement_id: achId,
      }));
      await this.supabase.from('user_achievements').upsert(achRows, {
        onConflict: 'user_id, achievement_id',
      });
    }

    // 4. Daily missions if provided
    if (dailyMissionsMap) {
      const allMissions: any[] = [];
      for (const date of Object.keys(dailyMissionsMap)) {
        for (const m of dailyMissionsMap[date]) {
          allMissions.push({
            user_id: userId,
            id: m.id,
            date: m.date,
            type: m.type,
            title: m.title,
            description: m.description,
            topic_id: m.topic_id || null,
            subject_id: m.subject_id || null,
            target_value: m.target_value,
            current_value: m.current_value,
            unit: m.unit,
            xp_reward: m.xp_reward,
            status: m.status,
            reason: m.reason,
            source: m.source,
            is_main: m.is_main || false,
            is_executable: m.is_executable !== false,
            cta_url: m.cta_url || null,
            cta_label: m.cta_label || null,
            created_at: m.created_at,
            completed_at: m.completed_at || null,
          });
        }
      }
      if (allMissions.length > 0) {
        await this.supabase.from('daily_missions').upsert(allMissions, {
          onConflict: 'user_id, id',
        });
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
    }, { onConflict: 'user_id' });
    if (error) console.error('Erro ao persistir settings:', error.message);
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
    if (error) console.error('Erro ao persistir study event:', error.message);
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
    await this.supabase.from('user_migrations').upsert({
      user_id: userId,
      migration_key: 'local_store_v3_import',
      completed_at: new Date().toISOString(),
      metadata,
    }, { onConflict: 'user_id, migration_key' });
  }
}
