import { SupabaseClient } from '@supabase/supabase-js';
import { AppStoreData, STORAGE_KEY_V3 } from './store';
import { mapDailyMissionToDb } from './mappers';
import { DailyMission } from '@/lib/gamification/types';

export interface V3MigrationResult {
  success: boolean;
  imported: boolean;
  error?: string;
  counts?: {
    questionSessions: number;
    studySessions: number;
    errorLogs: number;
    flashcards: number;
    reviews: number;
    discursiveSessions: number;
    mockExams: number;
    xp: number;
    dailyMissions: number;
  };
}

/**
 * Lê o localStorage atual e verifica se há dados da V3 prontos para importação.
 */
export function getLocalV3DataToImport(): AppStoreData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_V3) || localStorage.getItem('conc_store_v3');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const data: AppStoreData = parsed.data || parsed;

    // Verifica se possui alguma atividade real registrada
    const hasActivity =
      (data.questionSessions && data.questionSessions.length > 0) ||
      (data.studySessions && data.studySessions.length > 0) ||
      (data.flashcards && data.flashcards.length > 0) ||
      (data.reviews && data.reviews.length > 0) ||
      (data.discursiveSessions && data.discursiveSessions.length > 0) ||
      (data.mockExams && data.mockExams.length > 0) ||
      (data.gamificationProfile && data.gamificationProfile.total_xp > 0);

    return hasActivity ? data : null;
  } catch (err) {
    console.warn('Erro ao ler dados locais da V3 para migração:', err);
    return null;
  }
}

/**
 * Importa o histórico da V3 local para a conta remota no Supabase.
 * - Idempotente (usa onConflict em todas as coleções)
 * - Transforma todo user_id para auth.uid()
 * - Preserva estritamente IDs textuais, scores, FSRS, reviews, sessões de estudo
 */
