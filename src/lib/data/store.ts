'use client';

import {
  Exam,
  ExamBlock,
  Subject,
  Topic,
  SyllabusItem,
  TopicSyllabusItem,
  StudyMaterial,
  QuestionSession,
  ErrorLog,
  Flashcard,
  FlashcardFsrsState,
  FlashcardReview,
  DiscursiveSession,
  UserStudySettings,
  MockExam,
  MaterialProgress,
  StudyEvent,
  Priority,
  RecommendedMaterialType,
} from '@/types/database';
import { CardWithMetadata } from '@/lib/fsrs/types';
import {
  SEED_EXAM,
  SEED_EXAM_BLOCKS,
  SEED_SUBJECTS,
  SEED_TOPICS,
  SEED_SYLLABUS_ITEMS,
  SEED_TOPIC_SYLLABUS_ITEMS,
  SEED_MATERIALS,
} from './seed';
import { calculateTopicDomain, evaluateTopicStatus } from '@/lib/study-engine/domain';
import { calculateStudyScore } from '@/lib/study-engine/study-score';
import { calculateDiscursiveScore } from '@/lib/study-engine/discursive';
import {
  createInitialFsrsCard,
  processReview,
  sortDueCards,
  dbStateToFsrsCard,
} from '@/lib/fsrs/scheduler';
import { Rating } from 'ts-fsrs';
import {
  GamificationProfile,
  XpTransaction,
  DailyMission,
} from '@/lib/gamification/types';
import { createDefaultGamificationProfile } from '@/lib/gamification/xp';
import { processGamification } from '@/lib/gamification/engine';
import { MockExamInput, buildMockExamRecord } from '@/lib/gamification/mock-exam';

export const STORAGE_KEY_V1 = 'camara_estudos_store_v1';
export const STORAGE_KEY_V2 = 'camara_estudos_store_v2';
export const STORAGE_KEY_V3 = 'camara_estudos_store_v3';
export const STORE_VERSION = 3;

export interface AppStoreData {
  exam: Exam;
  examBlocks: ExamBlock[];
  subjects: Subject[];
  topics: Topic[];
  syllabusItems: SyllabusItem[];
  topicSyllabusItems: TopicSyllabusItem[];
  materials: StudyMaterial[];
  materialProgress: Record<string, MaterialProgress>;
  questionSessions: QuestionSession[];
  errorLogs: ErrorLog[];
  flashcards: Flashcard[];
  fsrsStates: Record<string, FlashcardFsrsState>;
  reviews: FlashcardReview[];
  discursiveSessions: DiscursiveSession[];
  settings: UserStudySettings;
  mockExams: MockExam[];
  events: StudyEvent[];
  gamificationProfile: GamificationProfile;
  xpTransactions: XpTransaction[];
  dailyMissions: Record<string, DailyMission[]>;
  unlockedAchievements: string[];
}

export interface StoredStoreEnvelope {
  version: number;
  data: AppStoreData;
}

export interface StudyRepository {
  load(): Promise<AppStoreData> | AppStoreData;
  save(data: AppStoreData): Promise<void> | void;
}

export class LocalStudyRepository implements StudyRepository {
  load(): AppStoreData {
    return loadStore();
  }
  save(data: AppStoreData): void {
    saveStore(data);
  }
}

export const studyRepository: StudyRepository = new LocalStudyRepository();

export function getDefaultStore(): AppStoreData {
  return {
    exam: SEED_EXAM,
    examBlocks: SEED_EXAM_BLOCKS,
    subjects: SEED_SUBJECTS,
    topics: SEED_TOPICS,
    syllabusItems: SEED_SYLLABUS_ITEMS,
    topicSyllabusItems: SEED_TOPIC_SYLLABUS_ITEMS,
    materials: SEED_MATERIALS,
    materialProgress: {},
    questionSessions: [],
    errorLogs: [],
    flashcards: [],
    fsrsStates: {},
    reviews: [],
    discursiveSessions: [],
    settings: {
      user_id: 'local-user',
      default_high_questions: 30,
      default_medium_questions: 20,
      default_low_questions: 15,
      memory_daily_minutes: 25,
      desired_retention: 0.90,
      today_available_minutes: null,
      gamification_show_animations: true,
      gamification_show_xp_toast: true,
      gamification_show_streak: true,
      gamification_weekly_target_days: 6,
      updated_at: '2026-10-14T00:00:00Z',
    },
    mockExams: [],
    events: [],
    gamificationProfile: createDefaultGamificationProfile(),
    xpTransactions: [],
    dailyMissions: {},
    unlockedAchievements: [],
  };
}

