
-- Analytics: retention snapshots
CREATE TABLE public.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  period_label text NOT NULL,
  dau integer NOT NULL DEFAULT 0,
  mau integer NOT NULL DEFAULT 0,
  crash_free_percent numeric NOT NULL DEFAULT 99.9,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Analytics: funnel steps
CREATE TABLE public.analytics_funnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  step_order integer NOT NULL DEFAULT 0,
  percent_value numeric NOT NULL DEFAULT 0,
  user_count integer NOT NULL DEFAULT 0,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- App reviews from stores
CREATE TABLE public.app_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stars integer NOT NULL DEFAULT 5,
  text text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT 'Anônimo',
  platform text NOT NULL DEFAULT 'android',
  ai_tag text NOT NULL DEFAULT '',
  ai_tag_type text NOT NULL DEFAULT 'praise',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Design tokens (current values)
CREATE TABLE public.design_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token_key text NOT NULL,
  token_value text NOT NULL,
  token_label text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'color',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, token_key)
);

-- Design token history
CREATE TABLE public.design_token_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token_key text NOT NULL,
  old_value text NOT NULL,
  new_value text NOT NULL,
  author text NOT NULL DEFAULT 'Designer',
  reason text NOT NULL DEFAULT '',
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for all new tables
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_token_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.analytics_snapshots FOR SELECT USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.analytics_snapshots FOR INSERT WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.analytics_snapshots FOR UPDATE USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.analytics_snapshots FOR DELETE USING (user_owns_project(project_id));

CREATE POLICY "owner_select" ON public.analytics_funnel FOR SELECT USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.analytics_funnel FOR INSERT WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.analytics_funnel FOR UPDATE USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.analytics_funnel FOR DELETE USING (user_owns_project(project_id));

CREATE POLICY "owner_select" ON public.app_reviews FOR SELECT USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.app_reviews FOR INSERT WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.app_reviews FOR UPDATE USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.app_reviews FOR DELETE USING (user_owns_project(project_id));

CREATE POLICY "owner_select" ON public.design_tokens FOR SELECT USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.design_tokens FOR INSERT WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.design_tokens FOR UPDATE USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.design_tokens FOR DELETE USING (user_owns_project(project_id));

CREATE POLICY "owner_select" ON public.design_token_history FOR SELECT USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.design_token_history FOR INSERT WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.design_token_history FOR DELETE USING (user_owns_project(project_id));

-- Enable realtime for reviews (live feed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_reviews;
