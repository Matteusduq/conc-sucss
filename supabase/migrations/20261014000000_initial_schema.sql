-- Migration: 20261014000000_initial_schema.sql
-- Description: Core schema for Câmara dos Deputados Study System

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  timezone text DEFAULT 'America/Sao_Paulo',
  weekly_study_target_minutes integer DEFAULT 1080,
  daily_memory_target_minutes integer DEFAULT 25,
  desired_retention numeric DEFAULT 0.90,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. EXAMS
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  institution text NOT NULL,
  role text NOT NULL,
  exam_board text NOT NULL,
  exam_date date NOT NULL,
  question_model text NOT NULL DEFAULT 'Certo / Errado',
  correct_points numeric NOT NULL DEFAULT 1,
  wrong_points numeric NOT NULL DEFAULT -1,
  blank_points numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  target_hours numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  priority text NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  priority_label text,
  priority_weight numeric NOT NULL DEFAULT 1.0,
  priority_source text,
  recommended_material_type text NOT NULL CHECK (recommended_material_type IN ('FULL_PDF', 'SIMPLIFIED_PDF', 'SUMMARY')),
  status text NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'LEARNING', 'AWAITING_QUESTIONS', 'CONSOLIDATING', 'MASTERED', 'MAINTENANCE', 'AT_RISK')),
  display_order integer NOT NULL DEFAULT 1,
  estimated_minutes integer,
  domain_score numeric,
  domain_confidence text CHECK (domain_confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  study_score numeric NOT NULL DEFAULT 0,
  last_studied_at timestamptz,
  next_recommended_at timestamptz,
  tec_filter_hint text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. STUDY MATERIALS
CREATE TABLE IF NOT EXISTS public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  material_type text NOT NULL CHECK (material_type IN ('FULL_PDF', 'SIMPLIFIED_PDF', 'SUMMARY')),
  storage_path text,
  file_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  page_count integer,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AVAILABLE', 'ARCHIVED')),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. MATERIAL PROGRESS
CREATE TABLE IF NOT EXISTS public.material_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  current_page integer NOT NULL DEFAULT 1,
  max_page_reached integer NOT NULL DEFAULT 1,
  progress_percent numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  completed_at timestamptz,
  total_study_seconds bigint NOT NULL DEFAULT 0,
  notes_by_page jsonb NOT NULL DEFAULT '{}'::jsonb,
  bookmarks integer[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_user_material UNIQUE (user_id, material_id)
);

-- 7. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  material_id uuid REFERENCES public.study_materials(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('MATERIAL', 'MEMORY', 'REVIEW', 'TEC_QUESTIONS', 'MOCK_EXAM', 'OTHER')),
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_seconds integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 8. QUESTION SESSIONS (TEC Concursos integration)
CREATE TABLE IF NOT EXISTS public.question_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  performed_at timestamptz NOT NULL DEFAULT now(),
  total_questions integer NOT NULL,
  correct integer NOT NULL,
  wrong integer NOT NULL,
  blank integer NOT NULL,
  duration_seconds integer,
  subjective_feeling text NOT NULL CHECK (subjective_feeling IN ('MASTERED', 'REASONABLE', 'UNSURE', 'VERY_WEAK')),
  notes text,
  accuracy_rate numeric NOT NULL,
  net_points numeric NOT NULL,
  net_rate numeric NOT NULL,
  had_conceptual_error boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chk_questions_total CHECK (correct + wrong + blank = total_questions)
);

-- 9. ERROR LOGS (Caderno de Erros)
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  question_session_id uuid REFERENCES public.question_sessions(id) ON DELETE SET NULL,
  error_type text NOT NULL CHECK (error_type IN (
    'CONTENT_UNKNOWN', 'CONCEPT_CONFUSION', 'EXCEPTION_FORGOTTEN',
    'COMPETENCE_SWAP', 'ABSOLUTE_WORD_TRAP', 'INTERPRETATION',
    'REWRITE_MEANING', 'INATTENTION', 'LAW_OR_CASELAW', 'GUESS', 'OTHER'
  )),
  summary text NOT NULL,
  correct_rule text,
  personal_note text,
  severity text NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. FLASHCARDS
CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  card_type text NOT NULL CHECK (card_type IN ('CONTENT', 'ERROR', 'COMPARISON', 'RULE', 'CEBRASPE_TRUE_FALSE')),
  front text NOT NULL,
  back text NOT NULL,
  source_type text NOT NULL DEFAULT 'MANUAL' CHECK (source_type IN ('MANUAL', 'MATERIAL', 'ERROR_LOG', 'AI_GENERATED')),
  source_material_id uuid REFERENCES public.study_materials(id) ON DELETE SET NULL,
  source_error_id uuid REFERENCES public.error_logs(id) ON DELETE SET NULL,
  exam_priority text NOT NULL DEFAULT 'MEDIUM' CHECK (exam_priority IN ('HIGH', 'MEDIUM', 'LOW')),
  priority_boost numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. FLASHCARD FSRS STATE
