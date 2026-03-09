
-- Migration: Create IA & UX Writing tables
-- Date: 2026-03-09 22:00:00

-- Sitemaps
CREATE TABLE IF NOT EXISTS public.sitemaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.sitemaps(id) ON DELETE CASCADE,
    node_name TEXT NOT NULL,
    url_path TEXT,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Card Sorting
CREATE TABLE IF NOT EXISTS public.card_sorting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    items TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tone of Voice
CREATE TABLE IF NOT EXISTS public.tone_of_voice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    personality_traits JSONB DEFAULT '[]',
    do_say TEXT[] DEFAULT '{}',
    dont_say TEXT[] DEFAULT '{}',
    brand_archetype TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Microcopy Inventory
CREATE TABLE IF NOT EXISTS public.microcopy_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    component_type TEXT NOT NULL, -- botão, erro, modal, etc
    context TEXT,
    original_text TEXT,
    suggested_copy TEXT NOT NULL,
    tone_applied TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_sorting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tone_of_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microcopy_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "owner_select_sitemap" ON public.sitemaps FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert_sitemap" ON public.sitemaps FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete_sitemap" ON public.sitemaps FOR DELETE TO authenticated USING (user_owns_project(project_id));

CREATE POLICY "owner_select_cardsort" ON public.card_sorting FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert_cardsort" ON public.card_sorting FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete_cardsort" ON public.card_sorting FOR DELETE TO authenticated USING (user_owns_project(project_id));

CREATE POLICY "owner_select_tone" ON public.tone_of_voice FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert_tone" ON public.tone_of_voice FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete_tone" ON public.tone_of_voice FOR DELETE TO authenticated USING (user_owns_project(project_id));

CREATE POLICY "owner_select_microcopy" ON public.microcopy_inventory FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert_microcopy" ON public.microcopy_inventory FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete_microcopy" ON public.microcopy_inventory FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- Triggers
CREATE TRIGGER update_sitemaps_updated_at BEFORE UPDATE ON public.sitemaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_sorting_updated_at BEFORE UPDATE ON public.card_sorting FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tone_of_voice_updated_at BEFORE UPDATE ON public.tone_of_voice FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_microcopy_inventory_updated_at BEFORE UPDATE ON public.microcopy_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
