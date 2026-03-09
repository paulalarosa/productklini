import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type UXPattern = Tables<"ux_patterns">;
type UXPatternInsert = TablesInsert<"ux_patterns">;
type UXPatternUpdate = TablesUpdate<"ux_patterns">;

export function useUXPatterns(filters?: {
  category?: string;
  pattern_type?: string;
  difficulty_level?: string;
  search?: string;
}) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["ux-patterns", filters],
    queryFn: async () => {
      let query = supabase
        .from("ux_patterns")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.pattern_type) {
        query = query.eq("pattern_type", filters.pattern_type);
      }

      if (filters?.difficulty_level) {
        query = query.eq("difficulty_level", filters.difficulty_level);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ux-patterns-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ux_patterns" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ux-patterns"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useUXPattern(patternId?: string) {
  return useQuery({
    queryKey: ["ux-pattern", patternId],
    queryFn: async () => {
      if (!patternId) return null;
      
      const { data, error } = await supabase
        .from("ux_patterns")
        .select("*")
        .eq("id", patternId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patternId,
  });
}

export function useCreateUXPattern() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pattern: { 
      name: string; 
      description: string; 
      category: string;
      tags?: string[];
      pattern_type?: string;
      difficulty_level?: string;
      use_cases?: string[];
      psychology_principles?: string[];
      best_practices?: string[];
      examples?: Record<string, unknown>;
      design_tokens?: Record<string, unknown>;
      code_examples?: Record<string, unknown>;
      metrics?: Record<string, unknown>;
    }) => {
      // Get current project
      const { data: projects } = await supabase.from("projects").select("id").limit(1).single();
      if (!projects) throw new Error("No project found");
      
      const { data, error } = await supabase
        .from("ux_patterns")
        .insert({
          ...pattern,
          examples: pattern.examples as unknown as Json,
          design_tokens: pattern.design_tokens as unknown as Json,
          code_examples: pattern.code_examples as unknown as Json,
          metrics: pattern.metrics as unknown as Json,
          project_id: projects.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ux-patterns"] });
    },
  });
}

export function useUpdateUXPattern() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UXPatternUpdate }) => {
      const { data, error } = await supabase
        .from("ux_patterns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ux-patterns"] });
      queryClient.invalidateQueries({ queryKey: ["ux-pattern", data.id] });
    },
  });
}

export function useDeleteUXPattern() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ux_patterns")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ux-patterns"] });
    },
  });
}

export const PATTERN_CATEGORIES = [
  { value: "persuasion", label: "Design Persuasivo" },
  { value: "navigation", label: "Navegação" },
  { value: "forms", label: "Formulários" },
  { value: "feedback", label: "Feedback & Estados" },
  { value: "content", label: "Conteúdo" },
  { value: "social", label: "Social & Colaboração" },
  { value: "onboarding", label: "Onboarding" },
  { value: "accessibility", label: "Acessibilidade" },
  { value: "mobile", label: "Mobile" },
  { value: "flutter", label: "Flutter / Mobile Nativo" },
  { value: "general", label: "Geral" },
];

export const PATTERN_TYPES = [
  { value: "component", label: "Componente" },
  { value: "flow", label: "Fluxo" },
  { value: "principle", label: "Princípio" },
];

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];