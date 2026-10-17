-- ============================================================================
-- INITIAL PRODUCTION SCHEMA — CONSOLIDATED MIGRATION
-- Concurso: Câmara dos Deputados — Analista Legislativo: Registro e Redação (2026/2027)
-- Estrutura: Multi-tenant rigoroso por auth.uid() com composite keys (user_id, id)
-- ============================================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  weekly_study_target_minutes integer NOT NULL DEFAULT 1200,
  daily_memory_target_minutes integer NOT NULL DEFAULT 20,
  desired_retention numeric(4,2) NOT NULL DEFAULT 0.90,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. EXAMS
CREATE TABLE IF NOT EXISTS public.exams (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  institution text NOT NULL,
  role text NOT NULL,
  exam_board text NOT NULL,
  exam_date date NOT NULL,
  question_model text NOT NULL,
  correct_points numeric(4,2) NOT NULL DEFAULT 1,
  wrong_points numeric(4,2) NOT NULL DEFAULT -1,
  blank_points numeric(4,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  objective_duration_minutes integer DEFAULT 300,
  discursive_duration_minutes integer DEFAULT 180,
  p1_items integer DEFAULT 90,
  p2_items integer DEFAULT 90,
  p1_min_points numeric(4,2) DEFAULT 18,
  p2_min_points numeric(4,2) DEFAULT 27,
  objective_total_min_points numeric(4,2) DEFAULT 54,
  p3_max_points numeric(4,2) DEFAULT 60,
  p3_min_points numeric(4,2) DEFAULT 30,
  official_notice_date date DEFAULT '2026-10-02',
  tiebreaker_rules text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- 3. EXAM BLOCKS
CREATE TABLE IF NOT EXISTS public.exam_blocks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  code text NOT NULL CHECK (code IN ('P1', 'P2', 'P3')),
  name text NOT NULL,
  block_type text NOT NULL CHECK (block_type IN ('OBJECTIVE', 'DISCURSIVE')),
  total_items integer NULL, -- P3 é discursiva e não possui total_items de questões objetivas
  max_points numeric(6,2) NOT NULL,
  minimum_points numeric(6,2),
  duration_minutes integer,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_exam_blocks_code UNIQUE (user_id, exam_id, code),
  CONSTRAINT chk_exam_blocks_items CHECK (
    (block_type = 'OBJECTIVE' AND total_items IS NOT NULL) OR
    (block_type = 'DISCURSIVE')
  )
);

-- 4. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  exam_block_id text NOT NULL,
  exam_block_code text NOT NULL CHECK (exam_block_code IN ('P1', 'P2', 'P3')),
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  target_hours numeric(5,2) DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, exam_block_id) REFERENCES public.exam_blocks(user_id, id) ON DELETE CASCADE
);

-- 5. TOPICS (76 Topics com starter_rank e metadados Cebraspe)
CREATE TABLE IF NOT EXISTS public.topics (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  subject_id text NOT NULL,
  exam_block_id text NOT NULL,
  exam_block_code text CHECK (exam_block_code IN ('P1', 'P2')),
  parent_topic_id text,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  priority_label text,
  priority_weight numeric(4,2) DEFAULT 1.0,
  priority_source text,
  priority_basis text,
  priority_confidence text DEFAULT 'MEDIUM',
  cross_relevance text NOT NULL DEFAULT 'NONE' CHECK (cross_relevance IN ('NONE', 'P1_P2', 'P2_P3', 'P1_P2_P3')),
  discursive_eligible boolean DEFAULT false,
  is_discursive_relevant boolean DEFAULT false,
  discursive_synergy text DEFAULT 'NONE',
  recommended_material_type text DEFAULT 'SIMPLIFIED_PDF',
  status text NOT NULL DEFAULT 'NOT_STARTED',
  display_order integer NOT NULL DEFAULT 0,
  estimated_minutes integer DEFAULT 60,
  domain_score numeric(5,2),
  domain_confidence text DEFAULT 'NONE',
  study_score numeric(5,2) DEFAULT 50.0,
  starter_rank integer,
  last_studied_at timestamptz,
  next_recommended_at timestamptz,
  tec_filter_hint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, subject_id) REFERENCES public.subjects(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, exam_block_id) REFERENCES public.exam_blocks(user_id, id) ON DELETE CASCADE
);