/**
 * Migration mappings from legacy topics (v1) to consolidated/aligned topics (v2).
 */
export const LEGACY_TOPIC_MAPPING: Record<string, string> = {
  // Português
  'top-port-1': 'top-p1-port-1',
  'top-port-2': 'top-p1-port-2',
  'top-port-3': 'top-p1-port-4',
  'top-port-4': 'top-p1-port-3',
  'top-port-5': 'top-p1-port-4',
  'top-port-6': 'top-p1-port-5',
  'top-port-7': 'top-p1-port-5',
  'top-port-8': 'top-p1-port-6',
  'top-port-9': 'top-p1-port-6',
  'top-port-10': 'top-p1-port-6',
  'top-port-11': 'top-p1-port-2',
  'top-port-12': 'top-p1-port-2',
  'top-port-13': 'top-p1-port-7',

  // Constitucional
  'top-const-1': 'top-p1-const-1',
  'top-const-2': 'top-p1-const-2',
  'top-const-3': 'top-p1-const-3',
  'top-const-4': 'top-p1-const-4',
  'top-const-5': 'top-p1-const-5',
  'top-const-6': 'top-p1-const-6',
  'top-const-7': 'top-p1-const-7',
  'top-const-8': 'top-p1-const-8',
  'top-const-9': 'top-p1-const-9',
  'top-const-10': 'top-p1-const-10',
  'top-const-11': 'top-p1-const-11',

  // Administrativo
  'top-adm-1': 'top-p1-adm-1',
  'top-adm-2': 'top-p1-adm-2',
  'top-adm-3': 'top-p1-adm-3',
  'top-adm-4': 'top-p1-adm-4',
  'top-adm-5': 'top-p1-adm-5',
  'top-adm-6': 'top-p1-adm-6',
  'top-adm-7': 'top-p1-adm-7',
  'top-adm-8': 'top-p1-adm-8',
  'top-adm-9': 'top-p1-adm-9',
  'top-adm-10': 'top-p1-adm-10',
  'top-adm-11': 'top-p1-adm-11',
  'top-adm-12': 'top-p1-adm-12',
  'top-adm-13': 'top-p1-adm-13',

  // TI antigos consolidando em unidades práticas de estudo
  'top-ti-1': 'top-p1-ti-1',
  'top-ti-2': 'top-p1-ti-1',
  'top-ti-3': 'top-p1-ti-1',
  'top-ti-4': 'top-p1-ti-1',
  'top-ti-5': 'top-p1-ti-2',
  'top-ti-6': 'top-p1-ti-2',
  'top-ti-7': 'top-p1-ti-2',
  'top-ti-8': 'top-p1-ti-3',
  'top-ti-9': 'top-p1-ti-3',
  'top-ti-10': 'top-p1-ti-3',
  // Segurança consolidada em top-p1-ti-4
  'top-ti-11': 'top-p1-ti-4',
  'top-ti-12': 'top-p1-ti-4',
  'top-ti-13': 'top-p1-ti-4',
  'top-ti-14': 'top-p1-ti-4',
  'top-ti-15': 'top-p1-ti-4',
  'top-ti-16': 'top-p1-ti-4',
  'top-ti-17': 'top-p1-ti-4',
  'top-ti-18': 'top-p1-ti-4',
  'top-ti-19': 'top-p1-ti-4',
  'top-ti-20': 'top-p1-ti-4',
  // IA consolidada em top-p1-ti-5
  'top-ti-21': 'top-p1-ti-5',
  'top-ti-22': 'top-p1-ti-5',
  'top-ti-23': 'top-p1-ti-5',
  'top-ti-24': 'top-p1-ti-5',
  'top-ti-25': 'top-p1-ti-5',
  // Ética digital em top-p1-ti-6
  'top-ti-26': 'top-p1-ti-6',
  // Dados em top-p1-ti-7
  'top-ti-27': 'top-p1-ti-7',
  'top-ti-28': 'top-p1-ti-7',
  'top-ti-29': 'top-p1-ti-7',
  // Visualização e gráficos consolidados em top-p1-ti-8
  'top-ti-30': 'top-p1-ti-8',
  'top-ti-31': 'top-p1-ti-8',
  'top-ti-32': 'top-p1-ti-8',
  'top-ti-33': 'top-p1-ti-8',
  'top-ti-34': 'top-p1-ti-8',
  'top-ti-35': 'top-p1-ti-8',
  'top-ti-36': 'top-p1-ti-8',

  // Named legacy microtopics (especially IT visualization and security)
  'top-ti-histograma': 'top-p1-ti-8',
  'top-ti-boxplot': 'top-p1-ti-8',
  'top-ti-box-plot': 'top-p1-ti-8',
  'top-ti-barras': 'top-p1-ti-8',
  'top-ti-linhas': 'top-p1-ti-8',
  'top-ti-dispersao': 'top-p1-ti-8',
  'top-ti-powerbi': 'top-p1-ti-8',
  'top-ti-tableau': 'top-p1-ti-8',
  'top-ti-storytelling': 'top-p1-ti-8',
  'top-ti-phishing': 'top-p1-ti-4',
  'top-ti-pharming': 'top-p1-ti-4',
  'top-ti-malware': 'top-p1-ti-4',
  'top-ti-ransomware': 'top-p1-ti-4',
  'top-ti-virus': 'top-p1-ti-4',
  'top-ti-firewall': 'top-p1-ti-4',
  'top-ti-backup': 'top-p1-ti-4',
};

