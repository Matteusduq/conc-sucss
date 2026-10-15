'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/study/PriorityBadge';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, FileText, UploadCloud, Clock, ExternalLink } from 'lucide-react';
import { formatDateBr } from '@/lib/utils/date';

export default function BibliotecaPage() {
  const { store, openTecModal } = useModal();
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const subjectMap = new Map(store.subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(store.topics.map((t) => [t.id, t]));

  const filteredMaterials = store.materials.filter((material) => {
    if (activeTab === 'ALL') return true;
    const topic = topicMap.get(material.topic_id);
    return topic && topic.subject_id === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Biblioteca de Materiais de Estudo
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão dos PDFs completos, simplificados e resumos vinculados a cada tópico do edital.
          </p>
        </div>
      </div>

      {/* Info Notice about PDF Storage & Import */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-start gap-3 text-xs text-zinc-300">
        <UploadCloud className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-100">
            Estrutura de Storage Preparada (Release MVP)
          </p>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            Todos os 94 tópicos do edital já estão cadastrados com seus respectivos placeholders de material pedagógico (PDF Completo para HIGH, Simplificado para MEDIUM e Resumo para LOW). Os arquivos reais serão inseridos via bucket privado do Supabase Storage.
          </p>
        </div>
      </div>

      {/* Discipline Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-800/80">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          Todas ({store.materials.length})
        </button>
        {store.subjects.map((s) => {
          const count = store.materials.filter((m) => {
            const top = topicMap.get(m.topic_id);
            return top && top.subject_id === s.id;
          }).length;

          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === s.id
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => {
          const topic = topicMap.get(material.topic_id);
          const progress = store.materialProgress[material.id];
          const hasFile = material.status === 'AVAILABLE' && Boolean(material.storage_path);

          return (
            <Card
              key={material.id}
              className="flex flex-col justify-between hover:border-zinc-700/80 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {topic ? subjectMap.get(topic.subject_id) : 'Geral'}
                  </span>
                  {topic && <PriorityBadge priority={topic.priority} />}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-100 leading-snug">
                    {material.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="neutral" className="text-[10px]">
                      {material.material_type}
                    </Badge>
                    <Badge
                      variant={hasFile ? 'success' : 'warning'}
                      className="text-[10px]"
                    >
                      {hasFile ? 'Disponível' : 'Aguardando PDF'}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Progresso de leitura</span>
                    <span className="font-mono font-bold text-zinc-300">
                      {progress ? `${progress.progress_percent}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${progress ? progress.progress_percent : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="text-[10px] text-zinc-400 font-mono">
                  {progress?.last_opened_at
                    ? `Lido em ${formatDateBr(progress.last_opened_at)}`
                    : 'Ainda não aberto'}
                </div>

                <div className="flex items-center gap-1.5">
                  {topic && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openTecModal(topic.id)}
                      className="text-[11px] px-2 py-1"
                      title="Registrar sessão TEC"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Link href={`/estudar/${material.topic_id}`}>
                    <Button
                      size="sm"
                      variant={hasFile ? 'primary' : 'outline'}
                      className="text-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                      {hasFile ? 'Ler Material' : 'Detalhes'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
