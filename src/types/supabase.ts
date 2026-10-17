export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          created_at: string
          id: string
          insight: string
          topic_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          insight: string
          topic_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insight?: string
          topic_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          current_value: number
          date: string
          description: string
          id: string
          is_executable: boolean
          is_main: boolean
          reason: string
          source: string
          status: string
          subject_id: string | null
          target_value: number
          title: string
          topic_id: string | null
          type: string
          unit: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          current_value?: number
          date: string
          description: string
          id: string
          is_executable?: boolean
          is_main?: boolean
          reason: string
          source: string
          status?: string
          subject_id?: string | null
          target_value: number
          title: string
          topic_id?: string | null
          type: string
          unit: string
          user_id: string
          xp_reward: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          current_value?: number
          date?: string
          description?: string
          id?: string
          is_executable?: boolean
          is_main?: boolean
          reason?: string
          source?: string
          status?: string
          subject_id?: string | null
          target_value?: number
          title?: string
          topic_id?: string | null
          type?: string
          unit?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      discursive_sessions: {
        Row: {
          calculated_score: number
          content_score: number
          created_at: string
          duration_seconds: number | null
          exam_id: string
          id: string
          language_errors: number
          lines_written: number
          notes: string | null
          performed_at: string
          prompt_summary: string | null
          related_subject_id: string | null
          related_topic_id: string | null
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_score: number
          content_score: number
          created_at?: string
          duration_seconds?: number | null
          exam_id: string
          id: string
          language_errors?: number
          lines_written: number
          notes?: string | null
          performed_at: string
          prompt_summary?: string | null
          related_subject_id?: string | null
          related_topic_id?: string | null
          title?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_score?: number
          content_score?: number
          created_at?: string
          duration_seconds?: number | null
          exam_id?: string
          id?: string
          language_errors?: number
          lines_written?: number
          notes?: string | null
          performed_at?: string
          prompt_summary?: string | null
          related_subject_id?: string | null
          related_topic_id?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discursive_sessions_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      error_logs: {
        Row: {
          correct_rule: string | null
          created_at: string
          error_type: string
          exam_id: string
          id: string
          personal_note: string | null
          question_session_id: string | null
          resolved: boolean
          resolved_at: string | null
          severity: string
          subject_id: string
          summary: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_rule?: string | null
          created_at?: string
          error_type: string
          exam_id: string
          id: string
          personal_note?: string | null
          question_session_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          subject_id: string
          summary: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_rule?: string | null
          created_at?: string
          error_type?: string
          exam_id?: string
          id?: string
          personal_note?: string | null
          question_session_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          subject_id?: string
          summary?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_topic_id_fkey"
            columns: ["user_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      exam_blocks: {
        Row: {
          block_type: string
          code: string
          created_at: string
          display_order: number
          duration_minutes: number | null
          exam_id: string
          id: string
          max_points: number
          minimum_points: number | null
          name: string
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_type: string
          code: string
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          exam_id: string
          id: string
          max_points: number
          minimum_points?: number | null
          name: string
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_type?: string
          code?: string
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          exam_id?: string
          id?: string
          max_points?: number
          minimum_points?: number | null
          name?: string
          total_items?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_blocks_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      exams: {
        Row: {
          active: boolean
          blank_points: number
          correct_points: number
          created_at: string
          discursive_duration_minutes: number | null
          exam_board: string
          exam_date: string
          id: string
          institution: string
          name: string
          objective_duration_minutes: number | null
          objective_total_min_points: number | null
          official_notice_date: string | null
          p1_items: number | null
          p1_min_points: number | null
          p2_items: number | null
          p2_min_points: number | null
          p3_max_points: number | null
          p3_min_points: number | null
          question_model: string
          role: string
          tiebreaker_rules: string[] | null
          updated_at: string
          user_id: string
          wrong_points: number
        }
        Insert: {
          active?: boolean
          blank_points?: number
          correct_points?: number
          created_at?: string
          discursive_duration_minutes?: number | null
          exam_board: string
          exam_date: string
          id: string
          institution: string
          name: string
          objective_duration_minutes?: number | null
          objective_total_min_points?: number | null
          official_notice_date?: string | null
          p1_items?: number | null
          p1_min_points?: number | null
          p2_items?: number | null
          p2_min_points?: number | null
          p3_max_points?: number | null
          p3_min_points?: number | null
          question_model: string
          role: string
          tiebreaker_rules?: string[] | null
          updated_at?: string
          user_id: string
          wrong_points?: number
        }
        Update: {
          active?: boolean
          blank_points?: number
          correct_points?: number
          created_at?: string
          discursive_duration_minutes?: number | null
          exam_board?: string
          exam_date?: string
          id?: string
          institution?: string
          name?: string
          objective_duration_minutes?: number | null
          objective_total_min_points?: number | null
          official_notice_date?: string | null
          p1_items?: number | null
          p1_min_points?: number | null
          p2_items?: number | null
          p2_min_points?: number | null
          p3_max_points?: number | null
          p3_min_points?: number | null
          question_model?: string
          role?: string
          tiebreaker_rules?: string[] | null
          updated_at?: string
          user_id?: string
          wrong_points?: number
        }
        Relationships: []
      }
      flashcard_fsrs_state: {
        Row: {
          difficulty: number
          due: string
          elapsed_days: number
          flashcard_id: string
          lapses: number
          last_review: string | null
          learning_steps: number
          reps: number
          scheduled_days: number
          stability: number
          state: number
          updated_at: string
          user_id: string
        }
        Insert: {
          difficulty: number
          due: string
          elapsed_days: number
          flashcard_id: string
          lapses?: number
          last_review?: string | null
          learning_steps?: number
          reps?: number
          scheduled_days: number
          stability: number
          state?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          difficulty?: number
          due?: string
          elapsed_days?: number
          flashcard_id?: string
          lapses?: number
          last_review?: string | null
          learning_steps?: number
          reps?: number
          scheduled_days?: number
          stability?: number
          state?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_fsrs_state_user_id_flashcard_id_fkey"
            columns: ["user_id", "flashcard_id"]
            isOneToOne: true
            referencedRelation: "flashcards"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          created_at: string
          flashcard_id: string
          fsrs_log: Json | null
          id: string
          rating: string
          response_time_ms: number | null
          reviewed_at: string
          state_after: Json
          state_before: Json
          user_id: string
          was_due_at_review: boolean
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          fsrs_log?: Json | null
          id: string
          rating: string
          response_time_ms?: number | null
          reviewed_at: string
          state_after: Json
          state_before: Json
          user_id: string
          was_due_at_review?: boolean
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          fsrs_log?: Json | null
          id?: string
          rating?: string
          response_time_ms?: number | null
          reviewed_at?: string
          state_after?: Json
          state_before?: Json
          user_id?: string
          was_due_at_review?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_user_id_flashcard_id_fkey"
            columns: ["user_id", "flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      flashcards: {
        Row: {
          active: boolean
          back: string
          card_type: string
          created_at: string
          exam_id: string
          exam_priority: string
          front: string
          id: string
          priority_boost: number
          source_error_id: string | null
          source_material_id: string | null
          source_type: string
          subject_id: string
          suspended: boolean
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          back: string
          card_type: string
          created_at?: string
          exam_id: string
          exam_priority?: string
          front: string
          id: string
          priority_boost?: number
          source_error_id?: string | null
          source_material_id?: string | null
          source_type?: string
          subject_id: string
          suspended?: boolean
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          back?: string
          card_type?: string
          created_at?: string
          exam_id?: string
          exam_priority?: string
          front?: string
          id?: string
          priority_boost?: number
          source_error_id?: string | null
          source_material_id?: string | null
          source_type?: string
          subject_id?: string
          suspended?: boolean
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_user_id_topic_id_fkey"
            columns: ["user_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      gamification_profiles: {
        Row: {
          current_streak: number
          current_week_start: string | null
          last_meaningful_study_date: string | null
          level: number
          longest_streak: number
          meaningful_days: number
          total_xp: number
          updated_at: string
          user_id: string
          weekly_consistency_days: number
        }
        Insert: {
          current_streak?: number
          current_week_start?: string | null
          last_meaningful_study_date?: string | null
          level?: number
          longest_streak?: number
          meaningful_days?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          weekly_consistency_days?: number
        }
        Update: {
          current_streak?: number
          current_week_start?: string | null
          last_meaningful_study_date?: string | null
          level?: number
          longest_streak?: number
          meaningful_days?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          weekly_consistency_days?: number
        }
        Relationships: []
      }
      material_progress: {
        Row: {
          bookmarks: number[]
          completed: boolean
          completed_at: string | null
          created_at: string
          current_page: number
          first_opened_at: string | null
          id: string
          last_opened_at: string | null
          material_id: string
          max_page_reached: number
          notes_by_page: Json
          progress_percent: number
          topic_id: string
          total_study_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bookmarks?: number[]
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_page?: number
          first_opened_at?: string | null
          id: string
          last_opened_at?: string | null
          material_id: string
          max_page_reached?: number
          notes_by_page?: Json
          progress_percent?: number
          topic_id: string
          total_study_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bookmarks?: number[]
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_page?: number
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          material_id?: string
          max_page_reached?: number
          notes_by_page?: Json
          progress_percent?: number
          topic_id?: string
          total_study_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_progress_user_id_material_id_fkey"
            columns: ["user_id", "material_id"]
            isOneToOne: true
            referencedRelation: "study_materials"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "material_progress_user_id_topic_id_fkey"
            columns: ["user_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      mock_exams: {
        Row: {
          blank: number
          correct: number
          created_at: string
          duration_seconds: number | null
          exam_id: string
          id: string
          net_points: number
          notes: string | null
          p1_blank: number
          p1_correct: number
          p1_net: number
          p1_wrong: number
          p2_blank: number
          p2_correct: number
          p2_net: number
          p2_wrong: number
          performed_at: string
          total_questions: number
          type: string
          user_id: string
          wrong: number
        }
        Insert: {
          blank: number
          correct: number
          created_at?: string
          duration_seconds?: number | null
          exam_id: string
          id: string
          net_points: number
          notes?: string | null
          p1_blank: number
          p1_correct: number
          p1_net: number
          p1_wrong: number
          p2_blank: number
          p2_correct: number
          p2_net: number
          p2_wrong: number
          performed_at: string
          total_questions: number
          type: string
          user_id: string
          wrong: number
        }
        Update: {
          blank?: number
          correct?: number
          created_at?: string
          duration_seconds?: number | null
          exam_id?: string
          id?: string
          net_points?: number
          notes?: string | null
          p1_blank?: number
          p1_correct?: number
          p1_net?: number
          p1_wrong?: number
          p2_blank?: number
          p2_correct?: number
          p2_net?: number
          p2_wrong?: number
          performed_at?: string
          total_questions?: number
          type?: string
          user_id?: string
          wrong?: number
        }
        Relationships: [
          {
            foreignKeyName: "mock_exams_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_memory_target_minutes: number
          desired_retention: number
          display_name: string | null
          id: string
          timezone: string
          updated_at: string
          weekly_study_target_minutes: number
        }
        Insert: {
          created_at?: string
          daily_memory_target_minutes?: number
          desired_retention?: number
          display_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
          weekly_study_target_minutes?: number
        }
        Update: {
          created_at?: string
          daily_memory_target_minutes?: number
          desired_retention?: number
          display_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
          weekly_study_target_minutes?: number
        }
        Relationships: []
      }
      question_sessions: {
        Row: {
          accuracy_rate: number
          blank: number
          correct: number
          created_at: string
          duration_seconds: number | null
          exam_id: string
          had_conceptual_error: boolean
          id: string
          net_points: number
          net_rate: number
          notes: string | null
          performed_at: string
          subject_id: string
          subjective_feeling: string | null
          topic_id: string
          total_questions: number
          updated_at: string
          user_id: string
          wrong: number
        }
        Insert: {
          accuracy_rate: number
          blank: number
          correct: number
          created_at?: string
          duration_seconds?: number | null
          exam_id: string
          had_conceptual_error?: boolean
          id: string
          net_points: number
          net_rate: number
          notes?: string | null
          performed_at: string
          subject_id: string
          subjective_feeling?: string | null
          topic_id: string
          total_questions: number
          updated_at?: string
          user_id: string
          wrong: number
        }
        Update: {
          accuracy_rate?: number
          blank?: number
          correct?: number
          created_at?: string
          duration_seconds?: number | null
          exam_id?: string
          had_conceptual_error?: boolean
          id?: string
          net_points?: number
          net_rate?: number
          notes?: string | null
          performed_at?: string
          subject_id?: string
          subjective_feeling?: string | null
          topic_id?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
          wrong?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_sessions_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "question_sessions_user_id_topic_id_fkey"
            columns: ["user_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      study_events: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          material_type: string
          mime_type: string | null
          page_count: number | null
          status: string
          storage_path: string | null
          title: string
          topic_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id: string
          material_type: string
          mime_type?: string | null
          page_count?: number | null
          status?: string
          storage_path?: string | null
          title: string
          topic_id: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          material_type?: string
          mime_type?: string | null
          page_count?: number | null
          status?: string
          storage_path?: string | null
          title?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_user_id_topic_id_fkey"
            columns: ["user_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          ended_at: string
          exam_id: string
          id: string
          material_id: string | null
          notes: string | null
          session_type: string
          started_at: string
          subject_id: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          ended_at: string
          exam_id: string
          id: string
          material_id?: string | null
          notes?: string | null
          session_type: string
          started_at: string
          subject_id: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          ended_at?: string
          exam_id?: string
          id?: string
          material_id?: string | null
          notes?: string | null
          session_type?: string
          started_at?: string
          subject_id?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      subjects: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          exam_block_code: string
          exam_block_id: string
          exam_id: string
          id: string
          name: string
          slug: string
          target_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          exam_block_code: string
          exam_block_id: string
          exam_id: string
          id: string
          name: string
          slug: string
          target_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          exam_block_code?: string
          exam_block_id?: string
          exam_id?: string
          id?: string
          name?: string
          slug?: string
          target_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_exam_block_id_fkey"
            columns: ["user_id", "exam_block_id"]
            isOneToOne: false
            referencedRelation: "exam_blocks"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "subjects_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      syllabus_items: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          exam_block_id: string
          exam_id: string
          id: string
          official_code: string | null
          official_text: string
          parent_item_id: string | null
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          exam_block_id: string
          exam_id: string
          id: string
          official_code?: string | null
          official_text: string
          parent_item_id?: string | null
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          exam_block_id?: string
          exam_id?: string
          id?: string
          official_code?: string | null
          official_text?: string
          parent_item_id?: string | null
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_items_user_id_exam_block_id_fkey"
            columns: ["user_id", "exam_block_id"]
            isOneToOne: false
            referencedRelation: "exam_blocks"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "syllabus_items_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "syllabus_items_user_id_subject_id_fkey"
            columns: ["user_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      topic_syllabus_items: {
        Row: {
          syllabus_item_id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          syllabus_item_id: string
          topic_id: string
          user_id: string
        }
        Update: {
          syllabus_item_id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_syllabus_items_user_id_syllabus_item_id_fkey"
            columns: ["user_id", "syllabus_item_id"]
            isOneToOne: false
            referencedRelation: "syllabus_items"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "topic_syllabus_items_user_id_topic_id_fkey"
            columns: ["user_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          cross_relevance: string
          description: string | null
          discursive_eligible: boolean | null
          discursive_synergy: string | null
          display_order: number
          domain_confidence: string | null
          domain_score: number | null
          estimated_minutes: number | null
          exam_block_code: string | null
          exam_block_id: string
          exam_id: string
          id: string
          is_discursive_relevant: boolean | null
          last_studied_at: string | null
          name: string
          next_recommended_at: string | null
          parent_topic_id: string | null
          priority: string
          priority_basis: string | null
          priority_confidence: string | null
          priority_label: string | null
          priority_source: string | null
          priority_weight: number | null
          recommended_material_type: string | null
          slug: string
          starter_rank: number | null
          status: string
          study_score: number | null
          subject_id: string
          tec_filter_hint: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cross_relevance?: string
          description?: string | null
          discursive_eligible?: boolean | null
          discursive_synergy?: string | null
          display_order?: number
          domain_confidence?: string | null
          domain_score?: number | null
          estimated_minutes?: number | null
          exam_block_code?: string | null
          exam_block_id: string
          exam_id: string
          id: string
          is_discursive_relevant?: boolean | null
          last_studied_at?: string | null
          name: string
          next_recommended_at?: string | null
          parent_topic_id?: string | null
          priority?: string
          priority_basis?: string | null
          priority_confidence?: string | null
          priority_label?: string | null
          priority_source?: string | null
          priority_weight?: number | null
          recommended_material_type?: string | null
          slug: string
          starter_rank?: number | null
          status?: string
          study_score?: number | null
          subject_id: string
          tec_filter_hint?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cross_relevance?: string
          description?: string | null
          discursive_eligible?: boolean | null
          discursive_synergy?: string | null
          display_order?: number
          domain_confidence?: string | null
          domain_score?: number | null
          estimated_minutes?: number | null
          exam_block_code?: string | null
          exam_block_id?: string
          exam_id?: string
          id?: string
          is_discursive_relevant?: boolean | null
          last_studied_at?: string | null
          name?: string
          next_recommended_at?: string | null
          parent_topic_id?: string | null
          priority?: string
          priority_basis?: string | null
          priority_confidence?: string | null
          priority_label?: string | null
          priority_source?: string | null
          priority_weight?: number | null
          recommended_material_type?: string | null
          slug?: string
          starter_rank?: number | null
          status?: string
          study_score?: number | null
          subject_id?: string
          tec_filter_hint?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_user_id_exam_block_id_fkey"
            columns: ["user_id", "exam_block_id"]
            isOneToOne: false
            referencedRelation: "exam_blocks"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "topics_user_id_exam_id_fkey"
            columns: ["user_id", "exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "topics_user_id_subject_id_fkey"
            columns: ["user_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      user_migrations: {
        Row: {
          completed_at: string
          metadata: Json
          migration_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          metadata?: Json
          migration_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          metadata?: Json
          migration_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_study_settings: {
        Row: {
          default_high_questions: number
          default_low_questions: number
          default_medium_questions: number
          desired_retention: number
          gamification_show_animations: boolean
          gamification_show_streak: boolean
          gamification_show_xp_toast: boolean
          gamification_weekly_target_days: number
          memory_daily_minutes: number
          today_available_minutes: number | null
          updated_at: string
          user_id: string
          weekly_study_target_minutes: number
        }
        Insert: {
          default_high_questions?: number
          default_low_questions?: number
          default_medium_questions?: number
          desired_retention?: number
          gamification_show_animations?: boolean
          gamification_show_streak?: boolean
          gamification_show_xp_toast?: boolean
          gamification_weekly_target_days?: number
          memory_daily_minutes?: number
          today_available_minutes?: number | null
          updated_at?: string
          user_id: string
          weekly_study_target_minutes?: number
        }
        Update: {
          default_high_questions?: number
          default_low_questions?: number
          default_medium_questions?: number
          desired_retention?: number
          gamification_show_animations?: boolean
          gamification_show_streak?: boolean
          gamification_show_xp_toast?: boolean
          gamification_weekly_target_days?: number
          memory_daily_minutes?: number
          today_available_minutes?: number | null
          updated_at?: string
          user_id?: string
          weekly_study_target_minutes?: number
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          rule_id: string
          source_entity_id: string | null
          source_event_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id: string
          rule_id: string
          source_entity_id?: string | null
          source_event_id: string
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          rule_id?: string
          source_entity_id?: string | null
          source_event_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
