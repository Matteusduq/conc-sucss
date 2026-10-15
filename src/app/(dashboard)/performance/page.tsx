'use client';

import React, { useState } from 'react';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  TrendingUp,
  Plus,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  Award,
  Calendar,
} from 'lucide-react';
import { formatDateBr } from '@/lib/utils/date';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export default function PerformancePage() {
  const { store, openTecModal } = useModal();
  const [timeFilter, setTimeFilter] = useState<'7' | '30' | '60' | 'ALL'>('30');

  const sessions = store.questionSessions;
  const totalQuestions = sessions.reduce((acc, s) => acc + s.total_questions, 0);
  const totalCorrect = sessions.reduce((acc, s) => acc + s.correct, 0);
  const totalWrong = sessions.reduce((acc, s) => acc + s.wrong, 0);
  const totalBlank = sessions.reduce((acc, s) => acc + s.blank, 0);
  const netPointsTotal = totalCorrect - totalWrong;

  const answered = totalCorrect + totalWrong;
  const accuracyRate = answered > 0 ? (totalCorrect / answered) * 100 : 0;
  const netPointsPerQuestion = totalQuestions > 0 ? (netPointsTotal / totalQuestions).toFixed(2) : '0';

  const totalDurationSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const avgSecondsPerQuestion = totalQuestions > 0 ? Math.round(totalDurationSeconds / totalQuestions) : 0;

  // Chart data: Net score and Accuracy over time
  const chartData = [...sessions]
    .sort((a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime())
    .map((s, idx) => ({
      name: `Sessão ${idx + 1}`,
      data: formatDateBr(s.performed_at),
      liquida: s.net_points,
      acertos: s.correct,
      erros: s.wrong,
      accuracy: Math.round(s.accuracy_rate * 100),
    }));

  const subjectMap = new Map(store.subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(store.topics.map((t) => [t.id, t]));

  // Domain by subject
  const subjectDomains = store.subjects.map((sub) => {
    const subTopics = store.topics.filter((t) => t.subject_id === sub.id && t.domain_score !== null);
    const avgDomain =
      subTopics.length > 0
        ? Math.round(subTopics.reduce((sum, t) => sum + (t.domain_score || 0), 0) / subTopics.length)
        : 0;

    return {
      name: sub.name.split(' ')[0], // short name
      fullName: sub.name,
      dominio: avgDomain,
      topicosAvaliados: subTopics.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Desempenho & Métricas Cebraspe
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Acompanhamento rigoroso de acertos, penalização de erros e evolução da nota líquida.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openTecModal()}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Registrar Sessão TEC
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Total Resolvido
          </span>
          <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
            {totalQuestions}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
            <span className="text-emerald-400 font-bold">{totalCorrect} certas</span>
            <span>•</span>
            <span className="text-rose-400 font-bold">{totalWrong} erradas</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Nota Líquida Cebraspe
          </span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {netPointsTotal > 0 ? `+${netPointsTotal}` : netPointsTotal} pts
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            {netPointsPerQuestion} pts líquidos / questão
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Taxa de Acurácia
          </span>
          <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
            {totalQuestions > 0 ? `${Math.round(accuracyRate)}%` : '-'}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Acertos sobre respondidas</p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Tempo Médio
          </span>
          <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
            {avgSecondsPerQuestion > 0 ? `${avgSecondsPerQuestion}s` : '-'}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Por questão Cebraspe</p>
        </Card>
      </div>

      {/* Main Charts Area */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Você ainda não registrou nenhuma sessão do TEC"
          description="Quando você fizer uma bateria de questões externa no TEC Concursos, registre o número de acertos, erros e em branco para visualizar a evolução gráfica da nota líquida."
          action={
            <Button size="sm" onClick={() => openTecModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Registrar Primeira Sessão
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Nota Líquida Cebraspe */}
          <Card className="p-5 space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Evolução da Nota Líquida por Sessão</CardTitle>
            </CardHeader>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="data" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="liquida"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    name="Nota Líquida"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Domínio por Disciplina */}
          <Card className="p-5 space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Domínio Médio por Disciplina (0–100%)</CardTitle>
            </CardHeader>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectDomains}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" domain={[0, 100]} fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  />
                  <Bar dataKey="dominio" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Domínio %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* History Table */}
      {sessions.length > 0 && (
        <Card className="p-5 space-y-3">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Histórico de Sessões Registradas</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2">Data</th>
                  <th className="py-2">Tópico</th>
                  <th className="py-2 text-center">Total</th>
                  <th className="py-2 text-center text-emerald-400">Certas</th>
                  <th className="py-2 text-center text-rose-400">Erradas</th>
                  <th className="py-2 text-center">Brancas</th>
                  <th className="py-2 text-right">Nota Líquida</th>
                  <th className="py-2 text-right">Percepção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {sessions.map((s) => {
                  const topic = topicMap.get(s.topic_id);
                  return (
                    <tr key={s.id} className="hover:bg-zinc-900/50">
                      <td className="py-2.5 text-zinc-400">{formatDateBr(s.performed_at)}</td>
                      <td className="py-2.5 font-sans font-medium text-zinc-200">
                        {topic?.name || 'Tópico'}
                      </td>
                      <td className="py-2.5 text-center text-zinc-300">{s.total_questions}</td>
                      <td className="py-2.5 text-center text-emerald-400 font-bold">{s.correct}</td>
                      <td className="py-2.5 text-center text-rose-400 font-bold">{s.wrong}</td>
                      <td className="py-2.5 text-center text-zinc-500">{s.blank}</td>
                      <td className="py-2.5 text-right font-black">
                        <span className={s.net_points > 0 ? 'text-emerald-400' : s.net_points < 0 ? 'text-rose-400' : 'text-zinc-400'}>
                          {s.net_points > 0 ? `+${s.net_points}` : s.net_points}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-sans text-[11px] text-zinc-400">
                        {s.subjective_feeling}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
