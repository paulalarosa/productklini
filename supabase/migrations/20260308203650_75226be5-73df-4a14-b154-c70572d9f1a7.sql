
-- Add figma_file_url to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS figma_file_url TEXT DEFAULT NULL;

-- Add flutter_variable to design_tokens
ALTER TABLE public.design_tokens ADD COLUMN IF NOT EXISTS flutter_variable TEXT NOT NULL DEFAULT '';

-- Create ui_components table
CREATE TABLE public.ui_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  figma_node_id TEXT NOT NULL DEFAULT '',
  dart_code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  version NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ui_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.ui_components FOR SELECT TO authenticated
  USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ui_components FOR INSERT TO authenticated
  WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ui_components FOR UPDATE TO authenticated
  USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ui_components FOR DELETE TO authenticated
  USING (user_owns_project(project_id));

-- Create mcp_sync_logs table
CREATE TABLE public.mcp_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_id UUID NOT NULL REFERENCES public.ui_components(id) ON DELETE CASCADE,
  ai_insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mcp_sync_logs ENABLE ROW LEVEL SECURITY;

-- For mcp_sync_logs we need a helper function
CREATE OR REPLACE FUNCTION public.user_owns_component(_component_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ui_components uc
    JOIN public.projects p ON uc.project_id = p.id
    WHERE uc.id = _component_id AND p.user_id = auth.uid()
  )
$$;

CREATE POLICY "owner_select" ON public.mcp_sync_logs FOR SELECT TO authenticated
  USING (user_owns_component(component_id));
CREATE POLICY "owner_insert" ON public.mcp_sync_logs FOR INSERT TO authenticated
  WITH CHECK (user_owns_component(component_id));
CREATE POLICY "owner_delete" ON public.mcp_sync_logs FOR DELETE TO authenticated
  USING (user_owns_component(component_id));
