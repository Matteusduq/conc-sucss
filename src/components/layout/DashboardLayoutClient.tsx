'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { TecSessionModal } from '@/components/performance/TecSessionModal';
import { ErrorLogModal } from '@/components/performance/ErrorLogModal';
import { CreateFlashcardModal } from '@/components/memory/CreateFlashcardModal';
import { RecordMockModal } from '@/components/gamification/RecordMockModal';
import { GamificationToast } from '@/components/gamification/GamificationToast';
import { GamificationNotification } from '@/lib/gamification/types';
import {
  recordQuestionSessionAction,
  recordErrorLogAction,
  createFlashcardAction,
  recordMockExamAction,
  AppStoreData,
  getDefaultStore,
} from '@/lib/data/store';
import { createClient } from '@/lib/supabase/client';
import { SupabaseStudyRepository } from '@/lib/data/repository/supabase-repository';
import { getLocalV3DataToImport, importV3DataToSupabase } from '@/lib/data/migrate-v3-to-supabase';
import { Button } from '@/components/ui/Button';
import { Sparkles, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface ModalContextType {
  openTecModal: (topicId?: string) => void;
  openErrorModal: (topicId?: string) => void;
  openCardModal: (data?: { topicId?: string; front?: string; back?: string; errorId?: string }) => void;
  openMockModal: () => void;
  store: AppStoreData;
  user: User | null;
  userEmail: string | null;
  refreshStore: () => Promise<void>;
  updateStore: (
    updater: (prev: AppStoreData) => AppStoreData,
    persistFn?: (repo: SupabaseStudyRepository, userId: string) => Promise<void>
  ) => Promise<void>;
  pushNotification?: (notification: GamificationNotification) => void;
  signOut: () => Promise<void>;
}

export const ModalContext = createContext<ModalContextType>({
  openTecModal: () => {},
  openErrorModal: () => {},
  openCardModal: () => {},
  openMockModal: () => {},
  store: getDefaultStore(),
  user: null,
  userEmail: null,
  refreshStore: async () => {},
  updateStore: async () => {},
  signOut: async () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<AppStoreData>(getDefaultStore());
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [tecModalOpen, setTecModalOpen] = useState(false);
  const [tecTopicId, setTecTopicId] = useState<string | undefined>(undefined);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorTopicId, setErrorTopicId] = useState<string | undefined>(undefined);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardModalData, setCardModalData] = useState<{
    topicId?: string;
    front?: string;
    back?: string;
    errorId?: string;
  }>({});
  const [mockModalOpen, setMockModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<GamificationNotification[]>([]);

  // V3 Migration State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Inicialização e hidratação via Supabase
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    const repo = new SupabaseStudyRepository(supabase);

    async function init() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          if (isMounted) {
            router.push('/auth/login');
          }
          return;
        }

        if (isMounted) {
          setUser(currentUser);
        }

        // Carrega dados completos do Supabase
        const remoteStore = await repo.loadAll(currentUser.id);

        if (isMounted) {
          setStore(remoteStore);
          setIsLoading(false);

          // Verifica se há dados legados V3 a importar
          const localV3 = getLocalV3DataToImport();
          if (localV3) {
            const alreadyImported = await repo.isV3ImportCompleted(currentUser.id);
            if (!alreadyImported) {
              setImportModalOpen(true);
            }
          }
        }
      } catch (err) {
        console.error('Erro na inicialização do Supabase:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    // Listener de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          setUser(null);
          router.push('/auth/login');
        }
      } else if (session?.user) {
        if (isMounted) {
          setUser(session.user);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  const refreshStore = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const repo = new SupabaseStudyRepository(supabase);
      const latest = await repo.loadAll(user.id);
      setStore(latest);
    } catch (err) {
      console.warn('Erro ao atualizar store do Supabase:', err);
    }
  };

  const updateStore = async (
    updater: (prev: AppStoreData) => AppStoreData,
    persistFn?: (repo: SupabaseStudyRepository, userId: string) => Promise<void>
  ) => {
    const prevStore = store;
    const nextStore = updater(prevStore);

    if (user && persistFn) {
      try {
        const supabase = createClient();
        const repo = new SupabaseStudyRepository(supabase);
        await persistFn(repo, user.id);
        setStore(nextStore);
      } catch (err) {
        console.error('Falha na persistência remota:', err);
        setStore(prevStore);
        pushNotification({
          id: `notif-err-${Date.now()}`,
          type: 'XP_AWARDED',
          title: 'Erro de Sincronização',
          message: 'Não foi possível salvar esta alteração no servidor. Tente novamente.',
          timestamp: new Date().toISOString(),
        });
        throw err;
      }
    } else {
      setStore(nextStore);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const openTecModal = (topicId?: string) => {
    setTecTopicId(topicId);
    setTecModalOpen(true);
  };

  const openErrorModal = (topicId?: string) => {
    setErrorTopicId(topicId);
    setErrorModalOpen(true);
  };

  const openCardModal = (data?: { topicId?: string; front?: string; back?: string; errorId?: string }) => {
    setCardModalData(data || {});
    setCardModalOpen(true);
  };

  const openMockModal = () => {
    setMockModalOpen(true);
  };

  const pushNotification = (notif: GamificationNotification) => {
    setNotifications((prev) => [...prev, notif]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Auto-dismiss top notification after 4 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Handler de importação da V3
  const handleExecuteV3Import = async () => {
    if (!user) return;
    setIsImporting(true);
    const localData = getLocalV3DataToImport();
    if (!localData) {
      setImportModalOpen(false);
      setIsImporting(false);
      return;
    }

    const supabase = createClient();
    const result = await importV3DataToSupabase(user.id, localData, supabase);
    if (result.success) {
      await refreshStore();
      setImportModalOpen(false);
      pushNotification({
        id: `notif-mig-${Date.now()}`,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: 'Dados Locais Importados!',
        message: `${result.counts?.questionSessions || 0} sessões e ${result.counts?.flashcards || 0} cards sincronizados com sua conta.`,
        xpAmount: 0,
        timestamp: new Date().toISOString(),
      });
    }
    setIsImporting(false);
  };

  const handleDismissV3Import = async () => {
    if (user) {
      const supabase = createClient();
      const repo = new SupabaseStudyRepository(supabase);
      await repo.markV3ImportCompleted(user.id, { dismissed: true });
    }
    setImportModalOpen(false);
  };

  // Loading state com estética premium
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <span className="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
          </div>
          <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-base font-semibold text-white mt-4">
          Carregando sua preparação...
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Sincronizando 76 tópicos e histórico com o Supabase
        </p>
      </div>
    );
  }

  return (
    <ModalContext.Provider
      value={{
        openTecModal,
        openErrorModal,
        openCardModal,
        openMockModal,
        store,
        user,
        userEmail: user?.email || null,
        refreshStore,
        updateStore,
        pushNotification,
        signOut,
      }}
    >
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <Sidebar userEmail={user?.email || null} onSignOut={signOut} />
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <Header
            userEmail={user?.email || null}
            onOpenTecModal={() => openTecModal()}
            onOpenErrorModal={() => openErrorModal()}
            onSignOut={signOut}
          />
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>

      {/* Modal de Importação Única da V3 Local */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Importar dados deste navegador?
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Encontramos histórico de questões, flashcards e progresso salvos localmente neste navegador. Deseja transferi-los permanentemente para a sua conta remota do Supabase?
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Importação idempotente e segura</span>
              </div>
              <p>Seus dados permanecerão isolados pelo seu login e disponíveis em qualquer dispositivo.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/60">
              <Button
                variant="ghost"
                size="sm"
                disabled={isImporting}
                onClick={handleDismissV3Import}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Começar sem importar
              </Button>
              <Button
                size="sm"
                disabled={isImporting}
                onClick={handleExecuteV3Import}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                {isImporting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Importando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Importar dados
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gamification Toast Feedback */}
      <GamificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        enabled={store.settings?.gamification_show_xp_toast !== false}
      />

      {/* Modais Globais com persistência atômica no Supabase */}
      <RecordMockModal
        isOpen={mockModalOpen}
        onClose={() => setMockModalOpen(false)}
        onSave={async (mockData) => {
          const currentUserId = user?.id || 'local-user';
          const { store: updated, mockExam } = recordMockExamAction(
            {
              ...mockData,
              user_id: currentUserId,
              exam_id: store.exam.id,
            },
            store
          );

          await updateStore(
            () => updated,
            async (repo, uId) => {
              await repo.persistMockExam(uId, mockExam);
              await repo.persistGamification(
                uId,
                updated.gamificationProfile,
                updated.xpTransactions,
                updated.unlockedAchievements,
                updated.dailyMissions
              );
            }
          );

          pushNotification({
            id: `notif-mock-${Date.now()}`,
            type: 'WEEKLY_BOSS_COMPLETED',
            title: 'Checkpoint Salvo com Sucesso!',
            message: `Registrado: ${mockData.p1_correct + mockData.p2_correct} certas, ${mockData.p1_wrong + mockData.p2_wrong} erradas.`,
            xpAmount: 120,
            timestamp: new Date().toISOString(),
          });
        }}
      />

      <TecSessionModal
        isOpen={tecModalOpen}
        onClose={() => setTecModalOpen(false)}
        topics={store.topics}
        subjects={store.subjects}
        initialTopicId={tecTopicId}
        onSaveSession={async (sessionData) => {
          const currentUserId = user?.id || 'local-user';
          const updated = recordQuestionSessionAction(
            {
              ...sessionData,
              user_id: currentUserId,
              exam_id: store.exam.id,
            },
            store
          );

          await updateStore(
            () => updated,
            async (repo, uId) => {
              const latestSession = updated.questionSessions[0];
              if (latestSession) {
                await repo.persistQuestionSession(uId, latestSession);
              }
              const updatedTopic = updated.topics.find((t) => t.id === sessionData.topic_id);
              if (updatedTopic) {
                await repo.persistTopic(uId, updatedTopic);
              }
              await repo.persistGamification(
                uId,
                updated.gamificationProfile,
                updated.xpTransactions,
                updated.unlockedAchievements,
                updated.dailyMissions
              );
            }
          );

          pushNotification({
            id: `notif-qs-${Date.now()}`,
            type: 'XP_AWARDED',
            title: 'Sessão de Questões Registrada!',
            message: `${sessionData.total_questions} itens gravados com sucesso.`,
            timestamp: new Date().toISOString(),
          });
        }}
        onOpenErrorLog={(topicId) => {
          openErrorModal(topicId);
        }}
      />

      <ErrorLogModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        topics={store.topics}
        subjects={store.subjects}
        initialTopicId={errorTopicId}
        onSaveError={async (errorData) => {
          const currentUserId = user?.id || 'local-user';
          const { store: updated } = recordErrorLogAction(
            {
              ...errorData,
              user_id: currentUserId,
              resolved: false,
              resolved_at: null,
            },
            store
          );

          await updateStore(
            () => updated,
            async (repo, uId) => {
              const latestError = updated.errorLogs[0];
              if (latestError) {
                await repo.persistErrorLog(uId, latestError);
              }
              await repo.persistGamification(
                uId,
                updated.gamificationProfile,
                updated.xpTransactions,
                updated.unlockedAchievements,
                updated.dailyMissions
              );
            }
          );

          pushNotification({
            id: `notif-err-${Date.now()}`,
            type: 'XP_AWARDED',
            title: 'Erro Cadastrado no Caderno!',
            message: `Análise registrada (+5 XP).`,
            xpAmount: 5,
            timestamp: new Date().toISOString(),
          });
        }}
      />

      <CreateFlashcardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        topics={store.topics}
        subjects={store.subjects}
        initialTopicId={cardModalData.topicId}
        initialFront={cardModalData.front}
        initialBack={cardModalData.back}
        sourceErrorId={cardModalData.errorId}
        onSaveCard={async (cardData) => {
          const currentUserId = user?.id || 'local-user';
          const updated = createFlashcardAction(
            {
              ...cardData,
              user_id: currentUserId,
            },
            store
          );

          await updateStore(
            () => updated,
            async (repo, uId) => {
              const latestCard = updated.flashcards[0];
              const latestFsrs = latestCard ? updated.fsrsStates[latestCard.id] : undefined;
              if (latestCard) {
                await repo.persistFlashcard(uId, latestCard, latestFsrs);
              }
            }
          );
        }}
      />
    </ModalContext.Provider>
  );
}