export function remapTopicId(oldId: string): string {
  if (LEGACY_TOPIC_MAPPING[oldId]) return LEGACY_TOPIC_MAPPING[oldId];
  const lower = oldId.toLowerCase();
  if (
    lower.includes('histogram') ||
    lower.includes('box') ||
    lower.includes('grafico') ||
    lower.includes('power-bi') ||
    lower.includes('tableau') ||
    lower.includes('storytelling')
  ) {
    return 'top-p1-ti-8';
  }
  if (
    lower.includes('phishing') ||
    lower.includes('pharming') ||
    lower.includes('firewall') ||
    lower.includes('antivirus') ||
    lower.includes('malware') ||
    lower.includes('ransomware') ||
    lower.includes('virus') ||
    lower.includes('worm') ||
    lower.includes('backup')
  ) {
    return 'top-p1-ti-4';
  }
  return oldId;
}


export function migrateV1ToV2(v1Data: Partial<AppStoreData>): AppStoreData {
  const defaultStore = getDefaultStore();

  const migratedSessions: QuestionSession[] = (v1Data.questionSessions || []).map((s) => ({
    ...s,
    topic_id: remapTopicId(s.topic_id),
  }));

  const migratedErrors: ErrorLog[] = (v1Data.errorLogs || []).map((e) => ({
    ...e,
    topic_id: remapTopicId(e.topic_id),
  }));

  const migratedFlashcards: Flashcard[] = (v1Data.flashcards || []).map((c) => ({
    ...c,
    topic_id: remapTopicId(c.topic_id),
  }));

  // Preserve user overrides on topics if present in v1
  const v1TopicsMap = new Map((v1Data.topics || []).map((t) => [t.id, t]));
  const updatedTopics = defaultStore.topics.map((t) => {
    // Check if user had overridden or studied the topic previously
    const mappedOldKey = Object.keys(LEGACY_TOPIC_MAPPING).find(
      (k) => LEGACY_TOPIC_MAPPING[k] === t.id
    );
    const oldTopic = (mappedOldKey && v1TopicsMap.get(mappedOldKey)) || v1TopicsMap.get(t.id);

    if (oldTopic) {
      return {
        ...t,
        status: oldTopic.status !== 'NOT_STARTED' ? oldTopic.status : t.status,
        priority: oldTopic.priority_source === 'USER_OVERRIDE' ? oldTopic.priority : t.priority,
        priority_source: oldTopic.priority_source || t.priority_source,
        last_studied_at: oldTopic.last_studied_at || t.last_studied_at,
        domain_score: oldTopic.domain_score ?? t.domain_score,
        domain_confidence: oldTopic.domain_confidence ?? t.domain_confidence,
      };
    }
    return t;
  });

  return {
    ...defaultStore,
    exam: {
      ...defaultStore.exam,
      ...(v1Data.exam || {}),
      // Preserve official parameters
      p1_items: 90,
      p2_items: 90,
      p1_min_points: 18,
      p2_min_points: 27,
      objective_total_min_points: 54,
      p3_max_points: 60,
      p3_min_points: 30,
      exam_date: v1Data.exam?.exam_date || defaultStore.exam.exam_date,
    },
    examBlocks: SEED_EXAM_BLOCKS,
    subjects: SEED_SUBJECTS,
    topics: updatedTopics,
    syllabusItems: SEED_SYLLABUS_ITEMS,
    topicSyllabusItems: SEED_TOPIC_SYLLABUS_ITEMS,
    materials: SEED_MATERIALS,
    materialProgress: v1Data.materialProgress || {},
    questionSessions: migratedSessions,
    errorLogs: migratedErrors,
    flashcards: migratedFlashcards,
    fsrsStates: v1Data.fsrsStates || {},
    reviews: v1Data.reviews || [],
    discursiveSessions: v1Data.discursiveSessions || [],
    settings: {
      ...defaultStore.settings,
      ...(v1Data.settings || {}),
    },
    mockExams: v1Data.mockExams || [],
    events: v1Data.events || [],
    gamificationProfile: createDefaultGamificationProfile(),
    xpTransactions: [],
    dailyMissions: {},
    unlockedAchievements: [],
  };
}

