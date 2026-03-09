
-- Migration: Create benchmarks table
-- Creation Date: 2026-03-09 20:00:00

CREATE TABLE IF NOT EXISTS public.benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    competitors JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    insights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

-- Add Permissions
CREATE POLICY "owner_select" ON public.benchmarks FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.benchmarks FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.benchmarks FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.benchmarks FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- Trigger for updated_at
CREATE TRIGGER update_benchmarks_updated_at
    BEFORE UPDATE ON public.benchmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
