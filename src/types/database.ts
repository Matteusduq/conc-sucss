// Database entity interfaces matching PostgreSQL schema

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendedMaterialType = 'FULL_PDF' | 'SIMPLIFIED_PDF' | 'SUMMARY';
export type TopicStatus = 
  | 'NOT_STARTED'
  | 'LEARNING'
  | 'AWAITING_QUESTIONS'
  | 'CONSOLIDATING'
  | 'MASTERED'
  | 'MAINTENANCE'
  | 'AT_RISK';
export type DomainConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type MaterialStatus = 'PENDING' | 'AVAILABLE' | 'ARCHIVED';
export type SessionType = 'MATERIAL' | 'MEMORY' | 'REVIEW' | 'TEC_QUESTIONS' | 'MOCK_EXAM' | 'OTHER';
export type SubjectiveFeeling = 'MASTERED' | 'REASONABLE' | 'UNSURE' | 'VERY_WEAK';
export type ErrorType = 
  | 'CONTENT_UNKNOWN'
  | 'CONCEPT_CONFUSION'
  | 'EXCEPTION_FORGOTTEN'
  | 'COMPETENCE_SWAP'
  | 'ABSOLUTE_WORD_TRAP'
  | 'INTERPRETATION'
  | 'REWRITE_MEANING'
  | 'INATTENTION'
  | 'LAW_OR_CASELAW'
  | 'GUESS'
  | 'OTHER';
export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type CardType = 'CONTENT' | 'ERROR' | 'COMPARISON' | 'RULE' | 'CEBRASPE_TRUE_FALSE';
export type FlashcardSourceType = 'MANUAL' | 'MATERIAL' | 'ERROR_LOG' | 'AI_GENERATED';
export type FsrsRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  weekly_study_target_minutes: number;
  daily_memory_target_minutes: number;
  desired_retention: number;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  name: string;
  institution: string;
  role: string;
  exam_board: string;
  exam_date: string;
  question_model: string;
  correct_points: number;
  wrong_points: number;
  blank_points: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  exam_id: string;
  name: string;
  slug: string;
  display_order: number;
  target_hours: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  exam_id: string;
  subject_id: string;
  parent_topic_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  priority: Priority;
  priority_label: string | null;
  priority_weight: number;
  priority_source: string | null;
  recommended_material_type: RecommendedMaterialType;
  status: TopicStatus;
  display_order: number;
  estimated_minutes: number | null;
  domain_score: number | null;
  domain_confidence: DomainConfidence | null;
  study_score: number;
  last_studied_at: string | null;
  next_recommended_at: string | null;
  tec_filter_hint: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyMaterial {
  id: string;
  user_id: string;
  topic_id: string;
  title: string;
  material_type: RecommendedMaterialType;
  storage_path: string | null;
  file_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  page_count: number | null;
  status: MaterialStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialProgress {
  id: string;
  user_id: string;
  material_id: string;
  topic_id: string;
  current_page: number;
  max_page_reached: number;
  progress_percent: number;
  completed: boolean;
  first_opened_at: string | null;
  last_opened_at: string | null;
  completed_at: string | null;
  total_study_seconds: number;
  notes_by_page: Record<string, string>;
  bookmarks: number[];
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  exam_id: string;
  subject_id: string;
  topic_id: string | null;
  material_id: string | null;
  session_type: SessionType;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  notes: string | null;
  created_at: string;
}

export interface QuestionSession {
  id: string;
  user_id: string;
  exam_id: string;
  subject_id: string;
  topic_id: string;
  performed_at: string;
  total_questions: number;
  correct: number;
  wrong: number;
  blank: number;
  duration_seconds: number | null;
  subjective_feeling: SubjectiveFeeling;
  notes: string | null;
  accuracy_rate: number;
  net_points: number;
  net_rate: number;
  had_conceptual_error: boolean;
  created_at: string;
  updated_at: string;
}

export interface ErrorLog {
  id: string;
  user_id: string;
  exam_id: string;
  subject_id: string;
  topic_id: string;
  question_session_id: string | null;
  error_type: ErrorType;
  summary: string;
  correct_rule: string | null;
  personal_note: string | null;
  severity: ErrorSeverity;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  exam_id: string;
  subject_id: string;
  topic_id: string;
  card_type: CardType;
  front: string;
  back: string;
  source_type: FlashcardSourceType;
  source_material_id: string | null;
  source_error_id: string | null;
  exam_priority: Priority;
  priority_boost: number;
  active: boolean;
  suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlashcardFsrsState {
  flashcard_id: string;
  user_id: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  updated_at: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  reviewed_at: string;
  rating: FsrsRating;
  response_time_ms: number | null;
  state_before: Record<string, unknown>;
  state_after: Record<string, unknown>;
  fsrs_log: Record<string, unknown> | null;
  created_at: string;
}

export interface UserStudySettings {
  user_id: string;
  weekly_study_target_minutes?: number;
  default_high_questions: number;
  default_medium_questions: number;
  default_low_questions: number;
  memory_daily_minutes: number;
  desired_retention: number;
  today_available_minutes: number | null;
  updated_at: string;
}

export interface MockExam {
  id: string;
  user_id: string;
  exam_id: string;
  performed_at: string;
  total_questions: number;
  correct: number;
  wrong: number;
  blank: number;
  net_points: number;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export interface StudyEvent {
  id: string;
  user_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string;
  exam_id: string;
  type: 'WEEKLY_ANALYSIS' | 'ERROR_ANALYSIS' | 'STUDY_RECOMMENDATION' | 'OTHER';
  content: Record<string, unknown>;
  provider: string | null;
  model: string | null;
  generated_at: string;
}
