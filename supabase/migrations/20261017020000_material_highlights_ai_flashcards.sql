-- ============================================================================
-- MIGRATION: Material Highlights & AI Flashcards Integration
-- Date: 2026-10-17
-- Description:
-- 1. Cria a tabela public.material_highlights com suporte a ancoragem de texto,
--    coordenadas normalizadas, metadados de IA e rastreabilidade pedagógica.
-- 2. Altera a tabela public.flashcards adicionando source_highlight_id e explanation
--    com FK composta ON DELETE SET NULL e índice único parcial.
-- 3. Habilita RLS estrito em material_highlights (auth.uid() = user_id).
-- ============================================================================

-- 1. Criação da tabela public.material_highlights
CREATE TABLE IF NOT EXISTS public.material_highlights (
  user_id uuid NOT NULL,
  id text NOT NULL,
  material_id text NOT NULL,
  topic_id text NOT NULL,
  page_number integer NOT NULL CHECK (page_number > 0),
  material_version integer NOT NULL DEFAULT 1,

  selected_text text NOT NULL,
  context_before text NULL,
  context_after text NULL,

  quote_prefix text NULL,
  quote_suffix text NULL,
  text_start_offset integer NULL,
  text_end_offset integer NULL,

  rects jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text NOT NULL DEFAULT 'YELLOW' CHECK (color IN ('YELLOW', 'GREEN', 'BLUE', 'PINK', 'PURPLE')),

  ai_status text NOT NULL DEFAULT 'NOT_REQUESTED' CHECK (ai_status IN ('NOT_REQUESTED', 'GENERATING', 'READY', 'NOT_RECOMMENDED', 'FAILED')),
  ai_explanation text NULL,
  ai_key_point text NULL,
  ai_cebraspe_trap text NULL,
  ai_flashcard_draft jsonb NULL,
  ai_provider text NULL,
  ai_model text NULL,
  ai_generated_at timestamptz NULL,
  ai_error text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, id),
  CONSTRAINT material_highlights_material_fk
    FOREIGN KEY (user_id, material_id)
    REFERENCES public.study_materials(user_id, id)
    ON DELETE CASCADE,
  CONSTRAINT material_highlights_topic_fk
    FOREIGN KEY (user_id, topic_id)
    REFERENCES public.topics(user_id, id)
    ON DELETE CASCADE
);

-- Índices de performance e consulta por material/tópico/data
CREATE INDEX IF NOT EXISTS idx_material_highlights_user_material_page
  ON public.material_highlights(user_id, material_id, page_number);

CREATE INDEX IF NOT EXISTS idx_material_highlights_user_topic
  ON public.material_highlights(user_id, topic_id);

CREATE INDEX IF NOT EXISTS idx_material_highlights_user_created
  ON public.material_highlights(user_id, created_at DESC);

-- 2. Alteração de public.flashcards para vincular ao highlight de origem
ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS source_highlight_id text NULL,
  ADD COLUMN IF NOT EXISTS explanation text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flashcards_source_highlight_fk'
  ) THEN
    ALTER TABLE public.flashcards
      ADD CONSTRAINT flashcards_source_highlight_fk
        FOREIGN KEY (user_id, source_highlight_id)
        REFERENCES public.material_highlights(user_id, id)
        ON DELETE SET NULL;
  END IF;
END $$;

-- Índice parcial único: impede mais de 1 flashcard ativo a partir do mesmo highlight
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_flashcard_per_highlight
  ON public.flashcards(user_id, source_highlight_id)
  WHERE source_highlight_id IS NOT NULL;

-- 3. Configuração de RLS
ALTER TABLE public.material_highlights ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'material_highlights' AND policyname = 'material_highlights_select_own'
  ) THEN
    CREATE POLICY material_highlights_select_own
      ON public.material_highlights FOR SELECT TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'material_highlights' AND policyname = 'material_highlights_insert_own'
  ) THEN
    CREATE POLICY material_highlights_insert_own
      ON public.material_highlights FOR INSERT TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'material_highlights' AND policyname = 'material_highlights_update_own'
  ) THEN
    CREATE POLICY material_highlights_update_own
      ON public.material_highlights FOR UPDATE TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'material_highlights' AND policyname = 'material_highlights_delete_own'
  ) THEN
    CREATE POLICY material_highlights_delete_own
      ON public.material_highlights FOR DELETE TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Permissões
GRANT ALL ON public.material_highlights TO authenticated;
REVOKE ALL ON public.material_highlights FROM anon;
