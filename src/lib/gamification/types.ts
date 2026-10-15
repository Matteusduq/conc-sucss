export type JourneyPhase =
  | 'BASE'
  | 'CONSOLIDATION'
  | 'EXAM_MODE'
  | 'FINAL_SPRINT'
  | 'POST_EXAM';

export interface GamificationProfile {
  user_id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  meaningful_days: number;
  last_meaningful_study_date: string | null; // YYYY-MM-DD
  achievements_unlocked: string[];
  weekly_consistency_days: number;
  current_week_start: string; // YYYY-MM-DD
  updated_at: string;
}

export interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  rule_id: string;
  source_event_id: string;
  source_type: string;
  source_entity_id?: string;
  description: string;
  created_at: string;
}

export type MissionType =
  | 'CORE_STUDY'
  | 'QUESTIONS'
  | 'MEMORY'
  | 'ERROR_REVIEW'
  | 'DISCURSIVE'
  | 'WEEKLY_BOSS'
  | 'MOCK_EXAM';

export type MissionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface DailyMission {
  id: string;
  date: string; // YYYY-MM-DD in America/Sao_Paulo
  type: MissionType;
  title: string;
  description: string;
  topic_id?: string;
  subject_id?: string;
  target_value: number;
  current_value: number;
  unit: string;
  xp_reward: number;
  status: MissionStatus;
  reason: string;
  source: string;
  is_main?: boolean;
  cta_url?: string;
  cta_label?: string;
  created_at: string;
  completed_at?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'QUESTIONS' | 'ERRORS' | 'MEMORY' | 'DISCURSIVE' | 'COVERAGE' | 'CONSISTENCY' | 'BOSS';
  icon: string;
  xp_reward: number;
  criteria_text: string;
  unlocked_at?: string;
}

export interface GamificationNotification {
  id: string;
  type: 'XP_AWARDED' | 'LEVEL_UP' | 'ACHIEVEMENT_UNLOCKED' | 'MISSION_COMPLETED' | 'WEEKLY_BOSS_COMPLETED';
  title: string;
  message: string;
  xpAmount?: number;
  newLevel?: number;
  achievementId?: string;
  timestamp: string;
}

export interface WeeklyBossGoal {
  week_start: string; // YYYY-MM-DD
  week_end: string; // YYYY-MM-DD
  phase: JourneyPhase;
  target_questions: number;
  p1_target: number;
  p2_target: number;
  xp_reward: number;
  completed: boolean;
  completed_at?: string;
  mock_exam_id?: string;
}

export interface AcademicProgressResult {
  overallIndex: number; // 0 to 100
  editalCoveragePercent: number; // 0 to 100
  p1CoveragePercent: number;
  p2CoveragePercent: number;
  averageDomainScore: number;
  retentionRate: number;
  discursiveSessionsCount: number;
  atRiskTopicsCount: number;
  masteredTopicsCount: number;
  breakdown: {
    coverageComponent: number;
    domainComponent: number;
    retentionComponent: number;
    discursiveComponent: number;
    riskComponent: number;
  };
  weights: {
    coverage: number;
    domain: number;
    retention: number;
    discursive: number;
    risk: number;
  };
}
