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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alert_events: {
        Row: {
          endpoint_id: string | null
          id: string
          message: string | null
          occurred_at: string
          payload: Json | null
          resolved_at: string | null
          rule_id: string
          status: Database["public"]["Enums"]["alert_status"]
        }
        Insert: {
          endpoint_id?: string | null
          id?: string
          message?: string | null
          occurred_at?: string
          payload?: Json | null
          resolved_at?: string | null
          rule_id: string
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Update: {
          endpoint_id?: string | null
          id?: string
          message?: string | null
          occurred_at?: string
          payload?: Json | null
          resolved_at?: string | null
          rule_id?: string
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          name: string
          query: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          throttle_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          query?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          throttle_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          query?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          throttle_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      endpoints: {
        Row: {
          created_at: string
          enabled: boolean
          error: string | null
          id: string
          interval_sec: number
          last_checked_at: string | null
          last_latency_ms: number | null
          last_status: Database["public"]["Enums"]["endpoint_status"]
          last_status_code: number | null
          method: string
          updated_at: string
          url: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          error?: string | null
          id?: string
          interval_sec?: number
          last_checked_at?: string | null
          last_latency_ms?: number | null
          last_status?: Database["public"]["Enums"]["endpoint_status"]
          last_status_code?: number | null
          method?: string
          updated_at?: string
          url: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          error?: string | null
          id?: string
          interval_sec?: number
          last_checked_at?: string | null
          last_latency_ms?: number | null
          last_status?: Database["public"]["Enums"]["endpoint_status"]
          last_status_code?: number | null
          method?: string
          updated_at?: string
          url?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          endpoint_id: string | null
          id: number
          level: Database["public"]["Enums"]["log_level"]
          message: string | null
          meta: Json
          service: string | null
          source: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          endpoint_id?: string | null
          id?: number
          level: Database["public"]["Enums"]["log_level"]
          message?: string | null
          meta?: Json
          service?: string | null
          source?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          endpoint_id?: string | null
          id?: number
          level?: Database["public"]["Enums"]["log_level"]
          message?: string | null
          meta?: Json
          service?: string | null
          source?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_queries: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          query: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          query: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          query?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_refresh: boolean
          created_at: string
          log_retention_days: number
          max_log_size_mb: number
          refresh_interval: number
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_refresh?: boolean
          created_at?: string
          log_retention_days?: number
          max_log_size_mb?: number
          refresh_interval?: number
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_refresh?: boolean
          created_at?: string
          log_retention_days?: number
          max_log_size_mb?: number
          refresh_interval?: number
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          endpoint_id: string
          error: string | null
          id: string
          payload: Json | null
          response_ms: number | null
          sent_at: string
          status_code: number | null
          success: boolean | null
          target_url: string
        }
        Insert: {
          endpoint_id: string
          error?: string | null
          id?: string
          payload?: Json | null
          response_ms?: number | null
          sent_at?: string
          status_code?: number | null
          success?: boolean | null
          target_url: string
        }
        Update: {
          endpoint_id?: string
          error?: string | null
          id?: string
          payload?: Json | null
          response_ms?: number | null
          sent_at?: string
          status_code?: number | null
          success?: boolean | null
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
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
      alert_severity: "info" | "warning" | "critical"
      alert_status: "active" | "resolved"
      endpoint_status: "up" | "down" | "unknown"
      log_level: "DEBUG" | "INFO" | "WARN" | "ERROR"
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
      alert_severity: ["info", "warning", "critical"],
      alert_status: ["active", "resolved"],
      endpoint_status: ["up", "down", "unknown"],
      log_level: ["DEBUG", "INFO", "WARN", "ERROR"],
    },
  },
} as const
