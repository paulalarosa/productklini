import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type BusinessModelCanvas = Tables<"business_model_canvas">;
type BusinessModelCanvasInsert = TablesInsert<"business_model_canvas">;
type BusinessModelCanvasUpdate = TablesUpdate<"business_model_canvas">;

export function useBusinessModelCanvases() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["business-model-canvas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_model_canvas")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("business-model-canvas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_model_canvas" }, () => {
        queryClient.invalidateQueries({ queryKey: ["business-model-canvas"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useBusinessModelCanvas(canvasId?: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["business-model-canvas", canvasId],
    queryFn: async () => {
      if (!canvasId) return null;
      
      const { data, error } = await supabase
        .from("business_model_canvas")
        .select("*")
        .eq("id", canvasId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!canvasId,
  });

  useEffect(() => {
    if (!canvasId) return;
    
    const channel = supabase
      .channel(`business-model-canvas-${canvasId}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "business_model_canvas",
        filter: `id=eq.${canvasId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["business-model-canvas", canvasId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient, canvasId]);

  return query;
}

export function useCreateBusinessModelCanvas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (canvas: Omit<BusinessModelCanvasInsert, "id" | "created_at" | "updated_at">) => {
      // Get current project (in a real app, this would come from context)
      const { data: projects } = await supabase.from("projects").select("id").limit(1).single();
      if (!projects) throw new Error("No project found");
      
      const { data, error } = await supabase
        .from("business_model_canvas")
        .insert({
          ...canvas,
          project_id: projects.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-model-canvas"] });
    },
  });
}

export function useUpdateBusinessModelCanvas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BusinessModelCanvasUpdate }) => {
      const { data, error } = await supabase
        .from("business_model_canvas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-model-canvas"] });
      queryClient.invalidateQueries({ queryKey: ["business-model-canvas", data.id] });
    },
  });
}

export function useDeleteBusinessModelCanvas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_model_canvas")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-model-canvas"] });
    },
  });
}