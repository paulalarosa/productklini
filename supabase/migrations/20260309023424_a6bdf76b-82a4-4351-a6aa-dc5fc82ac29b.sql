
-- Convert ALL restrictive policies to permissive across all tables

-- ============ projects ============
DROP POLICY IF EXISTS "owner_select" ON public.projects;
DROP POLICY IF EXISTS "owner_insert" ON public.projects;
DROP POLICY IF EXISTS "owner_update" ON public.projects;
DROP POLICY IF EXISTS "owner_delete" ON public.projects;
CREATE POLICY "owner_select" ON public.projects FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owner_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_update" ON public.projects FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owner_delete" ON public.projects FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ tasks ============
DROP POLICY IF EXISTS "owner_select" ON public.tasks;
DROP POLICY IF EXISTS "owner_insert" ON public.tasks;
DROP POLICY IF EXISTS "owner_update" ON public.tasks;
DROP POLICY IF EXISTS "owner_delete" ON public.tasks;
CREATE POLICY "owner_select" ON public.tasks FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.tasks FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.tasks FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ personas ============
DROP POLICY IF EXISTS "owner_select" ON public.personas;
DROP POLICY IF EXISTS "owner_insert" ON public.personas;
DROP POLICY IF EXISTS "owner_update" ON public.personas;
DROP POLICY IF EXISTS "owner_delete" ON public.personas;
CREATE POLICY "owner_select" ON public.personas FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.personas FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.personas FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.personas FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ ai_messages ============
DROP POLICY IF EXISTS "owner_select" ON public.ai_messages;
DROP POLICY IF EXISTS "owner_insert" ON public.ai_messages;
DROP POLICY IF EXISTS "owner_delete" ON public.ai_messages;
CREATE POLICY "owner_select" ON public.ai_messages FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ai_messages FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ai_messages FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ ux_metrics ============
DROP POLICY IF EXISTS "owner_select" ON public.ux_metrics;
DROP POLICY IF EXISTS "owner_insert" ON public.ux_metrics;
DROP POLICY IF EXISTS "owner_update" ON public.ux_metrics;
DROP POLICY IF EXISTS "owner_delete" ON public.ux_metrics;
CREATE POLICY "owner_select" ON public.ux_metrics FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ux_metrics FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ux_metrics FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ux_metrics FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ canvas_designs ============
DROP POLICY IF EXISTS "owner_select" ON public.canvas_designs;
DROP POLICY IF EXISTS "owner_insert" ON public.canvas_designs;
DROP POLICY IF EXISTS "owner_update" ON public.canvas_designs;
DROP POLICY IF EXISTS "owner_delete" ON public.canvas_designs;
CREATE POLICY "owner_select" ON public.canvas_designs FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.canvas_designs FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.canvas_designs FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.canvas_designs FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ canvas_versions ============
DROP POLICY IF EXISTS "owner_select" ON public.canvas_versions;
DROP POLICY IF EXISTS "owner_insert" ON public.canvas_versions;
DROP POLICY IF EXISTS "owner_delete" ON public.canvas_versions;
CREATE POLICY "owner_select" ON public.canvas_versions FOR SELECT TO authenticated USING (user_owns_design(design_id));
CREATE POLICY "owner_insert" ON public.canvas_versions FOR INSERT TO authenticated WITH CHECK (user_owns_design(design_id));
CREATE POLICY "owner_delete" ON public.canvas_versions FOR DELETE TO authenticated USING (user_owns_design(design_id));

-- ============ prototype_hotspots ============
DROP POLICY IF EXISTS "owner_select" ON public.prototype_hotspots;
DROP POLICY IF EXISTS "owner_insert" ON public.prototype_hotspots;
DROP POLICY IF EXISTS "owner_update" ON public.prototype_hotspots;
DROP POLICY IF EXISTS "owner_delete" ON public.prototype_hotspots;
CREATE POLICY "owner_select" ON public.prototype_hotspots FOR SELECT TO authenticated USING (user_owns_design(source_design_id));
CREATE POLICY "owner_insert" ON public.prototype_hotspots FOR INSERT TO authenticated WITH CHECK (user_owns_design(source_design_id));
CREATE POLICY "owner_update" ON public.prototype_hotspots FOR UPDATE TO authenticated USING (user_owns_design(source_design_id));
CREATE POLICY "owner_delete" ON public.prototype_hotspots FOR DELETE TO authenticated USING (user_owns_design(source_design_id));

