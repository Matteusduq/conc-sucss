import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/mock-provider';
import { AIConfigurationError } from '@/lib/ai/llm-provider';
import { ErrorPatternInput } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para acessar a análise de erros.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const topicId = body.topicId ? String(body.topicId) : undefined;
    const force = Boolean(body.force);

    // 1. Verificação de Cache recente (últimos 15 minutos para mesmo filtro)
    if (!force) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      let cacheQuery = supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'ERROR_ANALYSIS')
        .gte('created_at', fifteenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (topicId) {
        cacheQuery = cacheQuery.eq('topic_id', topicId);
      } else {
        cacheQuery = cacheQuery.is('topic_id', null);
      }

      const { data: cachedInsight } = await cacheQuery.single();
      if (cachedInsight && cachedInsight.insight) {
        try {
          const parsed = JSON.parse(cachedInsight.insight);
          return NextResponse.json({
            success: true,
            analysis: parsed,
            cached: true,
            insightId: cachedInsight.id,
          });
        } catch {
          // segue para gerar novo se parse falhar
        }
      }
    }

    // 2. Consulta dos erros reais do usuário
    let errorQuery = supabase
      .from('error_logs')
      .select('id, error_type, summary, correct_rule, topic_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (topicId) {
      errorQuery = errorQuery.eq('topic_id', topicId);
    }

    const { data: errors, error: fetchErr } = await errorQuery;
    if (fetchErr) {
      throw fetchErr;
    }

    // Se não há erros registrados, devolve resposta pedagógica limpa sem chamar LLM externo
    if (!errors || errors.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          summary: 'Nenhum erro registrado no Caderno de Erros para os critérios selecionados.',
          patterns: [],
          recommendations: [
            'Continue resolvendo baterias de questões no TEC Concursos.',
            'Ao errar ou chutar uma questão, cadastre o erro imediatamente para mapear armadilhas da Cebraspe.',
          ],
          provider: 'system',
          model: 'deterministic-check',
          generatedAt: new Date().toISOString(),
        },
        cached: false,
      });
    }

    // Consulta nome do tópico se filtrado
    let topicName: string | undefined;
    if (topicId) {
      const { data: topic } = await supabase
        .from('topics')
        .select('name')
        .eq('id', topicId)
        .eq('user_id', user.id)
        .single();
      topicName = topic?.name;
    }

    // 3. Agregação dos dados para minimização de privacidade
    const errorCountsByType: Record<string, number> = {};
    errors.forEach((e) => {
      errorCountsByType[e.error_type] = (errorCountsByType[e.error_type] || 0) + 1;
    });

    const recentErrors = errors.slice(0, 15).map((e) => ({
      summary: e.summary,
      correctRule: e.correct_rule || undefined,
      errorType: e.error_type,
      topicName,
    }));

    const input: ErrorPatternInput = {
      userId: user.id,
      topicId,
      topicName,
      totalErrors: errors.length,
      errorCountsByType,
      recentErrors,
    };

    // 4. Execução da IA
    const provider = getAIProvider();
    const result = await provider.analyzeErrorPatterns(input);

    // 5. Persistência em public.ai_insights
    const insightId = `ins-error-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await supabase.from('ai_insights').insert({
      id: insightId,
      user_id: user.id,
      topic_id: topicId || null,
      type: 'ERROR_ANALYSIS',
      insight: JSON.stringify(result),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      analysis: result,
      cached: false,
      insightId,
    });
  } catch (err: any) {
    const isConfigError = err instanceof AIConfigurationError;
    return NextResponse.json(
      {
        error: isConfigError
          ? 'IA ainda não configurada no servidor.'
          : err?.message || 'Falha ao processar análise de erros.',
        isConfigError,
      },
      { status: isConfigError ? 422 : 500 }
    );
  }
}
