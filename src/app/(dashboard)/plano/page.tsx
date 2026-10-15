'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { PriorityBadge } from '@/components/study/PriorityBadge';
import { StatusBadge } from '@/components/study/StatusBadge';
import { DomainScore } from '@/components/study/DomainScore';
import { StudyScoreBadge } from '@/components/study/StudyScoreBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Search,
  Filter,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Priority, TopicStatus } from '@/types/database';
import { formatDateBr } from '@/lib/utils/date';

export default function PlanoPage() {
  const { store, openTecModal } = useModal();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [onlyAtRisk, setOnlyAtRisk] = useState<boolean>(false);
  const [onlyAwaitingQuestions, setOnlyAwaitingQuestions] = useState<boolean>(false);

  const subjectMap = useMemo(() => {
    return new Map(store.subjects.map((s) => [s.id, s.name]));
  }, [store.subjects]);

  const filteredTopics = useMemo(() => {
    return store.topics.filter((topic) => {
      if (selectedSubject !== 'ALL' && topic.subject_id !== selectedSubject) return false;
      if (selectedPriority !== 'ALL' && topic.priority !== selectedPriority) return false;
      if (selectedStatus !== 'ALL' && topic.status !== selectedStatus) return false;
      if (onlyAtRisk && topic.status !== 'AT_RISK') return false;
      if (onlyAwaitingQuestions && topic.status !== 'AWAITING_QUESTIONS') return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = topic.name.toLowerCase().includes(query);
        const matchesSub = (subjectMap.get(topic.subject_id) || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSub) return false;
      }

      return true;
    });
  }, [
    store.topics,
    selectedSubject,
    selectedPriority,
    selectedStatus,
    onlyAtRisk,
    onlyAwaitingQuestions,
    search,
    subjectMap,
  ]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Plano do Edital & Hierarquia de Estudos
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Mapeamento completo dos tópicos da Câmara dos Deputados organizados por prioridade e status dinâmico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openTecModal()}>
            + Registrar Sessão TEC
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por tópico ou palavra-chave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="ALL">Todas as Disciplinas</option>
              {store.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="ALL">Todas as Prioridades</option>
              <option value="HIGH">Alta Prioridade</option>
              <option value="MEDIUM">Média Prioridade</option>
              <option value="LOW">Baixa Prioridade</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="NOT_STARTED">Não iniciado</option>
              <option value="LEARNING">Lendo teoria</option>
              <option value="AWAITING_QUESTIONS">Aguardando TEC</option>
              <option value="CONSOLIDATING">Consolidando</option>
              <option value="MASTERED">Dominado</option>
              <option value="MAINTENANCE">Manutenção</option>
              <option value="AT_RISK">Em risco</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          <span className="text-zinc-500 text-[11px] font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtros rápidos:
          </span>
          <button
            onClick={() => setOnlyAtRisk(!onlyAtRisk)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              onlyAtRisk
                ? 'bg-rose-950 border-rose-800 text-rose-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Apenas em Risco
          </button>
          <button
            onClick={() => setOnlyAwaitingQuestions(!onlyAwaitingQuestions)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              onlyAwaitingQuestions
                ? 'bg-amber-950 border-amber-800 text-amber-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Aguardando Questões TEC
          </button>
        </div>
      </Card>

      {/* Topics Table List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            Mostrando <strong>{filteredTopics.length}</strong> de {store.topics.length} tópicos do edital
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
          {filteredTopics.map((topic) => {
            const subjectName = subjectMap.get(topic.subject_id) || 'Geral';
            const material = store.materials.find((m) => m.topic_id === topic.id);
            const progress = material ? store.materialProgress[material.id] : undefined;

            return (
              <div
                key={topic.id}
                className="p-4 hover:bg-zinc-900/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Topic Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {subjectName}
                    </span>
                    <PriorityBadge priority={topic.priority} />
                    <StatusBadge status={topic.status} />
                    <StudyScoreBadge score={topic.study_score} />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight leading-snug">
                    {topic.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span>Material: {topic.recommended_material_type}</span>
                    <span>•</span>
                    <span>Cobertura: {progress ? `${progress.progress_percent}%` : '0%'}</span>
                    <span>•</span>
                    <span>Último treino: {formatDateBr(topic.last_studied_at)}</span>
                  </div>
                </div>

                {/* Domain & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/60">
                  <DomainScore score={topic.domain_score} confidence={topic.domain_confidence} />

                  <div className="flex items-center gap-2">
                    <Link href={`/estudar/${topic.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        <BookOpen className="w-3.5 h-3.5 mr-1" />
                        Teoria
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => openTecModal(topic.id)}
                      className="text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Treinar no TEC
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
