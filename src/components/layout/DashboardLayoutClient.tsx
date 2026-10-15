'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
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
  loadStore,
  recordQuestionSessionAction,
  recordErrorLogAction,
  createFlashcardAction,
  recordMockExamAction,
  AppStoreData,
} from '@/lib/data/store';

interface ModalContextType {
  openTecModal: (topicId?: string) => void;
  openErrorModal: (topicId?: string) => void;
  openCardModal: (data?: { topicId?: string; front?: string; back?: string; errorId?: string }) => void;
  openMockModal: () => void;
  store: AppStoreData;
  refreshStore: () => void;
  pushNotification?: (notification: GamificationNotification) => void;
}

export const ModalContext = createContext<ModalContextType>({
  openTecModal: () => {},
  openErrorModal: () => {},
  openCardModal: () => {},
  openMockModal: () => {},
  store: {} as AppStoreData,
  refreshStore: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AppStoreData>(loadStore());
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

  useEffect(() => {
    setStore(loadStore());
  }, []);

  const [mockModalOpen, setMockModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<GamificationNotification[]>([]);

  useEffect(() => {
    setStore(loadStore());
  }, []);

  const refreshStore = () => {
    setStore(loadStore());
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

  return (
    <ModalContext.Provider
      value={{
        openTecModal,
        openErrorModal,
        openCardModal,
        openMockModal,
        store,
        refreshStore,
        pushNotification,
      }}
    >
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <Header
            onOpenTecModal={() => openTecModal()}
            onOpenErrorModal={() => openErrorModal()}
          />
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>

      {/* Gamification Toast Feedback */}
      <GamificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        enabled={store.settings?.gamification_show_xp_toast !== false}
      />

      {/* Global Modals */}
      <RecordMockModal
        isOpen={mockModalOpen}
        onClose={() => setMockModalOpen(false)}
        onSave={(mockData) => {
          const { store: updated } = recordMockExamAction(
            {
              ...mockData,
              user_id: 'local-user',
              exam_id: store.exam.id,
            },
            store
          );
          setStore(updated);
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
        onSaveSession={(sessionData) => {
          const updated = recordQuestionSessionAction(
            {
              ...sessionData,
              user_id: 'local-user',
              exam_id: store.exam.id,
            },
            store
          );
          setStore(updated);
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
        onSaveError={(errorData) => {
          const { store: updated } = recordErrorLogAction(
            {
              ...errorData,
              user_id: 'local-user',
              resolved: false,
              resolved_at: null,
            },
            store
          );
          setStore(updated);
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
        onSaveCard={(cardData) => {
          const updated = createFlashcardAction(
            {
              ...cardData,
              user_id: 'local-user',
            },
            store
          );
          setStore(updated);
        }}
      />
    </ModalContext.Provider>
  );
}
