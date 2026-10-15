'use client';

import {
  Exam,
  Subject,
  Topic,
  StudyMaterial,
  QuestionSession,
  ErrorLog,
  Flashcard,
  FlashcardFsrsState,
  FlashcardReview,
  UserStudySettings,
  MockExam,
  MaterialProgress,
  StudyEvent,
} from '@/types/database';
import { CardWithMetadata } from '@/lib/fsrs/types';
import { SEED_EXAM, SEED_SUBJECTS, SEED_TOPICS, SEED_MATERIALS } from './seed-data';
import { calculateTopicDomain, evaluateTopicStatus } from '@/lib/study-engine/domain';
import { calculateStudyScore } from '@/lib/study-engine/study-score';
import {
  createInitialFsrsCard,
  processReview,
  sortDueCards,
  dbStateToFsrsCard,
} from '@/lib/fsrs/scheduler';
import { Rating } from 'ts-fsrs';

const STORAGE_KEY = 'camara_estudos_store_v1';

export interface AppStoreData {
  exam: Exam;
  subjects: Subject[];
  topics: Topic[];
  materials: StudyMaterial[];
  materialProgress: Record<string, MaterialProgress>;
  questionSessions: QuestionSession[];
  errorLogs: ErrorLog[];
  flashcards: Flashcard[];
  fsrsStates: Record<string, FlashcardFsrsState>;
  reviews: FlashcardReview[];
  settings: UserStudySettings;
  mockExams: MockExam[];
  events: StudyEvent[];
}

function getDefaultStore(): AppStoreData {
  return {
    exam: SEED_EXAM,
    subjects: SEED_SUBJECTS,
    topics: SEED_TOPICS,
    materials: SEED_MATERIALS,
    materialProgress: {},
    questionSessions: [],
    errorLogs: [],
    flashcards: [],
    fsrsStates: {},
    reviews: [],
    settings: {
      user_id: 'local-user',
      default_high_questions: 30,
      default_medium_questions: 20,
      default_low_questions: 15,
      memory_daily_minutes: 25,
      desired_retention: 0.90,
      today_available_minutes: null,
      updated_at: '2026-10-14T00:00:00Z',
    },
    mockExams: [],
    events: [],
  };
}

export function loadStore(): AppStoreData {
  if (typeof window === 'undefined') {
    return getDefaultStore();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultStore();
      saveStore(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppStoreData;
    // Merge if empty topics
    if (!parsed.topics || parsed.topics.length === 0) {
      parsed.topics = SEED_TOPICS;
    }
    if (!parsed.materials || parsed.materials.length === 0) {
      parsed.materials = SEED_MATERIALS;
    }
    return parsed;
  } catch {
    return getDefaultStore();
  }
}

export function saveStore(store: AppStoreData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save store to localStorage:', err);
  }
}

// -------------------------------------------------------------
// Core Business Services (Requirement 56, 57, 14, 15, 17, 18)
// -------------------------------------------------------------

export function recalculateTopicDomainService(
  topicId: string,
  store: AppStoreData
): AppStoreData {
  const topic = store.topics.find((t) => t.id === topicId);
  if (!topic) return store;

  const topicSessions = store.questionSessions.filter((s) => s.topic_id === topicId);

  // Calculate retention from flashcard states of this topic
  const topicCards = store.flashcards.filter((c) => c.topic_id === topicId && c.active);
  let retentionRate: number | null = null;
  if (topicCards.length > 0) {
    const states = topicCards
      .map((c) => store.fsrsStates[c.id])
      .filter(Boolean);
    if (states.length > 0) {
      const totalReps = states.reduce((sum, s) => sum + s.reps, 0);
      const totalLapses = states.reduce((sum, s) => sum + s.lapses, 0);
      if (totalReps > 0) {
        retentionRate = Math.max(0, Math.min(100, Math.round(((totalReps - totalLapses) / totalReps) * 100)));
      }
    }
  }

  // Coverage from material progress
  const material = store.materials.find((m) => m.topic_id === topicId);
  const progress = material ? store.materialProgress[material.id] : undefined;
  const coveragePercent = progress ? progress.progress_percent : 0;

  const domainResult = calculateTopicDomain({
    sessions: topicSessions,
    retentionRate,
    coveragePercent,
  });

  // Evaluate status transitions
  const newStatus = evaluateTopicStatus({
    currentStatus: topic.status,
    priority: topic.priority,
    materialOpened: Boolean(progress && progress.current_page > 1),
    materialCompleted: Boolean(progress && progress.completed),
    sessions: topicSessions,
    domainScore: domainResult.domainScore,
    domainConfidence: domainResult.domainConfidence,
  });

  // Calculate Study Score
  const overdueCount = topicCards.filter((c) => {
    const st = store.fsrsStates[c.id];
    return st && new Date(st.due).getTime() <= Date.now();
  }).length;

  const studyScoreResult = calculateStudyScore({
    priority: topic.priority,
    domainScore: domainResult.domainScore,
    domainConfidence: domainResult.domainConfidence,
    status: newStatus,
    overdueCardsCount: overdueCount,
    recentSessions: topicSessions,
    lastStudiedAt: topic.last_studied_at,
  });

  const updatedTopics = store.topics.map((t) => {
    if (t.id !== topicId) return t;
    return {
      ...t,
      domain_score: domainResult.domainScore,
      domain_confidence: domainResult.domainConfidence,
      status: newStatus,
      study_score: studyScoreResult.studyScore,
      updated_at: new Date().toISOString(),
    };
  });

  return {
    ...store,
    topics: updatedTopics,
  };
}

