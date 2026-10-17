-- ============================================================================
-- MIGRATION: Fix unique_active_flashcard_per_highlight index
-- Date: 2026-10-17
-- Description:
-- Ajusta o índice único parcial unique_active_flashcard_per_highlight para
-- considerar apenas cartões ativos e não suspensos:
-- WHERE source_highlight_id IS NOT NULL AND active = true AND suspended = false
-- ============================================================================

DROP INDEX IF EXISTS public.unique_active_flashcard_per_highlight;

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_flashcard_per_highlight
  ON public.flashcards (user_id, source_highlight_id)
  WHERE source_highlight_id IS NOT NULL
    AND active = true
    AND suspended = false;
