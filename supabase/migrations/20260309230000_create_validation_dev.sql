-- Create Validation & Development tables

-- 1. Nielsen Heuristics
CREATE TABLE IF NOT EXISTS public.nielsen_heuristics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    heuristic_name TEXT NOT NULL,
    evaluation_notes TEXT,
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Usability Tests
CREATE TABLE IF NOT EXISTS public.usability_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    success_rate_percentage INTEGER,
    user_feedback TEXT,
    key_observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WCAG Audits
CREATE TABLE IF NOT EXISTS public.wcag_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    guideline_reference TEXT NOT NULL,
    compliance_status TEXT CHECK (compliance_status IN ('Pass', 'Fail', 'Warning')),
    issue_description TEXT,
    fix_suggestion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QA Bugs
CREATE TABLE IF NOT EXISTS public.qa_bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    bug_title TEXT NOT NULL,
    steps_to_reproduce TEXT,
    severity TEXT CHECK (severity IN ('Baixa', 'Média', 'Alta', 'Crítica')),
    status TEXT CHECK (status IN ('Aberto', 'Em Análise', 'Resolvido')) DEFAULT 'Aberto',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nielsen_heuristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usability_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wcag_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_bugs ENABLE ROW LEVEL SECURITY;

-- Policies (assuming user_owns_project function exists from previous migrations)
CREATE POLICY "Users can manage nielsen_heuristics of their projects"
    ON public.nielsen_heuristics FOR ALL
    USING (user_owns_project(project_id));

CREATE POLICY "Users can manage usability_tests of their projects"
    ON public.usability_tests FOR ALL
    USING (user_owns_project(project_id));

CREATE POLICY "Users can manage wcag_audits of their projects"
    ON public.wcag_audits FOR ALL
    USING (user_owns_project(project_id));

CREATE POLICY "Users can manage qa_bugs of their projects"
    ON public.qa_bugs FOR ALL
    USING (user_owns_project(project_id));

-- Updated at triggers
CREATE TRIGGER set_updated_at_nielsen BEFORE UPDATE ON public.nielsen_heuristics FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_usability BEFORE UPDATE ON public.usability_tests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_wcag BEFORE UPDATE ON public.wcag_audits FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_qa BEFORE UPDATE ON public.qa_bugs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
