
-- Canvas version history table
CREATE TABLE public.canvas_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id uuid REFERENCES public.canvas_designs(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  name text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.canvas_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Canvas versions viewable by everyone" ON public.canvas_versions FOR SELECT USING (true);
CREATE POLICY "Canvas versions insertable by anyone" ON public.canvas_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Canvas versions deletable by anyone" ON public.canvas_versions FOR DELETE USING (true);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications viewable by everyone" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Notifications insertable by anyone" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Notifications updatable by anyone" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Notifications deletable by anyone" ON public.notifications FOR DELETE USING (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
