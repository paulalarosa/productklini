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
      ab_experiments: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          hypothesis: string
          id: string
          minimum_sample_size: number | null
          name: string
          project_id: string
          start_date: string | null
          statistical_significance: number | null
          status: string
          success_metrics: Json
          targeting_rules: Json
          traffic_allocation: number
          updated_at: string
          variants: Json
        }
        Insert: {
          created_at?: string
          description?: string
          end_date?: string | null
          hypothesis?: string
          id?: string
          minimum_sample_size?: number | null
          name: string
          project_id: string
          start_date?: string | null
          statistical_significance?: number | null
          status?: string
          success_metrics?: Json
          targeting_rules?: Json
          traffic_allocation?: number
          updated_at?: string
          variants?: Json
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          hypothesis?: string
          id?: string
          minimum_sample_size?: number | null
          name?: string
          project_id?: string
          start_date?: string | null
          statistical_significance?: number | null
          status?: string
          success_metrics?: Json
          targeting_rules?: Json
          traffic_allocation?: number
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      ab_results: {
        Row: {
          event_type: string
          event_value: number | null
          experiment_id: string
          id: string
          metadata: Json
          recorded_at: string
          user_session: string
          variant_id: string
        }
        Insert: {
          event_type: string
          event_value?: number | null
          experiment_id: string
          id?: string
          metadata?: Json
          recorded_at?: string
          user_session: string
          variant_id: string
        }
        Update: {
          event_type?: string
          event_value?: number | null
          experiment_id?: string
          id?: string
          metadata?: Json
          recorded_at?: string
          user_session?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_results_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_definitions: {
        Row: {
          badge_color: string
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points: number
          requirement_config: Json
          requirement_type: string
          updated_at: string
        }
        Insert: {
          badge_color?: string
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          points?: number
          requirement_config?: Json
          requirement_type?: string
          updated_at?: string
        }
        Update: {
          badge_color?: string
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          requirement_config?: Json
          requirement_type?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      analytics_funnel: {
        Row: {
          id: string
          percent_value: number
          project_id: string
          recorded_at: string
          step_name: string
          step_order: number
          user_count: number
        }
        Insert: {
          id?: string
          percent_value?: number
          project_id: string
          recorded_at?: string
          step_name: string
          step_order?: number
          user_count?: number
        }
        Update: {
          id?: string
          percent_value?: number
          project_id?: string
          recorded_at?: string
          step_name?: string
          step_order?: number
          user_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_funnel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_snapshots: {
        Row: {
          crash_free_percent: number
          dau: number
          id: string
          mau: number
          period_label: string
          project_id: string
          recorded_at: string
        }
        Insert: {
          crash_free_percent?: number
          dau?: number
          id?: string
          mau?: number
          period_label: string
          project_id: string
          recorded_at?: string
        }
        Update: {
          crash_free_percent?: number
          dau?: number
          id?: string
          mau?: number
          period_label?: string
          project_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_reviews: {
        Row: {
          ai_tag: string
          ai_tag_type: string
          author: string
          created_at: string
          id: string
          platform: string
          project_id: string
          stars: number
          text: string
        }
        Insert: {
          ai_tag?: string
          ai_tag_type?: string
          author?: string
          created_at?: string
          id?: string
          platform?: string
          project_id: string
          stars?: number
          text?: string
        }
        Update: {
          ai_tag?: string
          ai_tag_type?: string
          author?: string
          created_at?: string
          id?: string
          platform?: string
          project_id?: string
          stars?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_models: {
        Row: {
          ability_barriers: string[]
          ability_level: string
          ability_score: number
          behavior: string
          behavior_probability: string
          context: string
          created_at: string
          description: string
          id: string
          motivation_factors: string[]
          motivation_level: string
          motivation_score: number
          project_id: string
          prompt_channel: string
          prompt_score: number
          prompt_timing: string
          prompt_type: string
          recommendations: Json
          status: string
          success_metrics: string[]
          target_audience: string
          updated_at: string
        }
        Insert: {
          ability_barriers?: string[]
          ability_level?: string
          ability_score?: number
          behavior: string
          behavior_probability?: string
          context?: string
          created_at?: string
          description?: string
          id?: string
          motivation_factors?: string[]
          motivation_level?: string
          motivation_score?: number
          project_id: string
          prompt_channel?: string
          prompt_score?: number
          prompt_timing?: string
          prompt_type?: string
          recommendations?: Json
          status?: string
          success_metrics?: string[]
          target_audience?: string
          updated_at?: string
        }
        Update: {
          ability_barriers?: string[]
          ability_level?: string
          ability_score?: number
          behavior?: string
          behavior_probability?: string
          context?: string
          created_at?: string
          description?: string
          id?: string
          motivation_factors?: string[]
          motivation_level?: string
          motivation_score?: number
          project_id?: string
          prompt_channel?: string
          prompt_score?: number
          prompt_timing?: string
          prompt_type?: string
          recommendations?: Json
          status?: string
          success_metrics?: string[]
          target_audience?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_model_canvas: {
        Row: {
          channels: Json
          cost_structure: Json
          created_at: string
          customer_relationships: Json
          customer_segments: Json
          description: string | null
          id: string
          key_activities: Json
          key_partners: Json
          key_resources: Json
          name: string
          project_id: string
          revenue_streams: Json
          status: string
          updated_at: string
          value_propositions: Json
        }
        Insert: {
          channels?: Json
          cost_structure?: Json
          created_at?: string
          customer_relationships?: Json
          customer_segments?: Json
          description?: string | null
          id?: string
          key_activities?: Json
          key_partners?: Json
          key_resources?: Json
          name?: string
          project_id: string
          revenue_streams?: Json
          status?: string
          updated_at?: string
          value_propositions?: Json
        }
        Update: {
          channels?: Json
          cost_structure?: Json
          created_at?: string
          customer_relationships?: Json
          customer_segments?: Json
          description?: string | null
          id?: string
          key_activities?: Json
          key_partners?: Json
          key_resources?: Json
          name?: string
          project_id?: string
          revenue_streams?: Json
          status?: string
          updated_at?: string
          value_propositions?: Json
        }
        Relationships: []
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
      design_token_history: {
        Row: {
          author: string
          changed_at: string
          id: string
          new_value: string
          old_value: string
          project_id: string
          reason: string
          token_key: string
        }
        Insert: {
          author?: string
          changed_at?: string
          id?: string
          new_value: string
          old_value: string
          project_id: string
          reason?: string
          token_key: string
        }
        Update: {
          author?: string
          changed_at?: string
          id?: string
          new_value?: string
          old_value?: string
          project_id?: string
          reason?: string
          token_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_token_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_tokens: {
        Row: {
          category: string
          flutter_variable: string
          id: string
          project_id: string
          token_key: string
          token_label: string
          token_value: string
          updated_at: string
        }
        Insert: {
          category?: string
          flutter_variable?: string
          id?: string
          project_id: string
          token_key: string
          token_label?: string
          token_value: string
          updated_at?: string
        }
        Update: {
          category?: string
          flutter_variable?: string
          id?: string
          project_id?: string
          token_key?: string
          token_label?: string
          token_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      mcp_sync_logs: {
        Row: {
          ai_insights: Json
          component_id: string
          id: string
          synced_at: string
        }
        Insert: {
          ai_insights?: Json
          component_id: string
          id?: string
          synced_at?: string
        }
        Update: {
          ai_insights?: Json
          component_id?: string
          id?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_sync_logs_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "ui_components"
            referencedColumns: ["id"]
          },
        ]
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
      project_documents: {
        Row: {
          ai_generated: boolean
          content: string
          created_at: string
          doc_type: string
          id: string
          metadata: Json
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          metadata?: Json
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          metadata?: Json
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
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
          figma_file_url: string | null
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
          figma_file_url?: string | null
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
          figma_file_url?: string | null
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
      share_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string
          password_hash: string
          project_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          password_hash: string
          project_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          password_hash?: string
          project_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      ui_components: {
        Row: {
          component_name: string
          created_at: string
          dart_code: string
          figma_node_id: string
          id: string
          project_id: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          component_name: string
          created_at?: string
          dart_code?: string
          figma_node_id?: string
          id?: string
          project_id: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          component_name?: string
          created_at?: string
          dart_code?: string
          figma_node_id?: string
          id?: string
          project_id?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ui_components_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          points_awarded: number
          project_id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          points_awarded?: number
          project_id: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          points_awarded?: number
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          id: string
          level: number
          project_id: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: number
          project_id: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          project_id?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completion_percentage: number
          created_at: string
          id: string
          last_activity: string
          module_name: string
          points_earned: number
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          id?: string
          last_activity?: string
          module_name: string
          points_earned?: number
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          id?: string
          last_activity?: string
          module_name?: string
          points_earned?: number
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      ux_patterns: {
        Row: {
          best_practices: string[]
          category: string
          code_examples: Json
          created_at: string
          description: string
          design_tokens: Json
          difficulty_level: string
          examples: Json
          id: string
          metrics: Json
          name: string
          pattern_type: string
          preview_image: string | null
          project_id: string
          psychology_principles: string[]
          related_patterns: string[]
          status: string
          tags: string[]
          updated_at: string
          use_cases: string[]
        }
        Insert: {
          best_practices?: string[]
          category?: string
          code_examples?: Json
          created_at?: string
          description?: string
          design_tokens?: Json
          difficulty_level?: string
          examples?: Json
          id?: string
          metrics?: Json
          name: string
          pattern_type?: string
          preview_image?: string | null
          project_id: string
          psychology_principles?: string[]
          related_patterns?: string[]
          status?: string
          tags?: string[]
          updated_at?: string
          use_cases?: string[]
        }
        Update: {
          best_practices?: string[]
          category?: string
          code_examples?: Json
          created_at?: string
          description?: string
          design_tokens?: Json
          difficulty_level?: string
          examples?: Json
          id?: string
          metrics?: Json
          name?: string
          pattern_type?: string
          preview_image?: string | null
          project_id?: string
          psychology_principles?: string[]
          related_patterns?: string[]
          status?: string
          tags?: string[]
          updated_at?: string
          use_cases?: string[]
        }
        Relationships: []
      }
      ux_research: {
        Row: {
          conducted_at: string
          created_at: string
          findings: Json
          id: string
          participants: number
          project_id: string
          research_type: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          conducted_at?: string
          created_at?: string
          findings?: Json
          id?: string
          participants?: number
          project_id: string
          research_type?: string
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          conducted_at?: string
          created_at?: string
          findings?: Json
          id?: string
          participants?: number
          project_id?: string
          research_type?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ux_research_project_id_fkey"
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
      user_owns_component: { Args: { _component_id: string }; Returns: boolean }
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