export function recalculateAllStudyScoresService(store: AppStoreData): AppStoreData {
  const updatedTopics = store.topics.map((topic) => {
    const topicSessions = store.questionSessions.filter((s) => s.topic_id === topic.id);
    const topicCards = store.flashcards.filter((c) => c.topic_id === topic.id && c.active);
    const overdueCount = topicCards.filter((c) => {
      const st = store.fsrsStates[c.id];
      return st && new Date(st.due).getTime() <= Date.now();
    }).length;

    const res = calculateStudyScore({
      priority: topic.priority,
      domainScore: topic.domain_score,
      domainConfidence: topic.domain_confidence,
      status: topic.status,
      overdueCardsCount: overdueCount,
      recentSessions: topicSessions,
      lastStudiedAt: topic.last_studied_at,
    });

    return {
      ...topic,
      study_score: res.studyScore,
    };
  });

  return {
    ...store,
    topics: updatedTopics,
  };
}

// -------------------------------------------------------------
// Action Handlers
// -------------------------------------------------------------

export function recordQuestionSessionAction(
  sessionData: Omit<QuestionSession, 'id' | 'created_at' | 'updated_at'>,
  store: AppStoreData
): AppStoreData {
  const newSession: QuestionSession = {
    ...sessionData,
    id: `qs-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedSessions = [newSession, ...store.questionSessions];

  let nextStore: AppStoreData = {
    ...store,
    questionSessions: updatedSessions,
  };

  // Update last_studied_at on topic
  nextStore.topics = nextStore.topics.map((t) => {
    if (t.id === sessionData.topic_id) {
      return {
        ...t,
        last_studied_at: newSession.performed_at,
        // If it was awaiting questions or not started, advance to consolidating
        status: t.status === 'AWAITING_QUESTIONS' || t.status === 'NOT_STARTED' || t.status === 'LEARNING'
          ? 'CONSOLIDATING'
          : t.status,
      };
    }
    return t;
  });

  // Recalculate domain and scores for this topic
  nextStore = recalculateTopicDomainService(sessionData.topic_id, nextStore);

  // Log study event
  const event: StudyEvent = {
    id: `ev-${Date.now()}`,
    user_id: sessionData.user_id,
    event_type: 'QUESTION_SESSION_RECORDED',
    entity_type: 'topic',
    entity_id: sessionData.topic_id,
    payload: {
      totalQuestions: sessionData.total_questions,
      netPoints: sessionData.net_points,
      accuracyRate: sessionData.accuracy_rate,
    },
    created_at: new Date().toISOString(),
  };

  nextStore.events = [event, ...nextStore.events];
  saveStore(nextStore);
  return nextStore;
}

export function recordErrorLogAction(
  errorData: Omit<ErrorLog, 'id' | 'created_at' | 'updated_at'>,
  store: AppStoreData
): { store: AppStoreData; errorId: string } {
  const id = `err-${Date.now()}`;
  const newError: ErrorLog = {
    ...errorData,
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const nextStore = {
    ...store,
    errorLogs: [newError, ...store.errorLogs],
    events: [
      {
        id: `ev-${Date.now()}`,
        user_id: errorData.user_id,
        event_type: 'ERROR_LOGGED',
        entity_type: 'error_log',
        entity_id: id,
        payload: { errorType: errorData.error_type, topicId: errorData.topic_id },
        created_at: new Date().toISOString(),
      },
      ...store.events,
    ],
  };

  saveStore(nextStore);
  return { store: nextStore, errorId: id };
}

export function createFlashcardAction(
  cardData: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>,
  store: AppStoreData
): AppStoreData {
  const cardId = `fc-${Date.now()}`;
  const newCard: Flashcard = {
    ...cardData,
    id: cardId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const initialFsrs = createInitialFsrsCard();
  const fsrsState: FlashcardFsrsState = {
    flashcard_id: cardId,
    user_id: cardData.user_id,
    due: initialFsrs.due.toISOString(),
    stability: initialFsrs.stability,
    difficulty: initialFsrs.difficulty,
    elapsed_days: initialFsrs.elapsed_days,
    scheduled_days: initialFsrs.scheduled_days,
    learning_steps: initialFsrs.learning_steps,
    reps: initialFsrs.reps,
    lapses: initialFsrs.lapses,
    state: initialFsrs.state,
    last_review: null,
    updated_at: new Date().toISOString(),
  };

  const nextStore = {
    ...store,
    flashcards: [newCard, ...store.flashcards],
    fsrsStates: {
      ...store.fsrsStates,
      [cardId]: fsrsState,
    },
    events: [
      {
        id: `ev-${Date.now()}`,
        user_id: cardData.user_id,
        event_type: 'FLASHCARD_CREATED',
        entity_type: 'flashcard',
        entity_id: cardId,
        payload: { cardType: cardData.card_type, topicId: cardData.topic_id },
        created_at: new Date().toISOString(),
      },
      ...store.events,
    ],
  };

  saveStore(nextStore);
  return nextStore;
}

export function reviewFlashcardAction(
  flashcardId: string,
  rating: Rating,
  responseTimeMs: number | null,
  store: AppStoreData
): AppStoreData {
  const currentFsrs = store.fsrsStates[flashcardId];
  const card = store.flashcards.find((c) => c.id === flashcardId);
  if (!currentFsrs || !card) return store;

  const fsrsCard = dbStateToFsrsCard(currentFsrs);
  const record = processReview(fsrsCard, rating, store.settings.desired_retention);

  const updatedFsrsState: FlashcardFsrsState = {
    flashcard_id: flashcardId,
    user_id: card.user_id,
    due: record.card.due.toISOString(),
    stability: record.card.stability,
    difficulty: record.card.difficulty,
    elapsed_days: record.card.elapsed_days,
    scheduled_days: record.card.scheduled_days,
    learning_steps: record.card.learning_steps,
    reps: record.card.reps,
    lapses: record.card.lapses,
    state: record.card.state,
    last_review: record.card.last_review ? record.card.last_review.toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const ratingStr =
    rating === Rating.Again ? 'AGAIN' : rating === Rating.Hard ? 'HARD' : rating === Rating.Good ? 'GOOD' : 'EASY';

  const newReview: FlashcardReview = {
    id: `rev-${Date.now()}`,
    user_id: card.user_id,
    flashcard_id: flashcardId,
    reviewed_at: new Date().toISOString(),
    rating: ratingStr,
    response_time_ms: responseTimeMs,
    state_before: { ...currentFsrs },
    state_after: { ...updatedFsrsState },
    fsrs_log: { ...record.log },
    created_at: new Date().toISOString(),
  };

  let nextStore: AppStoreData = {
    ...store,
    fsrsStates: {
      ...store.fsrsStates,
      [flashcardId]: updatedFsrsState,
    },
    reviews: [newReview, ...store.reviews],
  };

  // Recalculate domain for this topic
  nextStore = recalculateTopicDomainService(card.topic_id, nextStore);
  saveStore(nextStore);
  return nextStore;
}

export function updateMaterialProgressAction(
  progressData: Partial<MaterialProgress> & { material_id: string; topic_id: string; user_id: string },
  store: AppStoreData
): AppStoreData {
  const existing = store.materialProgress[progressData.material_id] || {
    id: `mp-${Date.now()}`,
    user_id: progressData.user_id,
    material_id: progressData.material_id,
    topic_id: progressData.topic_id,
    current_page: 1,
    max_page_reached: 1,
    progress_percent: 0,
    completed: false,
    first_opened_at: new Date().toISOString(),
    last_opened_at: new Date().toISOString(),
    completed_at: null,
    total_study_seconds: 0,
    notes_by_page: {},
    bookmarks: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const merged: MaterialProgress = {
    ...existing,
    ...progressData,
    last_opened_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: progressData.completed && !existing.completed ? new Date().toISOString() : existing.completed_at,
  };

  let nextStore: AppStoreData = {
    ...store,
    materialProgress: {
      ...store.materialProgress,
      [progressData.material_id]: merged,
    },
  };

  // Status transitions
  nextStore.topics = nextStore.topics.map((t) => {
    if (t.id === progressData.topic_id) {
      if (merged.completed && t.status === 'LEARNING') {
        return { ...t, status: 'AWAITING_QUESTIONS' };
      }
      if (merged.current_page > 1 && t.status === 'NOT_STARTED') {
        return { ...t, status: 'LEARNING' };
      }
    }
    return t;
  });

  nextStore = recalculateTopicDomainService(progressData.topic_id, nextStore);
  saveStore(nextStore);
  return nextStore;
}

export function getDueFlashcards(store: AppStoreData, now: Date = new Date()): CardWithMetadata[] {
  const dueList: CardWithMetadata[] = [];
  const subjectMap = new Map(store.subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(store.topics.map((t) => [t.id, t]));

  for (const card of store.flashcards) {
    if (!card.active || card.suspended) continue;
    const fsrs = store.fsrsStates[card.id];
    if (!fsrs) continue;

    const dueDate = new Date(fsrs.due);
    if (dueDate.getTime() <= now.getTime()) {
      const topic = topicMap.get(card.topic_id);
      dueList.push({
        id: card.id,
        front: card.front,
        back: card.back,
        card_type: card.card_type,
        topic_id: card.topic_id,
        topic_name: topic?.name,
        subject_name: topic ? subjectMap.get(topic.subject_id) : undefined,
        exam_priority: card.exam_priority,
        priority_boost: card.priority_boost,
        fsrs_state: fsrs,
      });
    }
  }

  return sortDueCards(dueList, now);
}
