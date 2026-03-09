
-- Migration: Create empathy_maps table
-- Creation Date: 2026-03-09 19:00:00

CREATE TABLE IF NOT EXISTS public.empathy_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    persona_name TEXT,
    thinks_and_feels JSONB DEFAULT '[]'::jsonb,
    hears JSONB DEFAULT '[]'::jsonb,
    sees JSONB DEFAULT '[]'::jsonb,
    says_and_does JSONB DEFAULT '[]'::jsonb,
    pains JSONB DEFAULT '[]'::jsonb,
    gains JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.empathy_maps ENABLE ROW LEVEL SECURITY;

-- Add Permissions
CREATE POLICY "owner_select" ON public.empathy_maps FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.empathy_maps FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.empathy_maps FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.empathy_maps FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empathy_maps_updated_at
    BEFORE UPDATE ON public.empathy_maps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
