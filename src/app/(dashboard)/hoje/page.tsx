'use client';

import React from 'react';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { ExamCountdown } from '@/components/dashboard/ExamCountdown';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { TodayTaskCard } from '@/components/dashboard/TodayTaskCard';
import { generateDailyPlan, generateDeterministicInsights } from '@/lib/study-engine/recommendations';
import { getDueFlashcards } from '@/lib/data/store';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Brain, Sparkles, BookOpen, PenTool, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function HojePage() {
  const { store, openTecModal } = useModal();

  const dueCards = getDueFlashcards(store);
  const plan = generateDailyPlan({
    topics: store.topics,
    subjects: store.subjects,
    materials: store.materials,
    errors: store.errorLogs,
    overdueCardsCount: dueCards.length,
    availableMinutesToday: store.settings.today_available_minutes || undefined,
    weeklyTargetMinutes: store.settings.weekly_study_target_minutes,
  });

  const insights = generateDeterministicInsights({
    topics: store.topics,
    errors: store.errorLogs,
    desiredRetention: store.settings.desired_retention,
  });

  // Calculate KPIs
  const totalQuestions = store.questionSessions.reduce((acc, s) => acc + s.total_questions, 0);
  const correctQuestions = store.questionSessions.reduce((acc, s) => acc + s.correct, 0);
  const wrongQuestions = store.questionSessions.reduce((acc, s) => acc + s.wrong, 0);
  const blankQuestions = store.questionSessions.reduce((acc, s) => acc + s.blank, 0);
  const netPointsCebraspe = correctQuestions - wrongQuestions;
  const accuracyRate = totalQuestions > 0 ? correctQuestions / Math.max(1, correctQuestions + wrongQuestions) : 0;

  const totalReviews = store.reviews.length;
  const totalLapses = store.reviews.filter((r) => r.rating === 'AGAIN').length;
  const retentionRate = totalReviews > 0 ? Math.round(((totalReviews - totalLapses) / totalReviews) * 100) : null;

  const atRiskTopics = store.topics.filter((t) => t.status === 'AT_RISK');

  // Study time in current week (last 7 days)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const studiedSecondsThisWeek = store.questionSessions
    .filter((s) => new Date(s.performed_at).getTime() >= oneWeekAgo)
    .reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const weeklyStudiedMinutes = Math.round(studiedSecondsThisWeek / 60);

  // Block metrics for P1, P2 and P3
  const p1Topics = store.topics.filter((t) => t.exam_block_code === 'P1');
  const p2Topics = store.topics.filter((t) => t.exam_block_code === 'P2');
  const p1StartedCount = p1Topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const p2StartedCount = p2Topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const p3SessionsCount = (store.discursiveSessions || []).length;
  const isPreparationUnstarted = totalQuestions === 0 && p1StartedCount === 0 && p2StartedCount === 0 && p3SessionsCount === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Exam Countdown */}
      <ExamCountdown
        examName={store.exam.name}
        role={store.exam.role}
        examDate={store.exam.exam_date}
      />

      {/* 2. State of preparation (P1, P2, P3 status block) */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              {isPreparationUnstarted ? 'Preparação ainda não iniciada' : 'Progresso Estrutural dos Blocos'}
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Edital nº 1/2026 — Registro e Redação
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* P1 */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-400 font-mono">P1 — Conhecimentos Básicos</span>
              <span className="text-[10px] text-zinc-400">90 itens • mín. 18</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200 mt-1">
              {p1StartedCount === 0 ? 'Não iniciado' : `${p1StartedCount} de ${p1Topics.length} unidades`}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">5 disciplinas (Português, Inglês, Adm, Const, TI)</div>
          </div>

          {/* P2 */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-400 font-mono">P2 — Conhecimentos Específicos</span>
              <span className="text-[10px] text-zinc-400">90 itens • mín. 27</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200 mt-1">
              {p2StartedCount === 0 ? 'Não iniciado' : `${p2StartedCount} de ${p2Topics.length} unidades`}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">4 disciplinas (Linguística, ASR/IA, Legislação, Pol.)</div>
          </div>

          {/* P3 */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 font-mono">P3 — Prova Discursiva</span>
              <span className="text-[10px] text-zinc-400">60 pts • mín. 30</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200 mt-1">
              {p3SessionsCount === 0 ? 'Sem treino registrado' : `${p3SessionsCount} treino(s) registrado(s)`}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">2 questões (até 20L) + 1 peça técnica (até 50L)</div>
          </div>
        </div>
      </div>

      {/* 3. Top Metric KPIs */}
      <DashboardKPIs
        weeklyStudiedMinutes={weeklyStudiedMinutes}
        weeklyTargetMinutes={store.settings.weekly_study_target_minutes || 1080}
        totalQuestions={totalQuestions}
        correctQuestions={correctQuestions}
        wrongQuestions={wrongQuestions}
        blankQuestions={blankQuestions}
        netPointsCebraspe={netPointsCebraspe}
        accuracyRate={accuracyRate}
        retentionRate={retentionRate}
        desiredRetention={store.settings.desired_retention}
        atRiskTopicsCount={atRiskTopics.length}
      />

      {/* 4. Alerts Section (if any alerts) */}
      {plan.alerts.length > 0 && (
        <div className="space-y-2">
          {plan.alerts.map((alert, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-900/60 bg-amber-950/20 text-xs text-amber-200"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* 5. Time Distribution & Daily Balance */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Distribuição Estratégica do Dia
            </h3>
            <p className="text-xs text-zinc-400">
              Meta diária: {plan.availableMinutes} min • Equilíbrio dinâmico entre teoria, treino e retenção.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Teoria: {plan.blocks.theoryMinutes}m
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Questões: {plan.blocks.questionsMinutes}m
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Memória: {plan.blocks.memoryMinutes}m
            </span>
          </div>
        </div>

        {/* Progress Bar of Daily Split */}
        <div className="w-full h-3 rounded-full bg-zinc-800 flex overflow-hidden mt-3">
          <div
            style={{ width: `${(plan.blocks.theoryMinutes / plan.availableMinutes) * 100}%` }}
            className="bg-blue-500 h-full"
            title="Teoria e leitura"
          />
          <div
            style={{ width: `${(plan.blocks.questionsMinutes / plan.availableMinutes) * 100}%` }}
            className="bg-emerald-500 h-full"
            title="Questões no TEC"
          />
          <div
            style={{ width: `${(plan.blocks.memoryMinutes / plan.availableMinutes) * 100}%` }}
            className="bg-purple-500 h-full"
            title="Memória FSRS"
          />
          <div
            style={{ width: `${(plan.blocks.bufferMinutes / plan.availableMinutes) * 100}%` }}
            className="bg-zinc-700 h-full"
            title="Buffer"
          />
        </div>
      </Card>

      {/* 6. Memory / Flashcards Callout */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-900/80 text-purple-300">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100">
              Revisões de Memória Espaçada (FSRS)
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {dueCards.length > 0
                ? `${dueCards.length} cartões devidos hoje (~${plan.reviewsDueMinutes} min sugeridos). Prioridade a cartões do Caderno de Erros e tópicos de Alta Relevância.`
                : 'Nenhum cartão pendente de revisão hoje. Todos os tópicos com retenção em dia.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/memoria">
            <Button size="sm" variant={dueCards.length > 0 ? 'primary' : 'outline'}>
              {dueCards.length > 0 ? 'Iniciar Revisão de Hoje' : 'Acessar Módulo Memória'}
            </Button>
          </Link>
        </div>
      </div>

      {/* 7. Today Study Queue (Tasks from P1 and P2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-100 tracking-tight">
              Fila Diária Priorizada (O Que Estudar Agora)
            </h3>
            <p className="text-xs text-zinc-400">
              Ordenação orientada pelo algoritmo com tópicos de P1 e P2: relevância Cebraspe + gap de domínio + urgência.
            </p>
          </div>
          <Link href="/plano" className="text-xs font-semibold text-zinc-400 hover:text-white">
            Ver Edital Completo &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.tasks.slice(0, 4).map((task) => (
            <TodayTaskCard
              key={task.id}
              task={task}
              onOpenTecModal={(topicId) => openTecModal(topicId)}
              onOpenMaterial={(topicId) => {
                window.location.href = `/estudar/${topicId}`;
              }}
            />
          ))}
        </div>
      </div>

      {/* 8. Deterministic Insights Box */}
      {insights.length > 0 && (
        <Card className="p-5 border-zinc-800 bg-zinc-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-300" />
              Diagnósticos do Motor de Inteligência Pedagógica
            </CardTitle>
          </CardHeader>
          <div className="space-y-2 mt-2">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-zinc-300 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mt-1.5" />
                <p className="leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