export function migrateV2ToV3(v2Data: Partial<AppStoreData>): AppStoreData {
  const defaultStore = getDefaultStore();

  const baseStore: AppStoreData = {
    ...defaultStore,
    ...v2Data,
    exam: {
      ...defaultStore.exam,
      ...(v2Data.exam || {}),
    },
    examBlocks: v2Data.examBlocks && v2Data.examBlocks.length > 0 ? v2Data.examBlocks : defaultStore.examBlocks,
    subjects: v2Data.subjects && v2Data.subjects.length > 0 ? v2Data.subjects : defaultStore.subjects,
    topics: v2Data.topics && v2Data.topics.length > 0 ? v2Data.topics : defaultStore.topics,
    syllabusItems: v2Data.syllabusItems && v2Data.syllabusItems.length > 0 ? v2Data.syllabusItems : defaultStore.syllabusItems,
    topicSyllabusItems: v2Data.topicSyllabusItems && v2Data.topicSyllabusItems.length > 0 ? v2Data.topicSyllabusItems : defaultStore.topicSyllabusItems,
    materials: v2Data.materials && v2Data.materials.length > 0 ? v2Data.materials : defaultStore.materials,
    materialProgress: v2Data.materialProgress || {},
    questionSessions: v2Data.questionSessions || [],
    errorLogs: v2Data.errorLogs || [],
    flashcards: v2Data.flashcards || [],
    fsrsStates: v2Data.fsrsStates || {},
    reviews: v2Data.reviews || [],
    discursiveSessions: v2Data.discursiveSessions || [],
    settings: {
      ...defaultStore.settings,
      ...(v2Data.settings || {}),
    },
    mockExams: v2Data.mockExams || [],
    events: v2Data.events || [],
    gamificationProfile: v2Data.gamificationProfile || createDefaultGamificationProfile(),
    xpTransactions: v2Data.xpTransactions || [],
    dailyMissions: v2Data.dailyMissions || {},
    unlockedAchievements: v2Data.unlockedAchievements || [],
  };

  const { store: processedStore } = processGamification(baseStore);
  return processedStore;
}

