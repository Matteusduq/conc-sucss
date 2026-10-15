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
  ChevronDown,
  ChevronUp,
  FileText,
  PenTool,
  CheckCircle2,
} from 'lucide-react';
import { Priority, RecommendedMaterialType } from '@/types/database';
import { formatDateBr } from '@/lib/utils/date';
import { updateTopicPriorityAction, saveStore } from '@/lib/data/store';

export default function PlanoPage() {
  const { store, openTecModal, refreshStore } = useModal();
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<'ALL' | 'P1' | 'P2'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [onlyAtRisk, setOnlyAtRisk] = useState<boolean>(false);
  const [onlyAwaitingQuestions, setOnlyAwaitingQuestions] = useState<boolean>(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const subjectMap = useMemo(() => {
    return new Map(store.subjects.map((s) => [s.id, s]));
  }, [store.subjects]);

  // Map topicId -> SyllabusItem[]
  const topicSyllabusMap = useMemo(() => {
    const map = new Map<string, typeof store.syllabusItems>();
    const syllabusItemById = new Map(store.syllabusItems.map((si) => [si.id, si]));

    for (const rel of store.topicSyllabusItems || []) {
      const item = syllabusItemById.get(rel.syllabus_item_id);
      if (item) {
        const list = map.get(rel.topic_id) || [];
        list.push(item);
        map.set(rel.topic_id, list);
      }
    }
    return map;
  }, [store.syllabusItems, store.topicSyllabusItems]);

  const filteredTopics = useMemo(() => {
    return store.topics.filter((topic) => {
      if (selectedBlock !== 'ALL' && topic.exam_block_code !== selectedBlock) return false;
      if (selectedSubject !== 'ALL' && topic.subject_id !== selectedSubject) return false;
      if (selectedPriority !== 'ALL' && topic.priority !== selectedPriority) return false;
      if (selectedStatus !== 'ALL' && topic.status !== selectedStatus) return false;
      if (onlyAtRisk && topic.status !== 'AT_RISK') return false;
      if (onlyAwaitingQuestions && topic.status !== 'AWAITING_QUESTIONS') return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = topic.name.toLowerCase().includes(query);
        const sub = subjectMap.get(topic.subject_id);
        const matchesSub = (sub?.name || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSub) return false;
      }

      return true;
    });
  }, [
    store.topics,
    selectedBlock,
    selectedSubject,
    selectedPriority,
    selectedStatus,
    onlyAtRisk,
    onlyAwaitingQuestions,
    search,
    subjectMap,
  ]);

  const handlePriorityChange = (topicId: string, newPriority: Priority) => {
    const nextStore = updateTopicPriorityAction(topicId, newPriority, undefined, store);
    saveStore(nextStore);
    refreshStore();
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Plano do Edital & Unidades de Estudo
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            76 unidades de estudo práticas cobrindo integralmente o Edital nº 1/2026 da Câmara dos Deputados (P1 e P2).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openTecModal()}>
            + Registrar Sessão TEC
          </Button>
        </div>
      </div>

      {/* Block Selector Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 font-medium mr-1">Bloco da Prova:</span>
        {(['ALL', 'P1', 'P2'] as const).map((block) => (
          <button
            key={block}
            onClick={() => {
              setSelectedBlock(block);
              setSelectedSubject('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBlock === block
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            {block === 'ALL'
              ? 'Todos os Blocos (P1 + P2)'
              : block === 'P1'
              ? 'P1 — Conhecimentos Básicos (90 itens)'
              : 'P2 — Conhecimentos Específicos (90 itens)'}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por unidade de estudo, matéria ou conteúdo..."
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
              {store.subjects
                .filter((s) => selectedBlock === 'ALL' || s.exam_block_code === selectedBlock)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.exam_block_code}] {s.name}
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
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs flex-wrap">
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
            Mostrando <strong>{filteredTopics.length}</strong> de {store.topics.length} unidades de estudo
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
          {filteredTopics.map((topic) => {
            const subject = subjectMap.get(topic.subject_id);
            const material = store.materials.find((m) => m.topic_id === topic.id);
            const progress = material ? store.materialProgress[material.id] : undefined;
            const syllabusItems = topicSyllabusMap.get(topic.id) || [];
            const isExpanded = expandedTopicId === topic.id;

            return (
              <div key={topic.id} className="p-4 hover:bg-zinc-900/60 transition-colors space-y-3">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Topic Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          topic.exam_block_code === 'P1'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {topic.exam_block_code}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {subject?.name || 'Geral'}
                      </span>
                      <PriorityBadge priority={topic.priority} />
                      <span className="text-[9px] text-zinc-500 font-mono">
                        Confiança: {topic.priority_confidence || 'MEDIUM'}
                      </span>
                      <StatusBadge status={topic.status} />
                      <StudyScoreBadge score={topic.study_score} />
                      {topic.is_discursive_relevant && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          <PenTool className="w-2.5 h-2.5" />
                          Relevante p/ Discursiva
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight leading-snug">
                      {topic.name}
                    </h3>

                    {topic.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed">{topic.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono pt-1">
                      <span>Material: {topic.recommended_material_type}</span>
                      <span>•</span>
                      <span>Cobertura: {progress ? `${progress.progress_percent}%` : '0%'}</span>
                      <span>•</span>
                      <span>Último treino: {formatDateBr(topic.last_studied_at)}</span>
                      <span>•</span>
                      <span className="text-zinc-300 font-medium">
                        {syllabusItems.length} item(ns) do edital
                      </span>
                    </div>
                  </div>

                  {/* Domain & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/60">
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

                {/* Expandable official syllabus items */}
                <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors font-medium text-[11px] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    {isExpanded ? 'Ocultar itens oficiais do edital' : 'Ver itens oficiais do edital'}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Priority Override Dropdown */}
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <span>Ajustar prioridade:</span>
                    <select
                      value={topic.priority}
                      onChange={(e) => handlePriorityChange(topic.id, e.target.value as Priority)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-200 focus:outline-none"
                    >
                      <option value="HIGH">Alta (HIGH)</option>
                      <option value="MEDIUM">Média (MEDIUM)</option>
                      <option value="LOW">Baixa (LOW)</option>
                    </select>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-2 mt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                      Itens do Edital nº 1/2026 cobertos por esta unidade:
                    </span>
                    <div className="space-y-1.5">
                      {syllabusItems.map((si) => (
                        <div
                          key={si.id}
                          className="flex items-start gap-2 text-xs text-zinc-300 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50"
                        >
                          {si.official_code && (
                            <span className="font-mono text-zinc-400 font-bold shrink-0">
                              Item {si.official_code}:
                            </span>
                          )}
                          <p className="leading-relaxed">{si.official_text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
