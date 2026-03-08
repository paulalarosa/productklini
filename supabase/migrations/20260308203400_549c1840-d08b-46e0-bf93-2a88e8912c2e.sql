
-- UX Research table for storing research entries (interviews, surveys, etc.)
CREATE TABLE public.ux_research (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL DEFAULT 'interview',
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  participants INTEGER NOT NULL DEFAULT 0,
  conducted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ux_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.ux_research FOR SELECT TO authenticated
  USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ux_research FOR INSERT TO authenticated
  WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ux_research FOR UPDATE TO authenticated
  USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ux_research FOR DELETE TO authenticated
  USING (user_owns_project(project_id));