export async function importV3DataToSupabase(
  userId: string,
  v3Data: AppStoreData,
  supabase: SupabaseClient
): Promise<V3MigrationResult> {
  if (!userId) {
    throw new Error('userId obrigatório para importar dados V3.');
  }

  try {
    // 1. Topics overrides (status, domain_score, study_score, last_studied_at)
    const modifiedTopics = (v3Data.topics || []).filter(
      (t) => t.status !== 'NOT_STARTED' || (t.domain_score != null && t.domain_score > 0) || t.last_studied_at
    );
    if (modifiedTopics.length > 0) {
      const topicUpdates = modifiedTopics.map((t) => ({
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
      const { error: tErr } = await supabase.from('topics').upsert(topicUpdates, { onConflict: 'user_id, id' });
      if (tErr) throw tErr;
    }

    // 2. Material Progress
    const matProgList = Object.values(v3Data.materialProgress || {});
    if (matProgList.length > 0) {
      const progRows = matProgList.map((p) => ({
        user_id: userId,
        id: p.id,
        material_id: p.material_id,
        topic_id: p.topic_id,
        current_page: p.current_page,
        max_page_reached: p.max_page_reached,
        progress_percent: p.progress_percent,
        completed: p.completed,
        first_opened_at: p.first_opened_at,
        last_opened_at: p.last_opened_at,
        completed_at: p.completed_at,
        total_study_seconds: p.total_study_seconds,
        notes_by_page: p.notes_by_page || {},
        bookmarks: p.bookmarks || [],
      }));
      const { error: mpErr } = await supabase.from('material_progress').upsert(progRows, { onConflict: 'user_id, material_id' });
      if (mpErr) throw mpErr;
    }

    // 3. Study Sessions
    const studySessions = v3Data.studySessions || [];
    if (studySessions.length > 0) {
      const sessRows = studySessions.map((s) => ({
        user_id: userId,
        id: s.id,
        exam_id: s.exam_id,
        subject_id: s.subject_id,
        topic_id: s.topic_id,
        material_id: s.material_id,
        session_type: s.session_type,
        started_at: s.started_at,
        ended_at: s.ended_at,
        duration_seconds: s.duration_seconds,
        notes: s.notes,
      }));
      const { error: ssErr } = await supabase.from('study_sessions').upsert(sessRows, { onConflict: 'user_id, id' });
      if (ssErr) throw ssErr;
    }

    // 4. Question Sessions
    const questionSessions = v3Data.questionSessions || [];
    if (questionSessions.length > 0) {
      const qRows = questionSessions.map((q) => ({
        user_id: userId,
        id: q.id,
        exam_id: q.exam_id,
        subject_id: q.subject_id,
        topic_id: q.topic_id,
        performed_at: q.performed_at,
        total_questions: q.total_questions,
        correct: q.correct,
        wrong: q.wrong,
        blank: q.blank,
        duration_seconds: q.duration_seconds,
        subjective_feeling: q.subjective_feeling,
        notes: q.notes,
        accuracy_rate: q.accuracy_rate,
        net_points: q.net_points,
        net_rate: q.net_rate,
        had_conceptual_error: q.had_conceptual_error,
      }));
      const { error: qsErr } = await supabase.from('question_sessions').upsert(qRows, { onConflict: 'user_id, id' });
      if (qsErr) throw qsErr;
    }

    // 5. Error Logs
    const errorLogs = v3Data.errorLogs || [];
    if (errorLogs.length > 0) {
      const errRows = errorLogs.map((e) => ({
        user_id: userId,
        id: e.id,
        exam_id: e.exam_id,
        subject_id: e.subject_id,
        topic_id: e.topic_id,
        question_session_id: e.question_session_id,
        error_type: e.error_type,
        summary: e.summary,
        correct_rule: e.correct_rule,
        personal_note: e.personal_note,
        severity: e.severity,
        resolved: e.resolved,
        resolved_at: e.resolved_at,
      }));
      const { error: elErr } = await supabase.from('error_logs').upsert(errRows, { onConflict: 'user_id, id' });
      if (elErr) throw elErr;
    }

    // 6. Flashcards
    const flashcards = v3Data.flashcards || [];
    if (flashcards.length > 0) {
      const cardRows = flashcards.map((c) => ({
        user_id: userId,
        id: c.id,
        exam_id: c.exam_id,
        subject_id: c.subject_id,
        topic_id: c.topic_id,
        card_type: c.card_type,
        front: c.front,
        back: c.back,
        source_type: c.source_type,
        source_material_id: c.source_material_id,
        source_error_id: c.source_error_id,
        exam_priority: c.exam_priority,
        priority_boost: c.priority_boost,
        active: c.active,
        suspended: c.suspended,
      }));
      const { error: fcErr } = await supabase.from('flashcards').upsert(cardRows, { onConflict: 'user_id, id' });
      if (fcErr) throw fcErr;
    }

    // 7. FSRS State
    const fsrsEntries = Object.values(v3Data.fsrsStates || {});
    if (fsrsEntries.length > 0) {
      const fsrsRows = fsrsEntries.map((f) => ({
        user_id: userId,
        flashcard_id: f.flashcard_id,
        due: f.due,
        stability: f.stability,
        difficulty: f.difficulty,
        elapsed_days: f.elapsed_days,
        scheduled_days: f.scheduled_days,
        learning_steps: f.learning_steps || 0,
        reps: f.reps || 0,
        lapses: f.lapses || 0,
        state: f.state || 0,
        last_review: f.last_review,
      }));
      const { error: fsrsErr } = await supabase.from('flashcard_fsrs_state').upsert(fsrsRows, { onConflict: 'user_id, flashcard_id' });
      if (fsrsErr) throw fsrsErr;
    }

    // 8. Reviews
    const reviews = v3Data.reviews || [];
    if (reviews.length > 0) {
      const revRows = reviews.map((r) => ({
        user_id: userId,
        id: r.id,
        flashcard_id: r.flashcard_id,
        reviewed_at: r.reviewed_at,
        rating: r.rating,
        response_time_ms: r.response_time_ms,
        state_before: r.state_before,
        state_after: r.state_after,
        fsrs_log: r.fsrs_log,
        was_due_at_review: r.was_due_at_review !== false,
      }));
      const { error: rErr } = await supabase.from('flashcard_reviews').upsert(revRows, { onConflict: 'user_id, id' });
      if (rErr) throw rErr;
    }

    // 9. Discursive Sessions
    const discursiveSessions = v3Data.discursiveSessions || [];
    if (discursiveSessions.length > 0) {
      const discRows = discursiveSessions.map((d) => ({
        user_id: userId,
        id: d.id,
        exam_id: d.exam_id,
        type: d.type,
        performed_at: d.performed_at,
        title: d.title,
        prompt_summary: d.prompt_summary,
        related_subject_id: d.related_subject_id,
        related_topic_id: d.related_topic_id,
        duration_seconds: d.duration_seconds,
        lines_written: d.lines_written,
        content_score: d.content_score,
        language_errors: d.language_errors,
        calculated_score: d.calculated_score,
        notes: d.notes,
      }));
      const { error: discErr } = await supabase.from('discursive_sessions').upsert(discRows, { onConflict: 'user_id, id' });
      if (discErr) throw discErr;
    }

    // 10. Mock Exams
    const mockExams = v3Data.mockExams || [];
    if (mockExams.length > 0) {
      const mockRows = mockExams.map((m) => ({
        user_id: userId,
        id: m.id,
        exam_id: m.exam_id,
        type: m.type,
        performed_at: m.performed_at,
        total_questions: m.total_questions,
        correct: m.correct,
        wrong: m.wrong,
        blank: m.blank,
        net_points: m.net_points,
        p1_correct: m.p1_correct,
        p1_wrong: m.p1_wrong,
        p1_blank: m.p1_blank,
        p1_net: m.p1_net,
        p2_correct: m.p2_correct,
        p2_wrong: m.p2_wrong,
        p2_blank: m.p2_blank,
        p2_net: m.p2_net,
        duration_seconds: m.duration_seconds,
        notes: m.notes,
      }));
      const { error: meErr } = await supabase.from('mock_exams').upsert(mockRows, { onConflict: 'user_id, id' });
      if (meErr) throw meErr;
    }

    // 11. Study Events
    const events = v3Data.events || [];
    if (events.length > 0) {
      const evRows = events.map((e) => ({
        user_id: userId,
        id: e.id,
        event_type: e.event_type,
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        payload: e.payload,
        created_at: e.created_at,
      }));
      const { error: seErr } = await supabase.from('study_events').upsert(evRows, { onConflict: 'user_id, id' });
      if (seErr) throw seErr;
    }

    // 12. Gamification Profile & XP
    if (v3Data.gamificationProfile) {
      const g = v3Data.gamificationProfile;
      const { error: gpErr } = await supabase.from('gamification_profiles').upsert({
        user_id: userId,
        total_xp: g.total_xp,
        level: g.level,
        current_streak: g.current_streak,
        longest_streak: g.longest_streak,
        meaningful_days: g.meaningful_days,
        last_meaningful_study_date: g.last_meaningful_study_date,
        weekly_consistency_days: g.weekly_consistency_days,
        current_week_start: g.current_week_start,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (gpErr) throw gpErr;
    }

    const xpTransactions = v3Data.xpTransactions || [];
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
      const { error: xpErr } = await supabase.from('xp_transactions').upsert(txRows, { onConflict: 'user_id, rule_id, source_event_id' });
      if (xpErr) throw xpErr;
    }

    const achievements = v3Data.unlockedAchievements || [];
    if (achievements.length > 0) {
      const achRows = achievements.map((achId) => ({
        user_id: userId,
        achievement_id: achId,
      }));
      const { error: achErr } = await supabase.from('user_achievements').upsert(achRows, { onConflict: 'user_id, achievement_id' });
      if (achErr) throw achErr;
    }

    // 13. Daily Missions
    let totalMissionsImported = 0;
    const missionsMap = v3Data.dailyMissions || {};
    const allMissions: DailyMission[] = [];
    for (const date of Object.keys(missionsMap)) {
      for (const m of missionsMap[date]) {
        allMissions.push(m);
      }
    }
    if (allMissions.length > 0) {
      totalMissionsImported = allMissions.length;
      const mRows = allMissions.map((m) => mapDailyMissionToDb(m, userId));
      const { error: misErr } = await supabase.from('daily_missions').upsert(mRows, { onConflict: 'user_id, date, id' });
      if (misErr) throw misErr;
    }

    // 14. Settings
    if (v3Data.settings) {
      const s = v3Data.settings;
      const { error: setErr } = await supabase.from('user_study_settings').upsert({
        user_id: userId,
        weekly_study_target_minutes: s.weekly_study_target_minutes,
        default_high_questions: s.default_high_questions,
        default_medium_questions: s.default_medium_questions,
        default_low_questions: s.default_low_questions,
        memory_daily_minutes: s.memory_daily_minutes,
        desired_retention: s.desired_retention,
        today_available_minutes: s.today_available_minutes,
        gamification_show_animations: s.gamification_show_animations !== false,
        gamification_show_xp_toast: s.gamification_show_xp_toast !== false,
        gamification_show_streak: s.gamification_show_streak !== false,
        gamification_weekly_target_days: s.gamification_weekly_target_days || 5,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (setErr) throw setErr;
    }

    // 15. Registra conclusão da migração no backend
    const { error: migErr } = await supabase.from('user_migrations').upsert({
      user_id: userId,
      migration_key: 'local_store_v3_import',
      completed_at: new Date().toISOString(),
      metadata: {
        questionSessionsCount: questionSessions.length,
        studySessionsCount: studySessions.length,
        flashcardsCount: flashcards.length,
        dailyMissionsCount: totalMissionsImported,
        totalXp: v3Data.gamificationProfile?.total_xp || 0,
      },
    }, { onConflict: 'user_id, migration_key' });
    if (migErr) throw migErr;

    // 16. Marca timestamp no localStorage (sem deletar os dados brutos de backup)
    if (typeof window !== 'undefined') {
      localStorage.setItem('conc_store_v3_imported_at', new Date().toISOString());
    }

    return {
      success: true,
      imported: true,
      counts: {
        questionSessions: questionSessions.length,
        studySessions: studySessions.length,
        errorLogs: errorLogs.length,
        flashcards: flashcards.length,
        reviews: reviews.length,
        discursiveSessions: discursiveSessions.length,
        mockExams: mockExams.length,
        xp: v3Data.gamificationProfile?.total_xp || 0,
        dailyMissions: totalMissionsImported,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Falha na migração V3 -> Supabase:', errorMsg);
    return { success: false, imported: false, error: errorMsg };
  }
}
