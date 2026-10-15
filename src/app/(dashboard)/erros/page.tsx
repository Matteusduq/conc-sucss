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
} from 'lucide-react';
import { ERROR_TYPE_OPTIONS } from '@/components/performance/ErrorLogModal';
import { formatDateBr } from '@/lib/utils/date';
import { saveStore } from '@/lib/data/store';

export default function ErrosPage() {
  const { store, openErrorModal, openCardModal, refreshStore } = useModal();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterResolved, setFilterResolved] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');

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

  const toggleResolved = (errorId: string) => {
    const updatedErrors = store.errorLogs.map((e) => {
      if (e.id === errorId) {
        return {
          ...e,
          resolved: !e.resolved,
          resolved_at: !e.resolved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
      }
      return e;
    });

    const updatedStore = {
      ...store,
      errorLogs: updatedErrors,
    };
    saveStore(updatedStore);
    refreshStore();
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
