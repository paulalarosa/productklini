
-- Competitive Landscape table
CREATE TABLE public.competitive_landscape (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  competitor_name text NOT NULL,
  category text NOT NULL DEFAULT 'direct',
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  market_position text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.competitive_landscape ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_competitive" ON public.competitive_landscape FOR ALL TO authenticated USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- Feature flags table
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  flag_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'off',
  rollout_percentage numeric NOT NULL DEFAULT 0,
  target_segments text[] NOT NULL DEFAULT '{}',
  owner text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_flags" ON public.feature_flags FOR ALL TO authenticated USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- Moodboards table
CREATE TABLE public.moodboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  image_urls text[] NOT NULL DEFAULT '{}',
  color_palette text[] NOT NULL DEFAULT '{}',
  references_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moodboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_moodboards" ON public.moodboards FOR ALL TO authenticated USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- User flows table
CREATE TABLE public.user_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  flow_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  steps jsonb NOT NULL DEFAULT '[]',
  persona text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT '',
  pain_points text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_flows" ON public.user_flows FOR ALL TO authenticated USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));

-- Impact effort matrix table
CREATE TABLE public.impact_effort_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  impact_level text NOT NULL DEFAULT 'medium',
  effort_level text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'feature',
  quadrant text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.impact_effort_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_impact" ON public.impact_effort_items FOR ALL TO authenticated USING (user_owns_project(project_id)) WITH CHECK (user_owns_project(project_id));
