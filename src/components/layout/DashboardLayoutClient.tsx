'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { TecSessionModal } from '@/components/performance/TecSessionModal';
import { ErrorLogModal } from '@/components/performance/ErrorLogModal';
import { CreateFlashcardModal } from '@/components/memory/CreateFlashcardModal';
import {
  loadStore,
  recordQuestionSessionAction,
  recordErrorLogAction,
  createFlashcardAction,
  AppStoreData,
} from '@/lib/data/store';

interface ModalContextType {
  openTecModal: (topicId?: string) => void;
  openErrorModal: (topicId?: string) => void;
  openCardModal: (data?: { topicId?: string; front?: string; back?: string; errorId?: string }) => void;
  store: AppStoreData;
  refreshStore: () => void;
}

export const ModalContext = createContext<ModalContextType>({
  openTecModal: () => {},
  openErrorModal: () => {},
  openCardModal: () => {},
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

  return (
    <ModalContext.Provider
      value={{
        openTecModal,
        openErrorModal,
        openCardModal,
        store,
        refreshStore,
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

      {/* Global Modals */}
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
