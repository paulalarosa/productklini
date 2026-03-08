
-- Table for structured project documentation
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'insight',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.project_documents FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.project_documents FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.project_documents FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.project_documents FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_documents;

-- Index for fast lookups
CREATE INDEX idx_project_documents_project_type ON public.project_documents(project_id, doc_type);
