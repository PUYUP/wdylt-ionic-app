export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      answers: {
        Row: {
          content: string
          created_at: string
          id: number
          quiz: number
          quiz_content: string | null
          quiz_title: string | null
          score: number | null
          updated_at: string
          user: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          quiz: number
          quiz_content?: string | null
          quiz_title?: string | null
          score?: number | null
          updated_at?: string
          user: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          quiz?: number
          quiz_content?: string | null
          quiz_title?: string | null
          score?: number | null
          updated_at?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_quiz_fkey"
            columns: ["quiz"]
            isOneToOne: false
            referencedRelation: "quizs"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completion_datetime: string | null
          created_at: string
          id: number
          lesson: number
          points_reward: number
          progress_percentage: number
          start_datetime: string | null
          status: string
          target_completion_datetime: string | null
          updated_at: string | null
          user: string
        }
        Insert: {
          completion_datetime?: string | null
          created_at?: string
          id?: number
          lesson: number
          points_reward?: number
          progress_percentage: number
          start_datetime?: string | null
          status: string
          target_completion_datetime?: string | null
          updated_at?: string | null
          user?: string
        }
        Update: {
          completion_datetime?: string | null
          created_at?: string
          id?: number
          lesson?: number
          points_reward?: number
          progress_percentage?: number
          start_datetime?: string | null
          status?: string
          target_completion_datetime?: string | null
          updated_at?: string | null
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_lesson_fkey"
            columns: ["lesson"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_data: Json | null
          content_type: string
          created_at: string
          description: string
          estimated_duration_minutes: number | null
          id: number
          title: string | null
          updated_at: string
          user: string
        }
        Insert: {
          content_data?: Json | null
          content_type: string
          created_at?: string
          description: string
          estimated_duration_minutes?: number | null
          id?: number
          title?: string | null
          updated_at?: string
          user: string
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          created_at?: string
          description?: string
          estimated_duration_minutes?: number | null
          id?: number
          title?: string | null
          updated_at?: string
          user?: string
        }
        Relationships: []
      }
      quizs: {
        Row: {
          author: string | null
          content: string
          created_at: string
          id: number
          lesson: number
          quiz_type: string | null
          score: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string
          id?: number
          lesson: number
          quiz_type?: string | null
          score?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string
          id?: number
          lesson?: number
          quiz_type?: string | null
          score?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizs_lesson_fkey"
            columns: ["lesson"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          buffer_minutes: number | null
          created_at: string
          days_of_week: Json
          enrollment: number | null
          id: number
          is_active: boolean
          lesson: number
          message: string | null
          number_of_loop: number | null
          scheduled_time: string
          title: string
          updated_at: string
          user: string
        }
        Insert: {
          buffer_minutes?: number | null
          created_at?: string
          days_of_week: Json
          enrollment?: number | null
          id?: number
          is_active?: boolean
          lesson: number
          message?: string | null
          number_of_loop?: number | null
          scheduled_time: string
          title: string
          updated_at?: string
          user?: string
        }
        Update: {
          buffer_minutes?: number | null
          created_at?: string
          days_of_week?: Json
          enrollment?: number | null
          id?: number
          is_active?: boolean
          lesson?: number
          message?: string | null
          number_of_loop?: number | null
          scheduled_time?: string
          title?: string
          updated_at?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_enrollment_fkey"
            columns: ["enrollment"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_lesson_fkey"
            columns: ["lesson"]
            isOneToOne: false
            referencedRelation: "lessons"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
