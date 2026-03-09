
-- Migration: Create Discovery Suite tables
-- Date: 2026-03-09 21:00:00

-- JTBD Frameworks
CREATE TABLE IF NOT EXISTS public.jtbd_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    job_statement TEXT NOT NULL,
    situation TEXT,
    motivation TEXT,
    expected_outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CSD Matrices
CREATE TABLE IF NOT EXISTS public.csd_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Certeza', 'Suposição', 'Dúvida')),
    description TEXT NOT NULL,
    impact_level TEXT CHECK (impact_level IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- How Might We Questions
CREATE TABLE IF NOT EXISTS public.hmw_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    problem_statement TEXT,
    hmw_question TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('P1', 'P2', 'P3')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for all
ALTER TABLE public.jtbd_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csd_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hmw_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "owner_select_jtbd" ON public.jtbd_frameworks FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert_jtbd" ON public.jtbd_frameworks FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete_jtbd" ON public.jtbd_frameworks FOR DELETE TO authenticated USING (user_owns_project_id);

CREATE POLICY "owner_select_csd" ON public.csd_matrices FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert_csd" ON public.csd_matrices FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete_csd" ON public.csd_matrices FOR DELETE TO authenticated USING (user_owns_project_id);

CREATE POLICY "owner_select_hmw" ON public.hmw_questions FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert_hmw" ON public.hmw_questions FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete_hmw" ON public.hmw_questions FOR DELETE TO authenticated USING (user_owns_project_id);

-- Wait, fix RLS policy name helper (it's user_owns_project, not project_id)
DROP POLICY IF EXISTS "owner_delete_jtbd" ON public.jtbd_frameworks;
DROP POLICY IF EXISTS "owner_delete_csd" ON public.csd_matrices;
DROP POLICY IF EXISTS "owner_delete_hmw" ON public.hmw_questions;

CREATE POLICY "owner_delete_jtbd" ON public.jtbd_frameworks FOR DELETE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete_csd" ON public.csd_matrices FOR DELETE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete_hmw" ON public.hmw_questions FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- Triggers for updated_at
CREATE TRIGGER update_jtbd_updated_at BEFORE UPDATE ON public.jtbd_frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_csd_updated_at BEFORE UPDATE ON public.csd_matrices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hmw_updated_at BEFORE UPDATE ON public.hmw_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
