import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/mock-provider';
import { AIConfigurationError } from '@/lib/ai/llm-provider';
import { FlashcardGenerationInput } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para gerar rascunhos de flashcards.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const topicId = body.topicId ? String(body.topicId) : null;
    const snippet = body.snippet ? String(body.snippet).slice(0, 3000) : undefined;
    const targetCount = body.targetCount ? Number(body.targetCount) : 3;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Parâmetro topicId é obrigatório.' },
        { status: 400 }
      );
    }

    const { data: topic } = await supabase
      .from('topics')
      .select('id, name, priority, subjects(name)')
      .eq('id', topicId)
      .eq('user_id', user.id)
      .single();

    if (!topic) {
      return NextResponse.json(
        { error: 'Tópico não encontrado.' },
        { status: 404 }
      );
    }

    const input: FlashcardGenerationInput = {
      topicId: topic.id,
      topicName: topic.name,
      subjectName: (topic as any).subjects?.name || 'Geral',
      priority: (topic.priority as any) || 'HIGH',
      materialTextSnippet: snippet,
      targetCount,
    };

    const provider = getAIProvider();
    const drafts = await provider.generateFlashcards(input);

    return NextResponse.json({
      success: true,
      drafts,
    });
  } catch (err: any) {
    const isConfigError = err instanceof AIConfigurationError;
    return NextResponse.json(
      {
        error: isConfigError
          ? 'IA ainda não configurada no servidor.'
          : err?.message || 'Falha ao gerar flashcards.',
        isConfigError,
      },
      { status: isConfigError ? 422 : 500 }
    );
  }
}
