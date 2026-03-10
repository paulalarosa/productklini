-- ================================================================
-- CONSOLIDATED MIGRATION: All structured AI tool tables
-- Run this in Supabase SQL Editor if tables don't exist
-- Date: 2026-03-10
-- ================================================================

-- Helper: Ensure update_updated_at_column exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================================
-- 1. EMPATHY MAPS
-- ================================================================
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

ALTER TABLE public.empathy_maps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='empathy_maps' AND policyname='owner_all_empathy_maps') THEN
    CREATE POLICY "owner_all_empathy_maps" ON public.empathy_maps FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = empathy_maps.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = empathy_maps.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 2. BENCHMARKS
-- ================================================================
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

ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='benchmarks' AND policyname='owner_all_benchmarks') THEN
    CREATE POLICY "owner_all_benchmarks" ON public.benchmarks FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = benchmarks.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = benchmarks.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 3. JTBD FRAMEWORKS
-- ================================================================
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

ALTER TABLE public.jtbd_frameworks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='jtbd_frameworks' AND policyname='owner_all_jtbd') THEN
    CREATE POLICY "owner_all_jtbd" ON public.jtbd_frameworks FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = jtbd_frameworks.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = jtbd_frameworks.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 4. CSD MATRICES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.csd_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Certeza', 'Suposição', 'Dúvida')),
    description TEXT NOT NULL,
    impact_level TEXT CHECK (impact_level IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.csd_matrices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='csd_matrices' AND policyname='owner_all_csd') THEN
    CREATE POLICY "owner_all_csd" ON public.csd_matrices FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = csd_matrices.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = csd_matrices.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 5. HMW QUESTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.hmw_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    problem_statement TEXT,
    hmw_question TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('P1', 'P2', 'P3')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hmw_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hmw_questions' AND policyname='owner_all_hmw') THEN
    CREATE POLICY "owner_all_hmw" ON public.hmw_questions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = hmw_questions.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = hmw_questions.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 6. SITEMAPS
-- ================================================================
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

ALTER TABLE public.sitemaps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sitemaps' AND policyname='owner_all_sitemaps') THEN
    CREATE POLICY "owner_all_sitemaps" ON public.sitemaps FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = sitemaps.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = sitemaps.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 7. CARD SORTING
-- ================================================================
CREATE TABLE IF NOT EXISTS public.card_sorting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    items TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.card_sorting ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='card_sorting' AND policyname='owner_all_cardsort') THEN
    CREATE POLICY "owner_all_cardsort" ON public.card_sorting FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = card_sorting.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = card_sorting.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 8. TONE OF VOICE
-- ================================================================
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

ALTER TABLE public.tone_of_voice ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tone_of_voice' AND policyname='owner_all_tone') THEN
    CREATE POLICY "owner_all_tone" ON public.tone_of_voice FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = tone_of_voice.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = tone_of_voice.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 9. MICROCOPY INVENTORY
-- ================================================================
CREATE TABLE IF NOT EXISTS public.microcopy_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    context TEXT,
    original_text TEXT,
    suggested_copy TEXT NOT NULL,
    tone_applied TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.microcopy_inventory ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='microcopy_inventory' AND policyname='owner_all_microcopy') THEN
    CREATE POLICY "owner_all_microcopy" ON public.microcopy_inventory FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = microcopy_inventory.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = microcopy_inventory.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 10. NIELSEN HEURISTICS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.nielsen_heuristics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    heuristic_name TEXT NOT NULL,
    evaluation_notes TEXT,
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.nielsen_heuristics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nielsen_heuristics' AND policyname='owner_all_nielsen') THEN
    CREATE POLICY "owner_all_nielsen" ON public.nielsen_heuristics FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = nielsen_heuristics.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = nielsen_heuristics.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 11. USABILITY TESTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.usability_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    success_rate_percentage INTEGER,
    user_feedback TEXT,
    key_observations TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.usability_tests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usability_tests' AND policyname='owner_all_usability') THEN
    CREATE POLICY "owner_all_usability" ON public.usability_tests FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = usability_tests.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = usability_tests.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 12. WCAG AUDITS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.wcag_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    guideline_reference TEXT NOT NULL,
    compliance_status TEXT CHECK (compliance_status IN ('Pass', 'Fail', 'Warning')),
    issue_description TEXT,
    fix_suggestion TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wcag_audits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wcag_audits' AND policyname='owner_all_wcag') THEN
    CREATE POLICY "owner_all_wcag" ON public.wcag_audits FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = wcag_audits.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = wcag_audits.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- 13. QA BUGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.qa_bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    bug_title TEXT NOT NULL,
    steps_to_reproduce TEXT,
    severity TEXT CHECK (severity IN ('Baixa', 'Média', 'Alta', 'Crítica')),
    status TEXT CHECK (status IN ('Aberto', 'Em Análise', 'Resolvido')) DEFAULT 'Aberto',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.qa_bugs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='qa_bugs' AND policyname='owner_all_qa_bugs') THEN
    CREATE POLICY "owner_all_qa_bugs" ON public.qa_bugs FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.projects WHERE id = qa_bugs.project_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = qa_bugs.project_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ================================================================
-- REALTIME: Enable realtime for key tables
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE empathy_maps;
ALTER PUBLICATION supabase_realtime ADD TABLE benchmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE jtbd_frameworks;
ALTER PUBLICATION supabase_realtime ADD TABLE csd_matrices;
ALTER PUBLICATION supabase_realtime ADD TABLE hmw_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE sitemaps;
ALTER PUBLICATION supabase_realtime ADD TABLE card_sorting;
ALTER PUBLICATION supabase_realtime ADD TABLE tone_of_voice;
ALTER PUBLICATION supabase_realtime ADD TABLE microcopy_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE nielsen_heuristics;
ALTER PUBLICATION supabase_realtime ADD TABLE usability_tests;
ALTER PUBLICATION supabase_realtime ADD TABLE wcag_audits;
ALTER PUBLICATION supabase_realtime ADD TABLE qa_bugs;
