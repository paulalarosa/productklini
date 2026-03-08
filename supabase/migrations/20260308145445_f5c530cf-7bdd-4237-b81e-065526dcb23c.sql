
CREATE TABLE public.prototype_hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_design_id uuid NOT NULL REFERENCES public.canvas_designs(id) ON DELETE CASCADE,
  target_design_id uuid NOT NULL REFERENCES public.canvas_designs(id) ON DELETE CASCADE,
  x numeric NOT NULL DEFAULT 0,
  y numeric NOT NULL DEFAULT 0,
  width numeric NOT NULL DEFAULT 100,
  height numeric NOT NULL DEFAULT 60,
  transition text NOT NULL DEFAULT 'fade',
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prototype_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotspots viewable by everyone" ON public.prototype_hotspots FOR SELECT USING (true);
CREATE POLICY "Hotspots insertable by anyone" ON public.prototype_hotspots FOR INSERT WITH CHECK (true);
CREATE POLICY "Hotspots updatable by anyone" ON public.prototype_hotspots FOR UPDATE USING (true);
CREATE POLICY "Hotspots deletable by anyone" ON public.prototype_hotspots FOR DELETE USING (true);