-- 6. SYLLABUS ITEMS (182 Itens oficiais do edital Cebraspe)
CREATE TABLE IF NOT EXISTS public.syllabus_items (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  exam_block_id text NOT NULL,
  subject_id text NOT NULL,
  parent_item_id text,
  official_code text,
  official_text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, exam_block_id) REFERENCES public.exam_blocks(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, subject_id) REFERENCES public.subjects(user_id, id) ON DELETE CASCADE
);

-- 7. TOPIC SYLLABUS ITEMS (Mapeamento N:M)
CREATE TABLE IF NOT EXISTS public.topic_syllabus_items (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  syllabus_item_id text NOT NULL,
  PRIMARY KEY (user_id, topic_id, syllabus_item_id),
  FOREIGN KEY (user_id, topic_id) REFERENCES public.topics(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, syllabus_item_id) REFERENCES public.syllabus_items(user_id, id) ON DELETE CASCADE
);

-- 8. STUDY MATERIALS
CREATE TABLE IF NOT EXISTS public.study_materials (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  topic_id text NOT NULL,
  title text NOT NULL,
  material_type text NOT NULL,
  storage_path text,
  file_url text,
  file_name text,
  mime_type text,
  file_size integer,
  page_count integer,
  status text NOT NULL DEFAULT 'PENDING',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, topic_id) REFERENCES public.topics(user_id, id) ON DELETE CASCADE
);

-- 9. MATERIAL PROGRESS
CREATE TABLE IF NOT EXISTS public.material_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  material_id text NOT NULL,
  topic_id text NOT NULL,
  current_page integer NOT NULL DEFAULT 1,
  max_page_reached integer NOT NULL DEFAULT 1,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  completed_at timestamptz,
  total_study_seconds integer NOT NULL DEFAULT 0,
  notes_by_page jsonb NOT NULL DEFAULT '{}'::jsonb,
  bookmarks integer[] NOT NULL DEFAULT '{}'::integer[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, material_id) REFERENCES public.study_materials(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, topic_id) REFERENCES public.topics(user_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_material_progress UNIQUE (user_id, material_id)
);

-- 10. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  subject_id text NOT NULL,
  topic_id text,
  material_id text,
  session_type text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_seconds integer NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE
);

-- 11. QUESTION SESSIONS
CREATE TABLE IF NOT EXISTS public.question_sessions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  subject_id text NOT NULL,
  topic_id text NOT NULL,
  performed_at timestamptz NOT NULL,
  total_questions integer NOT NULL,
  correct integer NOT NULL,
  wrong integer NOT NULL,
  blank integer NOT NULL,
  duration_seconds integer,
  subjective_feeling text,
  notes text,
  accuracy_rate numeric(5,2) NOT NULL,
  net_points numeric(6,2) NOT NULL,
  net_rate numeric(5,2) NOT NULL,
  had_conceptual_error boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, topic_id) REFERENCES public.topics(user_id, id) ON DELETE CASCADE,
  CONSTRAINT chk_question_session_counts CHECK (correct + wrong + blank = total_questions)
);

-- 12. ERROR LOGS
CREATE TABLE IF NOT EXISTS public.error_logs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  subject_id text NOT NULL,
  topic_id text NOT NULL,
  question_session_id text,
  error_type text NOT NULL,
  summary text NOT NULL,
  correct_rule text, -- Nullable conforme domínio (opcional pelo aluno no formulário)
  personal_note text,
  severity text NOT NULL DEFAULT 'MEDIUM',
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, topic_id) REFERENCES public.topics(user_id, id) ON DELETE CASCADE
);

-- 13. FLASHCARDS
CREATE TABLE IF NOT EXISTS public.flashcards (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  subject_id text NOT NULL,
  topic_id text NOT NULL,
  card_type text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  source_type text NOT NULL DEFAULT 'MANUAL',
  source_material_id text,
  source_error_id text,
  exam_priority text NOT NULL DEFAULT 'MEDIUM',
  priority_boost numeric(4,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, topic_id) REFERENCES public.topics(user_id, id) ON DELETE CASCADE
);

