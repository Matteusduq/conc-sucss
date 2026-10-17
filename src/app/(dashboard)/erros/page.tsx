'use client';

import React, { useState, useMemo } from 'react';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  AlertOctagon,
  Plus,
  Brain,
  CheckCircle,
  Clock,
  Sparkles,
  PieChart,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ERROR_TYPE_OPTIONS } from '@/components/performance/ErrorLogModal';
import { formatDateBr } from '@/lib/utils/date';

export default function ErrosPage() {
  const { store, openErrorModal, openCardModal, refreshStore, updateStore } = useModal();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterResolved, setFilterResolved] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('ALL');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAnalyzeErrors = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/error-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicFilter !== 'ALL' ? selectedTopicFilter : undefined,
          force: Boolean(aiAnalysis),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao analisar erros.');
      }
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      setAiError(err.message || 'Erro ao carregar análise de erros.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const errors = store.errorLogs;
  const topicMap = useMemo(() => new Map(store.topics.map((t) => [t.id, t])), [store.topics]);
  const subjectMap = useMemo(() => new Map(store.subjects.map((s) => [s.id, s.name])), [store.subjects]);

  const filteredErrors = errors.filter((err) => {
    if (filterType !== 'ALL' && err.error_type !== filterType) return false;
    if (filterResolved === 'UNRESOLVED' && err.resolved) return false;
    if (filterResolved === 'RESOLVED' && !err.resolved) return false;
    return true;
  });

  // Calculate aggregation statistics (Requirement 15 & 41)
  const totalErrors = errors.length;
  const errorCountsByType: Record<string, number> = {};
  errors.forEach((e) => {
    errorCountsByType[e.error_type] = (errorCountsByType[e.error_type] || 0) + 1;
  });

  const topErrorPatterns = Object.entries(errorCountsByType)
    .sort((a, b) => b[1] - a[1])
    .map(([typeKey, count]) => {
      const opt = ERROR_TYPE_OPTIONS.find((o) => o.id === typeKey);
      const percent = totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0;
      return {
        label: opt?.label || typeKey,
        count,
        percent,
      };
    });

  const toggleResolved = async (errorId: string) => {
    let resolvedItem: (typeof errors)[0] | undefined;
    const updatedErrors = store.errorLogs.map((e) => {
      if (e.id === errorId) {
        resolvedItem = {
          ...e,
          resolved: !e.resolved,
          resolved_at: !e.resolved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
        return resolvedItem;
      }
      return e;
    });

    const updatedStore = {
      ...store,
      errorLogs: updatedErrors,
    };

    await updateStore(
      () => updatedStore,
      async (repo, uId) => {
        if (resolvedItem) {
          await repo.persistErrorLog(uId, resolvedItem);
        }
      }
    );
  };

  const handleConvertToFlashcard = (err: (typeof errors)[0]) => {
    const topic = topicMap.get(err.topic_id);
    const frontText = `[${err.error_type}] ${err.summary}`;
    const backText = err.correct_rule
      ? `${err.correct_rule}${err.personal_note ? `\n\nNota: ${err.personal_note}` : ''}`
      : err.summary;

    openCardModal({
      topicId: err.topic_id,
      front: frontText,
      back: backText,
      errorId: err.id,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Caderno de Erros Cognitivo
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Catalogação de pegadinhas Cebraspe, confusões conceituais e conversão em flashcards FSRS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openErrorModal()}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Catalogar Novo Erro
          </Button>
        </div>
      </div>

      {/* AI Error Diagnosis Section */}
      <Card className="p-4 md:p-5 border-zinc-800 bg-zinc-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Diagnóstico de Padrões com IA
                <span className="text-[10px] font-normal text-zinc-400 font-mono">Xkiro · Qwen</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Detecção de pegadinhas Cebraspe recorrentes, causas conceituais e recomendações de memorização.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
            >
              <option value="ALL">Todos os Tópicos</option>
              {store.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyzeErrors}
              disabled={isAnalyzing}
              className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Diagnosticando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  {aiAnalysis ? 'Atualizar Diagnóstico' : 'Analisar padrões com IA'}
                </>
              )}
            </Button>
          </div>
        </div>

        {aiError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiAnalysis && (
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3.5 text-xs text-zinc-300 animate-in fade-in duration-300">
            <div>
              <span className="font-semibold text-zinc-200">Diagnóstico Geral:</span>
              <p className="text-zinc-300 mt-1 leading-relaxed">{aiAnalysis.summary}</p>
            </div>

            {aiAnalysis.patterns && aiAnalysis.patterns.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <span className="font-semibold text-zinc-200 block">Armadilhas & Padrões Detectados:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {aiAnalysis.patterns.map((pat: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between text-zinc-300 font-bold">
                        <span>{pat.pattern}</span>
                        {pat.cebraspeTrap && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Pegadinha Cebraspe
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-[11px]"><strong className="text-zinc-300">Causa:</strong> {pat.possibleCause}</p>
                      {pat.cebraspeTrap && (
                        <p className="text-amber-300/90 text-[11px]"><strong className="text-amber-400">Armadilha:</strong> {pat.cebraspeTrap}</p>
                      )}
                      <p className="text-zinc-400 text-[11px]"><strong className="text-zinc-300">Revisão:</strong> {pat.suggestedReview}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/60">
                <span className="font-semibold text-zinc-200 mb-1 block">Recomendações Práticas:</span>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Aggregate Pattern Insights (Requirement 15) */}
      {topErrorPatterns.length > 0 && (
        <Card className="p-4 bg-zinc-950/80 border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
            <PieChart className="w-3.5 h-3.5" /> Padrões Recorrentes de Erro Identificados
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topErrorPatterns.slice(0, 3).map((pat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-semibold text-zinc-200">{pat.label}</span>
                  <span className="font-bold text-amber-400 font-mono">{pat.percent}%</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {pat.count} falha{pat.count > 1 ? 's' : ''} catalogada{pat.count > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 focus:outline-none"
          >
            <option value="ALL">Todos os Tipos de Erro</option>
            {ERROR_TYPE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="UNRESOLVED">Não Resolvidos</option>
            <option value="RESOLVED">Resolvidos</option>
          </select>
        </div>

        <span className="text-zinc-400 text-xs">
          {filteredErrors.length} erro{filteredErrors.length !== 1 ? 's' : ''} listado{filteredErrors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Errors List */}
      {filteredErrors.length === 0 ? (
        <EmptyState
          icon={AlertOctagon}
          title="Nenhum erro catalogado com os filtros atuais"
          description="Quando você errar uma questão no TEC Concursos, registre a causa raiz cognitiva para treinar a banca e gerar flashcards preventivos."
          action={
            <Button size="sm" onClick={() => openErrorModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Catalogar Erro
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredErrors.map((err) => {
            const topic = topicMap.get(err.topic_id);
            const subject = topic ? subjectMap.get(topic.subject_id) : undefined;
            const typeDef = ERROR_TYPE_OPTIONS.find((o) => o.id === err.error_type);

            return (
              <Card
                key={err.id}
                className={`p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all ${
                  err.resolved ? 'opacity-60 bg-zinc-950/40' : 'bg-zinc-900/40'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {subject} • {topic?.name}
                    </span>
                    <Badge variant={err.severity === 'HIGH' ? 'danger' : 'warning'}>
                      {err.severity === 'HIGH' ? 'Severidade Alta' : 'Severidade Média'}
                    </Badge>
                    <Badge variant="neutral">
                      {typeDef?.label || err.error_type}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{err.summary}</h4>
                    {err.correct_rule && (
                      <p className="text-xs text-emerald-400 font-mono mt-1 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/40">
                        <strong>Regra Correta:</strong> {err.correct_rule}
                      </p>
                    )}
                    {err.personal_note && (
                      <p className="text-xs text-zinc-400 mt-1 italic">
                        &ldquo;{err.personal_note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConvertToFlashcard(err)}
                    className="text-xs"
                    title="Criar Flashcard FSRS com este erro"
                  >
                    <Brain className="w-3.5 h-3.5 mr-1 text-purple-400" />
                    Criar Cartão
                  </Button>

                  <Button
                    size="sm"
                    variant={err.resolved ? 'ghost' : 'secondary'}
                    onClick={() => toggleResolved(err.id)}
                    className="text-xs"
                  >
                    <CheckCircle
                      className={`w-3.5 h-3.5 mr-1 ${err.resolved ? 'text-emerald-400' : 'text-zinc-400'}`}
                    />
                    {err.resolved ? 'Resolvido' : 'Marcar Resolvido'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