-- ============ ui_components ============
DROP POLICY IF EXISTS "owner_select" ON public.ui_components;
DROP POLICY IF EXISTS "owner_insert" ON public.ui_components;
DROP POLICY IF EXISTS "owner_update" ON public.ui_components;
DROP POLICY IF EXISTS "owner_delete" ON public.ui_components;
CREATE POLICY "owner_select" ON public.ui_components FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ui_components FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ui_components FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ui_components FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ mcp_sync_logs ============
DROP POLICY IF EXISTS "owner_select" ON public.mcp_sync_logs;
DROP POLICY IF EXISTS "owner_insert" ON public.mcp_sync_logs;
DROP POLICY IF EXISTS "owner_delete" ON public.mcp_sync_logs;
CREATE POLICY "owner_select" ON public.mcp_sync_logs FOR SELECT TO authenticated USING (user_owns_component(component_id));
CREATE POLICY "owner_insert" ON public.mcp_sync_logs FOR INSERT TO authenticated WITH CHECK (user_owns_component(component_id));
CREATE POLICY "owner_delete" ON public.mcp_sync_logs FOR DELETE TO authenticated USING (user_owns_component(component_id));

-- ============ team_members ============
DROP POLICY IF EXISTS "owner_select" ON public.team_members;
DROP POLICY IF EXISTS "owner_insert" ON public.team_members;
DROP POLICY IF EXISTS "owner_update" ON public.team_members;
DROP POLICY IF EXISTS "owner_delete" ON public.team_members;
CREATE POLICY "owner_select" ON public.team_members FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.team_members FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.team_members FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.team_members FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ notifications ============
DROP POLICY IF EXISTS "owner_select" ON public.notifications;
DROP POLICY IF EXISTS "owner_insert" ON public.notifications;
DROP POLICY IF EXISTS "owner_update" ON public.notifications;
DROP POLICY IF EXISTS "owner_delete" ON public.notifications;
CREATE POLICY "owner_select" ON public.notifications FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.notifications FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.notifications FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ design_tokens ============
DROP POLICY IF EXISTS "owner_select" ON public.design_tokens;
DROP POLICY IF EXISTS "owner_insert" ON public.design_tokens;
DROP POLICY IF EXISTS "owner_update" ON public.design_tokens;
DROP POLICY IF EXISTS "owner_delete" ON public.design_tokens;
CREATE POLICY "owner_select" ON public.design_tokens FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.design_tokens FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.design_tokens FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.design_tokens FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ design_token_history ============
DROP POLICY IF EXISTS "owner_select" ON public.design_token_history;
DROP POLICY IF EXISTS "owner_insert" ON public.design_token_history;
DROP POLICY IF EXISTS "owner_delete" ON public.design_token_history;
CREATE POLICY "owner_select" ON public.design_token_history FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.design_token_history FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.design_token_history FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ ds_components ============
DROP POLICY IF EXISTS "owner_select" ON public.ds_components;
DROP POLICY IF EXISTS "owner_insert" ON public.ds_components;
DROP POLICY IF EXISTS "owner_update" ON public.ds_components;
DROP POLICY IF EXISTS "owner_delete" ON public.ds_components;
CREATE POLICY "owner_select" ON public.ds_components FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ds_components FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ds_components FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ds_components FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ project_documents ============
DROP POLICY IF EXISTS "owner_select" ON public.project_documents;
DROP POLICY IF EXISTS "owner_insert" ON public.project_documents;
DROP POLICY IF EXISTS "owner_update" ON public.project_documents;
DROP POLICY IF EXISTS "owner_delete" ON public.project_documents;
CREATE POLICY "owner_select" ON public.project_documents FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.project_documents FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.project_documents FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.project_documents FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ share_links ============
DROP POLICY IF EXISTS "owner_select" ON public.share_links;
DROP POLICY IF EXISTS "owner_insert" ON public.share_links;
DROP POLICY IF EXISTS "owner_update" ON public.share_links;
DROP POLICY IF EXISTS "owner_delete" ON public.share_links;
CREATE POLICY "owner_select" ON public.share_links FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.share_links FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.share_links FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.share_links FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ ux_patterns ============
DROP POLICY IF EXISTS "owner_select" ON public.ux_patterns;
DROP POLICY IF EXISTS "owner_insert" ON public.ux_patterns;
DROP POLICY IF EXISTS "owner_update" ON public.ux_patterns;
DROP POLICY IF EXISTS "owner_delete" ON public.ux_patterns;
CREATE POLICY "owner_select" ON public.ux_patterns FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ux_patterns FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ux_patterns FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ux_patterns FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ ux_research ============
DROP POLICY IF EXISTS "owner_select" ON public.ux_research;
DROP POLICY IF EXISTS "owner_insert" ON public.ux_research;
DROP POLICY IF EXISTS "owner_update" ON public.ux_research;
DROP POLICY IF EXISTS "owner_delete" ON public.ux_research;
CREATE POLICY "owner_select" ON public.ux_research FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ux_research FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ux_research FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ux_research FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ app_reviews ============
DROP POLICY IF EXISTS "owner_select" ON public.app_reviews;
DROP POLICY IF EXISTS "owner_insert" ON public.app_reviews;
DROP POLICY IF EXISTS "owner_update" ON public.app_reviews;
DROP POLICY IF EXISTS "owner_delete" ON public.app_reviews;
CREATE POLICY "owner_select" ON public.app_reviews FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.app_reviews FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.app_reviews FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.app_reviews FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ analytics_snapshots ============
DROP POLICY IF EXISTS "owner_select" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "owner_insert" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "owner_update" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "owner_delete" ON public.analytics_snapshots;
CREATE POLICY "owner_select" ON public.analytics_snapshots FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.analytics_snapshots FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.analytics_snapshots FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.analytics_snapshots FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ analytics_funnel ============
DROP POLICY IF EXISTS "owner_select" ON public.analytics_funnel;
DROP POLICY IF EXISTS "owner_insert" ON public.analytics_funnel;
DROP POLICY IF EXISTS "owner_update" ON public.analytics_funnel;
DROP POLICY IF EXISTS "owner_delete" ON public.analytics_funnel;
CREATE POLICY "owner_select" ON public.analytics_funnel FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.analytics_funnel FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.analytics_funnel FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.analytics_funnel FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ behavior_models ============
DROP POLICY IF EXISTS "owner_select" ON public.behavior_models;
DROP POLICY IF EXISTS "owner_insert" ON public.behavior_models;
DROP POLICY IF EXISTS "owner_update" ON public.behavior_models;
DROP POLICY IF EXISTS "owner_delete" ON public.behavior_models;
CREATE POLICY "owner_select" ON public.behavior_models FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.behavior_models FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.behavior_models FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.behavior_models FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ business_model_canvas ============
DROP POLICY IF EXISTS "owner_select" ON public.business_model_canvas;
DROP POLICY IF EXISTS "owner_insert" ON public.business_model_canvas;
DROP POLICY IF EXISTS "owner_update" ON public.business_model_canvas;
DROP POLICY IF EXISTS "owner_delete" ON public.business_model_canvas;
CREATE POLICY "owner_select" ON public.business_model_canvas FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.business_model_canvas FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.business_model_canvas FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.business_model_canvas FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ ab_experiments ============
DROP POLICY IF EXISTS "owner_all" ON public.ab_experiments;
CREATE POLICY "owner_select" ON public.ab_experiments FOR SELECT TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.ab_experiments FOR INSERT TO authenticated WITH CHECK (user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.ab_experiments FOR UPDATE TO authenticated USING (user_owns_project(project_id));
CREATE POLICY "owner_delete" ON public.ab_experiments FOR DELETE TO authenticated USING (user_owns_project(project_id));

-- ============ ab_results ============
DROP POLICY IF EXISTS "owner_select" ON public.ab_results;
DROP POLICY IF EXISTS "owner_insert" ON public.ab_results;
CREATE POLICY "owner_select" ON public.ab_results FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM ab_experiments WHERE ab_experiments.id = ab_results.experiment_id AND user_owns_project(ab_experiments.project_id)));
CREATE POLICY "owner_insert" ON public.ab_results FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM ab_experiments WHERE ab_experiments.id = ab_results.experiment_id AND user_owns_project(ab_experiments.project_id)));

