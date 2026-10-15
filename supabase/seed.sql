-- seed.sql: Initial seed function and structure for Câmara dos Deputados
-- Strictly inserts structure: Exam, Subjects, Topics, and Material Placeholders.
-- NO fake performance, NO fake questions, NO fake flashcards.

CREATE OR REPLACE FUNCTION public.seed_camara_exam_data(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exam_id uuid;
  v_sub_port_id uuid;
  v_sub_const_id uuid;
  v_sub_adm_id uuid;
  v_sub_ti_id uuid;
  v_topic_id uuid;
  v_source text := 'Engenharia reversa Cebraspe/Câmara 2021–2026';
BEGIN
  -- 1. Create or get Exam
  SELECT id INTO v_exam_id FROM public.exams WHERE user_id = p_user_id AND name = 'Câmara dos Deputados 2027' LIMIT 1;
  IF v_exam_id IS NULL THEN
    INSERT INTO public.exams (
      user_id, name, institution, role, exam_board, exam_date,
      question_model, correct_points, wrong_points, blank_points, active
    ) VALUES (
      p_user_id, 'Câmara dos Deputados 2027', 'Câmara dos Deputados',
      'Analista Legislativo — Registro e Redação', 'Cebraspe', '2027-01-17',
      'Certo / Errado', 1, -1, 0, true
    ) RETURNING id INTO v_exam_id;
  END IF;

  -- 2. Create User Settings if not exists
  INSERT INTO public.user_study_settings (
    user_id, default_high_questions, default_medium_questions, default_low_questions,
    memory_daily_minutes, desired_retention
  ) VALUES (
    p_user_id, 30, 20, 15, 25, 0.90
  ) ON CONFLICT (user_id) DO NOTHING;

  -- 3. Subjects
  -- Língua Portuguesa — 80h
  INSERT INTO public.subjects (user_id, exam_id, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, 'Língua Portuguesa', 'lingua-portuguesa', 1, 80, true)
  RETURNING id INTO v_sub_port_id;

  -- Direito Constitucional — 62h
  INSERT INTO public.subjects (user_id, exam_id, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, 'Direito Constitucional', 'direito-constitucional', 2, 62, true)
  RETURNING id INTO v_sub_const_id;

  -- Direito Administrativo — 52h
  INSERT INTO public.subjects (user_id, exam_id, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, 'Direito Administrativo', 'direito-administrativo', 3, 52, true)
  RETURNING id INTO v_sub_adm_id;

  -- Tecnologia da Informação e Dados — 40h
  INSERT INTO public.subjects (user_id, exam_id, name, slug, display_order, target_hours, active)
  VALUES (p_user_id, v_exam_id, 'Tecnologia da Informação e Dados', 'tecnologia-da-informacao-e-dados', 4, 40, true)
  RETURNING id INTO v_sub_ti_id;

  -- =========================================================================
  -- 4. Topics: Língua Portuguesa
  -- HIGH -> FULL_PDF
  -- =========================================================================
  -- 1. Interpretação, inferência, coerência e finalidade argumentativa
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Interpretação, inferência, coerência e finalidade argumentativa', 'interpretacao-inferencia-coerencia', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 1, 'Disciplina: Português | Assunto: Interpretação de Texto')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Interpretação, inferência, coerência e finalidade argumentativa', 'FULL_PDF', 'PENDING');

  -- 2. Coesão e referenciação
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Coesão e referenciação', 'coesao-referenciacao', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 2, 'Disciplina: Português | Assunto: Coesão Textual')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Coesão e referenciação', 'FULL_PDF', 'PENDING');

  -- 3. Reescrita com preservação de correção e sentido
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Reescrita com preservação de correção e sentido', 'reescrita-correcao-sentido', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 3, 'Disciplina: Português | Assunto: Reescritura de Frases')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Reescrita com preservação de correção e sentido', 'FULL_PDF', 'PENDING');

  -- 4. Morfossintaxe e funções sintáticas
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Morfossintaxe e funções sintáticas', 'morfossintaxe-funcoes-sintaticas', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 4, 'Disciplina: Português | Assunto: Análise Sintática')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Morfossintaxe e funções sintáticas', 'FULL_PDF', 'PENDING');

  -- 5. Semântica lexical e relações de sentido
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Semântica lexical e relações de sentido', 'semantica-lexical-relacoes-sentido', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 5, 'Disciplina: Português | Assunto: Semântica')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Semântica lexical e relações de sentido', 'FULL_PDF', 'PENDING');

  -- MEDIUM -> SIMPLIFIED_PDF
  -- 6. Concordância verbal e nominal
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Concordância verbal e nominal', 'concordancia-verbal-nominal', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 6, 'Disciplina: Português | Assunto: Concordância Verbal e Nominal')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Concordância verbal e nominal', 'SIMPLIFIED_PDF', 'PENDING');

  -- 7. Pontuação com efeito sintático e semântico
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Pontuação com efeito sintático e semântico', 'pontuacao-sintatico-semantico', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 7, 'Disciplina: Português | Assunto: Pontuação')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Pontuação com efeito sintático e semântico', 'SIMPLIFIED_PDF', 'PENDING');

  -- 8. Regência
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Regência verbal e nominal', 'regencia', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 8, 'Disciplina: Português | Assunto: Regência Verbal e Nominal')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Regência', 'SIMPLIFIED_PDF', 'PENDING');

  -- 9. Crase
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Crase', 'crase', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 9, 'Disciplina: Português | Assunto: Crase')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Crase', 'SIMPLIFIED_PDF', 'PENDING');

  -- 10. Colocação pronominal
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Colocação pronominal', 'colocacao-pronominal', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 10, 'Disciplina: Português | Assunto: Colocação Pronominal')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Colocação pronominal', 'SIMPLIFIED_PDF', 'PENDING');

  -- 11. Funções de “que” e “se”
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Funções de "que" e "se"', 'funcoes-que-se', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 11, 'Disciplina: Português | Assunto: Funções do Que e do Se')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Funções de que e se', 'SIMPLIFIED_PDF', 'PENDING');

  -- 12. Conectivos e relações lógico-semânticas
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Conectivos e relações lógico-semânticas', 'conectivos-relacoes-logico-semanticas', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 12, 'Disciplina: Português | Assunto: Conjunções e Conectivos')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Conectivos e relações lógico-semânticas', 'SIMPLIFIED_PDF', 'PENDING');

  -- LOW -> SUMMARY
  -- 13. Ortografia e tópicos residuais do edital
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_port_id, 'Ortografia e tópicos residuais do edital', 'ortografia-residuais', 'LOW', 0.35, v_source, 'SUMMARY', 'NOT_STARTED', 13, 'Disciplina: Português | Assunto: Ortografia Oficial')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'Resumo — Ortografia e tópicos residuais', 'SUMMARY', 'PENDING');

  -- =========================================================================
  -- 5. Topics: Direito Constitucional
  -- =========================================================================
  -- HIGH -> FULL_PDF
  -- 1. Poder Legislativo
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Poder Legislativo', 'poder-legislativo', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 1, 'Disciplina: Direito Constitucional | Assunto: Poder Legislativo')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Poder Legislativo', 'FULL_PDF', 'PENDING');

  -- 2. Congresso Nacional
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Congresso Nacional', 'congresso-nacional', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 2, 'Disciplina: Direito Constitucional | Assunto: Congresso Nacional')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Congresso Nacional', 'FULL_PDF', 'PENDING');

  -- 3. Câmara dos Deputados
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Câmara dos Deputados', 'camara-dos-deputados', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 3, 'Disciplina: Direito Constitucional | Assunto: Câmara dos Deputados')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Câmara dos Deputados', 'FULL_PDF', 'PENDING');

  -- 4. Senado Federal
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Senado Federal', 'senado-federal', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 4, 'Disciplina: Direito Constitucional | Assunto: Senado Federal')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Senado Federal', 'FULL_PDF', 'PENDING');

  -- 5. Reuniões, sessões e funcionamento das Casas
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Reuniões, sessões e funcionamento das Casas', 'reunioes-sessoes-funcionamento', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 5, 'Disciplina: Direito Constitucional | Assunto: Reuniões e Sessões Legislativas')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Reuniões, sessões e funcionamento das Casas', 'FULL_PDF', 'PENDING');

  -- 6. Comissões permanentes e temporárias
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Comissões permanentes e temporárias', 'comissoes-permanentes-temporarias', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 6, 'Disciplina: Direito Constitucional | Assunto: Comissões Parlamentares')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Comissões permanentes e temporárias', 'FULL_PDF', 'PENDING');

  -- 7. Comissões Parlamentares de Inquérito
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Comissões Parlamentares de Inquérito', 'cpi', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 7, 'Disciplina: Direito Constitucional | Assunto: CPI')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Comissões Parlamentares de Inquérito', 'FULL_PDF', 'PENDING');

  -- 8. Competências do Congresso, Câmara e Senado
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Competências do Congresso, Câmara e Senado', 'competencias-congresso-camara-senado', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 8, 'Disciplina: Direito Constitucional | Assunto: Competências Legislativas')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Competências do Congresso, Câmara e Senado', 'FULL_PDF', 'PENDING');

  -- 9. Regime jurídico-constitucional dos parlamentares
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Regime jurídico-constitucional dos parlamentares', 'regime-juridico-parlamentares', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 9, 'Disciplina: Direito Constitucional | Assunto: Estatuto dos Congressistas')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Regime jurídico dos parlamentares', 'FULL_PDF', 'PENDING');

  -- 10. Imunidades parlamentares
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Imunidades parlamentares', 'imunidades-parlamentares', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 10, 'Disciplina: Direito Constitucional | Assunto: Imunidades Parlamentares')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Imunidades parlamentares', 'FULL_PDF', 'PENDING');

  -- 11. Incompatibilidades, perda de mandato e licenças
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Incompatibilidades, perda de mandato e licenças', 'incompatibilidades-perda-mandato', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 11, 'Disciplina: Direito Constitucional | Assunto: Perda de Mandato Parlamentar')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Incompatibilidades e perda de mandato', 'FULL_PDF', 'PENDING');

  -- 12. Regimento Interno da Câmara dos Deputados
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Regimento Interno da Câmara dos Deputados', 'ricd', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 12, 'Disciplina: Regimento Interno | Assunto: Regimento Interno da Câmara dos Deputados')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Regimento Interno da Câmara dos Deputados', 'FULL_PDF', 'PENDING');

  -- 13. Regimento Comum do Congresso Nacional
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Regimento Comum do Congresso Nacional', 'rcn', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 13, 'Disciplina: Regimento Comum | Assunto: Regimento Comum do Congresso')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Regimento Comum do Congresso Nacional', 'FULL_PDF', 'PENDING');

  -- MEDIUM -> SIMPLIFIED_PDF
  -- 14. Direitos e garantias fundamentais
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Direitos e garantias fundamentais', 'direitos-garantias-fundamentais', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 14, 'Disciplina: Direito Constitucional | Assunto: Art. 5º e Direitos Fundamentais')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Direitos e garantias fundamentais', 'SIMPLIFIED_PDF', 'PENDING');

  -- 15. Organização do Estado
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Organização do Estado', 'organizacao-do-estado', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 15, 'Disciplina: Direito Constitucional | Assunto: Organização Político-Administrativa')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Organização do Estado', 'SIMPLIFIED_PDF', 'PENDING');

  -- 16. Administração Pública na Constituição
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Administração Pública na Constituição', 'administracao-publica-constituicao', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 16, 'Disciplina: Direito Constitucional | Assunto: Da Administração Pública')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Administração Pública na CF', 'SIMPLIFIED_PDF', 'PENDING');

  -- 17. Art. 37 da Constituição
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Art. 37 da Constituição', 'art-37-constituicao', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 17, 'Disciplina: Direito Constitucional | Assunto: Art. 37 CF')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Art. 37 da Constituição', 'SIMPLIFIED_PDF', 'PENDING');

  -- 18. Princípios fundamentais
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Princípios fundamentais', 'principios-fundamentais', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 18, 'Disciplina: Direito Constitucional | Assunto: Arts. 1º a 4º CF')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Princípios fundamentais', 'SIMPLIFIED_PDF', 'PENDING');

  -- 19. Eficácia e aplicabilidade das normas constitucionais
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_const_id, 'Eficácia e aplicabilidade das normas constitucionais', 'eficacia-normas-constitucionais', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 19, 'Disciplina: Direito Constitucional | Assunto: Aplicabilidade das Normas')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Eficácia das normas', 'SIMPLIFIED_PDF', 'PENDING');

  -- =========================================================================
  -- 6. Topics: Direito Administrativo
  -- =========================================================================
  -- HIGH -> FULL_PDF
  -- 1. Lei 14.133/2021 — visão geral
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Lei 14.133/2021 — visão geral', 'lei-14133-visao-geral', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 1, 'Disciplina: Direito Administrativo | Assunto: Nova Lei de Licitações (14.133)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Lei 14.133/2021 (Visão Geral)', 'FULL_PDF', 'PENDING');

  -- 2. Princípios e finalidade das licitações
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Princípios e finalidade das licitações', 'principios-finalidade-licitacoes', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 2, 'Disciplina: Direito Administrativo | Assunto: Licitações - Princípios')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Princípios das Licitações', 'FULL_PDF', 'PENDING');

  -- 3. Fases da licitação
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Fases da licitação', 'fases-da-licitacao', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 3, 'Disciplina: Direito Administrativo | Assunto: Fases do Processo Licitatório')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Fases da Licitação', 'FULL_PDF', 'PENDING');

  -- 4. Modalidades
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Modalidades de licitação', 'modalidades-licitacao', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 4, 'Disciplina: Direito Administrativo | Assunto: Modalidades Licitatórias')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Modalidades de Licitação', 'FULL_PDF', 'PENDING');

  -- 5. Critérios de julgamento
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Critérios de julgamento', 'criterios-de-julgamento', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 5, 'Disciplina: Direito Administrativo | Assunto: Critérios de Julgamento')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Critérios de Julgamento', 'FULL_PDF', 'PENDING');

  -- 6. Contratação direta
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Contratação direta', 'contratacao-direta', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 6, 'Disciplina: Direito Administrativo | Assunto: Contratação Direta')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Contratação Direta', 'FULL_PDF', 'PENDING');

  -- 7. Dispensa de licitação
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Dispensa de licitação', 'dispensa-de-licitacao', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 7, 'Disciplina: Direito Administrativo | Assunto: Dispensa de Licitação')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Dispensa de Licitação', 'FULL_PDF', 'PENDING');

  -- 8. Inexigibilidade
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Inexigibilidade de licitação', 'inexigibilidade', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 8, 'Disciplina: Direito Administrativo | Assunto: Inexigibilidade de Licitação')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Inexigibilidade', 'FULL_PDF', 'PENDING');

  -- 9. Contratos administrativos
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Contratos administrativos', 'contratos-administrativos', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 9, 'Disciplina: Direito Administrativo | Assunto: Contratos Administrativos')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Contratos Administrativos', 'FULL_PDF', 'PENDING');

  -- 10. Alterações contratuais
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Alterações contratuais', 'alteracoes-contratuais', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 10, 'Disciplina: Direito Administrativo | Assunto: Alterações Contratuais')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Alterações Contratuais', 'FULL_PDF', 'PENDING');

  -- 11. Gestão e fiscalização de contratos
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Gestão e fiscalização de contratos', 'gestao-fiscalizacao-contratos', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 11, 'Disciplina: Direito Administrativo | Assunto: Fiscalização Contratual')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Gestão e Fiscalização de Contratos', 'FULL_PDF', 'PENDING');

  -- 12. Planejamento da contratação
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Planejamento da contratação', 'planejamento-contratacao', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 12, 'Disciplina: Direito Administrativo | Assunto: Planejamento das Contratações')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Planejamento da Contratação', 'FULL_PDF', 'PENDING');

  -- 13. Estudo Técnico Preliminar
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Estudo Técnico Preliminar (ETP)', 'etp', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 13, 'Disciplina: Direito Administrativo | Assunto: ETP')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Estudo Técnico Preliminar', 'FULL_PDF', 'PENDING');

  -- 14. Termo de Referência
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Termo de Referência (TR)', 'tr', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 14, 'Disciplina: Direito Administrativo | Assunto: Termo de Referência')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Termo de Referência', 'FULL_PDF', 'PENDING');

  -- 15. Agentes públicos
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Agentes públicos', 'agentes-publicos', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 15, 'Disciplina: Direito Administrativo | Assunto: Agentes Públicos')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Agentes Públicos', 'FULL_PDF', 'PENDING');

  -- 16. Lei 8.112/1990
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Lei 8.112/1990', 'lei-8112-1990', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 16, 'Disciplina: Legislação Federal | Assunto: Lei 8.112/1990')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Lei 8.112/1990', 'FULL_PDF', 'PENDING');

  -- 17. Atos administrativos
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Atos administrativos', 'atos-administrativos', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 17, 'Disciplina: Direito Administrativo | Assunto: Atos Administrativos')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Atos Administrativos', 'FULL_PDF', 'PENDING');

  -- 18. Improbidade administrativa pós-Lei 14.230/2021
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Improbidade administrativa pós-Lei 14.230/2021', 'improbidade-administrativa', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 18, 'Disciplina: Direito Administrativo | Assunto: Improbidade Administrativa (Lei 8.429 / 14.230)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Improbidade Administrativa', 'FULL_PDF', 'PENDING');

  -- MEDIUM -> SIMPLIFIED_PDF
  -- 19. Organização administrativa
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Organização administrativa', 'organizacao-administrativa', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 19, 'Disciplina: Direito Administrativo | Assunto: Organização Administrativa')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Organização Administrativa', 'SIMPLIFIED_PDF', 'PENDING');

  -- 20. Responsabilidade civil do Estado
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Responsabilidade civil do Estado', 'responsabilidade-civil-estado', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 20, 'Disciplina: Direito Administrativo | Assunto: Responsabilidade Civil do Estado')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Responsabilidade Civil do Estado', 'SIMPLIFIED_PDF', 'PENDING');

  -- 21. Poderes administrativos
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Poderes administrativos', 'poderes-administrativos', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 21, 'Disciplina: Direito Administrativo | Assunto: Poderes da Administração')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Poderes Administrativos', 'SIMPLIFIED_PDF', 'PENDING');

  -- 22. Controle da Administração
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Controle da Administração Pública', 'controle-da-administracao', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 22, 'Disciplina: Direito Administrativo | Assunto: Controle da Administração')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Controle da Administração', 'SIMPLIFIED_PDF', 'PENDING');

  -- 23. LAI
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Lei de Acesso à Informação (LAI)', 'lai', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 23, 'Disciplina: Legislação Federal | Assunto: Lei 12.527/2011 (LAI)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — LAI', 'SIMPLIFIED_PDF', 'PENDING');

  -- 24. LGPD aplicada à Administração
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'LGPD aplicada à Administração Pública', 'lgpd-administracao', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 24, 'Disciplina: Legislação Federal | Assunto: Lei 13.709/2018 (LGPD)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — LGPD na Administração', 'SIMPLIFIED_PDF', 'PENDING');

  -- 25. Processo administrativo federal
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Processo administrativo federal (Lei 9.784/1999)', 'processo-administrativo-federal', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 25, 'Disciplina: Legislação Federal | Assunto: Lei 9.784/1999')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Processo Administrativo Federal', 'SIMPLIFIED_PDF', 'PENDING');

  -- LOW -> SUMMARY
  -- 26. Tópicos administrativos residuais do edital
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_adm_id, 'Tópicos administrativos residuais do edital', 'topicos-administrativos-residuais', 'LOW', 0.35, v_source, 'SUMMARY', 'NOT_STARTED', 26, 'Disciplina: Direito Administrativo | Assunto: Tópicos Residuais')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'Resumo — Tópicos Administrativos Residuais', 'SUMMARY', 'PENDING');

  -- =========================================================================
  -- 7. Topics: Tecnologia da Informação e Dados
  -- =========================================================================
  -- HIGH -> FULL_PDF
  -- 1. Microsoft 365 — visão geral
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Microsoft 365 — visão geral', 'ms-365-visao-geral', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 1, 'Disciplina: Informática | Assunto: Microsoft 365')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Microsoft 365 (Visão Geral)', 'FULL_PDF', 'PENDING');

  -- 2. Microsoft Word
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Microsoft Word', 'ms-word', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 2, 'Disciplina: Informática | Assunto: Microsoft Word')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Microsoft Word', 'FULL_PDF', 'PENDING');

  -- 3. Microsoft Excel
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Microsoft Excel', 'ms-excel', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 3, 'Disciplina: Informática | Assunto: Microsoft Excel')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Microsoft Excel', 'FULL_PDF', 'PENDING');

  -- 4. Microsoft PowerPoint
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Microsoft PowerPoint', 'ms-powerpoint', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 4, 'Disciplina: Informática | Assunto: Microsoft PowerPoint')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Microsoft PowerPoint', 'FULL_PDF', 'PENDING');

  -- 5. OneDrive
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'OneDrive', 'onedrive', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 5, 'Disciplina: Informática | Assunto: Armazenamento em Nuvem (OneDrive)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — OneDrive', 'FULL_PDF', 'PENDING');

  -- 6. Microsoft Teams
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Microsoft Teams', 'ms-teams', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 6, 'Disciplina: Informática | Assunto: Microsoft Teams')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Microsoft Teams', 'FULL_PDF', 'PENDING');

  -- 7. Colaboração, sincronização e permissões
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Colaboração, sincronização e permissões', 'colaboracao-sincronizacao-permissoes', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 7, 'Disciplina: Informática | Assunto: Ferramentas Colaborativas')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Colaboração e Sincronização', 'FULL_PDF', 'PENDING');

  -- 8. Segurança da informação
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Segurança da informação', 'seguranca-da-informacao', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 8, 'Disciplina: Informática | Assunto: Princípios da Segurança da Informação')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Segurança da Informação', 'FULL_PDF', 'PENDING');

  -- 9. Backup
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Backup e recuperação', 'backup', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 9, 'Disciplina: Informática | Assunto: Cópias de Segurança (Backup)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Backup e Recuperação', 'FULL_PDF', 'PENDING');

  -- 10. Vírus e worms
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Vírus e worms', 'virus-worms', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 10, 'Disciplina: Informática | Assunto: Vírus e Worms')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Vírus e Worms', 'FULL_PDF', 'PENDING');

  -- 11. Malware e ransomware
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Malware e ransomware', 'malware-ransomware', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 11, 'Disciplina: Informática | Assunto: Malware e Ransomware')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Malware e Ransomware', 'FULL_PDF', 'PENDING');

  -- 12. Phishing e pharming
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Phishing e pharming', 'phishing-pharming', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 12, 'Disciplina: Informática | Assunto: Golpes Eletrônicos (Phishing)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Phishing e Pharming', 'FULL_PDF', 'PENDING');

  -- 13. Firewall, antivírus e antispyware
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Firewall, antivírus e antispyware', 'firewall-antivirus-antispyware', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 13, 'Disciplina: Informática | Assunto: Mecanismos de Proteção')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Firewall, Antivírus e Proteção', 'FULL_PDF', 'PENDING');

  -- 14. Inteligência Artificial — conceitos básicos
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Inteligência Artificial — conceitos básicos', 'ia-conceitos-basicos', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 14, 'Disciplina: Inteligência Artificial | Assunto: Conceitos Fundamentais de IA')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Inteligência Artificial (Básico)', 'FULL_PDF', 'PENDING');

  -- 15. IA generativa
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'IA generativa', 'ia-generativa', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 15, 'Disciplina: Inteligência Artificial | Assunto: IA Generativa e LLMs')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — IA Generativa', 'FULL_PDF', 'PENDING');

  -- 16. Engenharia de prompts
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Engenharia de prompts', 'engenharia-de-prompts', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 16, 'Disciplina: Inteligência Artificial | Assunto: Engenharia de Prompts')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Engenharia de Prompts', 'FULL_PDF', 'PENDING');

  -- 17. Aprendizado supervisionado
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Aprendizado supervisionado', 'aprendizado-supervisionado', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 17, 'Disciplina: Machine Learning | Assunto: Aprendizado Supervisionado')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Aprendizado Supervisionado', 'FULL_PDF', 'PENDING');

  -- 18. Aprendizado não supervisionado
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Aprendizado não supervisionado', 'aprendizado-nao-supervisionado', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 18, 'Disciplina: Machine Learning | Assunto: Aprendizado Não Supervisionado')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Aprendizado Não Supervisionado', 'FULL_PDF', 'PENDING');

  -- 19. Aprendizado por reforço
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Aprendizado por reforço', 'aprendizado-por-reforco', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 19, 'Disciplina: Machine Learning | Assunto: Aprendizado por Reforço')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Aprendizado por Reforço', 'FULL_PDF', 'PENDING');

  -- 20. Casos de uso de IA
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Casos de uso de IA no setor público', 'casos-de-uso-de-ia', 'HIGH', 1.0, v_source, 'FULL_PDF', 'NOT_STARTED', 20, 'Disciplina: Inteligência Artificial | Assunto: Casos de Uso')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF completo — Casos de Uso de IA', 'FULL_PDF', 'PENDING');

  -- MEDIUM -> SIMPLIFIED_PDF
  -- 21. Conceitos de dados e informação
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Conceitos de dados e informação', 'conceitos-dados-informacao', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 21, 'Disciplina: Ciência de Dados | Assunto: Dados e Informação')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Dados e Informação', 'SIMPLIFIED_PDF', 'PENDING');

  -- 22. Qualidade e transformação de dados
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Qualidade e transformação de dados', 'qualidade-transformacao-dados', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 22, 'Disciplina: Ciência de Dados | Assunto: Qualidade de Dados')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Qualidade de Dados', 'SIMPLIFIED_PDF', 'PENDING');

  -- 23. Métricas
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Métricas e indicadores', 'metricas', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 23, 'Disciplina: Ciência de Dados | Assunto: Métricas e Indicadores')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Métricas e Indicadores', 'SIMPLIFIED_PDF', 'PENDING');

  -- 24. Visualização de dados
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Visualização de dados', 'visualizacao-de-dados', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 24, 'Disciplina: Ciência de Dados | Assunto: Visualização de Dados')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Visualização de Dados', 'SIMPLIFIED_PDF', 'PENDING');

  -- 25. Gráficos de barras
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Gráficos de barras e colunas', 'graficos-de-barras', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 25, 'Disciplina: Ciência de Dados | Assunto: Gráficos de Barras')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Gráficos de Barras', 'SIMPLIFIED_PDF', 'PENDING');

  -- 26. Gráficos de linha
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Gráficos de linha', 'graficos-de-linha', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 26, 'Disciplina: Ciência de Dados | Assunto: Séries Temporais e Linhas')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Gráficos de Linha', 'SIMPLIFIED_PDF', 'PENDING');

  -- 27. Histograma
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Histograma', 'histograma', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 27, 'Disciplina: Estatística e Dados | Assunto: Histogramas')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Histograma', 'SIMPLIFIED_PDF', 'PENDING');

  -- 28. Dispersão
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Gráfico de dispersão', 'dispersao', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 28, 'Disciplina: Estatística e Dados | Assunto: Gráficos de Dispersão')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Dispersão', 'SIMPLIFIED_PDF', 'PENDING');

  -- 29. Box plot
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Box plot', 'box-plot', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 29, 'Disciplina: Estatística e Dados | Assunto: Diagrama de Caixa (Boxplot)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Box Plot', 'SIMPLIFIED_PDF', 'PENDING');

  -- 30. Power BI
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Power BI', 'power-bi', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 30, 'Disciplina: BI | Assunto: Power BI')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Power BI', 'SIMPLIFIED_PDF', 'PENDING');

  -- 31. Tableau
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Tableau', 'tableau', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 31, 'Disciplina: BI | Assunto: Tableau')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Tableau', 'SIMPLIFIED_PDF', 'PENDING');

  -- 32. Data Studio / Looker Studio
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Looker Studio / Data Studio', 'looker-studio', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 32, 'Disciplina: BI | Assunto: Looker Studio')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Looker Studio', 'SIMPLIFIED_PDF', 'PENDING');

  -- 33. Storytelling com dados
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Storytelling com dados', 'storytelling-com-dados', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 33, 'Disciplina: BI | Assunto: Storytelling com Dados')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Storytelling com Dados', 'SIMPLIFIED_PDF', 'PENDING');

  -- 34. Redes
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Redes de computadores — visão geral', 'redes-visao-geral', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 34, 'Disciplina: Redes | Assunto: Redes de Computadores')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Redes', 'SIMPLIFIED_PDF', 'PENDING');

  -- 35. Internet e intranet
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Internet e intranet', 'internet-intranet', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 35, 'Disciplina: Redes | Assunto: Internet e Intranet')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Internet e Intranet', 'SIMPLIFIED_PDF', 'PENDING');

  -- 36. Protocolos e serviços de rede
  INSERT INTO public.topics (user_id, exam_id, subject_id, name, slug, priority, priority_weight, priority_source, recommended_material_type, status, display_order, tec_filter_hint)
  VALUES (p_user_id, v_exam_id, v_sub_ti_id, 'Protocolos e serviços de rede', 'protocolos-e-servicos', 'MEDIUM', 0.65, v_source, 'SIMPLIFIED_PDF', 'NOT_STARTED', 36, 'Disciplina: Redes | Assunto: Protocolos e Serviços (TCP/IP, HTTP, DNS)')
  RETURNING id INTO v_topic_id;
  INSERT INTO public.study_materials (user_id, topic_id, title, material_type, status)
  VALUES (p_user_id, v_topic_id, 'PDF simplificado — Protocolos de Rede', 'SIMPLIFIED_PDF', 'PENDING');

  RETURN v_exam_id;
END;
$$;
