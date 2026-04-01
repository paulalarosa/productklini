
-- 1. Diary Studies
CREATE TABLE public.diary_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  participant_name text NOT NULL DEFAULT '',
  entry_date timestamp with time zone NOT NULL DEFAULT now(),
  context text NOT NULL DEFAULT '',
  activity text NOT NULL DEFAULT '',
  emotions text NOT NULL DEFAULT '',
  pain_points text[] NOT NULL DEFAULT '{}',
  insights text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.diary_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_diary" ON public.diary_studies FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 2. Stakeholder Maps
CREATE TABLE public.stakeholder_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  influence_level text NOT NULL DEFAULT 'medium',
  interest_level text NOT NULL DEFAULT 'medium',
  relationship text NOT NULL DEFAULT 'neutral',
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.stakeholder_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_stakeholder" ON public.stakeholder_maps FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 3. HEART Metrics
CREATE TABLE public.heart_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'happiness',
  metric_name text NOT NULL,
  signal text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT '',
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '%',
  measured_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.heart_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_heart" ON public.heart_metrics FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 4. North Star Metric
CREATE TABLE public.north_star_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  input_metrics jsonb NOT NULL DEFAULT '[]',
  measured_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.north_star_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_northstar" ON public.north_star_metrics FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 5. NPS Surveys
CREATE TABLE public.nps_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  survey_type text NOT NULL DEFAULT 'nps',
  score numeric NOT NULL DEFAULT 0,
  respondent_name text NOT NULL DEFAULT 'Anônimo',
  feedback text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_nps" ON public.nps_surveys FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 6. Roadmap Items
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  quarter text NOT NULL DEFAULT 'Q1',
  status text NOT NULL DEFAULT 'planned',
  priority text NOT NULL DEFAULT 'medium',
  effort text NOT NULL DEFAULT 'medium',
  impact text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'feature',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_roadmap" ON public.roadmap_items FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 7. OKRs
CREATE TABLE public.okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  objective text NOT NULL,
  key_results jsonb NOT NULL DEFAULT '[]',
  quarter text NOT NULL DEFAULT 'Q1',
  status text NOT NULL DEFAULT 'on_track',
  progress numeric NOT NULL DEFAULT 0,
  owner text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_okrs" ON public.okrs FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 8. Design Principles
CREATE TABLE public.design_principles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  example text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'star',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.design_principles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_principles" ON public.design_principles FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 9. Decision Log
CREATE TABLE public.decision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  context text NOT NULL DEFAULT '',
  decision text NOT NULL DEFAULT '',
  alternatives text[] NOT NULL DEFAULT '{}',
  rationale text NOT NULL DEFAULT '',
  impact text NOT NULL DEFAULT 'medium',
  decided_by text NOT NULL DEFAULT '',
  decided_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'approved',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.decision_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_decisions" ON public.decision_log FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- 10. Design Critiques
CREATE TABLE public.design_critiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  screen_name text NOT NULL,
  critique_type text NOT NULL DEFAULT 'general',
  feedback text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  reviewer text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.design_critiques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_critiques" ON public.design_critiques FOR ALL TO authenticated
  USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));
