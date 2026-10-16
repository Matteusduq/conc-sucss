'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { PdfReader } from '@/components/study/PdfReader';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/study/PriorityBadge';
import { StatusBadge } from '@/components/study/StatusBadge';
import { ArrowLeft, Sparkles, ExternalLink, Brain } from 'lucide-react';
import { updateMaterialProgressAction } from '@/lib/data/store';

export default function EstudarPage({ params }: { params: Promise<{ topicId: string }> }) {
  const resolvedParams = use(params);
  const { store, user, openTecModal, openCardModal, updateStore } = useModal();

  const topic = store.topics.find((t) => t.id === resolvedParams.topicId);
  const material = store.materials.find((m) => m.topic_id === resolvedParams.topicId);
  const subject = topic ? store.subjects.find((s) => s.id === topic.subject_id) : undefined;
  const progress = material ? store.materialProgress[material.id] : undefined;

  if (!topic || !material) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">Tópico não encontrado</h2>
        <Link href="/plano">
          <Button variant="outline">Voltar ao Plano do Edital</Button>
        </Link>
      </div>
    );
  }

  const isTheoryPending =
    (topic.status === 'NOT_STARTED' || topic.status === 'LEARNING') &&
    (material.status === 'PENDING' || !material.storage_path);

  const handleUpdateProgress = async (data: Record<string, unknown>) => {
    const currentUserId = user?.id || 'local-user';
    const nextStore = updateMaterialProgressAction(
      {
        material_id: material.id,
        topic_id: topic.id,
        user_id: currentUserId,
        ...data,
      },
      store
    );
    await updateStore(
      () => nextStore,
      async (repo, uId) => {
        const prog = nextStore.materialProgress[material.id];
        if (prog) {
          await repo.persistMaterialProgress(uId, prog);
        }
      }
    );
  };

  const handleCompleteMaterial = async () => {
    const currentUserId = user?.id || 'local-user';
    const nextStore = updateMaterialProgressAction(
      {
        material_id: material.id,
        topic_id: topic.id,
        user_id: currentUserId,
        completed: true,
        progress_percent: 100,
      },
      store
    );
    await updateStore(
      () => nextStore,
      async (repo, uId) => {
        const prog = nextStore.materialProgress[material.id];
        if (prog) {
          await repo.persistMaterialProgress(uId, prog);
        }
        const updatedTopic = nextStore.topics.find((t) => t.id === topic.id);
        if (updatedTopic) {
          await repo.persistTopic(uId, updatedTopic);
        }
        await repo.persistGamification(
          uId,
          nextStore.gamificationProfile,
          nextStore.xpTransactions,
          nextStore.unlockedAchievements
        );
      }
    );
    // Suggest TEC session immediately
    openTecModal(topic.id);
  };

  return (
    <div className="space-y-6">
      {/* Back and Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/plano">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {subject?.name}
              </span>
              <PriorityBadge priority={topic.priority} />
              <StatusBadge status={topic.status} />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight mt-0.5">
              {topic.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Flashcard Generator Button (Requirement 45: Disabled with tooltip) */}
          <div className="relative group">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="opacity-60 cursor-not-allowed border-zinc-800 text-zinc-400"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" />
              Gerar cartões com IA
            </Button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 shadow-xl pointer-events-none">
              Integração de IA ainda não configurada. A arquitetura está pronta e aguarda ativação de chave.
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => openCardModal({ topicId: topic.id })}
            variant="outline"
          >
            <Brain className="w-3.5 h-3.5 mr-1 text-purple-400" />
            Criar Flashcard
          </Button>

          {isTheoryPending ? (
            <Button
              size="sm"
              disabled
              variant="outline"
              className="opacity-50 cursor-not-allowed text-zinc-500 border-zinc-800"
              title="Aguardando material: a leitura teórica é obrigatória antes de resolver questões"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Treinar no TEC
            </Button>
          ) : (
            <Button size="sm" onClick={() => openTecModal(topic.id)}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Treinar no TEC
            </Button>
          )}
        </div>
      </div>

      {/* Reader Component */}
      <PdfReader
        topic={topic}
        material={material}
        progress={progress}
        onUpdateProgress={handleUpdateProgress}
        onCompleteMaterial={handleCompleteMaterial}
        onOpenTec={() => openTecModal(topic.id)}
      />
    </div>
  );
}
