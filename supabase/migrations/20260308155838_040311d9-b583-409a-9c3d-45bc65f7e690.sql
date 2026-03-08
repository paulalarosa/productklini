
CREATE TABLE public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  password_hash text NOT NULL,
  label text NOT NULL DEFAULT 'Diretor',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.share_links FOR SELECT TO authenticated
  USING (user_owns_project(project_id));

CREATE POLICY "owner_insert" ON public.share_links FOR INSERT TO authenticated
  WITH CHECK (user_owns_project(project_id));

CREATE POLICY "owner_update" ON public.share_links FOR UPDATE TO authenticated
  USING (user_owns_project(project_id));

CREATE POLICY "owner_delete" ON public.share_links FOR DELETE TO authenticated
  USING (user_owns_project(project_id));
