-- Migration: 20261014000002_complete_exam_structure.sql
-- Description: Structural exam alignment with P1, P2, P3, SyllabusItems and Discursive Sessions

-- 1. EXAM METADATA EXPANSION
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS objective_duration_minutes integer DEFAULT 300,
  ADD COLUMN IF NOT EXISTS discursive_duration_minutes integer DEFAULT 180,
  ADD COLUMN IF NOT EXISTS p1_items integer DEFAULT 90,
  ADD COLUMN IF NOT EXISTS p2_items integer DEFAULT 90,
  ADD COLUMN IF NOT EXISTS p1_min_points numeric DEFAULT 18,
  ADD COLUMN IF NOT EXISTS p2_min_points numeric DEFAULT 27,
  ADD COLUMN IF NOT EXISTS objective_total_min_points numeric DEFAULT 54,
  ADD COLUMN IF NOT EXISTS p3_max_points numeric DEFAULT 60,
  ADD COLUMN IF NOT EXISTS p3_min_points numeric DEFAULT 30,
  ADD COLUMN IF NOT EXISTS official_notice_date date DEFAULT '2026-10-02';

-- 2. EXAM BLOCKS
CREATE TABLE IF NOT EXISTS public.exam_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  code text NOT NULL CHECK (code IN ('P1', 'P2', 'P3')),
  name text NOT NULL,
  block_type text NOT NULL CHECK (block_type IN ('OBJECTIVE', 'DISCURSIVE')),
  total_items integer,
  max_points numeric NOT NULL,
  minimum_points numeric,
  duration_minutes integer,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_exam_block UNIQUE(exam_id, code)
);

-- 3. EXPAND SUBJECTS WITH EXAM BLOCK REFERENCES
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS exam_block_id uuid REFERENCES public.exam_blocks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS exam_block_code text CHECK (exam_block_code IN ('P1', 'P2', 'P3'));

-- 4. EXPAND TOPICS WITH BLOCK, PRIORITY BASIS AND CROSS RELEVANCE
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS exam_block_id uuid REFERENCES public.exam_blocks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS exam_block_code text CHECK (exam_block_code IN ('P1', 'P2')),
  ADD COLUMN IF NOT EXISTS priority_basis text CHECK (priority_basis IN ('RESEARCH_AND_EDITAL', 'EDITAL_AND_ROLE', 'EDITAL_ONLY', 'USER_OVERRIDE')),
  ADD COLUMN IF NOT EXISTS priority_confidence text CHECK (priority_confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  ADD COLUMN IF NOT EXISTS cross_relevance text CHECK (cross_relevance IN ('NONE', 'P1_P2', 'P2_P3', 'P1_P2_P3')),
  ADD COLUMN IF NOT EXISTS is_discursive_relevant boolean NOT NULL DEFAULT false;

-- 5. SYLLABUS ITEMS (OFFICIAL EDITAL ITEMS)
CREATE TABLE IF NOT EXISTS public.syllabus_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_block_id uuid NOT NULL REFERENCES public.exam_blocks(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_item_id uuid REFERENCES public.syllabus_items(id) ON DELETE SET NULL,
  official_code text,
  official_text text NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. TOPIC <-> SYLLABUS ITEM LINK TABLE (MANY-TO-MANY)
CREATE TABLE IF NOT EXISTS public.topic_syllabus_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  syllabus_item_id uuid NOT NULL REFERENCES public.syllabus_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_topic_syllabus_item UNIQUE(topic_id, syllabus_item_id)
);

-- 7. DISCURSIVE SESSIONS (P3 PRACTICE ENGINE)
CREATE TABLE IF NOT EXISTS public.discursive_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('QUESTION_20_LINES', 'TECHNICAL_PIECE_50_LINES')),
  performed_at timestamptz NOT NULL DEFAULT now(),
  title text,
  prompt_summary text,
  related_subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  related_topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  duration_seconds integer,
  lines_written integer NOT NULL CHECK (lines_written > 0),
  content_score numeric NOT NULL CHECK (content_score >= 0),
  language_errors integer NOT NULL DEFAULT 0 CHECK (language_errors >= 0),
  calculated_score numeric NOT NULL DEFAULT 0 CHECK (calculated_score >= 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. INDEXES FOR HIGH QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_exam_blocks_user ON public.exam_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_blocks_exam ON public.exam_blocks(exam_id);
CREATE INDEX IF NOT EXISTS idx_subjects_block ON public.subjects(exam_block_id);
CREATE INDEX IF NOT EXISTS idx_topics_block ON public.topics(exam_block_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_items_subject ON public.syllabus_items(subject_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_items_block ON public.syllabus_items(exam_block_id);
CREATE INDEX IF NOT EXISTS idx_topic_syllabus_topic ON public.topic_syllabus_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_syllabus_item ON public.topic_syllabus_items(syllabus_item_id);
CREATE INDEX IF NOT EXISTS idx_discursive_sessions_user ON public.discursive_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_discursive_sessions_exam ON public.discursive_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_discursive_sessions_date ON public.discursive_sessions(performed_at DESC);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.exam_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_syllabus_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discursive_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_blocks_owner_all"
  ON public.exam_blocks
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "syllabus_items_owner_all"
  ON public.syllabus_items
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "topic_syllabus_items_owner_all"
  ON public.topic_syllabus_items
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "discursive_sessions_owner_all"
  ON public.discursive_sessions
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
