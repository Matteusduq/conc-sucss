'use client';

import React, { useState } from 'react';
import { useModal } from '@/components/layout/DashboardLayoutClient';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Save, CheckCircle, ExternalLink, Sparkles, Sliders, Shield } from 'lucide-react';
import { saveStore } from '@/lib/data/store';

export default function ConfiguracoesPage() {
  const { store, refreshStore } = useModal();
  const [weeklyMinutes, setWeeklyMinutes] = useState(store.settings.weekly_study_target_minutes || 1080);
  const [memoryMinutes, setMemoryMinutes] = useState(store.settings.memory_daily_minutes || 25);
  const [desiredRetention, setDesiredRetention] = useState(store.settings.desired_retention || 0.90);
  const [highQ, setHighQ] = useState(store.settings.default_high_questions || 30);
  const [medQ, setMedQ] = useState(store.settings.default_medium_questions || 20);
  const [lowQ, setLowQ] = useState(store.settings.default_low_questions || 15);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStore = {
      ...store,
      settings: {
        ...store.settings,
        weekly_study_target_minutes: Number(weeklyMinutes),
        memory_daily_minutes: Number(memoryMinutes),
        desired_retention: Number(desiredRetention),
        default_high_questions: Number(highQ),
        default_medium_questions: Number(medQ),
        default_low_questions: Number(lowQ),
        updated_at: new Date().toISOString(),
      },
    };

    saveStore(updatedStore);
    refreshStore();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            Configurações do Sistema
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Parâmetros do concurso da Câmara dos Deputados, metas de estudo e calibração da retenção FSRS.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Concurso e Banca */}
        <Card className="p-5 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-400" />
              Parâmetros do Concurso e Banca Examinadora
            </CardTitle>
            <CardDescription>
              Configuração oficial do edital e modelo de pontuação.
            </CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-zinc-400 mb-1">Órgão e Cargo</label>
              <input
                type="text"
                disabled
                value={`${store.exam.name} — ${store.exam.role}`}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2 text-zinc-300 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Banca e Data da Prova</label>
              <input
                type="text"
                disabled
                value={`${store.exam.exam_board} • ${store.exam.exam_date}`}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>
              Modelo de Pontuação Cebraspe: <strong className="text-zinc-200">1 Certa (+1 pt) • 1 Errada (-1 pt) • Em Branco (0 pt)</strong>
            </span>
            <Badge variant="high">Cebraspe Ativo</Badge>
          </div>
        </Card>

        {/* 2. Metas de Estudo e Questões */}
        <Card className="p-5 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-400" />
              Metas de Estudo & Baterias TEC
            </CardTitle>
            <CardDescription>
              Ajuste as metas de tempo e a quantidade padrão de questões exigidas por prioridade.
            </CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Meta Semanal de Estudo (minutos)
              </label>
              <input
                type="number"
                min="60"
                step="30"
                value={weeklyMinutes}
                onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Padrão: 1080 min (~18 horas semanais).
              </span>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Limite Diário de Memória / Flashcards (minutos)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={memoryMinutes}
                onChange={(e) => setMemoryMinutes(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Previne sobrecarga de backlog. Padrão: 25 min/dia.
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-300 block mb-2">
              Meta Padrão de Questões no TEC Concursos por Prioridade
            </span>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 text-[11px]">Tópicos HIGH</label>
                <input
                  type="number"
                  min="5"
                  value={highQ}
                  onChange={(e) => setHighQ(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 text-[11px]">Tópicos MEDIUM</label>
                <input
                  type="number"
                  min="5"
                  value={medQ}
                  onChange={(e) => setMedQ(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 text-[11px]">Tópicos LOW</label>
                <input
                  type="number"
                  min="5"
                  value={lowQ}
                  onChange={(e) => setLowQ(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-center"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Calibração FSRS */}
        <Card className="p-5 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Calibração da Retenção Desejada (FSRS)</CardTitle>
            <CardDescription>
              Aumentar a retenção desejada eleva a precisão das revisões, mas aumenta a frequência diária de repetições.
            </CardDescription>
          </CardHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Retenção Alvo do Algoritmo:</span>
              <span className="font-mono text-base font-bold text-zinc-100">
                {Math.round(desiredRetention * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.80"
              max="0.95"
              step="0.01"
              value={desiredRetention}
              onChange={(e) => setDesiredRetention(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>80% (menos revisões)</span>
              <span>90% (recomendado)</span>
              <span>95% (alta frequência)</span>
            </div>
          </div>
        </Card>

        {/* 4. Integrações */}
        <Card className="p-5 space-y-3">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Status das Integrações</CardTitle>
          </CardHeader>

          <div className="divide-y divide-zinc-800 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-zinc-200">TEC Concursos</span>
                <p className="text-[11px] text-zinc-400">
                  Integração conceitual com registro de sessões externas (sem scraping).
                </p>
              </div>
              <Badge variant="success">Manual / Ativo</Badge>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Módulo de Inteligência Artificial
                </span>
                <p className="text-[11px] text-zinc-400">
                  Interfaces e provedor estruturados no backend. Ativação via variáveis seguras (.env).
                </p>
              </div>
              <Badge variant="neutral">Não configurada (Seguro)</Badge>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              Configurações salvas com sucesso!
            </span>
          )}
          <Button type="submit">
            <Save className="w-4 h-4 mr-1.5" />
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
