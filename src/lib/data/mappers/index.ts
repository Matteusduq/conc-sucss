import {
  Exam,
  ExamBlock,
  Subject,
  Topic,
  SyllabusItem,
  TopicSyllabusItem,
  StudyMaterial,
  MaterialProgress,
  QuestionSession,
  ErrorLog,
  Flashcard,
  FlashcardFsrsState,
  FlashcardReview,
  DiscursiveSession,
  StudySession,
  UserStudySettings,
  MockExam,
  StudyEvent,
} from '@/types/database';
import {
  GamificationProfile,
  XpTransaction,
  DailyMission,
} from '@/lib/gamification/types';

// ============================================================================
// CONVERSÕES DB -> DOMÍNIO
// ============================================================================

export function mapExamFromDb(row: Record<string, unknown>): Exam {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    institution: String(row.institution),
    role: String(row.role),
    exam_board: String(row.exam_board),
    exam_date: String(row.exam_date),
    question_model: String(row.question_model),
    correct_points: Number(row.correct_points),
    wrong_points: Number(row.wrong_points),
    blank_points: Number(row.blank_points),
    active: Boolean(row.active),
    objective_duration_minutes: row.objective_duration_minutes != null ? Number(row.objective_duration_minutes) : undefined,
    discursive_duration_minutes: row.discursive_duration_minutes != null ? Number(row.discursive_duration_minutes) : undefined,
    p1_items: row.p1_items != null ? Number(row.p1_items) : undefined,
    p2_items: row.p2_items != null ? Number(row.p2_items) : undefined,
    p1_min_points: row.p1_min_points != null ? Number(row.p1_min_points) : undefined,
    p2_min_points: row.p2_min_points != null ? Number(row.p2_min_points) : undefined,
    objective_total_min_points: row.objective_total_min_points != null ? Number(row.objective_total_min_points) : undefined,
    p3_max_points: row.p3_max_points != null ? Number(row.p3_max_points) : undefined,
    p3_min_points: row.p3_min_points != null ? Number(row.p3_min_points) : undefined,
    official_notice_date: row.official_notice_date ? String(row.official_notice_date) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

export function mapExamBlockFromDb(row: Record<string, unknown>): ExamBlock {
  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    exam_id: String(row.exam_id),
    code: String(row.code) as 'P1' | 'P2' | 'P3',
    name: String(row.name),
    block_type: String(row.block_type) as 'OBJECTIVE' | 'DISCURSIVE',
    total_items: row.total_items != null ? Number(row.total_items) : null,
    max_points: Number(row.max_points),
    minimum_points: row.minimum_points != null ? Number(row.minimum_points) : null,
    duration_minutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
    display_order: Number(row.display_order),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

export function mapSubjectFromDb(row: Record<string, unknown>): Subject {
  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    exam_id: String(row.exam_id),
    exam_block_id: String(row.exam_block_id),
    exam_block_code: String(row.exam_block_code) as 'P1' | 'P2' | 'P3',
    name: String(row.name),
    slug: String(row.slug),
    display_order: Number(row.display_order),
    target_hours: Number(row.target_hours || 0),
    active: Boolean(row.active),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

export function mapTopicFromDb(row: Record<string, unknown>): Topic {
  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    exam_id: String(row.exam_id),
    subject_id: String(row.subject_id),
    exam_block_id: String(row.exam_block_id),
    exam_block_code: row.exam_block_code ? (String(row.exam_block_code) as 'P1' | 'P2') : undefined,
    parent_topic_id: row.parent_topic_id ? String(row.parent_topic_id) : null,
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null,
    priority: String(row.priority) as Topic['priority'],
    priority_label: row.priority_label ? String(row.priority_label) : null,
    priority_weight: Number(row.priority_weight ?? 1.0),
    priority_source: row.priority_source ? String(row.priority_source) : null,
    priority_basis: (row.priority_basis ? String(row.priority_basis) : undefined) as Topic['priority_basis'],
    priority_confidence: (row.priority_confidence ? String(row.priority_confidence) : undefined) as Topic['priority_confidence'],
    cross_relevance: (row.cross_relevance ? String(row.cross_relevance) : undefined) as Topic['cross_relevance'],
    discursive_eligible: Boolean(row.discursive_eligible),
    is_discursive_relevant: Boolean(row.is_discursive_relevant),
    discursive_synergy: (row.discursive_synergy ? String(row.discursive_synergy) : 'NONE') as Topic['discursive_synergy'],
    recommended_material_type: (row.recommended_material_type ? String(row.recommended_material_type) : 'SIMPLIFIED_PDF') as Topic['recommended_material_type'],
    status: String(row.status) as Topic['status'],
    display_order: Number(row.display_order || 0),
    estimated_minutes: Number(row.estimated_minutes || 60),
    domain_score: row.domain_score != null ? Number(row.domain_score) : null,
    domain_confidence: String(row.domain_confidence || 'NONE') as Topic['domain_confidence'],
    study_score: Number(row.study_score ?? 50.0),
    starter_rank: row.starter_rank != null ? Number(row.starter_rank) : null,
    last_studied_at: row.last_studied_at ? String(row.last_studied_at) : null,
    next_recommended_at: row.next_recommended_at ? String(row.next_recommended_at) : null,
    tec_filter_hint: row.tec_filter_hint ? String(row.tec_filter_hint) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapSyllabusItemFromDb(row: Record<string, unknown>): SyllabusItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    exam_id: String(row.exam_id),
    exam_block_id: String(row.exam_block_id),
    subject_id: String(row.subject_id),
    parent_item_id: row.parent_item_id ? String(row.parent_item_id) : null,
    official_code: String(row.official_code),
    official_text: String(row.official_text),
    display_order: Number(row.display_order || 0),
    active: Boolean(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapTopicSyllabusItemFromDb(row: Record<string, unknown>): TopicSyllabusItem {
  return {
    topic_id: String(row.topic_id),
    syllabus_item_id: String(row.syllabus_item_id),
  };
}

export function mapStudyMaterialFromDb(row: Record<string, unknown>): StudyMaterial {
  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    topic_id: String(row.topic_id),
    title: String(row.title),
    material_type: String(row.material_type) as StudyMaterial['material_type'],
    storage_path: row.storage_path ? String(row.storage_path) : null,
    file_url: row.file_url ? String(row.file_url) : null,
    file_name: row.file_name ? String(row.file_name) : null,
    mime_type: row.mime_type ? String(row.mime_type) : null,
    file_size: row.file_size != null ? Number(row.file_size) : null,
    page_count: row.page_count != null ? Number(row.page_count) : null,
    status: String(row.status) as StudyMaterial['status'],
    version: Number(row.version || 1),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapMaterialProgressFromDb(row: Record<string, unknown>): MaterialProgress {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    material_id: String(row.material_id),
    topic_id: String(row.topic_id),
    current_page: Number(row.current_page || 1),
    max_page_reached: Number(row.max_page_reached || 1),
    progress_percent: Number(row.progress_percent || 0),
    completed: Boolean(row.completed),
    first_opened_at: row.first_opened_at ? String(row.first_opened_at) : null,
    last_opened_at: row.last_opened_at ? String(row.last_opened_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    total_study_seconds: Number(row.total_study_seconds || 0),
    notes_by_page: (row.notes_by_page as Record<string, string>) || {},
    bookmarks: Array.isArray(row.bookmarks) ? (row.bookmarks as number[]) : [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapStudySessionFromDb(row: Record<string, unknown>): StudySession {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exam_id: String(row.exam_id),
    subject_id: String(row.subject_id),
    topic_id: row.topic_id ? String(row.topic_id) : null,
    material_id: row.material_id ? String(row.material_id) : null,
    session_type: String(row.session_type) as StudySession['session_type'],
    started_at: String(row.started_at),
    ended_at: String(row.ended_at),
    duration_seconds: Number(row.duration_seconds),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
  };
}

export function mapQuestionSessionFromDb(row: Record<string, unknown>): QuestionSession {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exam_id: String(row.exam_id),
    subject_id: String(row.subject_id),
    topic_id: String(row.topic_id),
    performed_at: String(row.performed_at),
    total_questions: Number(row.total_questions),
    correct: Number(row.correct),
    wrong: Number(row.wrong),
    blank: Number(row.blank),
    duration_seconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
    subjective_feeling: (row.subjective_feeling ? String(row.subjective_feeling) : 'REASONABLE') as QuestionSession['subjective_feeling'],
    notes: row.notes ? String(row.notes) : null,
    accuracy_rate: Number(row.accuracy_rate),
    net_points: Number(row.net_points),
    net_rate: Number(row.net_rate),
    had_conceptual_error: Boolean(row.had_conceptual_error),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapErrorLogFromDb(row: Record<string, unknown>): ErrorLog {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exam_id: String(row.exam_id),
    subject_id: String(row.subject_id),
    topic_id: String(row.topic_id),
    question_session_id: row.question_session_id ? String(row.question_session_id) : null,
    error_type: String(row.error_type) as ErrorLog['error_type'],
    summary: String(row.summary),
    correct_rule: String(row.correct_rule),
    personal_note: row.personal_note ? String(row.personal_note) : null,
    severity: String(row.severity || 'MEDIUM') as ErrorLog['severity'],
    resolved: Boolean(row.resolved),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapFlashcardFromDb(row: Record<string, unknown>): Flashcard {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exam_id: String(row.exam_id),
    subject_id: String(row.subject_id),
    topic_id: String(row.topic_id),
    card_type: String(row.card_type) as Flashcard['card_type'],
    front: String(row.front),
    back: String(row.back),
    source_type: String(row.source_type) as Flashcard['source_type'],
    source_material_id: row.source_material_id ? String(row.source_material_id) : null,
    source_error_id: row.source_error_id ? String(row.source_error_id) : null,
    exam_priority: String(row.exam_priority) as Flashcard['exam_priority'],
    priority_boost: Number(row.priority_boost || 0),
    active: Boolean(row.active),
    suspended: Boolean(row.suspended),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapFlashcardFsrsStateFromDb(row: Record<string, unknown>): FlashcardFsrsState {
  return {
    flashcard_id: String(row.flashcard_id),
    user_id: String(row.user_id),
    due: String(row.due),
    stability: Number(row.stability),
    difficulty: Number(row.difficulty),
    elapsed_days: Number(row.elapsed_days),
    scheduled_days: Number(row.scheduled_days),
    learning_steps: Number(row.learning_steps || 0),
    reps: Number(row.reps || 0),
    lapses: Number(row.lapses || 0),
    state: Number(row.state || 0),
    last_review: row.last_review ? String(row.last_review) : null,
    updated_at: String(row.updated_at),
  };
}

export function mapFlashcardReviewFromDb(row: Record<string, unknown>): FlashcardReview {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    flashcard_id: String(row.flashcard_id),
    reviewed_at: String(row.reviewed_at),
    rating: Number(row.rating) as unknown as FlashcardReview['rating'],
    response_time_ms: row.response_time_ms != null ? Number(row.response_time_ms) : null,
    state_before: (row.state_before as Record<string, unknown>) || {},
    state_after: (row.state_after as Record<string, unknown>) || {},
    fsrs_log: (row.fsrs_log as Record<string, unknown>) || null,
    was_due_at_review: row.was_due_at_review !== false,
    created_at: String(row.created_at),
  };
}

export function mapDiscursiveSessionFromDb(row: Record<string, unknown>): DiscursiveSession {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exam_id: String(row.exam_id),
    type: String(row.type) as DiscursiveSession['type'],
    performed_at: String(row.performed_at),
    title: row.title ? String(row.title) : null,
    prompt_summary: row.prompt_summary ? String(row.prompt_summary) : null,
    related_subject_id: row.related_subject_id ? String(row.related_subject_id) : null,
    related_topic_id: row.related_topic_id ? String(row.related_topic_id) : null,
    duration_seconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
    lines_written: Number(row.lines_written),
    content_score: Number(row.content_score),
    language_errors: Number(row.language_errors || 0),
    calculated_score: Number(row.calculated_score),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapUserStudySettingsFromDb(row: Record<string, unknown>): UserStudySettings {
  return {
    user_id: String(row.user_id),
    weekly_study_target_minutes: Number(row.weekly_study_target_minutes || 1200),
    default_high_questions: Number(row.default_high_questions || 20),
    default_medium_questions: Number(row.default_medium_questions || 15),
    default_low_questions: Number(row.default_low_questions || 10),
    memory_daily_minutes: Number(row.memory_daily_minutes || 20),
    desired_retention: Number(row.desired_retention || 0.90),
    today_available_minutes: row.today_available_minutes != null ? Number(row.today_available_minutes) : null,
    updated_at: String(row.updated_at),
  };
}

export function mapMockExamFromDb(row: Record<string, unknown>): MockExam {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exam_id: String(row.exam_id),
    type: String(row.type) as MockExam['type'],
    performed_at: String(row.performed_at),
    total_questions: Number(row.total_questions),
    correct: Number(row.correct),
    wrong: Number(row.wrong),
    blank: Number(row.blank),
    net_points: Number(row.net_points),
    p1_correct: Number(row.p1_correct),
    p1_wrong: Number(row.p1_wrong),
    p1_blank: Number(row.p1_blank),
    p1_net: Number(row.p1_net),
    p2_correct: Number(row.p2_correct),
    p2_wrong: Number(row.p2_wrong),
    p2_blank: Number(row.p2_blank),
    p2_net: Number(row.p2_net),
    duration_seconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
  };
}

export function mapStudyEventFromDb(row: Record<string, unknown>): StudyEvent {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    event_type: String(row.event_type),
    entity_type: String(row.entity_type),
    entity_id: String(row.entity_id),
    payload: (row.payload as Record<string, unknown>) || {},
    created_at: String(row.created_at),
  };
}

export function mapGamificationProfileFromDb(row: Record<string, unknown>): GamificationProfile {
  return {
    user_id: String(row.user_id),
    total_xp: Number(row.total_xp || 0),
    level: Number(row.level || 1),
    current_streak: Number(row.current_streak || 0),
    longest_streak: Number(row.longest_streak || 0),
    meaningful_days: Number(row.meaningful_days || 0),
    last_meaningful_study_date: row.last_meaningful_study_date ? String(row.last_meaningful_study_date) : null,
    weekly_consistency_days: Number(row.weekly_consistency_days || 0),
    current_week_start: row.current_week_start ? String(row.current_week_start) : new Date().toISOString().split('T')[0],
    achievements_unlocked: [],
    updated_at: String(row.updated_at),
  };
}

export function mapXpTransactionFromDb(row: Record<string, unknown>): XpTransaction {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    amount: Number(row.amount),
    rule_id: String(row.rule_id),
    source_event_id: String(row.source_event_id),
    source_type: String(row.source_type),
    source_entity_id: row.source_entity_id ? String(row.source_entity_id) : undefined,
    description: String(row.description),
    created_at: String(row.created_at),
  };
}

export function mapDailyMissionFromDb(row: Record<string, unknown>): DailyMission {
  return {
    id: String(row.id),
    date: String(row.date),
    type: String(row.type) as DailyMission['type'],
    title: String(row.title),
    description: String(row.description),
    topic_id: row.topic_id ? String(row.topic_id) : undefined,
    subject_id: row.subject_id ? String(row.subject_id) : undefined,
    target_value: Number(row.target_value),
    current_value: Number(row.current_value || 0),
    unit: String(row.unit),
    xp_reward: Number(row.xp_reward),
    status: String(row.status) as DailyMission['status'],
    reason: String(row.reason || ''),
    source: String(row.source || ''),
    is_main: Boolean(row.is_main),
    is_executable: row.is_executable !== false,
    cta_url: row.cta_url ? String(row.cta_url) : undefined,
    cta_label: row.cta_label ? String(row.cta_label) : undefined,
    created_at: String(row.created_at),
    completed_at: row.completed_at ? String(row.completed_at) : undefined,
  };
}
