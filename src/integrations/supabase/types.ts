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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      competitor_keywords: {
        Row: {
          competitor_id: string
          created_at: string
          current_ranking: number | null
          id: string
          keyword: string
          previous_ranking: number | null
          updated_at: string
        }
        Insert: {
          competitor_id: string
          created_at?: string
          current_ranking?: number | null
          id?: string
          keyword: string
          previous_ranking?: number | null
          updated_at?: string
        }
        Update: {
          competitor_id?: string
          created_at?: string
          current_ranking?: number | null
          id?: string
          keyword?: string
          previous_ranking?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_keywords_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          backlinks_count: number | null
          competitor_name: string | null
          competitor_url: string
          created_at: string
          id: string
          last_checked_at: string | null
          overall_score: number | null
          speed_score: number | null
          website_id: string
        }
        Insert: {
          backlinks_count?: number | null
          competitor_name?: string | null
          competitor_url: string
          created_at?: string
          id?: string
          last_checked_at?: string | null
          overall_score?: number | null
          speed_score?: number | null
          website_id: string
        }
        Update: {
          backlinks_count?: number | null
          competitor_name?: string | null
          competitor_url?: string
          created_at?: string
          id?: string
          last_checked_at?: string | null
          overall_score?: number | null
          speed_score?: number | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_ranking_history: {
        Row: {
          checked_at: string
          competitor_keyword_id: string | null
          created_at: string
          id: string
          keyword_id: string | null
          ranking: number
        }
        Insert: {
          checked_at?: string
          competitor_keyword_id?: string | null
          created_at?: string
          id?: string
          keyword_id?: string | null
          ranking: number
        }
        Update: {
          checked_at?: string
          competitor_keyword_id?: string | null
          created_at?: string
          id?: string
          keyword_id?: string | null
          ranking?: number
        }
        Relationships: [
          {
            foreignKeyName: "keyword_ranking_history_competitor_keyword_id_fkey"
            columns: ["competitor_keyword_id"]
            isOneToOne: false
            referencedRelation: "competitor_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_ranking_history_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_tracking: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          keyword: string
          updated_at: string
          user_id: string
          website_name: string | null
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword: string
          updated_at?: string
          user_id: string
          website_name?: string | null
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword?: string
          updated_at?: string
          user_id?: string
          website_name?: string | null
          website_url?: string
        }
        Relationships: []
      }
      keyword_tracking_history: {
        Row: {
          checked_at: string
          created_at: string
          id: string
          ranking: number | null
          search_volume: number | null
          tracking_id: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          id?: string
          ranking?: number | null
          search_volume?: number | null
          tracking_id: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          id?: string
          ranking?: number | null
          search_volume?: number | null
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_tracking_history_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "keyword_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          created_at: string
          current_ranking: number | null
          id: string
          keyword: string
          previous_ranking: number | null
          updated_at: string
          website_id: string
        }
        Insert: {
          created_at?: string
          current_ranking?: number | null
          id?: string
          keyword: string
          previous_ranking?: number | null
          updated_at?: string
          website_id: string
        }
        Update: {
          created_at?: string
          current_ranking?: number | null
          id?: string
          keyword?: string
          previous_ranking?: number | null
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keywords_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_reports: {
        Row: {
          backlinks_count: number | null
          created_at: string
          id: string
          overall_score: number | null
          report_data: Json | null
          report_date: string
          speed_score: number | null
          structure_issues_count: number | null
          website_id: string
        }
        Insert: {
          backlinks_count?: number | null
          created_at?: string
          id?: string
          overall_score?: number | null
          report_data?: Json | null
          report_date?: string
          speed_score?: number | null
          structure_issues_count?: number | null
          website_id: string
        }
        Update: {
          backlinks_count?: number | null
          created_at?: string
          id?: string
          overall_score?: number | null
          report_data?: Json | null
          report_date?: string
          speed_score?: number | null
          structure_issues_count?: number | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_reports_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          notification_email: string
          report_frequency: string
          updated_at: string
          user_id: string
          website_name: string | null
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          notification_email: string
          report_frequency: string
          updated_at?: string
          user_id: string
          website_name?: string | null
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          notification_email?: string
          report_frequency?: string
          updated_at?: string
          user_id?: string
          website_name?: string | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
  public: {
    Enums: {},
  },
} as const
