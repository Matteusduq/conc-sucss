'use client';

import React from 'react';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  PieChart,
  ShieldAlert,
  Clock,
  CheckCircle,
  Brain,
  AlertTriangle,
  PenTool,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import { computeDiscursiveKPIs } from '@/lib/study-engine/discursive';
import { formatDurationMinutes } from '@/lib/utils/date';

export default function AnalyticsPage() {
  const { store } = useModal();

  const topicMap = new Map(store.topics.map((t) => [t.id, t]));

  // Block metrics helper
  const computeBlockAnalytics = (blockCode: 'P1' | 'P2') => {
    const blockTopics = store.topics.filter((t) => t.exam_block_code === blockCode);
    const totalUnits = blockTopics.length;
    const startedUnits = blockTopics.filter((t) => t.status !== 'NOT_STARTED').length;
    const coveragePercent = Math.round((startedUnits / Math.max(1, totalUnits)) * 100);

    const evaluatedTopics = blockTopics.filter((t) => t.domain_score !== null);
    const avgDomain =
      evaluatedTopics.length > 0
        ? Math.round(evaluatedTopics.reduce((sum, t) => sum + (t.domain_score || 0), 0) / evaluatedTopics.length)
        : null;

    const blockSessions = store.questionSessions.filter((s) => {
      const top = topicMap.get(s.topic_id);
      return top && top.exam_block_code === blockCode;
    });

    const totalQuestions = blockSessions.reduce((acc, s) => acc + s.total_questions, 0);
    const totalCorrect = blockSessions.reduce((acc, s) => acc + s.correct, 0);
    const totalWrong = blockSessions.reduce((acc, s) => acc + s.wrong, 0);
    const totalBlank = blockSessions.reduce((acc, s) => acc + s.blank, 0);
    const netPoints = totalCorrect - totalWrong;
    const answered = totalCorrect + totalWrong;
    const accuracy = answered > 0 ? (totalCorrect / answered) * 100 : 0;

    const studySeconds = blockSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const studyMinutes = Math.round(studySeconds / 60);

    return {
      totalUnits,
      startedUnits,
      coveragePercent,
      avgDomain,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalBlank,
      netPoints,
      accuracy,
      studyMinutes,
    };
  };

  const p1 = computeBlockAnalytics('P1');
  const p2 = computeBlockAnalytics('P2');
  const p3KPIs = computeDiscursiveKPIs(store.discursiveSessions || []);

  // Risk Matrix Quadrants (Objective topics)
  const critical = store.topics.filter(
    (t) => t.priority === 'HIGH' && ((t.domain_score ?? 0) < 60 || t.status === 'AT_RISK')
  );
  const maintain = store.topics.filter(
    (t) => t.priority === 'HIGH' && (t.domain_score ?? 0) >= 60 && t.status !== 'AT_RISK'
  );
  const secondary = store.topics.filter(
    (t) => (t.priority === 'MEDIUM' || t.priority === 'LOW') && (t.domain_score ?? 0) < 60
  );
  const lowUrgency = store.topics.filter(
    (t) => (t.priority === 'MEDIUM' || t.priority === 'LOW') && (t.domain_score ?? 0) >= 60
  );

  // Status pie chart data
  const statusData = [
    { name: 'Não Iniciado', value: store.topics.filter((t) => t.status === 'NOT_STARTED').length, color: '#3f3f46' },
    { name: 'Em Teoria', value: store.topics.filter((t) => t.status === 'LEARNING').length, color: '#3b82f6' },
    { name: 'Aguardando TEC', value: store.topics.filter((t) => t.status === 'AWAITING_QUESTIONS').length, color: '#f59e0b' },
    { name: 'Consolidando', value: store.topics.filter((t) => t.status === 'CONSOLIDATING').length, color: '#eab308' },
    { name: 'Dominado / Manutenção', value: store.topics.filter((t) => t.status === 'MASTERED' || t.status === 'MAINTENANCE').length, color: '#10b981' },
    { name: 'Em Risco', value: store.topics.filter((t) => t.status === 'AT_RISK').length, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Questions by Subject (all 9 subjects)
  const questionsBySubject = store.subjects.map((sub) => {
    const subSessions = store.questionSessions.filter((s) => s.subject_id === sub.id);
    const questions = subSessions.reduce((sum, s) => sum + s.total_questions, 0);
    const net = subSessions.reduce((sum, s) => sum + s.net_points, 0);

    return {
      name: sub.name.length > 18 ? sub.name.slice(0, 16) + '...' : sub.name,
      fullName: sub.name,
      block: sub.exam_block_code,
      questoes: questions,
      liquida: net,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
          Analytics Integral — P1, P2 e P3
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Visão separada para Conhecimentos Básicos (P1), Conhecimentos Específicos (P2) e Treino Discursivo (P3).
        </p>
      </div>

      {/* 1. Três Painéis Centrais: P1, P2 e P3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* P1 Card */}
        <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                P1 — Conhecimentos Básicos
              </span>
              <div className="text-xs text-zinc-400 mt-1">90 itens • mínimo 18 pts</div>
            </div>
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Cobertura</span>
              <span className="text-xl font-bold font-mono text-zinc-100">{p1.coveragePercent}%</span>
              <span className="text-[10px] text-zinc-500 block">{p1.startedUnits}/{p1.totalUnits} unidades</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Domínio Médio</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {p1.avgDomain !== null ? `${p1.avgDomain}%` : '—'}
              </span>
              <span className="text-[10px] text-zinc-500 block">Objetivo Cebraspe</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Questões Feitas</span>
              <span className="text-base font-bold font-mono text-zinc-200">{p1.totalQuestions}</span>
              <span className="text-[10px] text-zinc-500 block">{p1.totalCorrect}C • {p1.totalWrong}E</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Nota Líquida</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {p1.totalQuestions > 0 ? (p1.netPoints > 0 ? `+${p1.netPoints}` : p1.netPoints) : '0'} pts
              </span>
              <span className="text-[10px] text-zinc-500 block">Tempo: {formatDurationMinutes(p1.studyMinutes)}</span>
            </div>
          </div>
        </Card>

        {/* P2 Card */}
        <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                P2 — Conhecimentos Específicos
              </span>
              <div className="text-xs text-zinc-400 mt-1">90 itens • mínimo 27 pts</div>
            </div>
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Cobertura</span>
              <span className="text-xl font-bold font-mono text-zinc-100">{p2.coveragePercent}%</span>
              <span className="text-[10px] text-zinc-500 block">{p2.startedUnits}/{p2.totalUnits} unidades</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Domínio Médio</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {p2.avgDomain !== null ? `${p2.avgDomain}%` : '—'}
              </span>
              <span className="text-[10px] text-zinc-500 block">Objetivo Cebraspe</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Questões Feitas</span>
              <span className="text-base font-bold font-mono text-zinc-200">{p2.totalQuestions}</span>
              <span className="text-[10px] text-zinc-500 block">{p2.totalCorrect}C • {p2.totalWrong}E</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Nota Líquida</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {p2.totalQuestions > 0 ? (p2.netPoints > 0 ? `+${p2.netPoints}` : p2.netPoints) : '0'} pts
              </span>
              <span className="text-[10px] text-zinc-500 block">Tempo: {formatDurationMinutes(p2.studyMinutes)}</span>
            </div>
          </div>
        </Card>

        {/* P3 Card (Discursive - does not mix with domain_score) */}
        <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                P3 — Treino Discursivo
              </span>
              <div className="text-xs text-zinc-400 mt-1">60 pts • mínimo 30 pts</div>
            </div>
            <PenTool className="w-5 h-5 text-amber-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Treinos Feitos</span>
              <span className="text-xl font-bold font-mono text-zinc-100">{p3KPIs.totalSessions}</span>
              <span className="text-[10px] text-zinc-500 block">{p3KPIs.question20Count} Q20 • {p3KPIs.technicalPieceCount} Peças</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Média Calculada</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {p3KPIs.totalSessions > 0 ? `${p3KPIs.averageScore} pts` : '—'}
              </span>
              <span className="text-[10px] text-zinc-500 block">Fórmula Cebraspe</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Linhas Escritas</span>
              <span className="text-base font-bold font-mono text-zinc-200">{p3KPIs.totalLinesWritten}</span>
              <span className="text-[10px] text-zinc-500 block">Prática acumulada</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Erros de Escrita</span>
              <span className="text-base font-bold font-mono text-zinc-200">
                {p3KPIs.averageLanguageErrors}
              </span>
              <span className="text-[10px] text-zinc-500 block">Média por treino</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Matriz de Risco (Quadrante Cebraspe) */}
      <Card className="p-5 space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Matriz de Risco do Edital (Prioridade vs Domínio)
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrante 1: Crítico */}
          <div className="p-4 rounded-xl border border-rose-900/80 bg-rose-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-300 uppercase tracking-wider">
                1. Crítico (Alta Prioridade + Baixo Domínio)
              </span>
              <span className="font-mono font-black text-rose-400 text-sm">
                {critical.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Assuntos prioritários para o Cebraspe onde o rendimento está abaixo de 60%. Fila de estudo dá precedência imediata.
            </p>
            {critical.length > 0 && (
              <ul className="text-xs text-zinc-300 space-y-1 pt-1">
                {critical.slice(0, 3).map((t) => (
                  <li key={t.id} className="truncate">
                    • [{t.exam_block_code}] {t.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quadrante 2: Manter */}
          <div className="p-4 rounded-xl border border-emerald-900/80 bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300 uppercase tracking-wider">
                2. Manter (Alta Prioridade + Alto Domínio)
              </span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {maintain.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Conteúdos prioritários já dominados. Recebem apenas manutenção preventiva no TEC para evitar perda de retenção.
            </p>
          </div>

          {/* Quadrante 3: Secundário */}
          <div className="p-4 rounded-xl border border-amber-900/80 bg-amber-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 uppercase tracking-wider">
                3. Secundário (Média/Baixa Prioridade + Baixo Domínio)
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">
                {secondary.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Não devem consumir tempo desproporcional antes dos tópicos críticos.
            </p>
          </div>

          {/* Quadrante 4: Sem Urgência */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-400 uppercase tracking-wider">
                4. Sem Urgência (Média/Baixa + Alto Domínio)
              </span>
              <span className="font-mono font-black text-zinc-300 text-sm">
                {lowUrgency.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Conteúdos dominados com menor densidade de cobrança no edital.
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-5 space-y-3">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Distribuição de Status das Unidades de Estudo</CardTitle>
          </CardHeader>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${Math.round((percent || 0) * 100)}%)`}
                  fontSize={10}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Questões por Disciplina */}
        <Card className="p-5 space-y-3">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Volume de Questões no TEC por Disciplina (9 Disciplinas)</CardTitle>
          </CardHeader>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionsBySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="questoes" fill="#10b981" radius={[4, 4, 0, 0]} name="Questões" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 4. Gamification Analytics (Métricas da Jornada) */}
      {(() => {
        const profile = store.gamificationProfile || {
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          meaningful_days: 0,
          weekly_consistency_days: 0,
          achievements_unlocked: [],
        };
        const txs = store.xpTransactions || [];

        // XP by source type
        const catMap: Record<string, number> = {
          'Questões': 0,
          'Material': 0,
          'Memória': 0,
          'Caderno de Erros': 0,
          'Discursiva (P3)': 0,
          'Simulados/Boss': 0,
          'Missões': 0,
          'Conquistas': 0,
        };

        txs.forEach((t) => {
          if (t.source_type.includes('question')) catMap['Questões'] += t.amount;
          else if (t.source_type.includes('material')) catMap['Material'] += t.amount;
          else if (t.source_type.includes('flashcard')) catMap['Memória'] += t.amount;
          else if (t.source_type.includes('error')) catMap['Caderno de Erros'] += t.amount;
          else if (t.source_type.includes('discursive')) catMap['Discursiva (P3)'] += t.amount;
          else if (t.source_type.includes('mock')) catMap['Simulados/Boss'] += t.amount;
          else if (t.source_type.includes('mission')) catMap['Missões'] += t.amount;
          else if (t.source_type.includes('achievement')) catMap['Conquistas'] += t.amount;
        });

        // Completed vs pending missions
        let completedMissions = 0;
        let totalMissions = 0;
        Object.values(store.dailyMissions || {}).forEach((dayList) => {
          dayList.forEach((m) => {
            totalMissions++;
            if (m.status === 'COMPLETED') completedMissions++;
          });
        });

        return (
          <Card className="p-6 space-y-4 border-zinc-800 bg-zinc-950/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Métricas da Jornada e Engajamento
                </h3>
                <p className="text-xs text-zinc-400">
                  Esforço realizado e consistência da rotina (separadas das métricas acadêmicas).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                Nível {profile.level} • {profile.total_xp.toLocaleString('pt-BR')} XP Total
              </span>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Dias Significativos</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {profile.meaningful_days} dias
                </div>
                <div className="text-[10px] text-zinc-400">Atividades reais executadas</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Maior Sequência</div>
                <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                  {profile.longest_streak} dias
                </div>
                <div className="text-[10px] text-zinc-400">Atual: {profile.current_streak} dias</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Missões Concluídas</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {completedMissions}
                </div>
                <div className="text-[10px] text-zinc-400">De {totalMissions} geradas</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Conquistas</div>
                <div className="text-lg font-black text-purple-400 font-mono mt-0.5">
                  {profile.achievements_unlocked.length} de 16
                </div>
                <div className="text-[10px] text-zinc-400">Marcos desbloqueados</div>
              </div>
            </div>

            {/* XP by Category Breakdown */}
            <div className="pt-2 space-y-2">
              <h4 className="text-xs font-semibold text-zinc-300">XP por Categoria de Estudo</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(catMap).map(([category, amount]) => (
                  <div key={category} className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-xs">
                    <span className="text-zinc-400 text-[11px] block">{category}</span>
                    <span className="font-mono font-bold text-zinc-200">{amount} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
