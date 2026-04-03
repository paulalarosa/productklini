
-- 1. Customer Journeys
CREATE TABLE public.customer_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  journey_name TEXT NOT NULL,
  persona TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  touchpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  emotions JSONB NOT NULL DEFAULT '[]'::jsonb,
  pain_points TEXT[] NOT NULL DEFAULT '{}',
  opportunities TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_journeys" ON public.customer_journeys FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 2. Sprint Retrospectives
CREATE TABLE public.sprint_retrospectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  sprint_name TEXT NOT NULL,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  went_well TEXT[] NOT NULL DEFAULT '{}',
  to_improve TEXT[] NOT NULL DEFAULT '{}',
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  team_mood TEXT NOT NULL DEFAULT 'neutral',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sprint_retrospectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_retros" ON public.sprint_retrospectives FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 3. Risk Register
CREATE TABLE public.risk_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  risk_title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'technical',
  probability TEXT NOT NULL DEFAULT 'medium',
  impact TEXT NOT NULL DEFAULT 'medium',
  mitigation_plan TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_risks" ON public.risk_register FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 4. Design Handoff Specs
CREATE TABLE public.design_handoff_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  screen_name TEXT NOT NULL,
  component_name TEXT NOT NULL DEFAULT '',
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  spacing JSONB NOT NULL DEFAULT '{}'::jsonb,
  typography JSONB NOT NULL DEFAULT '{}'::jsonb,
  colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  interactions TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.design_handoff_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_handoff" ON public.design_handoff_specs FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 5. Component Usage Analytics
CREATE TABLE public.component_usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  component_name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  screens_used TEXT[] NOT NULL DEFAULT '{}',
  last_updated_by TEXT NOT NULL DEFAULT '',
  consistency_score NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.component_usage_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_comp_analytics" ON public.component_usage_analytics FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 6. Add validation_status to personas for evolution pipeline
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'proto';
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS validation_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS interview_count INTEGER NOT NULL DEFAULT 0;

-- 7. Product Pipeline tracking
CREATE TABLE public.product_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL UNIQUE,
  current_step INTEGER NOT NULL DEFAULT 0,
  steps_completed JSONB NOT NULL DEFAULT '{}'::jsonb,
  checklist_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_pipeline" ON public.product_pipeline FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));
