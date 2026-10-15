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
import { AlertTriangle, Brain, Sparkles, BookOpen, PenTool, CheckCircle, Info, Compass, Target, ArrowRight, Layers, Trophy, Flame } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PriorityBadge } from '@/components/study/PriorityBadge';
import { StudyScoreBadge } from '@/components/study/StudyScoreBadge';
import { getOrCreateDailyMissions } from '@/lib/gamification/missions';
import { calculateWeeklyConsistency, getAllMeaningfulStudyDates } from '@/lib/gamification/streak';
import { getLevelProgress } from '@/lib/gamification/xp';
import { getLocalDateString } from '@/lib/utils/date';

export default function HojePage() {
  const router = useRouter();
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

  // Gamification state
  const todayStr = getLocalDateString();
  const { missions } = getOrCreateDailyMissions(todayStr, store);
  const completedMissionsCount = missions.filter((m) => m.status === 'COMPLETED').length;
  const profile = store.gamificationProfile || { total_xp: 0, level: 1, current_streak: 0, longest_streak: 0 };
  const { level, progressPercent } = getLevelProgress(profile.total_xp);
  const meaningfulDates = getAllMeaningfulStudyDates({
    questionSessions: store.questionSessions,
    materialProgress: store.materialProgress,
    reviews: store.reviews,
    discursiveSessions: store.discursiveSessions || [],
    mockExams: store.mockExams || [],
  });
  const weeklyRhythm = calculateWeeklyConsistency(
    meaningfulDates,
    todayStr,
    store.settings?.gamification_weekly_target_days || 6
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Exam Countdown */}
      <ExamCountdown
        examName={store.exam.name}
        role={store.exam.role}
        examDate={store.exam.exam_date}
      />

      {/* Gamification Quick Bar */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Level & XP */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Nível {level}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {profile.total_xp.toLocaleString('pt-BR')} XP
                </span>
              </div>
              <div className="w-24 h-1.5 rounded-full bg-zinc-800 mt-1 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-zinc-800" />

          {/* Streak */}
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white font-mono">
                {profile.current_streak} dias
              </span>
              <span className="text-[10px] text-zinc-400 block">Sequência</span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-zinc-800" />

          {/* Weekly Rhythm */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-300">
              Ritmo: {weeklyRhythm.daysStudiedThisWeek}/{weeklyRhythm.targetDays} dias
            </div>
            <div className="flex items-center gap-1 mt-1">
              {weeklyRhythm.daysStatuses.map((day) => (
                <div
                  key={day.date}
                  className={`w-2 h-2 rounded-full ${
                    day.completed ? 'bg-emerald-400' : 'bg-zinc-800'
                  }`}
                  title={`${day.dayName}: ${day.completed ? 'Estudo registrado' : 'Pendente'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Missions summary and link to /jornada */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400">Missões de hoje:</span>
            <div className="text-xs font-mono font-bold text-amber-300">
              {completedMissionsCount} de {missions.length} concluídas
            </div>
          </div>
          <Link href="/jornada">
            <Button size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-200 gap-1.5 h-8">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Ver Jornada
            </Button>
          </Link>
        </div>
      </div>

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

      {/* 4. Seu Ponto de Partida (Brand New / Unstarted Preparations) */}
      {isPreparationUnstarted && plan.tasks.length >= 2 && (
        <section className="p-6 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-b from-indigo-950/30 via-zinc-900/60 to-zinc-950/90 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Seu ponto de partida
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Motor Estratégico
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                Como você ainda não possui histórico de estudo, o plano foi calculado a partir dos critérios objetivos do{' '}
                <span className="text-white font-semibold">Edital nº 1/2026</span>: estrutura do concurso, peso pedagógico dos conteúdos, mínimos de aprovação (mín. 27 em P2 vs 18 em P1), sinergia com a prova discursiva (P3) e tempo até a prova.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/plano">
                <Button size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-300">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Ver Edital Completo
                </Button>
              </Link>
            </div>
          </div>

          {/* Cards: Missão Principal & Próximo Passo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Missão Principal */}
            {(() => {
              const task1 = plan.tasks[0];
              return (
                <div className="flex flex-col justify-between p-5 rounded-xl border-2 border-amber-500/40 bg-zinc-900/90 hover:border-amber-500/60 transition-all shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        Missão Principal
                      </span>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={task1.priority} />
                        <StudyScoreBadge score={task1.studyScore} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {task1.examBlockCode && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              task1.examBlockCode === 'P1'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {task1.examBlockCode}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
                          {task1.subjectName}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-100 tracking-tight mt-1 leading-snug">
                        {task1.topicName}
                      </h3>
                    </div>

                    {/* Por que começar aqui? */}
                    <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs space-y-2">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Por que começar aqui?
                      </span>
                      <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside">
                        {(task1.strategicReasons || []).slice(0, 4).map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400 font-mono">
                      ~{task1.estimatedMinutes} min sugeridos
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openTecModal(task1.topicId)}
                        className="cursor-pointer text-xs"
                      >
                        Praticar no TEC
                      </Button>
                      <Link href={`/estudar/${task1.topicId}`}>
                        <Button size="sm" variant="primary" className="cursor-pointer text-xs">
                          <BookOpen className="w-3.5 h-3.5 mr-1" />
                          Estudar Teoria
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Próximo Passo */}
            {(() => {
              const task2 = plan.tasks[1];
              return (
                <div className="flex flex-col justify-between p-5 rounded-xl border border-zinc-700/80 bg-zinc-900/70 hover:border-zinc-600 transition-all shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                        Próximo Passo
                      </span>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={task2.priority} />
                        <StudyScoreBadge score={task2.studyScore} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {task2.examBlockCode && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              task2.examBlockCode === 'P1'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {task2.examBlockCode}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
                          {task2.subjectName}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-100 tracking-tight mt-1 leading-snug">
                        {task2.topicName}
                      </h3>
                    </div>

                    {/* Por que estudar logo após? */}
                    <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs space-y-2">
                      <span className="font-bold text-blue-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Por que estudar logo após?
                      </span>
                      <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside">
                        {(task2.strategicReasons || []).slice(0, 4).map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400 font-mono">
                      ~{task2.estimatedMinutes} min sugeridos
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openTecModal(task2.topicId)}
                        className="cursor-pointer text-xs"
                      >
                        Praticar no TEC
                      </Button>
                      <Link href={`/estudar/${task2.topicId}`}>
                        <Button size="sm" variant="primary" className="cursor-pointer text-xs">
                          <BookOpen className="w-3.5 h-3.5 mr-1" />
                          Estudar Teoria
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Non-blocking Freedom Banner */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-zinc-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-200">Recomendação flexível (você tem autonomia):</span>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  O plano não bloqueia sua rotina. Você pode explorar a biblioteca, filtrar qualquer assunto no TEC, revisar cartões de memória ou registrar treinos discursivos livremente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Link href="/estudar">
                <Button size="sm" variant="outline" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" /> Biblioteca
                </Button>
              </Link>
              <Link href="/memoria">
                <Button size="sm" variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" /> Memória
                </Button>
              </Link>
              <Link href="/discursiva">
                <Button size="sm" variant="outline" className="text-xs">
                  <PenTool className="w-3 h-3 mr-1" /> Discursiva
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
                router.push(`/estudar/${topicId}`);
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
