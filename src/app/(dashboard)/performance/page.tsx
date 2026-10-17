'use client';

import React, { useState, useMemo } from 'react';
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
  Sparkles,
  AlertCircle,
  Loader2,
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
} from 'recharts';

export default function PerformancePage() {
  const { store, openTecModal } = useModal();
  const [selectedBlock, setSelectedBlock] = useState<'ALL' | 'P1' | 'P2'>('ALL');
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<any>(null);
  const [isAnalyzingWeekly, setIsAnalyzingWeekly] = useState(false);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  const handleRunWeeklyAnalysis = async () => {
    setIsAnalyzingWeekly(true);
    setWeeklyError(null);
    try {
      const res = await fetch('/api/ai/weekly-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: Boolean(weeklyAnalysis) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar análise.');
      }
      setWeeklyAnalysis(data.analysis);
    } catch (err: any) {
      setWeeklyError(err.message || 'Erro ao carregar análise de IA.');
    } finally {
      setIsAnalyzingWeekly(false);
    }
  };

  const topicMap = useMemo(() => new Map(store.topics.map((t) => [t.id, t])), [store.topics]);
  const subjectMap = useMemo(() => new Map(store.subjects.map((s) => [s.id, s.name])), [store.subjects]);

  // Filter sessions based on topic's exam_block_code
  const filteredSessions = useMemo(() => {
    return store.questionSessions.filter((s) => {
      if (selectedBlock === 'ALL') return true;
      const topic = topicMap.get(s.topic_id);
      return topic && topic.exam_block_code === selectedBlock;
    });
  }, [store.questionSessions, selectedBlock, topicMap]);

  // Compute breakdown metrics for P1, P2 and Total
  const computeMetrics = (blockCode?: 'P1' | 'P2') => {
    const list = store.questionSessions.filter((s) => {
      if (!blockCode) return true;
      const topic = topicMap.get(s.topic_id);
      return topic && topic.exam_block_code === blockCode;
    });

    const totalQuestions = list.reduce((acc, s) => acc + s.total_questions, 0);
    const correct = list.reduce((acc, s) => acc + s.correct, 0);
    const wrong = list.reduce((acc, s) => acc + s.wrong, 0);
    const blank = list.reduce((acc, s) => acc + s.blank, 0);
    const netPoints = correct - wrong;
    const answered = correct + wrong;
    const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

    return {
      totalQuestions,
      correct,
      wrong,
      blank,
      netPoints,
      accuracy,
      sessionCount: list.length,
    };
  };

  const p1Metrics = useMemo(() => computeMetrics('P1'), [store.questionSessions, topicMap]);
  const p2Metrics = useMemo(() => computeMetrics('P2'), [store.questionSessions, topicMap]);
  const totalMetrics = useMemo(() => computeMetrics(), [store.questionSessions, topicMap]);

  const activeMetrics =
    selectedBlock === 'P1' ? p1Metrics : selectedBlock === 'P2' ? p2Metrics : totalMetrics;

  // Chart data: Net score and Accuracy over time for filtered sessions
  const chartData = [...filteredSessions]
    .sort((a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime())
    .map((s, idx) => ({
      name: `Sessão ${idx + 1}`,
      data: formatDateBr(s.performed_at),
      liquida: s.net_points,
      acertos: s.correct,
      erros: s.wrong,
      accuracy: Math.round(s.accuracy_rate * 100),
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Desempenho & Métricas Cebraspe
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Acompanhamento de nota líquida (C - E), acurácia e aproveitamento por bloco (P1 / P2).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openTecModal()}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Registrar Sessão TEC
          </Button>
        </div>
      </div>

      {/* Discrete AI Weekly Analysis Section */}
      <Card className="p-4 md:p-5 border-zinc-800 bg-zinc-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Análise da IA — Desempenho Semanal
                <span className="text-[10px] font-normal text-zinc-400 font-mono">Xkiro · Qwen</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Diagnóstico pedagógico e equilíbrio entre teoria, questões, revisões FSRS e discursiva.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunWeeklyAnalysis}
            disabled={isAnalyzingWeekly}
            className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10 shrink-0"
          >
            {isAnalyzingWeekly ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {weeklyAnalysis ? 'Atualizar Análise da Semana' : 'Analisar minha última semana'}
              </>
            )}
          </Button>
        </div>

        {weeklyError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{weeklyError}</span>
          </div>
        )}

        {weeklyAnalysis && (
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3.5 text-xs text-zinc-300 animate-in fade-in duration-300">
            <div>
              <span className="font-semibold text-zinc-200">Resumo da Semana:</span>
              <p className="text-zinc-300 mt-1 leading-relaxed">{weeklyAnalysis.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
              <div>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Pontos Fortes & Evolução
                </span>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  {weeklyAnalysis.strongAreas?.length > 0 ? (
                    weeklyAnalysis.strongAreas.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))
                  ) : (
                    <li>Sem áreas de destaque registradas ainda</li>
                  )}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Alertas & Pontos de Atenção
                </span>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  {weeklyAnalysis.weakAreas?.length > 0 ? (
                    weeklyAnalysis.weakAreas.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))
                  ) : (
                    <li>Nenhuma área crítica detectada</li>
                  )}
                </ul>
              </div>
            </div>

            {weeklyAnalysis.balanceAnalysis && (
              <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                  <span className="font-bold text-zinc-400 block mb-0.5">Teoria</span>
                  <span className="text-zinc-300">{weeklyAnalysis.balanceAnalysis.theory}</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                  <span className="font-bold text-zinc-400 block mb-0.5">Questões</span>
                  <span className="text-zinc-300">{weeklyAnalysis.balanceAnalysis.questions}</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                  <span className="font-bold text-zinc-400 block mb-0.5">FSRS</span>
                  <span className="text-zinc-300">{weeklyAnalysis.balanceAnalysis.memory}</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                  <span className="font-bold text-zinc-400 block mb-0.5">Discursiva</span>
                  <span className="text-zinc-300">{weeklyAnalysis.balanceAnalysis.discursive}</span>
                </div>
              </div>
            )}

            {weeklyAnalysis.recommendations && weeklyAnalysis.recommendations.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/60">
                <span className="font-semibold text-zinc-200 mb-1.5 block">Recomendações Prioritárias:</span>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  {weeklyAnalysis.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Block Filter Switcher */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 font-medium mr-1">Filtrar Bloco:</span>
        {(['ALL', 'P1', 'P2'] as const).map((block) => (
          <button
            key={block}
            onClick={() => setSelectedBlock(block)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlock === block
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            {block === 'ALL'
              ? 'Total (P1 + P2)'
              : block === 'P1'
              ? 'P1 — Conhecimentos Básicos'
              : 'P2 — Conhecimentos Específicos'}
          </button>
        ))}
      </div>

      {/* Block Comparison Matrix: P1, P2, Total */}
      <Card className="p-4 bg-zinc-900/40 border-zinc-800 space-y-3">
        <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          Quadro Comparativo Oficial (P1 vs P2)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                <th className="py-2 px-3">Bloco da Prova</th>
                <th className="py-2 px-3 text-center">Questões Feitas</th>
                <th className="py-2 px-3 text-center">Certas (C)</th>
                <th className="py-2 px-3 text-center">Erradas (E)</th>
                <th className="py-2 px-3 text-center">Brancas (B)</th>
                <th className="py-2 px-3 text-center">Acurácia (%)</th>
                <th className="py-2 px-3 text-right">Nota Líquida (C - E)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {/* P1 */}
              <tr className={selectedBlock === 'P1' ? 'bg-zinc-800/40 font-semibold' : ''}>
                <td className="py-2.5 px-3 text-blue-400 font-bold font-mono">
                  P1 — Conhecimentos Básicos (90 itens)
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-200">
                  {p1Metrics.totalQuestions}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-emerald-400">
                  {p1Metrics.correct}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-rose-400">
                  {p1Metrics.wrong}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-400">
                  {p1Metrics.blank}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-200">
                  {p1Metrics.totalQuestions > 0 ? `${p1Metrics.accuracy.toFixed(1)}%` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-emerald-400">
                  {p1Metrics.totalQuestions > 0
                    ? p1Metrics.netPoints > 0
                      ? `+${p1Metrics.netPoints}`
                      : p1Metrics.netPoints
                    : '0'}
                </td>
              </tr>

              {/* P2 */}
              <tr className={selectedBlock === 'P2' ? 'bg-zinc-800/40 font-semibold' : ''}>
                <td className="py-2.5 px-3 text-purple-400 font-bold font-mono">
                  P2 — Conhecimentos Específicos (90 itens)
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-200">
                  {p2Metrics.totalQuestions}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-emerald-400">
                  {p2Metrics.correct}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-rose-400">
                  {p2Metrics.wrong}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-400">
                  {p2Metrics.blank}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-200">
                  {p2Metrics.totalQuestions > 0 ? `${p2Metrics.accuracy.toFixed(1)}%` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-emerald-400">
                  {p2Metrics.totalQuestions > 0
                    ? p2Metrics.netPoints > 0
                      ? `+${p2Metrics.netPoints}`
                      : p2Metrics.netPoints
                    : '0'}
                </td>
              </tr>

              {/* Total */}
              <tr className="bg-zinc-950/80 font-bold border-t border-zinc-700">
                <td className="py-3 px-3 text-white">
                  Total Geral (P1 + P2)
                </td>
                <td className="py-3 px-3 text-center font-mono text-white">
                  {totalMetrics.totalQuestions}
                </td>
                <td className="py-3 px-3 text-center font-mono text-emerald-400">
                  {totalMetrics.correct}
                </td>
                <td className="py-3 px-3 text-center font-mono text-rose-400">
                  {totalMetrics.wrong}
                </td>
                <td className="py-3 px-3 text-center font-mono text-zinc-400">
                  {totalMetrics.blank}
                </td>
                <td className="py-3 px-3 text-center font-mono text-white">
                  {totalMetrics.totalQuestions > 0 ? `${totalMetrics.accuracy.toFixed(1)}%` : '—'}
                </td>
                <td className="py-3 px-3 text-right font-mono text-base text-emerald-400">
                  {totalMetrics.totalQuestions > 0
                    ? totalMetrics.netPoints > 0
                      ? `+${totalMetrics.netPoints}`
                      : totalMetrics.netPoints
                    : '0'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Active Filter KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Questões ({selectedBlock})
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {activeMetrics.totalQuestions}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {activeMetrics.correct}C • {activeMetrics.wrong}E • {activeMetrics.blank}B
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Acurácia Bruta
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {activeMetrics.totalQuestions > 0 ? `${Math.round(activeMetrics.accuracy)}%` : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Certas / (Certas + Erradas)
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/60 border-zinc-800 border-l-4 border-l-amber-500">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Nota Líquida Cebraspe
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {activeMetrics.totalQuestions > 0
              ? activeMetrics.netPoints > 0
                ? `+${activeMetrics.netPoints}`
                : activeMetrics.netPoints
              : '0'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Regra Cebraspe: C - E
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Sessões Registradas
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {activeMetrics.sessionCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Via TEC Concursos
          </div>
        </Card>
      </div>

      {/* Evolution Chart */}
      {chartData.length > 0 ? (
        <Card className="p-5 bg-zinc-900/40 border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100">
              Evolução da Nota Líquida ({selectedBlock === 'ALL' ? 'Total' : selectedBlock})
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Linha temporal</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="data" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="liquida"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Pontos Líquidos"
                  dot={{ fill: '#10b981', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  name="Acurácia (%)"
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Nenhuma sessão de questões registrada para este filtro"
          description="Resolva baterias de questões no TEC Concursos e registre seu desempenho para acompanhar as métricas oficiais Cebraspe."
          action={
            <Button size="sm" onClick={() => openTecModal()}>
              Registrar sessão do TEC
            </Button>
          }
        />
      )}

      {/* Session History List */}
      <Card className="p-5 bg-zinc-900/40 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Histórico Detalhado de Sessões</h2>
          <span className="text-xs text-zinc-400 font-mono">
            {filteredSessions.length} sessão(ões)
          </span>
        </div>

        {filteredSessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Bloco</th>
                  <th className="py-2.5 px-3">Disciplina</th>
                  <th className="py-2.5 px-3">Unidade de Estudo</th>
                  <th className="py-2.5 px-3 text-center">Questões</th>
                  <th className="py-2.5 px-3 text-center">C / E / B</th>
                  <th className="py-2.5 px-3 text-center">Acurácia</th>
                  <th className="py-2.5 px-3 text-right">Nota Líquida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredSessions.map((s) => {
                  const topic = topicMap.get(s.topic_id);
                  const blockCode = topic?.exam_block_code || 'P1';

                  return (
                    <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-zinc-300 whitespace-nowrap text-[11px]">
                        {formatDateBr(s.performed_at)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            blockCode === 'P1'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {blockCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-medium">
                        {subjectMap.get(s.subject_id) || '—'}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{topic?.name || '—'}</td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-200">
                        {s.total_questions}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs whitespace-nowrap">
                        <span className="text-emerald-400 font-semibold">{s.correct}</span>
                        <span className="text-zinc-500"> / </span>
                        <span className="text-rose-400 font-semibold">{s.wrong}</span>
                        <span className="text-zinc-500"> / </span>
                        <span className="text-zinc-400">{s.blank}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-200">
                        {Math.round(s.accuracy_rate * 100)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm whitespace-nowrap">
                        <span
                          className={
                            s.net_points > 0
                              ? 'text-emerald-400'
                              : s.net_points < 0
                              ? 'text-rose-400'
                              : 'text-zinc-400'
                          }
                        >
                          {s.net_points > 0 ? `+${s.net_points}` : s.net_points} pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