export function loadStore(): AppStoreData {
  if (typeof window === 'undefined') {
    return getDefaultStore();
  }
  try {
    // 1. Try v3 format first
    const rawV3 = localStorage.getItem(STORAGE_KEY_V3);
    if (rawV3) {
      const parsedEnvelope = JSON.parse(rawV3);
      let data: AppStoreData;
      if (parsedEnvelope && parsedEnvelope.version === 3 && parsedEnvelope.data) {
        data = parsedEnvelope.data as AppStoreData;
      } else {
        data = parsedEnvelope as AppStoreData;
      }

      // Ensure all seed components are loaded if missing
      if (!data.examBlocks || data.examBlocks.length === 0) {
        data.examBlocks = SEED_EXAM_BLOCKS;
      }
      if (!data.syllabusItems || data.syllabusItems.length === 0) {
        data.syllabusItems = SEED_SYLLABUS_ITEMS;
      }
      if (!data.topicSyllabusItems || data.topicSyllabusItems.length === 0) {
        data.topicSyllabusItems = SEED_TOPIC_SYLLABUS_ITEMS;
      }
      if (!data.discursiveSessions) {
        data.discursiveSessions = [];
      }
      if (!data.mockExams) {
        data.mockExams = [];
      }
      if (!data.topics || data.topics.length < SEED_TOPICS.length) {
        const existingIds = new Set(data.topics.map((t) => t.id));
        const missingTopics = SEED_TOPICS.filter((t) => !existingIds.has(t.id));
        data.topics = [...data.topics, ...missingTopics];
      }
      if (!data.topics || data.topics.some((t) => !t.study_score || t.study_score === 0)) {
        data = recalculateAllStudyScoresService(data);
      }
      if (!data.gamificationProfile) {
        data.gamificationProfile = createDefaultGamificationProfile();
      }
      if (!data.xpTransactions) data.xpTransactions = [];
      if (!data.dailyMissions) data.dailyMissions = {};
      if (!data.unlockedAchievements) data.unlockedAchievements = [];

      const { store: processed } = processGamification(data);
      return processed;
    }

    // 2. Check if v2 exists and needs migration to v3
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsedEnvelope = JSON.parse(rawV2);
      const v2Data = (parsedEnvelope?.data || parsedEnvelope) as Partial<AppStoreData>;
      const migrated = recalculateAllStudyScoresService(migrateV2ToV3(v2Data));
      saveStore(migrated);
      return migrated;
    }

    // 3. Check if v1 exists and needs migration
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1) as Partial<AppStoreData>;
      const v2Data = migrateV1ToV2(parsedV1);
      const migrated = recalculateAllStudyScoresService(migrateV2ToV3(v2Data));
      saveStore(migrated);
      return migrated;
    }

    // 4. Brand new setup: initialize default store in v3
    const initial = recalculateAllStudyScoresService(getDefaultStore());
    const { store: processedInitial } = processGamification(initial);
    saveStore(processedInitial);
    return processedInitial;
  } catch (err) {
    console.error('Error loading store, falling back to default store:', err);
    return getDefaultStore();
  }
}

export function saveStore(store: AppStoreData) {
  if (typeof window === 'undefined') return;
  try {
    const envelope: StoredStoreEnvelope = {
      version: STORE_VERSION,
      data: store,
    };
    localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(envelope));
  } catch (err) {
    console.error('Failed to save store to localStorage:', err);
  }
}

// -------------------------------------------------------------
// Core Business Services
// -------------------------------------------------------------

