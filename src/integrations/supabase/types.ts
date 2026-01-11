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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      assessments: {
        Row: {
          bloom_level: string
          completed_at: string
          correct_answers: number
          created_at: string
          id: string
          subject_id: string | null
          time_taken_seconds: number | null
          topic: string | null
          total_questions: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          bloom_level?: string
          completed_at?: string
          correct_answers?: number
          created_at?: string
          id?: string
          subject_id?: string | null
          time_taken_seconds?: number | null
          topic?: string | null
          total_questions?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          bloom_level?: string
          completed_at?: string
          correct_answers?: number
          created_at?: string
          id?: string
          subject_id?: string | null
          time_taken_seconds?: number | null
          topic?: string | null
          total_questions?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          class: number
          created_at: string
          current_streak: number
          display_name: string
          id: string
          is_public: boolean
          school_name: string | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          class: number
          created_at?: string
          current_streak?: number
          display_name: string
          id?: string
          is_public?: boolean
          school_name?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          class?: number
          created_at?: string
          current_streak?: number
          display_name?: string
          id?: string
          is_public?: boolean
          school_name?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_plan_tasks: {
        Row: {
          bloom_level: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          plan_id: string
          priority: number
          subject_id: string | null
          target_xp: number
          topic: string
        }
        Insert: {
          bloom_level?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          plan_id: string
          priority?: number
          subject_id?: string | null
          target_xp?: number
          topic: string
        }
        Update: {
          bloom_level?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          plan_id?: string
          priority?: number
          subject_id?: string | null
          target_xp?: number
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "learning_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_plan_tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_plans: {
        Row: {
          created_at: string
          end_date: string
          id: string
          plan_type: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          plan_type?: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          plan_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offline_lessons: {
        Row: {
          bloom_level: string
          chapter_number: number
          class_range: unknown
          content: Json
          created_at: string
          id: string
          subject_id: string | null
          title: string
          title_bn: string | null
        }
        Insert: {
          bloom_level?: string
          chapter_number: number
          class_range: unknown
          content: Json
          created_at?: string
          id?: string
          subject_id?: string | null
          title: string
          title_bn?: string | null
        }
        Update: {
          bloom_level?: string
          chapter_number?: number
          class_range?: unknown
          content?: Json
          created_at?: string
          id?: string
          subject_id?: string | null
          title?: string
          title_bn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offline_lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          type: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          type: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          type?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class: number
          created_at: string
          division: string | null
          email: string
          full_name: string
          id: string
          school_name: string
          updated_at: string
          user_id: string
          version: Database["public"]["Enums"]["curriculum_version"]
        }
        Insert: {
          class: number
          created_at?: string
          division?: string | null
          email: string
          full_name: string
          id?: string
          school_name: string
          updated_at?: string
          user_id: string
          version?: Database["public"]["Enums"]["curriculum_version"]
        }
        Update: {
          class?: number
          created_at?: string
          division?: string | null
          email?: string
          full_name?: string
          id?: string
          school_name?: string
          updated_at?: string
          user_id?: string
          version?: Database["public"]["Enums"]["curriculum_version"]
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      revision_schedule: {
        Row: {
          completed_at: string | null
          created_at: string
          ease_factor: number
          id: string
          is_completed: boolean
          next_review_date: string
          repetition_count: number
          review_interval_days: number
          subject_id: string | null
          topic_mastery_id: string | null
          topic_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          ease_factor?: number
          id?: string
          is_completed?: boolean
          next_review_date: string
          repetition_count?: number
          review_interval_days?: number
          subject_id?: string | null
          topic_mastery_id?: string | null
          topic_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          ease_factor?: number
          id?: string
          is_completed?: boolean
          next_review_date?: string
          repetition_count?: number
          review_interval_days?: number
          subject_id?: string | null
          topic_mastery_id?: string | null
          topic_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_schedule_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_schedule_topic_mastery_id_fkey"
            columns: ["topic_mastery_id"]
            isOneToOne: false
            referencedRelation: "topic_mastery"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          chapters_completed: number
          created_at: string
          current_chapter: number
          id: string
          last_studied_at: string | null
          subject_id: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          chapters_completed?: number
          created_at?: string
          current_chapter?: number
          id?: string
          last_studied_at?: string | null
          subject_id: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          chapters_completed?: number
          created_at?: string
          current_chapter?: number
          id?: string
          last_studied_at?: string | null
          subject_id?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_stats: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_study_minutes: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_study_minutes?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_study_minutes?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          bloom_level: string | null
          created_at: string
          duration_minutes: number
          id: string
          subject_id: string | null
          topic: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          bloom_level?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          subject_id?: string | null
          topic?: string | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          bloom_level?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          subject_id?: string | null
          topic?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: string | null
          color: string
          created_at: string
          division: string | null
          icon: string
          id: string
          max_class: number
          min_class: number
          name: string
          name_bn: string | null
          total_chapters: number
        }
        Insert: {
          category?: string | null
          color?: string
          created_at?: string
          division?: string | null
          icon?: string
          id?: string
          max_class?: number
          min_class?: number
          name: string
          name_bn?: string | null
          total_chapters?: number
        }
        Update: {
          category?: string | null
          color?: string
          created_at?: string
          division?: string | null
          icon?: string
          id?: string
          max_class?: number
          min_class?: number
          name?: string
          name_bn?: string | null
          total_chapters?: number
        }
        Relationships: []
      }
      topic_mastery: {
        Row: {
          attempts: number
          bloom_level: string
          correct_answers: number
          created_at: string
          id: string
          is_weak_topic: boolean
          last_practiced_at: string | null
          mastery_score: number
          subject_id: string | null
          topic_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          bloom_level?: string
          correct_answers?: number
          created_at?: string
          id?: string
          is_weak_topic?: boolean
          last_practiced_at?: string | null
          mastery_score?: number
          subject_id?: string | null
          topic_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          bloom_level?: string
          correct_answers?: number
          created_at?: string
          id?: string
          is_weak_topic?: boolean
          last_practiced_at?: string | null
          mastery_score?: number
          subject_id?: string | null
          topic_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_mastery_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatars: {
        Row: {
          avatar_url: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_achievements: {
        Row: {
          achievement_description: string
          achievement_name: string
          achievement_type: string
          completed_at: string | null
          created_at: string
          current_value: number
          icon: string
          id: string
          is_completed: boolean
          target_value: number
          updated_at: string
          user_id: string
          week_start: string
          xp_reward: number
        }
        Insert: {
          achievement_description: string
          achievement_name: string
          achievement_type: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          icon?: string
          id?: string
          is_completed?: boolean
          target_value?: number
          updated_at?: string
          user_id: string
          week_start: string
          xp_reward?: number
        }
        Update: {
          achievement_description?: string
          achievement_name?: string
          achievement_type?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          icon?: string
          id?: string
          is_completed?: boolean
          target_value?: number
          updated_at?: string
          user_id?: string
          week_start?: string
          xp_reward?: number
        }
        Relationships: []
      }
      weekly_notes: {
        Row: {
          created_at: string
          id: string
          mcq_content: Json
          notes_content: Json
          pdf_url: string | null
          subject_id: string | null
          subject_name: string
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          mcq_content?: Json
          notes_content?: Json
          pdf_url?: string | null
          subject_id?: string | null
          subject_name: string
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          mcq_content?: Json
          notes_content?: Json
          pdf_url?: string | null
          subject_id?: string | null
          subject_name?: string
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      curriculum_version: "bangla" | "english"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      curriculum_version: ["bangla", "english"],
    },
  },
} as const
