import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/mock-provider';
import { AIConfigurationError } from '@/lib/ai/llm-provider';
import { StudyAdjustmentInput } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para acessar as recomendações de IA.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const force = Boolean(body.force);

    // 1. Verificação de Cache recente (últimas 24 horas)
    if (!force) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: cachedInsight } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'STUDY_RECOMMENDATION')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedInsight && cachedInsight.insight) {
        try {
          const parsed = JSON.parse(cachedInsight.insight);
          return NextResponse.json({
            success: true,
            adjustment: parsed,
            cached: true,
            insightId: cachedInsight.id,
          });
        } catch {
          // segue para gerar novo se parse falhar
        }
      }
    }

    // 2. Consulta de métricas reais
    const examDate = new Date('2027-01-17T08:00:00Z');
    const now = new Date();
    const diffTime = examDate.getTime() - now.getTime();
    const daysUntilExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const [
      { data: settings },
      { data: topics },
      { data: questionSessions },
      { data: discursiveSessions },
      { data: dueCards },
    ] = await Promise.all([
      supabase.from('user_study_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('topics').select('id, status, domain_score, exam_block_code').eq('user_id', user.id),
      supabase.from('question_sessions').select('total_questions, correct, wrong, topic_id').eq('user_id', user.id),
      supabase.from('discursive_sessions').select('id').eq('user_id', user.id),
      supabase
        .from('flashcard_fsrs_state')
        .select('card_id')
        .eq('user_id', user.id)
        .lte('due', new Date().toISOString()),
    ]);

    const weeklyHours = settings?.weekly_available_hours ?? 20;

    const uncoveredTopicsCount = (topics || []).filter(
      (t) => t.status === 'NOT_STARTED'
    ).length;

    const atRiskTopicsCount = (topics || []).filter(
      (t) => (t.domain_score ?? 0) < 50 || t.status === 'LEARNING'
    ).length;

    // Precisão P1 e P2
    const topicBlockMap = new Map((topics || []).map((t) => [t.id, t.exam_block_code]));
    let p1Correct = 0, p1Total = 0;
    let p2Correct = 0, p2Total = 0;

    (questionSessions || []).forEach((qs) => {
      const block = topicBlockMap.get(qs.topic_id);
      const answered = (qs.correct || 0) + (qs.wrong || 0);
      if (block === 'P1') {
        p1Correct += qs.correct || 0;
        p1Total += answered;
      } else if (block === 'P2') {
        p2Correct += qs.correct || 0;
        p2Total += answered;
      }
    });

    const p1Accuracy = p1Total > 0 ? (p1Correct / p1Total) * 100 : undefined;
    const p2Accuracy = p2Total > 0 ? (p2Correct / p2Total) * 100 : undefined;

    const input: StudyAdjustmentInput = {
      userId: user.id,
      daysUntilExam,
      currentWeeklyHours: weeklyHours,
      uncoveredTopicsCount,
      atRiskTopicsCount,
      fsrsBacklogCount: dueCards?.length || 0,
      p1Accuracy,
      p2Accuracy,
      p3SessionsCount: discursiveSessions?.length || 0,
    };

    // 3. Execução da IA
    const provider = getAIProvider();
    const result = await provider.suggestStudyAdjustment(input);

    // 4. Persistência em public.ai_insights
    const insightId = `ins-adjust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await supabase.from('ai_insights').insert({
      id: insightId,
      user_id: user.id,
      topic_id: null,
      type: 'STUDY_RECOMMENDATION',
      insight: JSON.stringify(result),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      adjustment: result,
      cached: false,
      insightId,
    });
  } catch (err: any) {
    const isConfigError = err instanceof AIConfigurationError;
    return NextResponse.json(
      {
        error: isConfigError
          ? 'IA ainda não configurada no servidor.'
          : err?.message || 'Falha ao processar sugestão de estudo.',
        isConfigError,
      },
      { status: isConfigError ? 422 : 500 }
    );
  }
}
