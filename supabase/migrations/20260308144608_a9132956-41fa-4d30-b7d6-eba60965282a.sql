
CREATE TABLE public.ds_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'components',
  code_react text NOT NULL DEFAULT '',
  code_vue text NOT NULL DEFAULT '',
  code_html text NOT NULL DEFAULT '',
  preview_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  source text NOT NULL DEFAULT 'ai-generated',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ds_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DS components viewable by everyone" ON public.ds_components FOR SELECT USING (true);
CREATE POLICY "DS components insertable by anyone" ON public.ds_components FOR INSERT WITH CHECK (true);
CREATE POLICY "DS components updatable by anyone" ON public.ds_components FOR UPDATE USING (true);
CREATE POLICY "DS components deletable by anyone" ON public.ds_components FOR DELETE USING (true);

CREATE TRIGGER update_ds_components_updated_at BEFORE UPDATE ON public.ds_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
