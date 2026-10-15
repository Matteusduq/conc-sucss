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

export default function AnalyticsPage() {
  const { store } = useModal();

  const totalTopics = store.topics.length;
  const startedTopics = store.topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const awaitingQuestions = store.topics.filter((t) => t.status === 'AWAITING_QUESTIONS').length;
  const masteredTopics = store.topics.filter((t) => t.status === 'MASTERED' || t.status === 'MAINTENANCE').length;

  const coveragePercent = Math.round((startedTopics / Math.max(1, totalTopics)) * 100);
  const masteredPercent = Math.round((masteredTopics / Math.max(1, totalTopics)) * 100);

  // Risk Matrix Quadrants (Requirement 42)
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
    { name: 'Aguardando TEC', value: awaitingQuestions, color: '#f59e0b' },
    { name: 'Consolidando', value: store.topics.filter((t) => t.status === 'CONSOLIDATING').length, color: '#eab308' },
    { name: 'Dominado / Manutenção', value: masteredTopics, color: '#10b981' },
    { name: 'Em Risco', value: store.topics.filter((t) => t.status === 'AT_RISK').length, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Performance by Subject
  const subjectMap = new Map(store.subjects.map((s) => [s.id, s.name]));
  const questionsBySubject = store.subjects.map((sub) => {
    const subSessions = store.questionSessions.filter((s) => s.subject_id === sub.id);
    const questions = subSessions.reduce((sum, s) => sum + s.total_questions, 0);
    const net = subSessions.reduce((sum, s) => sum + s.net_points, 0);

    return {
      name: sub.name.split(' ')[0],
      fullName: sub.name,
      questoes: questions,
      liquida: net,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
          Analytics Determinístico & Matriz de Risco
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Auditoria transparente da preparação para o concurso da Câmara dos Deputados baseada exclusivamente em dados reais.
        </p>
      </div>

      {/* 1. Cobertura do Edital */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Edital Iniciado
          </span>
          <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
            {coveragePercent}%
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            {startedTopics} de {totalTopics} tópicos iniciados
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Aguardando Questões TEC
          </span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {awaitingQuestions}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            Teoria lida sem validação prática
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Tópicos Consolidados / Dominados
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {masteredPercent}%
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            {masteredTopics} tópicos com domínio &gt;= 85%
          </p>
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
              Assuntos mais cobrados pela banca onde o desempenho está abaixo da meta. Fila de estudo dá prioridade máxima a estes tópicos.
            </p>
            {critical.length > 0 && (
              <ul className="text-xs text-zinc-300 space-y-1 pt-1">
                {critical.slice(0, 3).map((t) => (
                  <li key={t.id} className="truncate">
                    • {t.name}
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
              Conteúdos prioritários já consolidados. Devem receber apenas sessões espaçadas de manutenção preventiva no TEC.
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
              Conteúdos dominados com baixo peso no edital. Manter em repouso.
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-5 space-y-3">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Distribuição de Status dos Tópicos</CardTitle>
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
            <CardTitle className="text-sm">Volume de Questões no TEC por Disciplina</CardTitle>
          </CardHeader>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionsBySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="questoes" fill="#10b981" radius={[4, 4, 0, 0]} name="Questões" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
