'use client';

import React from 'react';
import { BookOpen, ExternalLink, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { TodayTask } from '@/types/study';
import { PriorityBadge } from '@/components/study/PriorityBadge';
import { DomainScore } from '@/components/study/DomainScore';
import { StudyScoreBadge } from '@/components/study/StudyScoreBadge';
import { Button } from '@/components/ui/Button';

interface TodayTaskCardProps {
  task: TodayTask;
  onOpenTecModal: (topicId: string) => void;
  onOpenMaterial?: (topicId: string) => void;
}

export function TodayTaskCard({ task, onOpenTecModal, onOpenMaterial }: TodayTaskCardProps) {
  const getActionIcon = () => {
    switch (task.actionType) {
      case 'READ_MATERIAL':
        return <BookOpen className="w-4 h-4" />;
      case 'REVIEW_ERRORS':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const handleAction = () => {
    if (task.actionType === 'READ_MATERIAL' && onOpenMaterial) {
      onOpenMaterial(task.topicId);
    } else {
      onOpenTecModal(task.topicId);
    }
  };

  return (
    <div className="flex flex-col justify-between p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700/80 transition-all shadow-sm">
      <div className="space-y-3">
        {/* Subject & Badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
              {task.subjectName}
            </span>
            <h4 className="text-base font-bold text-zinc-100 tracking-tight mt-0.5 leading-snug">
              {task.topicName}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <PriorityBadge priority={task.priority} />
            <StudyScoreBadge score={task.studyScore} />
          </div>
        </div>

        {/* Reason Box */}
        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-zinc-200">Por que estudar agora:</span>
            <p className="text-zinc-400">{task.reason}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{task.estimatedMinutes} min sugeridos</span>
          </div>
          <div>
            <DomainScore score={task.domainScore} confidence={task.domainConfidence} />
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-400 font-mono">
          Meta Cebraspe: {task.targetQuestions || 20} questões
        </span>
        <Button size="sm" onClick={handleAction} className="cursor-pointer">
          {getActionIcon()}
          {task.actionLabel}
        </Button>
      </div>
    </div>
  );
}
