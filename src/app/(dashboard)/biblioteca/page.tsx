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
  const [selectedBlock, setSelectedBlock] = useState<'ALL' | 'P1' | 'P2'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  const subjectMap = new Map(store.subjects.map((s) => [s.id, s]));
  const topicMap = new Map(store.topics.map((t) => [t.id, t]));

  const filteredMaterials = store.materials.filter((material) => {
    const topic = topicMap.get(material.topic_id);
    if (!topic) return false;

    if (selectedBlock !== 'ALL' && topic.exam_block_code !== selectedBlock) {
      return false;
    }
    if (selectedSubject !== 'ALL' && topic.subject_id !== selectedSubject) {
      return false;
    }
    return true;
  });

  const availableSubjects = store.subjects.filter(
    (s) => selectedBlock === 'ALL' || s.exam_block_code === selectedBlock
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Biblioteca de Materiais de Estudo
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Materiais estruturados por Unidade de Estudo (76 placeholders correspondendo às unidades de P1 e P2).
          </p>
        </div>
      </div>

      {/* Info Notice about PDF Storage & Import */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-start gap-3 text-xs text-zinc-300">
        <UploadCloud className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-100">
            Estrutura de Storage Preparada (Release Fase 1)
          </p>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            Cada unidade de estudo possui exatamente 1 placeholder de material pedagógico (PDF Completo para HIGH, Simplificado para MEDIUM e Resumo para LOW), cobrindo múltiplos itens correlatos do edital sem dispersão. Os arquivos reais serão inseridos via bucket privado do Supabase Storage.
          </p>
        </div>
      </div>

      {/* Block Tabs: ALL, P1, P2 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 font-medium mr-1">Bloco:</span>
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
              ? 'Todos os Blocos'
              : block === 'P1'
              ? 'P1 — Conhecimentos Básicos'
              : 'P2 — Conhecimentos Específicos'}
          </button>
        ))}
      </div>

      {/* Discipline Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-800/80">
        <button
          onClick={() => setSelectedSubject('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            selectedSubject === 'ALL'
              ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          Todas as Disciplinas ({filteredMaterials.length})
        </button>
        {availableSubjects.map((s) => {
          const count = store.materials.filter((m) => {
            const top = topicMap.get(m.topic_id);
            return top && top.subject_id === s.id;
          }).length;

          return (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedSubject === s.id
                  ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              [{s.exam_block_code}] {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => {
          const topic = topicMap.get(material.topic_id);
          const subject = topic ? subjectMap.get(topic.subject_id) : undefined;
          const progress = store.materialProgress[material.id];
          const hasFile = material.status === 'AVAILABLE' && Boolean(material.storage_path);

          return (
            <Card
              key={material.id}
              className="flex flex-col justify-between hover:border-zinc-700/80 transition-all p-5 bg-zinc-900/40 border-zinc-800"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {topic?.exam_block_code && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            topic.exam_block_code === 'P1'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {topic.exam_block_code}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {subject?.name || 'Geral'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight mt-1 line-clamp-2">
                      {material.title}
                    </h3>
                  </div>
                  {topic && <PriorityBadge priority={topic.priority} />}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={hasFile ? 'success' : 'neutral'}>
                    {hasFile ? 'Disponível' : 'Aguardando PDF'}
                  </Badge>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {material.material_type}
                  </span>
                </div>

                {/* Progress bar if opened */}
                {progress && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                      <span>Progresso</span>
                      <span>{progress.progress_percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${progress.progress_percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-0.5">
                      <span>Página {progress.current_page} de {progress.max_page_reached}</span>
                      <span>Último: {formatDateBr(progress.last_opened_at)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800/60 mt-4 flex items-center justify-between gap-2">
                <Link href={`/estudar/${material.topic_id}`} className="flex-1">
                  <Button
                    size="sm"
                    variant={hasFile ? 'primary' : 'outline'}
                    className="w-full text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    {hasFile ? 'Abrir no Leitor' : 'Ver Detalhes'}
                  </Button>
                </Link>
                {topic && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openTecModal(topic.id)}
                    title="Resolver questões deste tópico no TEC"
                    className="text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
