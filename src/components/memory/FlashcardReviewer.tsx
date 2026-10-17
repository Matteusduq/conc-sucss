'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Rating } from 'ts-fsrs';
import { CardWithMetadata } from '@/lib/fsrs/types';
import { getScheduledIntervals, dbStateToFsrsCard } from '@/lib/fsrs/scheduler';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/study/PriorityBadge';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface FlashcardReviewerProps {
  cards: CardWithMetadata[];
  desiredRetention?: number;
  onReviewCard: (cardId: string, rating: Rating, responseTimeMs: number) => void;
  onFinish: () => void;
}

export function FlashcardReviewer({
  cards,
  desiredRetention = 0.90,
  onReviewCard,
  onFinish,
}: FlashcardReviewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const startTimeRef = useRef<number>(0);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    startTimeRef.current = Date.now();
    setShowExplanation(false);
  }, [currentIndex]);

  const intervals = useMemo(() => {
    if (!currentCard) return [];
    const fsrsCard = dbStateToFsrsCard(currentCard.fsrs_state);
    return getScheduledIntervals(fsrsCard, desiredRetention);
  }, [currentCard, desiredRetention]);

  const handleRating = useCallback(
    (rating: Rating) => {
      if (!currentCard) return;
      const durationMs = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 3000;
      onReviewCard(currentCard.id, rating, durationMs);
      setIsRevealed(false);

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onFinish();
      }
    },
    [currentCard, currentIndex, cards.length, onReviewCard, onFinish]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRevealed) {
          setIsRevealed(true);
        }
      } else if (isRevealed) {
        if (e.key === '1') {
          e.preventDefault();
          handleRating(Rating.Again);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRating(Rating.Hard);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRating(Rating.Good);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRating(Rating.Easy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, handleRating]);

  if (!currentCard || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
        <h3 className="text-lg font-bold text-zinc-100">Revisões do dia concluídas!</h3>
        <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6">
          Você revisou todos os cartões que estavam devidos. A repetição espaçada FSRS irá alertar quando novos cartões atingirem o limiar de esquecimento.
        </p>
        <Button onClick={onFinish}>Voltar ao Painel</Button>
      </div>
    );
  }

  const againInterval = intervals.find((i) => i.ratingValue === Rating.Again)?.intervalText || '10m';
  const hardInterval = intervals.find((i) => i.ratingValue === Rating.Hard)?.intervalText || '1d';
  const goodInterval = intervals.find((i) => i.ratingValue === Rating.Good)?.intervalText || '3d';
  const easyInterval = intervals.find((i) => i.ratingValue === Rating.Easy)?.intervalText || '7d';

  return (
    <div className="max-w-2xl mx-auto flex flex-col space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200">
            Cartão {currentIndex + 1} de {cards.length}
          </span>
          <span className="text-zinc-600">•</span>
          <span>{currentCard.subject_name || 'Geral'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {currentCard.card_type === 'ERROR' && (
            <Badge variant="high">Caderno de Erros</Badge>
          )}
          <PriorityBadge priority={currentCard.exam_priority} />
          <Button variant="ghost" size="sm" onClick={onFinish}>
            Encerrar
          </Button>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="min-h-[280px] p-8 rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl flex flex-col justify-between transition-all">
        {/* Front Question */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
              Frente • {currentCard.topic_name}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Repetições: {currentCard.fsrs_state?.reps || 0}
            </span>
          </div>
          <div className="text-lg md:text-xl font-medium text-zinc-100 leading-relaxed">
            {currentCard.front}
          </div>
        </div>

        {/* Back Answer (Revealed) */}
        {isRevealed ? (
          <div className="mt-6 pt-6 border-t border-zinc-800/80 animate-in fade-in duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                Verso • Resposta
              </span>

              {/* Botão discreto: Ver origem no material */}
              {currentCard.source_highlight_id && (
                <Link
                  href={`/estudar/${currentCard.topic_id}?highlight=${currentCard.source_highlight_id}`}
                  className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors py-1 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ver origem no material</span>
                </Link>
              )}
            </div>

            <div className="text-base text-zinc-200 leading-relaxed font-normal bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
              {currentCard.back}
            </div>

            {/* Explicação complementar recolhível */}
            {currentCard.explanation && (
              <div className="pt-2">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
                >
                  {showExplanation ? (
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>Explicação do trecho</span>
                </button>
                {showExplanation && (
                  <div className="mt-2 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed animate-in fade-in duration-150">
                    {currentCard.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 pt-4 border-t border-zinc-800/40 text-center">
            <Button
              size="lg"
              onClick={() => setIsRevealed(true)}
              className="w-full sm:w-auto px-8 cursor-pointer"
            >
              Revelar Resposta (Espaço)
            </Button>
          </div>
        )}
      </div>

      {/* Review Actions (when revealed) */}
      {isRevealed && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. AGAIN */}
            <button
              onClick={() => handleRating(Rating.Again)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-rose-900/60 bg-rose-950/30 hover:bg-rose-950/60 text-rose-200 transition-colors cursor-pointer group"
            >
              <div className="text-xs font-mono text-rose-400 font-semibold mb-0.5">
                {againInterval}
              </div>
              <div className="text-sm font-bold">Errei</div>
              <div className="text-[10px] text-zinc-400 mt-1">Tecla [ 1 ]</div>
            </button>

            {/* 2. HARD */}
            <button
              onClick={() => handleRating(Rating.Hard)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-900/60 bg-amber-950/30 hover:bg-amber-950/60 text-amber-200 transition-colors cursor-pointer group"
            >
              <div className="text-xs font-mono text-amber-400 font-semibold mb-0.5">
                {hardInterval}
              </div>
              <div className="text-sm font-bold">Difícil</div>
              <div className="text-[10px] text-zinc-400 mt-1">Tecla [ 2 ]</div>
            </button>

            {/* 3. GOOD */}
            <button
              onClick={() => handleRating(Rating.Good)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-900/60 bg-blue-950/30 hover:bg-blue-950/60 text-blue-200 transition-colors cursor-pointer group"
            >
              <div className="text-xs font-mono text-blue-400 font-semibold mb-0.5">
                {goodInterval}
              </div>
              <div className="text-sm font-bold">Acertei</div>
              <div className="text-[10px] text-zinc-400 mt-1">Tecla [ 3 ]</div>
            </button>

            {/* 4. EASY */}
            <button
              onClick={() => handleRating(Rating.Easy)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-200 transition-colors cursor-pointer group"
            >
              <div className="text-xs font-mono text-emerald-400 font-semibold mb-0.5">
                {easyInterval}
              </div>
              <div className="text-sm font-bold">Muito fácil</div>
              <div className="text-[10px] text-zinc-400 mt-1">Tecla [ 4 ]</div>
            </button>
          </div>
          <p className="text-center text-[11px] text-zinc-400 pt-1">
            Intervalos calculados automaticamente pelo algoritmo <span className="text-zinc-300 font-medium">ts-fsrs</span>
          </p>
        </div>
      )}
    </div>
  );
}
