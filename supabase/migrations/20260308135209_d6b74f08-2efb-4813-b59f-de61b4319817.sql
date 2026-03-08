
-- Function for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  current_phase TEXT NOT NULL DEFAULT 'discovery' CHECK (current_phase IN ('discovery', 'define', 'develop', 'deliver')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  phase_progress JSONB NOT NULL DEFAULT '{"discovery": 0, "define": 0, "develop": 0, "deliver": 0}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Projects can be inserted by anyone" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Projects can be updated by anyone" ON public.projects FOR UPDATE USING (true);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('ux', 'ui', 'dev')),
  phase TEXT NOT NULL CHECK (phase IN ('discovery', 'define', 'develop', 'deliver')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  assignee TEXT,
  avatar TEXT,
  days_in_phase INTEGER NOT NULL DEFAULT 0,
  estimated_days INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Tasks can be inserted by anyone" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Tasks can be updated by anyone" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Tasks can be deleted by anyone" ON public.tasks FOR DELETE USING (true);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members are viewable by everyone" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Team members can be inserted by anyone" ON public.team_members FOR INSERT WITH CHECK (true);

-- Personas table
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  pain_points TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personas are viewable by everyone" ON public.personas FOR SELECT USING (true);
CREATE POLICY "Personas can be inserted by anyone" ON public.personas FOR INSERT WITH CHECK (true);
CREATE POLICY "Personas can be updated by anyone" ON public.personas FOR UPDATE USING (true);

CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI chat messages table
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI messages are viewable by everyone" ON public.ai_messages FOR SELECT USING (true);
CREATE POLICY "AI messages can be inserted by anyone" ON public.ai_messages FOR INSERT WITH CHECK (true);

-- UX Metrics table
CREATE TABLE public.ux_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  score NUMERIC NOT NULL,
  previous_score NUMERIC,
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ux_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UX metrics are viewable by everyone" ON public.ux_metrics FOR SELECT USING (true);
CREATE POLICY "UX metrics can be inserted by anyone" ON public.ux_metrics FOR INSERT WITH CHECK (true);
