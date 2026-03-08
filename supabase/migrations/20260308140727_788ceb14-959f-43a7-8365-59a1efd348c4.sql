
-- Canvas designs table for persisting wireframes
CREATE TABLE public.canvas_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sem título',
  elements JSONB NOT NULL DEFAULT '[]',
  canvas_width INTEGER NOT NULL DEFAULT 1440,
  canvas_height INTEGER NOT NULL DEFAULT 900,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.canvas_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Canvas designs are viewable by everyone" ON public.canvas_designs FOR SELECT USING (true);
CREATE POLICY "Canvas designs can be inserted by anyone" ON public.canvas_designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Canvas designs can be updated by anyone" ON public.canvas_designs FOR UPDATE USING (true);
CREATE POLICY "Canvas designs can be deleted by anyone" ON public.canvas_designs FOR DELETE USING (true);

CREATE TRIGGER update_canvas_designs_updated_at
  BEFORE UPDATE ON public.canvas_designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
