import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/mock-provider';
import { AIConfigurationError } from '@/lib/ai/llm-provider';
import { WeeklyAnalysisInput } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para acessar a análise de IA.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const force = Boolean(body.force);

    // 1. Verificação de Cache recente (últimas 24 horas para mesma semana)
    if (!force) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: cachedInsight } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'WEEKLY_ANALYSIS')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

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

    // 2. Consulta de dados reais da última semana (7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: studySessions },
      { data: questionSessions },
      { data: discursiveSessions },
      { data: materialsProgress },
      { data: materials },
      { data: dueCards },
      { data: reviewedCards },
      { data: weakTopics },
    ] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('duration_seconds, started_at')
        .eq('user_id', user.id)
        .gte('started_at', sevenDaysAgo),
      supabase
        .from('question_sessions')
        .select('total_questions, correct, wrong, blank, net_points, performed_at')
        .eq('user_id', user.id)
        .gte('performed_at', sevenDaysAgo),
      supabase
        .from('discursive_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('performed_at', sevenDaysAgo),
      supabase.from('material_progress').select('completed').eq('user_id', user.id),
      supabase.from('study_materials').select('id'),
      supabase
        .from('flashcard_fsrs_state')
        .select('card_id')
        .eq('user_id', user.id)
        .lte('due', new Date().toISOString()),
      supabase
        .from('flashcard_reviews')
        .select('id')
        .eq('user_id', user.id)
        .gte('reviewed_at', sevenDaysAgo),
      supabase
        .from('topics')
        .select('name, domain_score')
        .eq('user_id', user.id)
        .order('domain_score', { ascending: true })
        .limit(3),
    ]);

    // 3. Agregação determinística estrita
    const totalMinutes = Math.round(
      (studySessions || []).reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60
    );

    const questionsSolved = (questionSessions || []).reduce(
      (acc, s) => acc + (s.total_questions || 0),
      0
    );
    const correctCount = (questionSessions || []).reduce((acc, s) => acc + (s.correct || 0), 0);
    const wrongCount = (questionSessions || []).reduce((acc, s) => acc + (s.wrong || 0), 0);
    const answeredCount = correctCount + wrongCount;
    const accuracyRate = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
    const netScore = (questionSessions || []).reduce((acc, s) => acc + (s.net_points || 0), 0);

    const uniqueDays = new Set(
      (studySessions || []).map((s) => s.started_at.split('T')[0])
    ).size;

    const completedMaterialsCount = (materialsProgress || []).filter((m) => m.completed).length;

    const input: WeeklyAnalysisInput = {
      userId: user.id,
      totalStudyMinutes: totalMinutes,
      questionsSolved,
      accuracyRate,
      netScore,
      daysStudiedCount: uniqueDays,
      materialsCompleted: completedMaterialsCount,
      materialsTotal: materials?.length || 0,
      fsrsDueCards: dueCards?.length || 0,
      fsrsReviewedCards: reviewedCards?.length || 0,
      discursiveSessionsCount: discursiveSessions?.length || 0,
      topWeakTopics: (weakTopics || []).map((t) => ({
        name: t.name,
        domainScore: t.domain_score ?? 0,
      })),
    };

    // 4. Execução da IA
    const provider = getAIProvider();
    const result = await provider.generateWeeklyAnalysis(input);

    // 5. Persistência em public.ai_insights
    const insightId = `ins-weekly-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await supabase.from('ai_insights').insert({
      id: insightId,
      user_id: user.id,
      topic_id: null,
      type: 'WEEKLY_ANALYSIS',
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
          : err?.message || 'Falha ao processar análise semanal.',
        isConfigError,
      },
      { status: isConfigError ? 422 : 500 }
    );
  }
}