-- 14. FLASHCARD FSRS STATE
CREATE TABLE IF NOT EXISTS public.flashcard_fsrs_state (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id text NOT NULL,
  due timestamptz NOT NULL,
  stability numeric(10,4) NOT NULL,
  difficulty numeric(10,4) NOT NULL,
  elapsed_days integer NOT NULL,
  scheduled_days integer NOT NULL,
  learning_steps integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  state integer NOT NULL DEFAULT 0,
  last_review timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, flashcard_id),
  FOREIGN KEY (user_id, flashcard_id) REFERENCES public.flashcards(user_id, id) ON DELETE CASCADE
);

-- 15. FLASHCARD REVIEWS
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  flashcard_id text NOT NULL,
  reviewed_at timestamptz NOT NULL,
  rating text NOT NULL CHECK (rating IN ('AGAIN', 'HARD', 'GOOD', 'EASY')),
  response_time_ms integer,
  state_before jsonb NOT NULL,
  state_after jsonb NOT NULL,
  fsrs_log jsonb,
  was_due_at_review boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, flashcard_id) REFERENCES public.flashcards(user_id, id) ON DELETE CASCADE
);

-- 16. DISCURSIVE SESSIONS (P3)
CREATE TABLE IF NOT EXISTS public.discursive_sessions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  type text NOT NULL,
  performed_at timestamptz NOT NULL,
  title text,
  prompt_summary text,
  related_subject_id text,
  related_topic_id text,
  duration_seconds integer,
  lines_written integer NOT NULL,
  content_score numeric(5,2) NOT NULL,
  language_errors integer NOT NULL DEFAULT 0,
  calculated_score numeric(5,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE,
  CONSTRAINT chk_discursive_lines CHECK (lines_written >= 0 AND lines_written <= 50)
);

-- 17. USER STUDY SETTINGS
CREATE TABLE IF NOT EXISTS public.user_study_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_study_target_minutes integer NOT NULL DEFAULT 1200,
  default_high_questions integer NOT NULL DEFAULT 20,
  default_medium_questions integer NOT NULL DEFAULT 15,
  default_low_questions integer NOT NULL DEFAULT 10,
  memory_daily_minutes integer NOT NULL DEFAULT 20,
  desired_retention numeric(4,2) NOT NULL DEFAULT 0.90,
  today_available_minutes integer,
  gamification_show_animations boolean NOT NULL DEFAULT true,
  gamification_show_xp_toast boolean NOT NULL DEFAULT true,
  gamification_show_streak boolean NOT NULL DEFAULT true,
  gamification_weekly_target_days integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 18. MOCK EXAMS
CREATE TABLE IF NOT EXISTS public.mock_exams (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  exam_id text NOT NULL,
  type text NOT NULL,
  performed_at timestamptz NOT NULL,
  total_questions integer NOT NULL,
  correct integer NOT NULL,
  wrong integer NOT NULL,
  blank integer NOT NULL,
  net_points numeric(6,2) NOT NULL,
  p1_correct integer NOT NULL,
  p1_wrong integer NOT NULL,
  p1_blank integer NOT NULL,
  p1_net numeric(6,2) NOT NULL,
  p2_correct integer NOT NULL,
  p2_wrong integer NOT NULL,
  p2_blank integer NOT NULL,
  p2_net numeric(6,2) NOT NULL,
  duration_seconds integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, exam_id) REFERENCES public.exams(user_id, id) ON DELETE CASCADE
);

-- 19. STUDY EVENTS
CREATE TABLE IF NOT EXISTS public.study_events (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- 20. GAMIFICATION PROFILES
CREATE TABLE IF NOT EXISTS public.gamification_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  meaningful_days integer NOT NULL DEFAULT 0,
  last_meaningful_study_date text,
  weekly_consistency_days integer NOT NULL DEFAULT 0,
  current_week_start text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 21. XP TRANSACTIONS (Com unique de idempotência)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  amount integer NOT NULL,
  rule_id text NOT NULL,
  source_event_id text NOT NULL,
  source_type text NOT NULL,
  source_entity_id text,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  CONSTRAINT uq_xp_transactions_idempotency UNIQUE (user_id, rule_id, source_event_id)
);

