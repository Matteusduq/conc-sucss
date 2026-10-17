'use client';

import React, { useEffect } from 'react';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { JourneyHeader } from '@/components/gamification/JourneyHeader';
import { JourneyMap } from '@/components/gamification/JourneyMap';
import { DailyMissions } from '@/components/gamification/DailyMissions';
import { WeeklyBoss } from '@/components/gamification/WeeklyBoss';
import { AchievementGrid } from '@/components/gamification/AchievementGrid';
import { calculateJourneyPhase, calculateAcademicProgress } from '@/lib/gamification/journey';
import { getOrCreateDailyMissions } from '@/lib/gamification/missions';
import { calculateWeeklyConsistency, getAllMeaningfulStudyDates } from '@/lib/gamification/streak';
import { qualifiesForWeeklyBoss, evaluateWeeklyBossQualification } from '@/lib/gamification/mock-exam';
import { getLocalDateString, getDaysUntilExam } from '@/lib/utils/date';
import { ShieldCheck } from 'lucide-react';

export default function JornadaPage() {
  const { store, openMockModal, updateStore } = useModal();
  const todayStr = getLocalDateString();
  const daysUntilExam = getDaysUntilExam(store.exam.exam_date);

  // Topics calculation
  const totalTopics = store.topics.length || 76;
  const startedTopics = store.topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const masteredTopics = store.topics.filter((t) => t.status === 'MASTERED').length;
  const atRiskTopics = store.topics.filter((t) => t.status === 'AT_RISK').length;

  const p1Topics = store.topics.filter((t) => t.exam_block_code === 'P1');
  const p2Topics = store.topics.filter((t) => t.exam_block_code === 'P2');
  const p1Started = p1Topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const p2Started = p2Topics.filter((t) => t.status !== 'NOT_STARTED').length;

  const totalQuestions = store.questionSessions.reduce((sum, s) => sum + s.total_questions, 0);
  const discursiveSessions = store.discursiveSessions || [];
  const mockExams = store.mockExams || [];

  // Domain score
  const studiedWithScore = store.topics.filter((t) => t.domain_score !== null && t.domain_score !== undefined);
  const avgDomain =
    studiedWithScore.length > 0
      ? Math.round(studiedWithScore.reduce((sum, t) => sum + (t.domain_score || 0), 0) / studiedWithScore.length)
      : 0;

  // Calculate Journey Phase
  const phaseInfo = calculateJourneyPhase({
    daysUntilExam,
    totalTopics,
    startedTopics,
    masteredTopics,
    atRiskTopics,
    p1StartedTopics: p1Started,
    p1TotalTopics: p1Topics.length || 42,
    p2StartedTopics: p2Started,
    p2TotalTopics: p2Topics.length || 34,
    averageDomainScore: avgDomain,
    totalQuestions,
    discursiveSessionsCount: discursiveSessions.length,
    mockExamsCount: mockExams.length,
  });

  // Calculate Academic Preparation Progress (distinct from XP)
  const totalReviews = store.reviews.length;
  const totalLapses = store.reviews.filter((r) => r.rating === 'AGAIN').length;
  const retentionRate = totalReviews > 0 ? Math.round(((totalReviews - totalLapses) / totalReviews) * 100) : null;
  const academicProgress = calculateAcademicProgress(store.topics, discursiveSessions, retentionRate);

  // Stable daily missions
  const { missions } = getOrCreateDailyMissions(todayStr, store);

  useEffect(() => {
    if (!store.dailyMissions[todayStr] || store.dailyMissions[todayStr].length === 0) {
      updateStore(
        (prev) => ({
          ...prev,
          dailyMissions: {
            ...prev.dailyMissions,
            [todayStr]: missions,
          },
        }),
        async (repo, uId) => {
          await repo.persistDailyMissions(uId, missions);
        }
      );
    }
  }, [todayStr, store.dailyMissions, missions, updateStore]);

  // Weekly consistency & Boss completion
  const meaningfulDates = getAllMeaningfulStudyDates({
    questionSessions: store.questionSessions,
    materialProgress: store.materialProgress,
    reviews: store.reviews,
    discursiveSessions: store.discursiveSessions || [],
    mockExams: store.mockExams || [],
    studySessions: store.studySessions || [],
  });
  const weeklyRhythm = calculateWeeklyConsistency(
    meaningfulDates,
    todayStr,
    store.settings?.gamification_weekly_target_days || 5
  );

  // Check if Weekly Boss was completed in current week with real qualification
  const mocksThisWeek = mockExams.filter((m) => {
    const mDate = getLocalDateString(m.performed_at);
    return mDate >= weeklyRhythm.weekStart && mDate <= weeklyRhythm.weekEnd;
  });
  const qualifyingBossMock = mocksThisWeek.find((m) =>
    qualifiesForWeeklyBoss(m, phaseInfo.weeklyBossRecommendation)
  );
  const isBossCompletedThisWeek = Boolean(qualifyingBossMock);

  let unmetBossMockReason: string | undefined;
  if (!isBossCompletedThisWeek && mocksThisWeek.length > 0) {
    const latestUnmet = mocksThisWeek[mocksThisWeek.length - 1];
    unmetBossMockReason = evaluateWeeklyBossQualification(
      latestUnmet,
      phaseInfo.weeklyBossRecommendation
    ).reason;
  }

  const confidenceLabels: Record<string, string> = {
    NO_DATA: 'Sem dados',
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
  };
  const confidenceText = confidenceLabels[academicProgress.preparationConfidence] || 'Sem dados';

  const profile = store.gamificationProfile || {
    total_xp: 0,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
    meaningful_days: 0,
    achievements_unlocked: [],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Journey Phase, Countdown, Level, XP bar, Streak */}
      <JourneyHeader
        phaseInfo={phaseInfo}
        daysUntilExam={daysUntilExam}
        totalXp={profile.total_xp}
        currentStreak={profile.current_streak}
        longestStreak={profile.longest_streak}
        daysStudiedThisWeek={weeklyRhythm.daysStudiedThisWeek}
        weeklyTargetDays={weeklyRhythm.targetDays}
        daysStatuses={weeklyRhythm.daysStatuses}
        showStreak={store.settings?.gamification_show_streak !== false}
      />

      {/* 2. Visual Roadmap of 4 Preparation Phases */}
      <JourneyMap
        currentPhase={phaseInfo.phase}
        phaseNumber={phaseInfo.phaseNumber}
        coveragePercent={phaseInfo.coveragePercent}
      />

      {/* Academic Progress Summary (Índice de Preparação) */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Índice de Preparação Acadêmica (Edital nº 1/2026)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Métrica curricular independente do XP
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Índice Geral</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              {academicProgress.overallIndex}%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">
              Confiança: <span className="text-zinc-200">{confidenceText}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Cobertura Edital</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {academicProgress.editalCoveragePercent}%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{startedTopics}/76 tópicos</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Domínio Médio</div>
            <div className="text-lg font-black text-blue-400 font-mono mt-0.5">
              {academicProgress.domainScore !== null ? `${academicProgress.domainScore} pts` : '—'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {academicProgress.domainScore !== null ? 'Tópicos com questões' : 'Sem dados suficientes'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Retenção FSRS</div>
            <div className="text-lg font-black text-purple-400 font-mono mt-0.5">
              {academicProgress.retentionRate !== null ? `${academicProgress.retentionRate}%` : '—'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {academicProgress.retentionRate !== null ? 'Memória espaçada' : 'Sem revisões suficientes'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Prontidão P3</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {academicProgress.discursiveReadiness !== null
                ? `${academicProgress.discursiveReadiness}%`
                : '—'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {academicProgress.discursiveSessionsCount > 0
                ? `${academicProgress.discursiveSessionsCount} treinos válidos`
                : 'Sem treinos discursivos'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Missões de Hoje (Missão Principal + Auxiliares) */}
      <DailyMissions missions={missions} dateStr={todayStr} />

      {/* 4. Boss da Semana (Checkpoint Semanal) */}
      <WeeklyBoss
        phaseInfo={phaseInfo}
        isCompletedThisWeek={isBossCompletedThisWeek}
        unmetBossMockReason={unmetBossMockReason}
        onOpenRecordModal={openMockModal}
      />

      {/* 5. Conquistas da Jornada */}
      <AchievementGrid unlockedIds={profile.achievements_unlocked} />
    </div>
  );
}