-- ============ achievement_definitions ============
DROP POLICY IF EXISTS "public_select" ON public.achievement_definitions;
CREATE POLICY "public_select" ON public.achievement_definitions FOR SELECT TO authenticated USING (true);

-- ============ user_achievements ============
DROP POLICY IF EXISTS "owner_select" ON public.user_achievements;
DROP POLICY IF EXISTS "owner_insert" ON public.user_achievements;
CREATE POLICY "owner_select" ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid() AND user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND user_owns_project(project_id));

-- ============ user_points ============
DROP POLICY IF EXISTS "owner_select" ON public.user_points;
DROP POLICY IF EXISTS "owner_insert" ON public.user_points;
DROP POLICY IF EXISTS "owner_update" ON public.user_points;
CREATE POLICY "owner_select" ON public.user_points FOR SELECT TO authenticated USING (user_id = auth.uid() AND user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.user_points FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.user_points FOR UPDATE TO authenticated USING (user_id = auth.uid() AND user_owns_project(project_id));

-- ============ user_progress ============
DROP POLICY IF EXISTS "owner_select" ON public.user_progress;
DROP POLICY IF EXISTS "owner_insert" ON public.user_progress;
DROP POLICY IF EXISTS "owner_update" ON public.user_progress;
CREATE POLICY "owner_select" ON public.user_progress FOR SELECT TO authenticated USING (user_id = auth.uid() AND user_owns_project(project_id));
CREATE POLICY "owner_insert" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND user_owns_project(project_id));
CREATE POLICY "owner_update" ON public.user_progress FOR UPDATE TO authenticated USING (user_id = auth.uid() AND user_owns_project(project_id));
