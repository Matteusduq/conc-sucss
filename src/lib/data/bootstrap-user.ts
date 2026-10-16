import { SupabaseClient } from '@supabase/supabase-js';
import {
  SEED_EXAM,
  SEED_EXAM_BLOCKS,
  SEED_SUBJECTS,
  SEED_TOPICS,
  SEED_SYLLABUS_ITEMS,
  SEED_TOPIC_SYLLABUS_ITEMS,
  SEED_MATERIALS,
} from './seed';

/**
 * Bootstrap curricular idempotente para um novo usuário autenticado.
 * Transforma `local-user` em `userId = auth.uid()` preservando rigorosamente:
 * - 76 Topics (42 P1 + 34 P2)
 * - 182 SyllabusItems (103 P1 + 79 P2)
 * - starter_rank (1 a 8)
 * - StudyScore inicial
 * - Estrutura de blocos e disciplinas
 * - Materiais em status PENDING
 * - GamificationProfile zerado (0 XP, 0 Streak)
 */
export async function ensureUserStudyData(
  userId: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; created: boolean; error?: string }> {
  if (!userId) {
    throw new Error('userId é obrigatório para o bootstrap curricular.');
  }

  try {
    // 1. Verifica se os tópicos já foram bootstrapados para este usuário
    const { count, error: checkError } = await supabase
      .from('topics')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (checkError) {
      console.error('Erro ao verificar tópicos do usuário:', checkError);
      return { success: false, created: false, error: checkError.message };
    }

    if (count && count >= 76) {
      // Usuário já possui estrutura completa inicializada
      return { success: true, created: false };
    }

    // 2. Profile
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        timezone: 'America/Sao_Paulo',
        weekly_study_target_minutes: 1200,
        daily_memory_target_minutes: 20,
        desired_retention: 0.90,
      },
      { onConflict: 'id' }
    );
    if (profileError) console.warn('Erro ao criar profile:', profileError.message);

    // 3. User Study Settings
    const { error: settingsError } = await supabase.from('user_study_settings').upsert(
      {
        user_id: userId,
        weekly_study_target_minutes: 1200,
        default_high_questions: 20,
        default_medium_questions: 15,
        default_low_questions: 10,
        memory_daily_minutes: 20,
        desired_retention: 0.90,
        gamification_show_animations: true,
        gamification_show_xp_toast: true,
        gamification_show_streak: true,
        gamification_weekly_target_days: 5,
      },
      { onConflict: 'user_id' }
    );
    if (settingsError) console.warn('Erro ao criar settings:', settingsError.message);

    // 4. Exam
    const { error: examError } = await supabase.from('exams').upsert(
      {
        user_id: userId,
        id: SEED_EXAM.id,
        name: SEED_EXAM.name,
        institution: SEED_EXAM.institution,
        role: SEED_EXAM.role,
        exam_board: SEED_EXAM.exam_board,
        exam_date: SEED_EXAM.exam_date,
        question_model: SEED_EXAM.question_model,
        correct_points: SEED_EXAM.correct_points,
        wrong_points: SEED_EXAM.wrong_points,
        blank_points: SEED_EXAM.blank_points,
        active: SEED_EXAM.active,
        objective_duration_minutes: SEED_EXAM.objective_duration_minutes || 300,
        discursive_duration_minutes: SEED_EXAM.discursive_duration_minutes || 180,
        p1_items: SEED_EXAM.p1_items || 90,
        p2_items: SEED_EXAM.p2_items || 90,
        p1_min_points: SEED_EXAM.p1_min_points || 18,
        p2_min_points: SEED_EXAM.p2_min_points || 27,
        objective_total_min_points: SEED_EXAM.objective_total_min_points || 54,
        p3_max_points: SEED_EXAM.p3_max_points || 60,
        p3_min_points: SEED_EXAM.p3_min_points || 30,
        official_notice_date: SEED_EXAM.official_notice_date || '2026-10-02',
      },
      { onConflict: 'user_id, id' }
    );
    if (examError) throw examError;

    // 5. Exam Blocks (P1, P2, P3)
    const blocksData = SEED_EXAM_BLOCKS.map((b) => ({
      user_id: userId,
      id: b.id,
      exam_id: b.exam_id,
      code: b.code,
      name: b.name,
      block_type: b.block_type,
      total_items: b.total_items,
      max_points: b.max_points,
      minimum_points: b.minimum_points,
      duration_minutes: b.duration_minutes,
      display_order: b.display_order,
    }));
    const { error: blocksError } = await supabase.from('exam_blocks').upsert(blocksData, {
      onConflict: 'user_id, id',
    });
    if (blocksError) throw blocksError;

    // 6. Subjects (9 disciplinas)
    const subjectsData = SEED_SUBJECTS.map((s) => ({
      user_id: userId,
      id: s.id,
      exam_id: s.exam_id,
      exam_block_id: s.exam_block_id,
      exam_block_code: s.exam_block_code,
      name: s.name,
      slug: s.slug,
      display_order: s.display_order,
      target_hours: s.target_hours,
      active: s.active,
    }));
    const { error: subjectsError } = await supabase.from('subjects').upsert(subjectsData, {
      onConflict: 'user_id, id',
    });
    if (subjectsError) throw subjectsError;

    // 7. Topics (76 Topics) em chunks para evitar excesso de payload
    const topicsData = SEED_TOPICS.map((t) => ({
      user_id: userId,
      id: t.id,
      exam_id: t.exam_id,
      subject_id: t.subject_id,
      exam_block_id: t.exam_block_id,
      exam_block_code: t.exam_block_code,
      parent_topic_id: t.parent_topic_id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      priority: t.priority,
      priority_label: t.priority_label,
      priority_weight: t.priority_weight,
      priority_source: t.priority_source,
      priority_basis: t.priority_basis,
      priority_confidence: t.priority_confidence,
      cross_relevance: t.cross_relevance,
      discursive_eligible: t.discursive_eligible,
      is_discursive_relevant: t.is_discursive_relevant,
      discursive_synergy: t.discursive_synergy,
      recommended_material_type: t.recommended_material_type,
      status: t.status,
      display_order: t.display_order,
      estimated_minutes: t.estimated_minutes,
      domain_score: t.domain_score,
      domain_confidence: t.domain_confidence,
      study_score: t.study_score,
      starter_rank: t.starter_rank,
      last_studied_at: t.last_studied_at,
      next_recommended_at: t.next_recommended_at,
      tec_filter_hint: t.tec_filter_hint,
    }));

    for (let i = 0; i < topicsData.length; i += 50) {
      const chunk = topicsData.slice(i, i + 50);
      const { error: topicsError } = await supabase.from('topics').upsert(chunk, {
        onConflict: 'user_id, id',
      });
      if (topicsError) throw topicsError;
    }

    // 8. Syllabus Items (182 itens) em chunks
    const syllabusData = SEED_SYLLABUS_ITEMS.map((item) => ({
      user_id: userId,
      id: item.id,
      exam_id: item.exam_id,
      exam_block_id: item.exam_block_id,
      subject_id: item.subject_id,
      parent_item_id: item.parent_item_id,
      official_code: item.official_code,
      official_text: item.official_text,
      display_order: item.display_order,
      active: item.active,
    }));

    for (let i = 0; i < syllabusData.length; i += 50) {
      const chunk = syllabusData.slice(i, i + 50);
      const { error: sylError } = await supabase.from('syllabus_items').upsert(chunk, {
        onConflict: 'user_id, id',
      });
      if (sylError) throw sylError;
    }

    // 9. Topic Syllabus Items (mapeamentos) em chunks
    const topicSylData = SEED_TOPIC_SYLLABUS_ITEMS.map((tsi) => ({
      user_id: userId,
      topic_id: tsi.topic_id,
      syllabus_item_id: tsi.syllabus_item_id,
    }));

    for (let i = 0; i < topicSylData.length; i += 50) {
      const chunk = topicSylData.slice(i, i + 50);
      const { error: tsiError } = await supabase.from('topic_syllabus_items').upsert(chunk, {
        onConflict: 'user_id, topic_id, syllabus_item_id',
      });
      if (tsiError) throw tsiError;
    }

    // 10. Study Materials placeholders (PENDING) em chunks
    const materialsData = SEED_MATERIALS.map((m) => ({
      user_id: userId,
      id: m.id,
      topic_id: m.topic_id,
      title: m.title,
      material_type: m.material_type,
      storage_path: m.storage_path,
      file_url: m.file_url,
      file_name: m.file_name,
      mime_type: m.mime_type,
      file_size: m.file_size,
      page_count: m.page_count,
      status: 'PENDING',
      version: m.version || 1,
    }));

    for (let i = 0; i < materialsData.length; i += 50) {
      const chunk = materialsData.slice(i, i + 50);
      const { error: matError } = await supabase.from('study_materials').upsert(chunk, {
        onConflict: 'user_id, id',
      });
      if (matError) throw matError;
    }

    // 11. Gamification Profile (Inicial zerado)
    const { error: gamError } = await supabase.from('gamification_profiles').upsert(
      {
        user_id: userId,
        total_xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        meaningful_days: 0,
        last_meaningful_study_date: null,
        weekly_consistency_days: 0,
        current_week_start: null,
      },
      { onConflict: 'user_id' }
    );
    if (gamError) console.warn('Erro ao inicializar gamification_profile:', gamError.message);

    return { success: true, created: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Falha no bootstrap curricular do usuário:', errorMsg);
    return { success: false, created: false, error: errorMsg };
  }
}
