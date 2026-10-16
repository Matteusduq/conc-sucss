export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          timezone: string
          weekly_study_target_minutes: number
          daily_memory_target_minutes: number
          desired_retention: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          timezone?: string
          weekly_study_target_minutes?: number
          daily_memory_target_minutes?: number
          desired_retention?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          timezone?: string
          weekly_study_target_minutes?: number
          daily_memory_target_minutes?: number
          desired_retention?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_study_settings: {
        Row: {
          user_id: string
          weekly_study_target_minutes: number
          default_high_questions: number
          default_medium_questions: number
          default_low_questions: number
          memory_daily_minutes: number
          desired_retention: number
          today_available_minutes: number | null
          gamification_show_animations: boolean
          gamification_show_xp_toast: boolean
          gamification_show_streak: boolean
          gamification_weekly_target_days: number
          updated_at: string
        }
        Insert: {
          user_id: string
          weekly_study_target_minutes?: number
          default_high_questions?: number
          default_medium_questions?: number
          default_low_questions?: number
          memory_daily_minutes?: number
          desired_retention?: number
          today_available_minutes?: number | null
          gamification_show_animations?: boolean
          gamification_show_xp_toast?: boolean
          gamification_show_streak?: boolean
          gamification_weekly_target_days?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          weekly_study_target_minutes?: number
          default_high_questions?: number
          default_medium_questions?: number
          default_low_questions?: number
          memory_daily_minutes?: number
          desired_retention?: number
          today_available_minutes?: number | null
          gamification_show_animations?: boolean
          gamification_show_xp_toast?: boolean
          gamification_show_streak?: boolean
          gamification_weekly_target_days?: number
          updated_at?: string
        }
      }
      exams: {
        Row: {
          user_id: string
          id: string
          name: string
          institution: string
          role: string
          exam_board: string
          exam_date: string
          question_model: string
          correct_points: number
          wrong_points: number
          blank_points: number
          active: boolean
          objective_duration_minutes: number | null
          discursive_duration_minutes: number | null
          p1_items: number | null
          p2_items: number | null
          p1_min_points: number | null
          p2_min_points: number | null
          objective_total_min_points: number | null
          p3_max_points: number | null
          p3_min_points: number | null
          official_notice_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          name: string
          institution: string
          role: string
          exam_board: string
          exam_date: string
          question_model: string
          correct_points?: number
          wrong_points?: number
          blank_points?: number
          active?: boolean
          objective_duration_minutes?: number | null
          discursive_duration_minutes?: number | null
          p1_items?: number | null
          p2_items?: number | null
          p1_min_points?: number | null
          p2_min_points?: number | null
          objective_total_min_points?: number | null
          p3_max_points?: number | null
          p3_min_points?: number | null
          official_notice_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          name?: string
          institution?: string
          role?: string
          exam_board?: string
          exam_date?: string
          question_model?: string
          correct_points?: number
          wrong_points?: number
          blank_points?: number
          active?: boolean
          objective_duration_minutes?: number | null
          discursive_duration_minutes?: number | null
          p1_items?: number | null
          p2_items?: number | null
          p1_min_points?: number | null
          p2_min_points?: number | null
          objective_total_min_points?: number | null
          p3_max_points?: number | null
          p3_min_points?: number | null
          official_notice_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exam_blocks: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          code: string
          name: string
          block_type: string
          total_items: number | null
          max_points: number
          minimum_points: number | null
          duration_minutes: number | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          code: string
          name: string
          block_type: string
          total_items?: number | null
          max_points: number
          minimum_points?: number | null
          duration_minutes?: number | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          code?: string
          name?: string
          block_type?: string
          total_items?: number | null
          max_points?: number
          minimum_points?: number | null
          duration_minutes?: number | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          exam_block_id: string
          exam_block_code: string
          name: string
          slug: string
          display_order: number
          target_hours: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          exam_block_id: string
          exam_block_code: string
          name: string
          slug: string
          display_order?: number
          target_hours?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          exam_block_id?: string
          exam_block_code?: string
          name?: string
          slug?: string
          display_order?: number
          target_hours?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          exam_block_id: string
          exam_block_code: string
          parent_topic_id: string | null
          name: string
          slug: string
          description: string | null
          priority: string
          priority_label: string | null
          priority_weight: number
          priority_source: string | null
          priority_basis: string | null
          priority_confidence: string | null
          cross_relevance: boolean | null
          discursive_eligible: boolean
          is_discursive_relevant: boolean
          discursive_synergy: string | null
          recommended_material_type: string
          status: string
          display_order: number
          estimated_minutes: number
          domain_score: number | null
          domain_confidence: string
          study_score: number
          starter_rank: number | null
          last_studied_at: string | null
          next_recommended_at: string | null
          tec_filter_hint: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          exam_block_id: string
          exam_block_code: string
          parent_topic_id?: string | null
          name: string
          slug: string
          description?: string | null
          priority: string
          priority_label?: string | null
          priority_weight?: number
          priority_source?: string | null
          priority_basis?: string | null
          priority_confidence?: string | null
          cross_relevance?: boolean | null
          discursive_eligible?: boolean
          is_discursive_relevant?: boolean
          discursive_synergy?: string | null
          recommended_material_type?: string
          status?: string
          display_order?: number
          estimated_minutes?: number
          domain_score?: number | null
          domain_confidence?: string
          study_score?: number
          starter_rank?: number | null
          last_studied_at?: string | null
          next_recommended_at?: string | null
          tec_filter_hint?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          subject_id?: string
          exam_block_id?: string
          exam_block_code?: string
          parent_topic_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          priority?: string
          priority_label?: string | null
          priority_weight?: number
          priority_source?: string | null
          priority_basis?: string | null
          priority_confidence?: string | null
          cross_relevance?: boolean | null
          discursive_eligible?: boolean
          is_discursive_relevant?: boolean
          discursive_synergy?: string | null
          recommended_material_type?: string
          status?: string
          display_order?: number
          estimated_minutes?: number
          domain_score?: number | null
          domain_confidence?: string
          study_score?: number
          starter_rank?: number | null
          last_studied_at?: string | null
          next_recommended_at?: string | null
          tec_filter_hint?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      syllabus_items: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          exam_block_id: string
          subject_id: string
          parent_item_id: string | null
          official_code: string | null
          official_text: string
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          exam_block_id: string
          subject_id: string
          parent_item_id?: string | null
          official_code?: string | null
          official_text: string
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          exam_block_id?: string
          subject_id?: string
          parent_item_id?: string | null
          official_code?: string | null
          official_text?: string
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      topic_syllabus_items: {
        Row: {
          user_id: string
          topic_id: string
          syllabus_item_id: string
        }
        Insert: {
          user_id: string
          topic_id: string
          syllabus_item_id: string
        }
        Update: {
          user_id?: string
          topic_id?: string
          syllabus_item_id?: string
        }
      }
      study_materials: {
        Row: {
          user_id: string
          id: string
          topic_id: string
          title: string
          material_type: string
          storage_path: string | null
          file_url: string | null
          file_name: string | null
          mime_type: string | null
          file_size: number | null
          page_count: number | null
          status: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          topic_id: string
          title: string
          material_type: string
          storage_path?: string | null
          file_url?: string | null
          file_name?: string | null
          mime_type?: string | null
          file_size?: number | null
          page_count?: number | null
          status?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          topic_id?: string
          title?: string
          material_type?: string
          storage_path?: string | null
          file_url?: string | null
          file_name?: string | null
          mime_type?: string | null
          file_size?: number | null
          page_count?: number | null
          status?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      material_progress: {
        Row: {
          user_id: string
          id: string
          material_id: string
          topic_id: string
          current_page: number
          max_page_reached: number
          progress_percent: number
          completed: boolean
          first_opened_at: string | null
          last_opened_at: string | null
          completed_at: string | null
          total_study_seconds: number
          notes_by_page: Json
          bookmarks: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          material_id: string
          topic_id: string
          current_page?: number
          max_page_reached?: number
          progress_percent?: number
          completed?: boolean
          first_opened_at?: string | null
          last_opened_at?: string | null
          completed_at?: string | null
          total_study_seconds?: number
          notes_by_page?: Json
          bookmarks?: number[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          material_id?: string
          topic_id?: string
          current_page?: number
          max_page_reached?: number
          progress_percent?: number
          completed?: boolean
          first_opened_at?: string | null
          last_opened_at?: string | null
          completed_at?: string | null
          total_study_seconds?: number
          notes_by_page?: Json
          bookmarks?: number[]
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id: string | null
          material_id: string | null
          session_type: string
          started_at: string
          ended_at: string
          duration_seconds: number
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id?: string | null
          material_id?: string | null
          session_type: string
          started_at: string
          ended_at: string
          duration_seconds: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          subject_id?: string
          topic_id?: string | null
          material_id?: string | null
          session_type?: string
          started_at?: string
          ended_at?: string
          duration_seconds?: number
          notes?: string | null
          created_at?: string
        }
      }
      question_sessions: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id: string
          performed_at: string
          total_questions: number
          correct: number
          wrong: number
          blank: number
          duration_seconds: number | null
          subjective_feeling: string | null
          notes: string | null
          accuracy_rate: number
          net_points: number
          net_rate: number
          had_conceptual_error: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id: string
          performed_at: string
          total_questions: number
          correct: number
          wrong: number
          blank: number
          duration_seconds?: number | null
          subjective_feeling?: string | null
          notes?: string | null
          accuracy_rate: number
          net_points: number
          net_rate: number
          had_conceptual_error?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          subject_id?: string
          topic_id?: string
          performed_at?: string
          total_questions?: number
          correct?: number
          wrong?: number
          blank?: number
          duration_seconds?: number | null
          subjective_feeling?: string | null
          notes?: string | null
          accuracy_rate?: number
          net_points?: number
          net_rate?: number
          had_conceptual_error?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      error_logs: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id: string
          question_session_id: string | null
          error_type: string
          summary: string
          correct_rule: string
          personal_note: string | null
          severity: string
          resolved: boolean
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id: string
          question_session_id?: string | null
          error_type: string
          summary: string
          correct_rule: string
          personal_note?: string | null
          severity?: string
          resolved?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          subject_id?: string
          topic_id?: string
          question_session_id?: string | null
          error_type?: string
          summary?: string
          correct_rule?: string
          personal_note?: string | null
          severity?: string
          resolved?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      flashcards: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id: string
          card_type: string
          front: string
          back: string
          source_type: string
          source_material_id: string | null
          source_error_id: string | null
          exam_priority: string
          priority_boost: number
          active: boolean
          suspended: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string
          topic_id: string
          card_type: string
          front: string
          back: string
          source_type: string
          source_material_id?: string | null
          source_error_id?: string | null
          exam_priority: string
          priority_boost?: number
          active?: boolean
          suspended?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          subject_id?: string
          topic_id?: string
          card_type?: string
          front?: string
          back?: string
          source_type?: string
          source_material_id?: string | null
          source_error_id?: string | null
          exam_priority?: string
          priority_boost?: number
          active?: boolean
          suspended?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      flashcard_fsrs_state: {
        Row: {
          user_id: string
          flashcard_id: string
          due: string
          stability: number
          difficulty: number
          elapsed_days: number
          scheduled_days: number
          learning_steps: number
          reps: number
          lapses: number
          state: number
          last_review: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          flashcard_id: string
          due: string
          stability: number
          difficulty: number
          elapsed_days: number
          scheduled_days: number
          learning_steps?: number
          reps?: number
          lapses?: number
          state?: number
          last_review?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          flashcard_id?: string
          due?: string
          stability?: number
          difficulty?: number
          elapsed_days?: number
          scheduled_days?: number
          learning_steps?: number
          reps?: number
          lapses?: number
          state?: number
          last_review?: string | null
          updated_at?: string
        }
      }
      flashcard_reviews: {
        Row: {
          user_id: string
          id: string
          flashcard_id: string
          reviewed_at: string
          rating: number
          response_time_ms: number | null
          state_before: Json
          state_after: Json
          fsrs_log: Json | null
          was_due_at_review: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          id: string
          flashcard_id: string
          reviewed_at: string
          rating: number
          response_time_ms?: number | null
          state_before?: Json
          state_after?: Json
          fsrs_log?: Json | null
          was_due_at_review?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          flashcard_id?: string
          reviewed_at?: string
          rating?: number
          response_time_ms?: number | null
          state_before?: Json
          state_after?: Json
          fsrs_log?: Json | null
          was_due_at_review?: boolean
          created_at?: string
        }
      }
      discursive_sessions: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          type: string
          performed_at: string
          title: string | null
          prompt_summary: string | null
          related_subject_id: string | null
          related_topic_id: string | null
          duration_seconds: number | null
          lines_written: number
          content_score: number
          language_errors: number
          calculated_score: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          type: string
          performed_at: string
          title?: string | null
          prompt_summary?: string | null
          related_subject_id?: string | null
          related_topic_id?: string | null
          duration_seconds?: number | null
          lines_written: number
          content_score: number
          language_errors?: number
          calculated_score: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          type?: string
          performed_at?: string
          title?: string | null
          prompt_summary?: string | null
          related_subject_id?: string | null
          related_topic_id?: string | null
          duration_seconds?: number | null
          lines_written?: number
          content_score?: number
          language_errors?: number
          calculated_score?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mock_exams: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          type: string
          performed_at: string
          total_questions: number
          correct: number
          wrong: number
          blank: number
          net_points: number
          p1_correct: number
          p1_wrong: number
          p1_blank: number
          p1_net: number
          p2_correct: number
          p2_wrong: number
          p2_blank: number
          p2_net: number
          duration_seconds: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          type: string
          performed_at: string
          total_questions: number
          correct: number
          wrong: number
          blank: number
          net_points: number
          p1_correct: number
          p1_wrong: number
          p1_blank: number
          p1_net: number
          p2_correct: number
          p2_wrong: number
          p2_blank: number
          p2_net: number
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          type?: string
          performed_at?: string
          total_questions?: number
          correct?: number
          wrong?: number
          blank?: number
          net_points?: number
          p1_correct?: number
          p1_wrong?: number
          p1_blank?: number
          p1_net?: number
          p2_correct?: number
          p2_wrong?: number
          p2_blank?: number
          p2_net?: number
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      study_events: {
        Row: {
          user_id: string
          id: string
          event_type: string
          entity_type: string
          entity_id: string
          payload: Json
          created_at: string
        }
        Insert: {
          user_id: string
          id: string
          event_type: string
          entity_type: string
          entity_id: string
          payload?: Json
          created_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          event_type?: string
          entity_type?: string
          entity_id?: string
          payload?: Json
          created_at?: string
        }
      }
      gamification_profiles: {
        Row: {
          user_id: string
          total_xp: number
          level: number
          current_streak: number
          longest_streak: number
          meaningful_days: number
          last_meaningful_study_date: string | null
          weekly_consistency_days: number
          current_week_start: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          total_xp?: number
          level?: number
          current_streak?: number
          longest_streak?: number
          meaningful_days?: number
          last_meaningful_study_date?: string | null
          weekly_consistency_days?: number
          current_week_start?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_xp?: number
          level?: number
          current_streak?: number
          longest_streak?: number
          meaningful_days?: number
          last_meaningful_study_date?: string | null
          weekly_consistency_days?: number
          current_week_start?: string | null
          updated_at?: string
        }
      }
      xp_transactions: {
        Row: {
          user_id: string
          id: string
          amount: number
          rule_id: string
          source_event_id: string
          source_type: string
          source_entity_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          user_id: string
          id: string
          amount: number
          rule_id: string
          source_event_id: string
          source_type: string
          source_entity_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          amount?: number
          rule_id?: string
          source_event_id?: string
          source_type?: string
          source_entity_id?: string | null
          description?: string
          created_at?: string
        }
      }
      daily_missions: {
        Row: {
          user_id: string
          id: string
          date: string
          type: string
          title: string
          description: string
          topic_id: string | null
          subject_id: string | null
          target_value: number
          current_value: number
          unit: string
          xp_reward: number
          status: string
          reason: string
          source: string
          is_main: boolean
          is_executable: boolean
          cta_url: string | null
          cta_label: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          user_id: string
          id: string
          date: string
          type: string
          title: string
          description: string
          topic_id?: string | null
          subject_id?: string | null
          target_value: number
          current_value?: number
          unit: string
          xp_reward: number
          status: string
          reason?: string
          source?: string
          is_main?: boolean
          is_executable?: boolean
          cta_url?: string | null
          cta_label?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          user_id?: string
          id?: string
          date?: string
          type?: string
          title?: string
          description?: string
          topic_id?: string | null
          subject_id?: string | null
          target_value?: number
          current_value?: number
          unit?: string
          xp_reward?: number
          status?: string
          reason?: string
          source?: string
          is_main?: boolean
          is_executable?: boolean
          cta_url?: string | null
          cta_label?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          unlocked_at: string
          xp_reward: number
        }
        Insert: {
          user_id: string
          achievement_id: string
          unlocked_at?: string
          xp_reward: number
        }
        Update: {
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
          xp_reward?: number
        }
      }
      user_migrations: {
        Row: {
          user_id: string
          migration_key: string
          completed_at: string
          metadata: Json
        }
        Insert: {
          user_id: string
          migration_key: string
          completed_at?: string
          metadata?: Json
        }
        Update: {
          user_id?: string
          migration_key?: string
          completed_at?: string
          metadata?: Json
        }
      }
      ai_insights: {
        Row: {
          user_id: string
          id: string
          exam_id: string
          subject_id: string | null
          topic_id: string | null
          insight_type: string
          title: string
          content: string
          priority: string
          created_at: string
          expires_at: string | null
        }
        Insert: {
          user_id: string
          id: string
          exam_id: string
          subject_id?: string | null
          topic_id?: string | null
          insight_type: string
          title: string
          content: string
          priority?: string
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          user_id?: string
          id?: string
          exam_id?: string
          subject_id?: string | null
          topic_id?: string | null
          insight_type?: string
          title?: string
          content?: string
          priority?: string
          created_at?: string
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
