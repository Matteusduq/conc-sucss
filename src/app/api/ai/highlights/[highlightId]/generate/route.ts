import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/mock-provider';
import { AIConfigurationError } from '@/lib/ai/llm-provider';
import { HighlightExplanationInput } from '@/lib/ai/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ highlightId: string }> }
) {
  try {
    const { highlightId } = await params;
    const supabase = await createServerSupabaseClient();

    // 1. Autenticação estrita no servidor
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para utilizar a geração com IA.' },
        { status: 401 }
      );
    }

    // 2. Consulta de propriedade do highlight
    const { data: highlight, error: hlError } = await supabase
      .from('material_highlights')
      .select('*')
      .eq('id', highlightId)
      .eq('user_id', user.id)
      .single();

    if (hlError || !highlight) {
      return NextResponse.json(
        { error: 'Marcação não encontrada ou acesso não autorizado.' },
        { status: 404 }
      );
    }

    // 3. Consulta de contexto curricular (Topic, Subject, Syllabus Items)
    const { data: topic } = await supabase
      .from('topics')
      .select('id, name, priority, subject_id, subjects(name)')
      .eq('id', highlight.topic_id)
      .eq('user_id', user.id)
      .single();

    const { data: topicSyl } = await supabase
      .from('topic_syllabus_items')
      .select('syllabus_item_id, syllabus_items(official_code, official_text)')
      .eq('topic_id', highlight.topic_id)
      .eq('user_id', user.id);

    const subjectName = (topic as any)?.subjects?.name || 'Geral';
    const syllabusList = (topicSyl || []).map((item: any) => ({
      officialCode: item.syllabus_items?.official_code || null,
      officialText: item.syllabus_items?.official_text || '',
    }));

    // 4. Marca status GENERATING na base
    await supabase
      .from('material_highlights')
      .update({
        ai_status: 'GENERATING',
        ai_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', highlight.id)
      .eq('user_id', user.id);

    // 5. Monta o payload validado para a IA
    const aiInput: HighlightExplanationInput = {
      topicId: highlight.topic_id,
      topicName: topic?.name || 'Tópico Legislativo',
      subjectName,
      priority: (topic?.priority as any) || 'HIGH',
      syllabusItems: syllabusList,
      pageNumber: highlight.page_number,
      selectedText: highlight.selected_text,
      contextBefore: highlight.context_before || undefined,
      contextAfter: highlight.context_after || undefined,
    };

    // 6. Chamada server-side
    try {
      const provider = getAIProvider();
      const result = await provider.explainHighlightAndDraftFlashcard(aiInput);

      const status = result.shouldCreateFlashcard ? 'READY' : 'NOT_RECOMMENDED';
      const flashcardDraft = result.draft
        ? {
            front: result.draft.front,
            back: result.draft.back,
            card_type: result.draft.cardType,
            exam_priority: result.draft.examPriority,
            explanation: result.explanation,
          }
        : null;

      const updateData = {
        ai_status: status,
        ai_explanation: result.explanation,
        ai_key_point: result.keyPoint,
        ai_cebraspe_trap: result.cebraspeTrap || null,
        ai_flashcard_draft: flashcardDraft,
        ai_provider: result.provider,
        ai_model: result.model,
        ai_generated_at: new Date().toISOString(),
        ai_error: null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedHighlight, error: updateError } = await supabase
        .from('material_highlights')
        .update(updateData)
        .eq('id', highlight.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        highlight: updatedHighlight,
        result,
      });
    } catch (aiErr: any) {
      const isConfigError = aiErr instanceof AIConfigurationError;
      const errorMsg = isConfigError
        ? 'IA ainda não configurada.'
        : aiErr?.message || 'Falha ao processar com provedor de IA.';

      await supabase
        .from('material_highlights')
        .update({
          ai_status: 'FAILED',
          ai_error: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', highlight.id)
        .eq('user_id', user.id);

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          isConfigError,
        },
        { status: isConfigError ? 422 : 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
