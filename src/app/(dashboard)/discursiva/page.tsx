'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DiscursiveSessionModal } from '@/components/discursive/DiscursiveSessionModal';
import {
  loadStore,
  recordDiscursiveSessionAction,
  deleteDiscursiveSessionAction,
  AppStoreData,
} from '@/lib/data/store';
import { computeDiscursiveKPIs } from '@/lib/study-engine/discursive';
import { PenTool, Plus, Trash2, BookOpen, AlertCircle, Award } from 'lucide-react';
import { formatDateBr } from '@/lib/utils/date';
import { useModal } from '@/components/layout/DashboardLayoutClient';

export default function DiscursivePage() {
  const { store, user, updateStore } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-400 text-sm">
        Carregando módulo discursivo...
      </div>
    );
  }

  const sessions = store.discursiveSessions || [];
  const kpis = computeDiscursiveKPIs(sessions);
  const subjectMap = new Map(store.subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(store.topics.map((t) => [t.id, t.name]));

  const handleSaveSession = async (sessionData: Parameters<typeof recordDiscursiveSessionAction>[0]) => {
    const currentUserId = user?.id || 'local-user';
    const { store: nextStore, session } = recordDiscursiveSessionAction(
      {
        ...sessionData,
        user_id: currentUserId,
      },
      store
    );

    await updateStore(
      () => nextStore,
      async (repo, uId) => {
        await repo.persistDiscursiveSession(uId, session);
        await repo.persistGamification(
          uId,
          nextStore.gamificationProfile,
          nextStore.xpTransactions,
          nextStore.unlockedAchievements
        );
      }
    );
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('Deseja excluir este registro de treino discursivo?')) {
      const nextStore = deleteDiscursiveSessionAction(id, store);
      await updateStore(() => nextStore);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              P3 — Prova Discursiva (60 pts)
            </span>
            <span className="text-xs text-zinc-400">Eliminatória e Classificatória</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Treino Discursivo — Redação & Peça Técnica
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registro e cálculo oficial Cebraspe para 2 questões de até 20 linhas e 1 peça técnica de até 50 linhas.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Treino
        </Button>
      </div>

      {/* Official Rules Note */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-300 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="font-bold text-zinc-100 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-zinc-400" />
            2 Questões (Q20) — 15 pts cada
          </div>
          <p className="text-[11px] text-zinc-400">
            Fórmula Cebraspe: <span className="font-mono text-zinc-300">NQ = NC - 3 × NE / TL</span> (até 20 linhas, base em Conhecimentos Específicos).
          </p>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-zinc-100 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            1 Peça Técnica (PT50) — 30 pts
          </div>
          <p className="text-[11px] text-zinc-400">
            Fórmula Cebraspe: <span className="font-mono text-zinc-300">NPT = NC - 6 × NE / TL</span> (até 50 linhas, base em Conhecimentos Específicos).
          </p>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-zinc-100 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Aprovação em P3: NFPD ≥ 30 pts
          </div>
          <p className="text-[11px] text-zinc-400">
            Total P3: 60 pontos. Mínimo eliminatório: 30 pontos. Duração: 3 horas (tarde de 17/01/2027).
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="p-3.5 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Treinos Feitos</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{kpis.totalSessions}</div>
        </Card>
        <Card className="p-3.5 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Questões (Q20)</span>
          <div className="text-xl font-bold font-mono text-zinc-200 mt-1">{kpis.question20Count}</div>
        </Card>
        <Card className="p-3.5 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Peças (PT50)</span>
          <div className="text-xl font-bold font-mono text-zinc-200 mt-1">{kpis.technicalPieceCount}</div>
        </Card>
        <Card className="p-3.5 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Média Geral</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {kpis.averageScore} <span className="text-xs text-zinc-400 font-sans">pts</span>
          </div>
        </Card>
        <Card className="p-3.5 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Linhas Escritas</span>
          <div className="text-xl font-bold font-mono text-zinc-200 mt-1">{kpis.totalLinesWritten}</div>
        </Card>
        <Card className="p-3.5 bg-zinc-900/60 border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Erros / Treino</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{kpis.averageLanguageErrors}</div>
        </Card>
      </div>

      {/* History table */}
      <Card className="p-5 bg-zinc-900/40 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Histórico de Treinos Registrados</h2>
          <span className="text-xs text-zinc-400 font-mono">{sessions.length} registro(s)</span>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="Nenhum treino discursivo registrado"
            description="Faça a prática em folha de resposta padrão e registre aqui a nota de conteúdo, linhas escritas e erros apontados para acompanhar sua evolução."
            action={
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Registrar primeiro treino
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Tema / Enunciado</th>
                  <th className="py-2.5 px-3">Matéria / Tópico</th>
                  <th className="py-2.5 px-3 text-center">Linhas (TL)</th>
                  <th className="py-2.5 px-3 text-center">Conteúdo (NC)</th>
                  <th className="py-2.5 px-3 text-center">Erros (NE)</th>
                  <th className="py-2.5 px-3 text-right">Nota Calculada</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sessions.map((s) => {
                  const maxPts = s.type === 'QUESTION_20_LINES' ? 15 : 30;
                  const isQ20 = s.type === 'QUESTION_20_LINES';

                  return (
                    <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3 text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                        {formatDateBr(s.performed_at)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isQ20
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {isQ20 ? 'Questão 20L' : 'Peça 50L'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-200 font-medium">
                        <div>{s.title || 'Treino sem título'}</div>
                        {s.notes && (
                          <div className="text-[11px] text-zinc-400 italic line-clamp-1">{s.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 text-[11px]">
                        <div>{s.related_subject_id ? subjectMap.get(s.related_subject_id) : '—'}</div>
                        {s.related_topic_id && (
                          <div className="text-[10px] text-zinc-400">{topicMap.get(s.related_topic_id)}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-300">
                        {s.lines_written}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-300">
                        {s.content_score} <span className="text-[10px] text-zinc-400">/{maxPts}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-400">
                        {s.language_errors}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                        {s.calculated_score}{' '}
                        <span className="text-[10px] font-normal text-zinc-400">/{maxPts}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          title="Excluir treino"
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Discursive Session Registration Modal */}
      <DiscursiveSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subjects={store.subjects}
        topics={store.topics}
        onSave={handleSaveSession}
      />
    </div>
  );
}
