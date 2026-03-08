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
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_designs: {
        Row: {
          canvas_height: number
          canvas_width: number
          created_at: string
          elements: Json
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          canvas_height?: number
          canvas_width?: number
          created_at?: string
          elements?: Json
          id?: string
          name?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          canvas_height?: number
          canvas_width?: number
          created_at?: string
          elements?: Json
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_designs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_versions: {
        Row: {
          created_at: string
          design_id: string
          elements: Json
          id: string
          name: string
          version_number: number
        }
        Insert: {
          created_at?: string
          design_id: string
          elements?: Json
          id?: string
          name?: string
          version_number?: number
        }
        Update: {
          created_at?: string
          design_id?: string
          elements?: Json
          id?: string
          name?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "canvas_versions_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "canvas_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      ds_components: {
        Row: {
          category: string
          code_html: string
          code_react: string
          code_vue: string
          created_at: string
          description: string
          id: string
          name: string
          preview_elements: Json
          project_id: string
          source: string
          specs: Json
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          code_html?: string
          code_react?: string
          code_vue?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          preview_elements?: Json
          project_id: string
          source?: string
          specs?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          code_html?: string
          code_react?: string
          code_vue?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          preview_elements?: Json
          project_id?: string
          source?: string
          specs?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          project_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          project_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          project_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          created_at: string
          goals: string[]
          id: string
          name: string
          pain_points: string[]
          project_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          goals?: string[]
          id?: string
          name: string
          pain_points?: string[]
          project_id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          goals?: string[]
          id?: string
          name?: string
          pain_points?: string[]
          project_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          current_phase: string
          description: string | null
          id: string
          name: string
          phase_progress: Json
          progress: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_phase?: string
          description?: string | null
          id?: string
          name: string
          phase_progress?: Json
          progress?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_phase?: string
          description?: string | null
          id?: string
          name?: string
          phase_progress?: Json
          progress?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prototype_hotspots: {
        Row: {
          created_at: string
          height: number
          id: string
          label: string
          source_design_id: string
          target_design_id: string
          transition: string
          width: number
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          height?: number
          id?: string
          label?: string
          source_design_id: string
          target_design_id: string
          transition?: string
          width?: number
          x?: number
          y?: number
        }
        Update: {
          created_at?: string
          height?: number
          id?: string
          label?: string
          source_design_id?: string
          target_design_id?: string
          transition?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "prototype_hotspots_source_design_id_fkey"
            columns: ["source_design_id"]
            isOneToOne: false
            referencedRelation: "canvas_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_hotspots_target_design_id_fkey"
            columns: ["target_design_id"]
            isOneToOne: false
            referencedRelation: "canvas_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          avatar: string | null
          created_at: string
          days_in_phase: number
          estimated_days: number
          id: string
          module: string
          phase: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          avatar?: string | null
          created_at?: string
          days_in_phase?: number
          estimated_days?: number
          id?: string
          module: string
          phase: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          avatar?: string | null
          created_at?: string
          days_in_phase?: number
          estimated_days?: number
          id?: string
          module?: string
          phase?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar: string
          created_at: string
          id: string
          name: string
          project_id: string
          role: string
        }
        Insert: {
          avatar: string
          created_at?: string
          id?: string
          name: string
          project_id: string
          role: string
        }
        Update: {
          avatar?: string
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ux_metrics: {
        Row: {
          id: string
          measured_at: string
          metric_name: string
          previous_score: number | null
          project_id: string
          score: number
        }
        Insert: {
          id?: string
          measured_at?: string
          metric_name: string
          previous_score?: number | null
          project_id: string
          score: number
        }
        Update: {
          id?: string
          measured_at?: string
          metric_name?: string
          previous_score?: number | null
          project_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ux_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_design: { Args: { _design_id: string }; Returns: boolean }
      user_owns_project: { Args: { _project_id: string }; Returns: boolean }
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