-- 22. DAILY MISSIONS (Chave única composta para evitar duplicações no reload)
CREATE TABLE IF NOT EXISTS public.daily_missions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  date text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  topic_id text,
  subject_id text,
  target_value integer NOT NULL,
  current_value integer NOT NULL DEFAULT 0,
  unit text NOT NULL,
  xp_reward integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  reason text NOT NULL,
  source text NOT NULL,
  is_main boolean NOT NULL DEFAULT false,
  is_executable boolean NOT NULL DEFAULT true,
  cta_url text,
  cta_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (user_id, id),
  CONSTRAINT uq_daily_missions_date_id UNIQUE (user_id, date, id)
);

-- 23. USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  xp_reward integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, achievement_id)
);

-- 24. USER MIGRATIONS (Rastreamento de migrações e bootstrap idempotente)
CREATE TABLE IF NOT EXISTS public.user_migrations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  migration_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_id, migration_key)
);

-- 25. AI INSIGHTS
CREATE TABLE IF NOT EXISTS public.ai_insights (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL,
  topic_id text,
  type text NOT NULL,
  insight text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- ============================================================================
-- INDEXES DE DESEMPENHO E CONSULTAS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_exams_user ON public.exams (user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_user_exam ON public.exam_blocks (user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_exam ON public.subjects (user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_subject ON public.topics (user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_status ON public.topics (user_id, status);
CREATE INDEX IF NOT EXISTS idx_topics_user_priority ON public.topics (user_id, priority);
CREATE INDEX IF NOT EXISTS idx_topics_user_starter_rank ON public.topics (user_id, starter_rank);
CREATE INDEX IF NOT EXISTS idx_syllabus_user_subject ON public.syllabus_items (user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_topic ON public.study_materials (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_mat_prog_user_topic ON public.material_progress (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_perf ON public.study_sessions (user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_question_sessions_user_topic ON public.question_sessions (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_question_sessions_user_date ON public.question_sessions (user_id, performed_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_topic ON public.error_logs (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_topic ON public.flashcards (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_fsrs_user_due ON public.flashcard_fsrs_state (user_id, due);
CREATE INDEX IF NOT EXISTS idx_reviews_user_card ON public.flashcard_reviews (user_id, flashcard_id);
CREATE INDEX IF NOT EXISTS idx_discursive_user_date ON public.discursive_sessions (user_id, performed_at);
CREATE INDEX IF NOT EXISTS idx_mock_exams_user_date ON public.mock_exams (user_id, performed_at);
CREATE INDEX IF NOT EXISTS idx_missions_user_date ON public.daily_missions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_xp_tx_user_rule ON public.xp_transactions (user_id, rule_id);
CREATE INDEX IF NOT EXISTS idx_events_user_type ON public.study_events (user_id, event_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================================

-- Tabela Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING ((select auth.uid()) = id);

-- Macro de RLS para tabelas com user_id
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'exams', 'exam_blocks', 'subjects', 'topics', 'syllabus_items',
    'topic_syllabus_items', 'study_materials', 'material_progress',
    'study_sessions', 'question_sessions', 'error_logs', 'flashcards',
    'flashcard_fsrs_state', 'flashcard_reviews', 'discursive_sessions',
    'user_study_settings', 'mock_exams', 'study_events', 'gamification_profiles',
    'xp_transactions', 'daily_missions', 'user_achievements', 'user_migrations',
    'ai_insights'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    EXECUTE format('
      CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING ((select auth.uid()) = user_id);
    ', tbl || '_select_own', tbl);

    EXECUTE format('
      CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
    ', tbl || '_insert_own', tbl);

    EXECUTE format('
      CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
    ', tbl || '_update_own', tbl);

    EXECUTE format('
      CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
      USING ((select auth.uid()) = user_id);
    ', tbl || '_delete_own', tbl);
  END LOOP;
END $$;

-- ============================================================================
-- PERMISSÕES / GRANTS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- ============================================================================
-- STORAGE CONFIGURATION (Bucket study-materials privado)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-materials',
  'study-materials',
  false,
  52428800, -- 50 MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Storage Policies on storage.objects for study-materials bucket
CREATE POLICY "study_materials_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'study-materials'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "study_materials_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'study-materials'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "study_materials_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'study-materials'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'study-materials'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "study_materials_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'study-materials'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
