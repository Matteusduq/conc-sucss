'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { getDueFlashcards, reviewFlashcardAction, deleteFlashcardAction } from '@/lib/data/store';
import { FlashcardReviewer } from '@/components/memory/FlashcardReviewer';
import { DeleteFlashcardModal } from '@/components/memory/DeleteFlashcardModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/study/PriorityBadge';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateBr } from '@/lib/utils/date';
import { Flashcard } from '@/types/database';
import { Brain, Plus, Play, CheckCircle2, Clock, Trash2, BookOpen } from 'lucide-react';

export default function MemoriaPage() {
  const { store, openCardModal, updateStore } = useModal();
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const dueCards = getDueFlashcards(store);
  const totalCards = store.flashcards.length;

  const handleDeleteFlashcard = async (cardId: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await updateStore(
        (prevStore) => deleteFlashcardAction(cardId, prevStore),
        async (repo, uId) => {
          await repo.deleteFlashcard(uId, cardId);
        }
      );
      setCardToDelete(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao excluir o flashcard no servidor. Tente novamente.';
      setDeleteError(msg);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  // Breakdown by FSRS states
  const states = Object.values(store.fsrsStates);
  const newCardsCount = states.filter((s) => s.state === 0).length;
  const learningCount = states.filter((s) => s.state === 1 || s.state === 3).length;
  const reviewCount = states.filter((s) => s.state === 2).length;

  const totalReviews = store.reviews.length;
  const totalLapses = store.reviews.filter((r) => r.rating === 'AGAIN').length;
  const realRetention = totalReviews > 0 ? Math.round(((totalReviews - totalLapses) / totalReviews) * 100) : null;

  // Backlog limit: default 25 min ~ 30 cards
  const dailyLimitCards = Math.round(store.settings.memory_daily_minutes * 1.2);
  const isBacklogHeavy = dueCards.length > dailyLimitCards;

  if (isReviewing) {
    return (
      <div className="py-4">
        <FlashcardReviewer
          cards={dueCards}
          desiredRetention={store.settings.desired_retention}
          onReviewCard={async (cardId, rating, duration) => {
            const nextStore = reviewFlashcardAction(cardId, rating, duration, store);
            await updateStore(
              () => nextStore,
              async (repo, uId) => {
                const latestReview = nextStore.reviews[0];
                const latestFsrs = nextStore.fsrsStates[cardId];
                if (latestReview && latestFsrs) {
                  await repo.persistFlashcardReview(uId, latestReview, latestFsrs);
                }
                await repo.persistGamification(
                  uId,
                  nextStore.gamificationProfile,
                  nextStore.xpTransactions,
                  nextStore.unlockedAchievements,
                  nextStore.dailyMissions
                );
              }
            );
          }}
          onDeleteCard={handleDeleteFlashcard}
          onFinish={() => setIsReviewing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Memória Espaçada (FSRS)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Algoritmo de repetição espaçada avançado para fixação atômica de leis, regras regimentais e conceitos da prova.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openCardModal()} variant="outline">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Criar Flashcard
          </Button>
          <Button
            size="sm"
            onClick={() => setIsReviewing(true)}
            disabled={dueCards.length === 0}
          >
            <Play className="w-3.5 h-3.5 mr-1 fill-current" />
            Iniciar Revisão ({dueCards.length})
          </Button>
        </div>
      </div>

      {/* Backlog Alert (Non-punitive, Requirement 39) */}
      {isBacklogHeavy && (
        <div className="p-4 rounded-xl border border-purple-900/60 bg-purple-950/20 flex items-start gap-3 text-xs">
          <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-purple-300">
              Limite diário sugerido: {store.settings.memory_daily_minutes} min
            </span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Você tem {dueCards.length} cartões devidos hoje. O sistema priorizou automaticamente os cartões do Caderno de Erros e de tópicos de Alta Relevância para caber no seu tempo diário. Não se preocupe em zerar tudo de uma vez.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Devidos Hoje</span>
          <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
            {dueCards.length}
          </div>
        </Card>

        <Card className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Novos</span>
          <div className="text-2xl font-black font-mono text-blue-400 mt-1">
            {newCardsCount}
          </div>
        </Card>

        <Card className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Aprendizagem</span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {learningCount}
          </div>
        </Card>

        <Card className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Maduros</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {reviewCount}
          </div>
        </Card>

        <Card className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Retenção Real</span>
          <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
            {realRetention !== null ? `${realRetention}%` : '-'}
          </div>
        </Card>

        <Card className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Meta FSRS</span>
          <div className="text-2xl font-black font-mono text-zinc-300 mt-1">
            {Math.round(store.settings.desired_retention * 100)}%
          </div>
        </Card>
      </div>

      {/* Main Review Callout */}
      {dueCards.length > 0 ? (
        <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800/80 mx-auto flex items-center justify-center text-purple-300">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {dueCards.length} cartões prontos para revisão
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Tempo estimado: ~{Math.ceil(dueCards.length * 0.8)} minutos. Revisões espaçadas impedem a curva de esquecimento.
            </p>
          </div>
          <Button size="lg" onClick={() => setIsReviewing(true)} className="px-8 font-bold">
            <Play className="w-4 h-4 mr-1.5 fill-current" />
            Iniciar Sessão de Revisão
          </Button>
        </div>
      ) : totalCards === 0 ? (
        <EmptyState
          icon={Brain}
          title="Nenhum flashcard criado ainda"
          description="Você pode criar flashcards manualmente, gerá-los a partir do Caderno de Erros ou diretamente no leitor de PDF selecionando um trecho com a IA (Xkiro · Qwen)."
          action={
            <Button size="sm" onClick={() => openCardModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Criar Primeiro Flashcard
            </Button>
          }
        />
      ) : (
        <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-zinc-100">Revisões em dia!</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Nenhum cartão atingiu o intervalo de revisão no momento. Dedique o restante do seu bloco de tempo a questões no TEC Concursos.
          </p>
        </div>
      )}

      {/* Meus Flashcards */}
      {store.flashcards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200">
              Meus Flashcards ({store.flashcards.length})
            </h3>
            <span className="text-[11px] text-zinc-500">
              Gerencie seus cartões e agendamentos FSRS
            </span>
          </div>

          <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
            {store.flashcards.map((c) => {
              const topic = store.topics.find((t) => t.id === c.topic_id);
              const fsrs = store.fsrsStates[c.id];
              const isDue = fsrs && new Date(fsrs.due).getTime() <= Date.now();

              // Estado FSRS
              const fsrsStateLabel =
                fsrs?.state === 0
                  ? 'Novo'
                  : fsrs?.state === 1
                  ? 'Aprendizagem'
                  : fsrs?.state === 2
                  ? 'Maduro'
                  : fsrs?.state === 3
                  ? 'Reaprendizagem'
                  : 'FSRS';

              const fsrsStateColor =
                fsrs?.state === 0
                  ? 'bg-blue-950/60 text-blue-400 border-blue-800/40'
                  : fsrs?.state === 1
                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                  : fsrs?.state === 2
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                  : 'bg-purple-950/60 text-purple-400 border-purple-800/40';

              return (
                <div
                  key={c.id}
                  className="p-3.5 flex items-start justify-between gap-3 text-xs hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.card_type === 'ERROR' && <Badge variant="high">Caderno de Erros</Badge>}
                      <PriorityBadge priority={c.exam_priority} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${fsrsStateColor}`}>
                        {fsrsStateLabel}
                      </span>
                      <span className="text-[11px] text-zinc-400 truncate max-w-xs font-medium">
                        {topic?.name || c.topic_id}
                      </span>
                      {c.source_highlight_id && (
                        <Link
                          href={`/estudar/${c.topic_id}?highlight=${c.source_highlight_id}`}
                          className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 hover:text-amber-300 transition-colors ml-1"
                          title="Ver trecho marcado no material"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>PDF</span>
                        </Link>
                      )}
                    </div>
                    <p className="font-semibold text-zinc-200 line-clamp-2 leading-relaxed">
                      {c.front}
                    </p>
                    <p className="text-zinc-400 text-[11px] line-clamp-1 leading-relaxed">
                      {c.back}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right font-mono text-[11px]">
                      <span className={isDue ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
                        {isDue ? 'Devido hoje' : fsrs?.due ? formatDateBr(fsrs.due) : 'Em dia'}
                      </span>
                      <div className="text-[10px] text-zinc-500">
                        Reps: {fsrs?.reps || 0}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteError(null);
                        setCardToDelete(c);
                      }}
                      title="Excluir flashcard"
                      className="text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 p-1.5 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Flashcard Modal */}
      <DeleteFlashcardModal
        isOpen={Boolean(cardToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setCardToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={async () => {
          if (cardToDelete) {
            await handleDeleteFlashcard(cardToDelete.id);
          }
        }}
        cardFront={cardToDelete?.front}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  );
}
