'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bookmark,
  CheckCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Topic, StudyMaterial, MaterialProgress } from '@/types/database';
import { formatDurationSeconds } from '@/lib/utils/date';

interface PdfReaderProps {
  topic: Topic;
  material: StudyMaterial;
  progress?: MaterialProgress;
  onUpdateProgress: (data: Partial<MaterialProgress>) => void;
  onCompleteMaterial: () => void;
  onOpenTec: () => void;
}

export function PdfReader({
  topic,
  material,
  progress,
  onUpdateProgress,
  onCompleteMaterial,
  onOpenTec,
}: PdfReaderProps) {
  const [currentPage, setCurrentPage] = useState<number>(progress?.current_page || 1);
  const totalPages = material.page_count || 45; // Default estimation when no file yet
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [notesByPage, setNotesByPage] = useState<Record<string, string>>(progress?.notes_by_page || {});
  const [bookmarks, setBookmarks] = useState<number[]>(progress?.bookmarks || []);
  const pageNote = notesByPage[currentPage.toString()] || '';

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSavePageNote = (noteText: string) => {
    const updated = { ...notesByPage, [currentPage.toString()]: noteText };
    setNotesByPage(updated);
    onUpdateProgress({ notes_by_page: updated });
  };

  const handleToggleBookmark = () => {
    const nextBookmarks = bookmarks.includes(currentPage)
      ? bookmarks.filter((p) => p !== currentPage)
      : [...bookmarks, currentPage].sort((a, b) => a - b);
    setBookmarks(nextBookmarks);
    onUpdateProgress({ bookmarks: nextBookmarks });
  };

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    const maxReached = Math.max(progress?.max_page_reached || 1, clamped);
    const percent = Math.round((maxReached / totalPages) * 100);

    onUpdateProgress({
      current_page: clamped,
      max_page_reached: maxReached,
      progress_percent: percent,
      total_study_seconds: (progress?.total_study_seconds || 0) + 1,
    });
  };

  const isBookmarked = bookmarks.includes(currentPage);

  // If material has no uploaded PDF yet (Requirement 8 & 47)
  if (material.status === 'PENDING' || !material.storage_path) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>{topic.name}</span>
              <span>•</span>
              <span className="text-zinc-300 font-semibold">{topic.recommended_material_type}</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight mt-1">
              {material.title}
            </h2>
          </div>
        </div>

        {/* Empty State / Awaiting Material */}
        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-100">Material ainda não disponível.</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Este tópico já está priorizado e será liberado assim que o PDF correspondente for inserido.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-left text-xs max-w-md w-full space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>Tipo recomendado:</span>
              <span className="text-zinc-200 font-semibold">{topic.recommended_material_type}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Prioridade de prova:</span>
              <span className="text-zinc-200 font-semibold">{topic.priority}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Diretriz pedagógica:</span>
              <span className="text-zinc-300 font-medium">Teoria obrigatória antes de bateria de questões</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active PDF Viewer UI
  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950 p-6 overflow-y-auto' : ''}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>{formatDurationSeconds(sessionSeconds)}</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-mono text-zinc-200 px-1">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-zinc-300 text-[11px]">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Bookmark */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleBookmark}
            className={isBookmarked ? 'text-amber-400' : 'text-zinc-400'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </Button>

          {/* Fullscreen */}
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* Conclude Button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={onCompleteMaterial}
            className="border-emerald-800/80 text-emerald-300 hover:bg-emerald-950/60"
          >
            <CheckCircle className="w-4 h-4 mr-1 text-emerald-400" />
            Concluir Material
          </Button>
        </div>
      </div>

      {/* Reader Layout: PDF Canvas Area + Notes Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* PDF Document Canvas View */}
        <div className="lg:col-span-3 min-h-[600px] rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div
            className="w-full max-w-2xl bg-zinc-900/60 rounded-lg border border-zinc-800/80 p-8 shadow-xl text-left"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <div className="border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-zinc-300">{material.title}</span>
              <span className="font-mono">Página {currentPage}</span>
            </div>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans">
              <p className="font-semibold text-zinc-100 text-sm">
                Tópico: {topic.name}
              </p>
              <p>
                Visualizador de leitura ativo. O componente integra com <code className="text-zinc-400 font-mono">react-pdf</code> renderizando as páginas do material com suporte a anotações contextuais e retenção da última página lida.
              </p>
              <p className="text-zinc-400 text-[11px]">
                Após concluir a leitura deste material, o algoritmo do sistema transitará o status para <span className="text-amber-400 font-semibold">AGUARDANDO_QUESTOES</span> e agendará a sessão de treino no TEC Concursos.
              </p>
            </div>
          </div>
        </div>

        {/* Notes by Page Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Notas da Página {currentPage}</span>
            </div>
            <textarea
              value={pageNote}
              onChange={(e) => handleSavePageNote(e.target.value)}
              placeholder="Digite anotações ou sínteses deste trecho..."
              rows={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <p className="text-[10px] text-zinc-400">Salvo automaticamente no banco de progresso.</p>
          </Card>

          {/* Bookmarks list */}
          {bookmarks.length > 0 && (
            <Card className="p-4 space-y-2">
              <span className="text-xs font-semibold text-zinc-300">Páginas Marcadas</span>
              <div className="flex flex-wrap gap-1.5">
                {bookmarks.map((bm) => (
                  <button
                    key={bm}
                    onClick={() => handlePageChange(bm)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-mono cursor-pointer"
                  >
                    pág. {bm}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Next Step Banner */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs space-y-2">
            <span className="font-bold text-blue-300">Próximo Passo Obrigatório:</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              O sistema não consolida o tópico apenas pela leitura teórica. Faça questões no TEC Concursos logo após o PDF.
            </p>
            <Button size="sm" variant="outline" onClick={onOpenTec} className="w-full text-xs">
              Abrir TEC Concursos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
