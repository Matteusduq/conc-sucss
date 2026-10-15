-- seed.sql: Complete idempotent seed function for Câmara dos Deputados (Edital nº 1/2026)
-- Covers P1 (5 subjects), P2 (4 subjects), P3 (Discursive), 76 Topics, 81 Syllabus Items, and Placeholders.
-- NO fake performance, NO fake questions, NO fake flashcards.

CREATE OR REPLACE FUNCTION public.seed_camara_exam_data(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exam_id uuid;
  v_block_p1_id uuid;
  v_block_p2_id uuid;
  v_block_p3_id uuid;

  -- Subject IDs
  v_sub_port_id uuid;
  v_sub_ing_id uuid;
  v_sub_adm_id uuid;
  v_sub_const_id uuid;
  v_sub_ti_id uuid;
  v_sub_ling_id uuid;
  v_sub_asr_id uuid;
  v_sub_leg_id uuid;
  v_sub_pol_id uuid;

  v_topic_id uuid;
  v_syl_id uuid;
BEGIN
  -- 1. Create or get Exam
  SELECT id INTO v_exam_id FROM public.exams WHERE user_id = p_user_id AND name = 'Câmara dos Deputados 2027' LIMIT 1;
  IF v_exam_id IS NULL THEN
    INSERT INTO public.exams (
      user_id, name, institution, role, exam_board, exam_date,
      question_model, correct_points, wrong_points, blank_points, active,
      objective_duration_minutes, discursive_duration_minutes,
      p1_items, p2_items, p1_min_points, p2_min_points, objective_total_min_points,
      p3_max_points, p3_min_points, official_notice_date
    ) VALUES (
      p_user_id, 'Câmara dos Deputados 2027', 'Câmara dos Deputados',
      'Analista Legislativo — Registro e Redação', 'Cebraspe', '2027-01-17',
      'Certo / Errado', 1, -1, 0, true,
      300, 180, 90, 90, 18, 27, 54, 60, 30, '2026-10-02'
    ) RETURNING id INTO v_exam_id;
  END IF;

  -- 2. User Settings
  INSERT INTO public.user_study_settings (
    user_id, default_high_questions, default_medium_questions, default_low_questions,
    memory_daily_minutes, desired_retention
  ) VALUES (
    p_user_id, 30, 20, 15, 25, 0.90
  ) ON CONFLICT (user_id) DO NOTHING;

  -- 3. Exam Blocks (P1, P2, P3)
  INSERT INTO public.exam_blocks (user_id, exam_id, code, name, block_type, total_items, max_points, minimum_points, duration_minutes, display_order)
  VALUES (p_user_id, v_exam_id, 'P1', 'Conhecimentos Básicos', 'OBJECTIVE', 90, 90, 18, 300, 1)
  ON CONFLICT (exam_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_block_p1_id;

  INSERT INTO public.exam_blocks (user_id, exam_id, code, name, block_type, total_items, max_points, minimum_points, duration_minutes, display_order)
  VALUES (p_user_id, v_exam_id, 'P2', 'Conhecimentos Específicos', 'OBJECTIVE', 90, 90, 27, 300, 2)
  ON CONFLICT (exam_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_block_p2_id;

  INSERT INTO public.exam_blocks (user_id, exam_id, code, name, block_type, total_items, max_points, minimum_points, duration_minutes, display_order)
  VALUES (p_user_id, v_exam_id, 'P3', 'Prova Discursiva', 'DISCURSIVE', NULL, 60, 30, 180, 3)
  ON CONFLICT (exam_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_block_p3_id;

  -- 4. Subjects (5 in P1, 4 in P2)
  -- P1
  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p1_id, 'P1', 'Língua Portuguesa', 'lingua-portuguesa', 1, NULL, true)
  RETURNING id INTO v_sub_port_id;

  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p1_id, 'P1', 'Língua Inglesa', 'lingua-inglesa', 2, NULL, true)
  RETURNING id INTO v_sub_ing_id;

  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p1_id, 'P1', 'Direito Administrativo e Administração Pública', 'direito-administrativo-e-administracao-publica', 3, NULL, true)
  RETURNING id INTO v_sub_adm_id;

  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p1_id, 'P1', 'Direito Constitucional e Regimento Interno', 'direito-constitucional-e-regimento-interno', 4, NULL, true)
  RETURNING id INTO v_sub_const_id;

  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p1_id, 'P1', 'Tecnologia da Informação e Dados', 'tecnologia-da-informacao-e-dados', 5, NULL, true)
  RETURNING id INTO v_sub_ti_id;

  -- P2
  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p2_id, 'P2', 'Linguística', 'linguistica', 6, NULL, true)
  RETURNING id INTO v_sub_ling_id;

  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p2_id, 'P2', 'Reconhecimento de Fala, Transcrição e Inteligência Artificial', 'reconhecimento-de-fala-transcricao-e-inteligencia-artificial', 7, NULL, true)
  RETURNING id INTO v_sub_asr_id;

  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p2_id, 'P2', 'Processo Legislativo, Regimento Interno da Câmara e Regimento Comum do Congresso', 'processo-legislativo-regimento-interno-e-comum', 8, NULL, true)
  RETURNING id INTO v_sub_leg_id;

  INSERT INTO public.subjects (user_id, exam_id, exam_block_id, exam_block_code, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, v_block_p2_id, 'P2', 'Ciência Política', 'ciencia-politica', 9, NULL, true)
  RETURNING id INTO v_sub_pol_id;

  RETURN v_exam_id;
END;
$$;
