
-- Add user_id to projects table
ALTER TABLE public.projects ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop all existing permissive RLS policies on projects
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Projects can be inserted by anyone" ON public.projects;
DROP POLICY IF EXISTS "Projects can be updated by anyone" ON public.projects;

-- Create owner-scoped policies for projects
CREATE POLICY "owner_select" ON public.projects FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owner_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_update" ON public.projects FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owner_delete" ON public.projects FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create a helper function to check project ownership (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.user_owns_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND user_id = auth.uid()
  )
$$;

-- TASKS: replace open policies with owner-scoped
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be inserted by anyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be updated by anyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be deleted by anyone" ON public.tasks;
CREATE POLICY "owner_select" ON public.tasks FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.tasks FOR UPDATE TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.tasks FOR DELETE TO authenticated USING (public.user_owns_project(project_id));

-- TEAM_MEMBERS
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
DROP POLICY IF EXISTS "Team members can be inserted by anyone" ON public.team_members;
CREATE POLICY "owner_select" ON public.team_members FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.team_members FOR UPDATE TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.team_members FOR DELETE TO authenticated USING (public.user_owns_project(project_id));

-- PERSONAS
DROP POLICY IF EXISTS "Personas are viewable by everyone" ON public.personas;
DROP POLICY IF EXISTS "Personas can be inserted by anyone" ON public.personas;
DROP POLICY IF EXISTS "Personas can be updated by anyone" ON public.personas;
CREATE POLICY "owner_select" ON public.personas FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.personas FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.personas FOR UPDATE TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.personas FOR DELETE TO authenticated USING (public.user_owns_project(project_id));

-- AI_MESSAGES
DROP POLICY IF EXISTS "AI messages are viewable by everyone" ON public.ai_messages;
DROP POLICY IF EXISTS "AI messages can be inserted by anyone" ON public.ai_messages;
CREATE POLICY "owner_select" ON public.ai_messages FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ai_messages FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));

-- UX_METRICS
DROP POLICY IF EXISTS "UX metrics are viewable by everyone" ON public.ux_metrics;
DROP POLICY IF EXISTS "UX metrics can be inserted by anyone" ON public.ux_metrics;
CREATE POLICY "owner_select" ON public.ux_metrics FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ux_metrics FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ux_metrics FOR UPDATE TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ux_metrics FOR DELETE TO authenticated USING (public.user_owns_project(project_id));

-- CANVAS_DESIGNS
DROP POLICY IF EXISTS "Canvas designs are viewable by everyone" ON public.canvas_designs;
DROP POLICY IF EXISTS "Canvas designs can be inserted by anyone" ON public.canvas_designs;
DROP POLICY IF EXISTS "Canvas designs can be updated by anyone" ON public.canvas_designs;
DROP POLICY IF EXISTS "Canvas designs can be deleted by anyone" ON public.canvas_designs;
CREATE POLICY "owner_select" ON public.canvas_designs FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.canvas_designs FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.canvas_designs FOR UPDATE TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.canvas_designs FOR DELETE TO authenticated USING (public.user_owns_project(project_id));

-- CANVAS_VERSIONS (scoped via design_id -> canvas_designs -> project)
CREATE OR REPLACE FUNCTION public.user_owns_design(_design_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.canvas_designs cd
    JOIN public.projects p ON cd.project_id = p.id
    WHERE cd.id = _design_id AND p.user_id = auth.uid()
  )
$$;

DROP POLICY IF EXISTS "Canvas versions viewable by everyone" ON public.canvas_versions;
DROP POLICY IF EXISTS "Canvas versions insertable by anyone" ON public.canvas_versions;
DROP POLICY IF EXISTS "Canvas versions deletable by anyone" ON public.canvas_versions;
CREATE POLICY "owner_select" ON public.canvas_versions FOR SELECT TO authenticated USING (public.user_owns_design(design_id));
CREATE POLICY "owner_insert" ON public.canvas_versions FOR INSERT TO authenticated WITH CHECK (public.user_owns_design(design_id));
CREATE POLICY "owner_delete" ON public.canvas_versions FOR DELETE TO authenticated USING (public.user_owns_design(design_id));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Notifications viewable by everyone" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insertable by anyone" ON public.notifications;
DROP POLICY IF EXISTS "Notifications updatable by anyone" ON public.notifications;
DROP POLICY IF EXISTS "Notifications deletable by anyone" ON public.notifications;
CREATE POLICY "owner_select" ON public.notifications FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.notifications FOR UPDATE TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.notifications FOR DELETE TO authenticated USING (public.user_owns_project(project_id));

-- DS_COMPONENTS
DROP POLICY IF EXISTS "DS components viewable by everyone" ON public.ds_components;
DROP POLICY IF EXISTS "DS components insertable by anyone" ON public.ds_components;
DROP POLICY IF EXISTS "DS components updatable by anyone" ON public.ds_components;
DROP POLICY IF EXISTS "DS components deletable by anyone" ON public.ds_components;
CREATE POLICY "owner_select" ON public.ds_components FOR SELECT TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ds_components FOR INSERT TO authenticated WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ds_components FOR UPDATE TO authenticated USING (public.user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ds_components FOR DELETE TO authenticated USING (public.user_owns_project(project_id));

-- PROTOTYPE_HOTSPOTS (scoped via source_design_id)
DROP POLICY IF EXISTS "Hotspots viewable by everyone" ON public.prototype_hotspots;
DROP POLICY IF EXISTS "Hotspots insertable by anyone" ON public.prototype_hotspots;
DROP POLICY IF EXISTS "Hotspots updatable by anyone" ON public.prototype_hotspots;
DROP POLICY IF EXISTS "Hotspots deletable by anyone" ON public.prototype_hotspots;
CREATE POLICY "owner_select" ON public.prototype_hotspots FOR SELECT TO authenticated USING (public.user_owns_design(source_design_id));
CREATE POLICY "owner_insert" ON public.prototype_hotspots FOR INSERT TO authenticated WITH CHECK (public.user_owns_design(source_design_id));
CREATE POLICY "owner_update" ON public.prototype_hotspots FOR UPDATE TO authenticated USING (public.user_owns_design(source_design_id));
CREATE POLICY "owner_delete" ON public.prototype_hotspots FOR DELETE TO authenticated USING (public.user_owns_design(source_design_id));