export function recalculateTopicDomainService(
  topicId: string,
  store: AppStoreData
): AppStoreData {
  const topic = store.topics.find((t) => t.id === topicId);
  if (!topic) return store;

  // Domain score only applies to objective blocks (P1 / P2)
  if (topic.exam_block_code !== 'P1' && topic.exam_block_code !== 'P2') {
    return store;
  }

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
    examBlockCode: topic.exam_block_code,
    discursiveEligible: topic.discursive_eligible,
    discursiveSynergy: topic.discursive_synergy,
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
      examBlockCode: topic.exam_block_code,
      discursiveEligible: topic.discursive_eligible,
      discursiveSynergy: topic.discursive_synergy,
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
        status:
          t.status === 'AWAITING_QUESTIONS' || t.status === 'NOT_STARTED' || t.status === 'LEARNING'
            ? 'CONSOLIDATING'
            : t.status,
      };
    }
    return t;
  });

  // Recalculate domain and scores for this topic
  nextStore = recalculateTopicDomainService(sessionData.topic_id, nextStore);
  nextStore = recalculateAllStudyScoresService(nextStore);

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
  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return gamified;
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

  let nextStore: AppStoreData = {
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

  nextStore = recalculateTopicDomainService(errorData.topic_id, nextStore);
  nextStore = recalculateAllStudyScoresService(nextStore);
  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return { store: gamified, errorId: id };
}

export function resolveErrorLogAction(
  errorId: string,
  store: AppStoreData
): AppStoreData {
  const now = new Date().toISOString();
  let topicId: string | undefined;

  const updatedErrors = store.errorLogs.map((e) => {
    if (e.id === errorId) {
      topicId = e.topic_id;
      return {
        ...e,
        resolved: true,
        resolved_at: now,
        updated_at: now,
      };
    }
    return e;
  });

  let nextStore: AppStoreData = {
    ...store,
    errorLogs: updatedErrors,
    events: [
      {
        id: `ev-${Date.now()}`,
        user_id: 'local-user',
        event_type: 'ERROR_RESOLVED',
        entity_type: 'error_log',
        entity_id: errorId,
        payload: { errorId, topicId },
        created_at: now,
      },
      ...store.events,
    ],
  };

  if (topicId) {
    nextStore = recalculateTopicDomainService(topicId, nextStore);
    nextStore = recalculateAllStudyScoresService(nextStore);
  }

  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return gamified;
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

  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return gamified;
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
    events: [
      {
        id: `ev-${Date.now()}`,
        user_id: card.user_id,
        event_type: 'FLASHCARD_REVIEWED',
        entity_type: 'flashcard',
        entity_id: flashcardId,
        payload: { rating: ratingStr, topicId: card.topic_id },
        created_at: new Date().toISOString(),
      },
      ...store.events,
    ],
  };

  // Recalculate domain for this topic
  nextStore = recalculateTopicDomainService(card.topic_id, nextStore);

  // Check if all overdue cards are now cleared
  const remainingDue = getDueFlashcards(nextStore);
  if (remainingDue.length === 0) {
    nextStore.events = [
      {
        id: `ev-${Date.now()}-qc`,
        user_id: card.user_id,
        event_type: 'FLASHCARD_QUEUE_CLEARED',
        entity_type: 'flashcard_queue',
        entity_id: 'all',
        payload: {},
        created_at: new Date().toISOString(),
      },
      ...nextStore.events,
    ];
  }

  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return gamified;
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

  const isNewlyCompleted = Boolean(progressData.completed && !existing.completed);

  const merged: MaterialProgress = {
    ...existing,
    ...progressData,
    last_opened_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: isNewlyCompleted ? new Date().toISOString() : existing.completed_at,
  };

  let nextStore: AppStoreData = {
    ...store,
    materialProgress: {
      ...store.materialProgress,
      [progressData.material_id]: merged,
    },
  };

  // Log events
  if (isNewlyCompleted) {
    nextStore.events = [
      {
        id: `ev-${Date.now()}-mc`,
        user_id: progressData.user_id,
        event_type: 'MATERIAL_COMPLETED',
        entity_type: 'study_material',
        entity_id: progressData.material_id,
        payload: { topicId: progressData.topic_id },
        created_at: new Date().toISOString(),
      },
      ...nextStore.events,
    ];
  } else if (merged.total_study_seconds >= 1200) {
    nextStore.events = [
      {
        id: `ev-${Date.now()}-mp`,
        user_id: progressData.user_id,
        event_type: 'MATERIAL_PROGRESS_RECORDED',
        entity_type: 'study_material',
        entity_id: progressData.material_id,
        payload: { topicId: progressData.topic_id, totalSeconds: merged.total_study_seconds },
        created_at: new Date().toISOString(),
      },
      ...nextStore.events,
    ];
  }

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
  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return gamified;
}