CREATE TABLE IF NOT EXISTS public.flashcard_fsrs_state (
  flashcard_id uuid PRIMARY KEY REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due timestamptz NOT NULL,
  stability numeric NOT NULL DEFAULT 0,
  difficulty numeric NOT NULL DEFAULT 0,
  elapsed_days integer NOT NULL DEFAULT 0,
  scheduled_days integer NOT NULL DEFAULT 0,
  learning_steps integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  state integer NOT NULL DEFAULT 0,
  last_review timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- 12. FLASHCARD REVIEWS
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  rating text NOT NULL CHECK (rating IN ('AGAIN', 'HARD', 'GOOD', 'EASY')),
  response_time_ms integer,
  state_before jsonb NOT NULL,
  state_after jsonb NOT NULL,
  fsrs_log jsonb,
  created_at timestamptz DEFAULT now()
);

-- 13. USER STUDY SETTINGS
CREATE TABLE IF NOT EXISTS public.user_study_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_high_questions integer NOT NULL DEFAULT 30,
  default_medium_questions integer NOT NULL DEFAULT 20,
  default_low_questions integer NOT NULL DEFAULT 15,
  memory_daily_minutes integer NOT NULL DEFAULT 25,
  desired_retention numeric NOT NULL DEFAULT 0.90,
  today_available_minutes integer,
  updated_at timestamptz DEFAULT now()
);

-- 14. MOCK EXAMS (Simulados)
CREATE TABLE IF NOT EXISTS public.mock_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  performed_at timestamptz NOT NULL DEFAULT now(),
  total_questions integer NOT NULL,
  correct integer NOT NULL,
  wrong integer NOT NULL,
  blank integer NOT NULL,
  net_points numeric NOT NULL,
  duration_seconds integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 15. STUDY EVENTS
CREATE TABLE IF NOT EXISTS public.study_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 16. AI INSIGHTS (Future-proof)
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('WEEKLY_ANALYSIS', 'ERROR_ANALYSIS', 'STUDY_RECOMMENDATION', 'OTHER')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider text,
  model text,
  generated_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_exams_user ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_exam ON public.subjects(exam_id, user_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.topics(subject_id, user_id);
CREATE INDEX IF NOT EXISTS idx_topics_priority ON public.topics(priority);
CREATE INDEX IF NOT EXISTS idx_topics_status ON public.topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_study_score ON public.topics(study_score DESC);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic ON public.study_materials(topic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_material_progress_user ON public.material_progress(user_id, material_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_sessions_topic ON public.question_sessions(topic_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_sessions_user ON public.question_sessions(user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_topic ON public.error_logs(topic_id, error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashcards_topic ON public.flashcards(topic_id, active);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON public.flashcards(user_id, active);
CREATE INDEX IF NOT EXISTS idx_fsrs_state_due ON public.flashcard_fsrs_state(user_id, due ASC);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user ON public.flashcard_reviews(user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_events_user ON public.study_events(user_id, created_at DESC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_fsrs_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_study_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Exams
CREATE POLICY "exams_all_own" ON public.exams FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subjects
CREATE POLICY "subjects_all_own" ON public.subjects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Topics
CREATE POLICY "topics_all_own" ON public.topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Materials
CREATE POLICY "study_materials_all_own" ON public.study_materials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Material Progress
CREATE POLICY "material_progress_all_own" ON public.material_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Sessions
CREATE POLICY "study_sessions_all_own" ON public.study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Question Sessions
CREATE POLICY "question_sessions_all_own" ON public.question_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Error Logs
CREATE POLICY "error_logs_all_own" ON public.error_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Flashcards
CREATE POLICY "flashcards_all_own" ON public.flashcards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Flashcard FSRS State
CREATE POLICY "fsrs_state_all_own" ON public.flashcard_fsrs_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Flashcard Reviews
CREATE POLICY "reviews_all_own" ON public.flashcard_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Study Settings
CREATE POLICY "user_settings_all_own" ON public.user_study_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mock Exams
CREATE POLICY "mock_exams_all_own" ON public.mock_exams FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Events
CREATE POLICY "study_events_all_own" ON public.study_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI Insights
CREATE POLICY "ai_insights_all_own" ON public.ai_insights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
