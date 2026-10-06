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
      charter: {
        Row: {
          address_form: string
          banned_expressions: string[]
          id: number
          inclusive_writing: boolean
          sensitive_topics: string[]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          address_form?: string
          banned_expressions?: string[]
          id?: number
          inclusive_writing?: boolean
          sensitive_topics?: string[]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          address_form?: string
          banned_expressions?: string[]
          id?: number
          inclusive_writing?: boolean
          sensitive_topics?: string[]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "charter_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      charter_clients: {
        Row: {
          aliases: string[]
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["client_status"]
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["client_status"]
        }
        Update: {
          aliases?: string[]
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["client_status"]
        }
        Relationships: []
      }
      dismissed_suggestions: {
        Row: {
          dismissed_at: string
          dismissed_by: string
          suggestion_key: string
        }
        Insert: {
          dismissed_at?: string
          dismissed_by?: string
          suggestion_key: string
        }
        Update: {
          dismissed_at?: string
          dismissed_by?: string
          suggestion_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_suggestions_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_line: {
        Row: {
          exemples: string
          id: number
          mots_a_eviter: string
          ton: string
          updated_at: string
          valeurs: string
        }
        Insert: {
          exemples?: string
          id?: number
          mots_a_eviter?: string
          ton?: string
          updated_at?: string
          valeurs?: string
        }
        Update: {
          exemples?: string
          id?: number
          mots_a_eviter?: string
          ton?: string
          updated_at?: string
          valeurs?: string
        }
        Relationships: []
      }
      editorial_lines: {
        Row: {
          about: string
          brand: string
          code: string
          configured: boolean
          core_values: string[]
          defaults: Json
          id: string
          name: string
          pillars: string[]
          reference_posts: string[]
          target_per_week: number
          targets: string
          updated_at: string
          updated_by: string | null
          version: number
          voice_adjectives: string[]
          we_are: string[]
          we_are_not: string[]
        }
        Insert: {
          about?: string
          brand?: string
          code: string
          configured?: boolean
          core_values?: string[]
          defaults?: Json
          id?: string
          name: string
          pillars?: string[]
          reference_posts?: string[]
          target_per_week?: number
          targets?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          voice_adjectives?: string[]
          we_are?: string[]
          we_are_not?: string[]
        }
        Update: {
          about?: string
          brand?: string
          code?: string
          configured?: boolean
          core_values?: string[]
          defaults?: Json
          id?: string
          name?: string
          pillars?: string[]
          reference_posts?: string[]
          target_per_week?: number
          targets?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          voice_adjectives?: string[]
          we_are?: string[]
          we_are_not?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "editorial_lines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string
          created_by: string
          id: string
          text: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          text: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_connection: {
        Row: {
          access_token_encrypted: string | null
          admin_user_id: string | null
          connected_at: string
          expires_at: string | null
          id: number
          last_import_at: string | null
          mode: string
          scopes: string[]
          target_logo_url: string | null
          target_name: string
          target_urn: string
        }
        Insert: {
          access_token_encrypted?: string | null
          admin_user_id?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: number
          last_import_at?: string | null
          mode?: string
          scopes?: string[]
          target_logo_url?: string | null
          target_name: string
          target_urn: string
        }
        Update: {
          access_token_encrypted?: string | null
          admin_user_id?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: number
          last_import_at?: string | null
          mode?: string
          scopes?: string[]
          target_logo_url?: string | null
          target_name?: string
          target_urn?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_connection_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          captured_on: string
          clicks: number | null
          comments: number
          created_at: string
          impressions: number
          members_reached: number | null
          post_id: string
          reactions: number
          reposts: number
          updated_at: string
        }
        Insert: {
          captured_on?: string
          clicks?: number | null
          comments?: number
          created_at?: string
          impressions?: number
          members_reached?: number | null
          post_id: string
          reactions?: number
          reposts?: number
          updated_at?: string
        }
        Update: {
          captured_on?: string
          clicks?: number | null
          comments?: number
          created_at?: string
          impressions?: number
          members_reached?: number | null
          post_id?: string
          reactions?: number
          reposts?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_transitions: {
        Row: {
          actor: string
          enabled: boolean
          from_status: Database["public"]["Enums"]["post_status"]
          to_status: Database["public"]["Enums"]["post_status"]
        }
        Insert: {
          actor: string
          enabled?: boolean
          from_status: Database["public"]["Enums"]["post_status"]
          to_status: Database["public"]["Enums"]["post_status"]
        }
        Update: {
          actor?: string
          enabled?: boolean
          from_status?: Database["public"]["Enums"]["post_status"]
          to_status?: Database["public"]["Enums"]["post_status"]
        }
        Relationships: []
      }
      posts: {
        Row: {
          angle: string | null
          answers: Json
          author_id: string
          cible: Database["public"]["Enums"]["post_target"]
          content: string
          created_at: string
          editorial_line_id: string | null
          failure_reason: string | null
          guardrail_report: Json | null
          id: string
          image_alt: string | null
          image_path: string | null
          linkedin_post_urn: string | null
          linkedin_url: string | null
          origin: Database["public"]["Enums"]["post_origin"]
          params: Json
          published_at: string | null
          publishing_started_at: string | null
          scheduled_at: string | null
          series_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          sujet: string
          type: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          angle?: string | null
          answers?: Json
          author_id?: string
          cible?: Database["public"]["Enums"]["post_target"]
          content?: string
          created_at?: string
          editorial_line_id?: string | null
          failure_reason?: string | null
          guardrail_report?: Json | null
          id?: string
          image_alt?: string | null
          image_path?: string | null
          linkedin_post_urn?: string | null
          linkedin_url?: string | null
          origin?: Database["public"]["Enums"]["post_origin"]
          params?: Json
          published_at?: string | null
          publishing_started_at?: string | null
          scheduled_at?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          sujet?: string
          type: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          angle?: string | null
          answers?: Json
          author_id?: string
          cible?: Database["public"]["Enums"]["post_target"]
          content?: string
          created_at?: string
          editorial_line_id?: string | null
          failure_reason?: string | null
          guardrail_report?: Json | null
          id?: string
          image_alt?: string | null
          image_path?: string | null
          linkedin_post_urn?: string | null
          linkedin_url?: string | null
          origin?: Database["public"]["Enums"]["post_origin"]
          params?: Json
          published_at?: string | null
          publishing_started_at?: string | null
          scheduled_at?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          sujet?: string
          type?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_editorial_line_id_fkey"
            columns: ["editorial_line_id"]
            isOneToOne: false
            referencedRelation: "editorial_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          line_id: string | null
          nom: string
          onboarded_at: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id: string
          line_id?: string | null
          nom?: string
          onboarded_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          line_id?: string | null
          nom?: string
          onboarded_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "editorial_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          angle_plan: Json | null
          brief: string
          charter_snapshot: Json
          created_at: string
          created_by: string
          editorial_line_id: string | null
          id: string
          line_snapshot: Json
          settings: Json
          subject: string
          type: string
        }
        Insert: {
          angle_plan?: Json | null
          brief?: string
          charter_snapshot?: Json
          created_at?: string
          created_by?: string
          editorial_line_id?: string | null
          id?: string
          line_snapshot?: Json
          settings?: Json
          subject: string
          type: string
        }
        Update: {
          angle_plan?: Json | null
          brief?: string
          charter_snapshot?: Json
          created_at?: string
          created_by?: string
          editorial_line_id?: string | null
          id?: string
          line_snapshot?: Json
          settings?: Json
          subject?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_editorial_line_id_fkey"
            columns: ["editorial_line_id"]
            isOneToOne: false
            referencedRelation: "editorial_lines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cron_claim_due_posts: {
        Args: { p_limit?: number; p_secret: string }
        Returns: {
          angle: string | null
          answers: Json
          author_id: string
          cible: Database["public"]["Enums"]["post_target"]
          content: string
          created_at: string
          editorial_line_id: string | null
          failure_reason: string | null
          guardrail_report: Json | null
          id: string
          image_alt: string | null
          image_path: string | null
          linkedin_post_urn: string | null
          linkedin_url: string | null
          origin: Database["public"]["Enums"]["post_origin"]
          params: Json
          published_at: string | null
          publishing_started_at: string | null
          scheduled_at: string | null
          series_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          sujet: string
          type: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cron_complete_post: {
        Args: {
          p_failure_reason?: string
          p_linkedin_post_urn?: string
          p_linkedin_url?: string
          p_post_id: string
          p_secret: string
          p_success: boolean
        }
        Returns: undefined
      }
      cron_publication_context: { Args: { p_secret: string }; Returns: Json }
    }
    Enums: {
      client_status: "citable" | "citable_without_detail" | "not_citable"
      post_origin: "app" | "linkedin_import"
      post_status:
        | "draft"
        | "pending"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "archived"
      post_target: "perso" | "entreprise"
      user_role: "admin" | "contributor"
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
    Enums: {
      client_status: ["citable", "citable_without_detail", "not_citable"],
      post_origin: ["app", "linkedin_import"],
      post_status: [
        "draft",
        "pending",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "archived",
      ],
      post_target: ["perso", "entreprise"],
      user_role: ["admin", "contributor"],
    },
  },
} as const