// -------------------------------------------------------------
// Discursive Session Actions (P3)
// -------------------------------------------------------------

export function recordDiscursiveSessionAction(
  sessionData: Omit<DiscursiveSession, 'id' | 'calculated_score' | 'created_at' | 'updated_at'>,
  store: AppStoreData
): { store: AppStoreData; session: DiscursiveSession } {
  const calc = calculateDiscursiveScore(
    sessionData.type,
    sessionData.content_score,
    sessionData.language_errors,
    sessionData.lines_written
  );

  const sessionId = `disc-${Date.now()}`;
  const newSession: DiscursiveSession = {
    ...sessionData,
    id: sessionId,
    calculated_score: calc.calculatedScore,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const nextStore: AppStoreData = {
    ...store,
    discursiveSessions: [newSession, ...(store.discursiveSessions || [])],
    events: [
      {
        id: `ev-${Date.now()}`,
        user_id: sessionData.user_id,
        event_type: 'DISCURSIVE_SESSION_RECORDED',
        entity_type: 'discursive_session',
        entity_id: sessionId,
        payload: {
          type: sessionData.type,
          calculatedScore: calc.calculatedScore,
          linesWritten: sessionData.lines_written,
        },
        created_at: new Date().toISOString(),
      },
      ...store.events,
    ],
  };

  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return { store: gamified, session: newSession };
}

export function deleteDiscursiveSessionAction(
  sessionId: string,
  store: AppStoreData
): AppStoreData {
  const nextStore: AppStoreData = {
    ...store,
    discursiveSessions: (store.discursiveSessions || []).filter((s) => s.id !== sessionId),
  };
  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return gamified;
}

// -------------------------------------------------------------
// Mock Exam Actions (Simulados & Checkpoints)
// -------------------------------------------------------------

export function recordMockExamAction(
  mockData: MockExamInput,
  store: AppStoreData
): { store: AppStoreData; mockExam: MockExam } {
  const newMock = buildMockExamRecord(mockData);

  const nextStore: AppStoreData = {
    ...store,
    mockExams: [newMock, ...(store.mockExams || [])],
    events: [
      {
        id: `ev-${Date.now()}`,
        user_id: newMock.user_id,
        event_type: 'MOCK_EXAM_RECORDED',
        entity_type: 'mock_exam',
        entity_id: newMock.id,
        payload: {
          type: newMock.type,
          totalQuestions: newMock.total_questions,
          netPoints: newMock.net_points,
          p1Net: newMock.p1_net,
          p2Net: newMock.p2_net,
        },
        created_at: newMock.performed_at,
      },
      ...store.events,
    ],
  };

  const { store: gamified } = processGamification(nextStore);
  saveStore(gamified);
  return { store: gamified, mockExam: newMock };
}

// -------------------------------------------------------------
// User Override Action for Topic Priority
// -------------------------------------------------------------

export function updateTopicPriorityAction(
  topicId: string,
  priority: Priority,
  recommendedMaterialType: RecommendedMaterialType | undefined,
  store: AppStoreData
): AppStoreData {
  const weight = priority === 'HIGH' ? 3.0 : priority === 'MEDIUM' ? 2.0 : 1.0;
  const nextStore: AppStoreData = {
    ...store,
    topics: store.topics.map((t) => {
      if (t.id === topicId) {
        return {
          ...t,
          priority,
          priority_weight: weight,
          priority_basis: 'USER_OVERRIDE',
          priority_source: 'Alterado manualmente pelo usuário',
          recommended_material_type: recommendedMaterialType || t.recommended_material_type,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    }),
  };

  const recalculatedStore = recalculateTopicDomainService(topicId, nextStore);
  saveStore(recalculatedStore);
  return recalculatedStore;
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
