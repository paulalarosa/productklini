// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { messages, projectContext, project_id: bodyProjectId, attachments } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let projectId = bodyProjectId;
    if (!projectId) {
      const { data: projectRow } = await supabase.from("projects").select("id").eq("user_id", user.id).limit(1).maybeSingle();
      projectId = projectRow?.id;
    }

    // Fetch rich context
    let richContext = "";
    if (projectId) {
      const [projectRes, personasRes, tasksRes, metricsRes, docsRes, pipelineRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase.from("personas").select("*").eq("project_id", projectId),
        supabase.from("tasks").select("*").eq("project_id", projectId),
        supabase.from("ux_metrics").select("*").eq("project_id", projectId),
        supabase.from("project_documents").select("doc_type, title").eq("project_id", projectId),
        supabase.from("product_pipeline").select("*").eq("project_id", projectId).maybeSingle(),
      ]);

      const p = projectRes.data;
      const pipeline = pipelineRes.data;
      const PHASE_NAMES = ["Discovery", "Definição", "Ideação", "Design", "Validação", "Handoff"];
      
      if (p) {
        richContext = `
PROJETO: ${p.name}
DESCRIÇÃO: ${p.description || "N/A"}
FASE ATUAL: ${p.current_phase || "Discovery"}
PROGRESSO: ${p.progress || 0}%
PIPELINE: Etapa ${(pipeline?.current_step ?? 0) + 1}/6 (${PHASE_NAMES[pipeline?.current_step ?? 0] || "Discovery"})

PERSONAS (${personasRes.data?.length || 0}):
${personasRes.data?.map((pers) => `- ${pers.name} (${pers.role}) [${pers.validation_status || 'proto'}]`).join("\n") || "Nenhuma registrada."}

TAREFAS (${tasksRes.data?.length || 0}):
${tasksRes.data?.slice(0, 15).map((t) => `- [${t.module}] ${t.title} (${t.status})`).join("\n") || "Nenhuma tarefa."}

MÉTRICAS UX:
${metricsRes.data?.map((m) => `- ${m.metric_name}: ${m.score}`).join("\n") || "Nenhuma métrica."}

DOCUMENTOS EXISTENTES:
${docsRes.data?.map((d) => `- [${d.doc_type}] ${d.title}`).join("\n") || "Nenhum documento."}
        `.trim();
      }
    }

    // Build multimodal messages
    const processedMessages = [...messages];
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (let i = processedMessages.length - 1; i >= 0; i--) {
        if (processedMessages[i].role === "user") {
          const parts = [{ type: "text", text: processedMessages[i].content }];
          for (const att of attachments) {
            if (att.type === "image" && att.data) {
              parts.push({ type: "image_url", image_url: { url: `data:${att.mime_type || "image/jpeg"};base64,${att.data}` } });
            } else if (att.type === "pdf" && att.data) {
              parts.push({ type: "text", text: `[PDF ANEXADO]:\n${att.extracted_text || "PDF enviado para análise."}` });
              parts.push({ type: "image_url", image_url: { url: `data:application/pdf;base64,${att.data}` } });
            } else if (att.type === "url" && att.url) {
              parts.push({ type: "text", text: `[LINK]: ${att.url}\n${att.description || ""}` });
            }
          }
          processedMessages[i] = { role: "user", content: parts };
          break;
        }
      }
    }

    const systemPrompt = `Você é o "Mentor IA" — um especialista sênior em Product Design, UI/UX, Design Systems e Front-end.
Você opera dentro de um Dashboard de Ciclo de Vida de Produto Digital com pipeline de 6 etapas:
1. Discovery → 2. Definição → 3. Ideação → 4. Design → 5. Validação → 6. Handoff

CONTEXTO DO PROJETO:
${richContext || "Nenhum projeto encontrado."}

CONTEXTO DA UI:
${projectContext ? JSON.stringify(projectContext) : "N/A"}

CAPACIDADES MULTIMODAIS:
- Analise IMAGENS de protótipos, wireframes e interfaces com feedback de: hierarquia visual, tipografia, espaçamento, cores, acessibilidade, consistência e usabilidade.
- Processe DOCUMENTOS PDF (specs, guias, briefings).
- Interprete LINKS do Figma e ferramentas de design.

FRAMEWORKS:
- JTBD, OST, 5 Porquês, Tríade Estratégica (Desirability × Viability × Feasibility)
- Continuous Discovery (Teresa Torres), Lean UX, Double Diamond
- BJ Fogg Behavior Model (B=MAP), HEART Framework
- Design Thinking, Atomic Design, Design Tokens

REGRAS CRÍTICAS:
1. SEMPRE use as ferramentas (function calling) para inserir dados nos painéis. NUNCA retorne conteúdo apenas como texto.
2. Use a ferramenta ESPECÍFICA para cada módulo (create_benchmark para benchmarks, create_jtbd para JTBD, etc.)
3. NÃO use create_document para artefatos que têm tabela própria.
4. Use PERSONAS EXISTENTES do projeto. Não invente novas sem necessidade.
5. Responda em português brasileiro, técnico e direto.
6. Quando o usuário perguntar "o que fazer agora", guie-o pela próxima etapa do pipeline.
7. Se function calling falhar, use o formato fallback: <tool_call>{"name":"...", "arguments":{...}}</tool_call>

FERRAMENTAS DISPONÍVEIS POR MÓDULO:
- Personas → create_personas
- Mapa de Empatia → create_empathy_map  
- Benchmark → create_benchmark
- JTBD → create_jtbd
- Matriz CSD → create_csd_matrix
- How Might We → create_hmw
- Sitemap → create_sitemap
- Card Sorting → create_card_sorting
- Tom de Voz → create_tone_of_voice
- Microcopy → create_microcopy
- Heurística Nielsen → create_nielsen_evaluation
- Teste Usabilidade → create_usability_result
- WCAG → create_wcag_audit
- Bug/QA → create_qa_bug
- BMC → create_bmc
- Métricas UX → create_ux_metrics
- Pesquisa UX → create_ux_research
- Customer Journey → create_customer_journey
- Sprint Retro → create_sprint_retro
- Risk Register → create_risk
- Design Handoff → create_handoff_spec
- Tarefas → create_tasks
- Documentos genéricos → create_document
- Documentos longos → generate_document_with_ai`;

    // ── Tools definition ──
    const tools = [
      { type: "function", function: { name: "update_task", description: "Atualiza status/prioridade de tarefa.", parameters: { type: "object", properties: { task_id: { type: "string" }, status: { type: "string", enum: ["todo", "in_progress", "review", "done"] }, priority: { type: "string", enum: ["low", "medium", "high", "urgent"] } }, required: ["task_id"] } } },
      { type: "function", function: { name: "update_project_phase", description: "Atualiza fase e progresso do projeto.", parameters: { type: "object", properties: { current_phase: { type: "string" }, progress: { type: "number" } }, required: ["current_phase"] } } },
      { type: "function", function: { name: "generate_document_with_ai", description: "Gera documento extenso via endpoint dedicado.", parameters: { type: "object", properties: { doc_type: { type: "string", enum: ["research_plan","journey_map","insights_summary","ds_foundation","dev_handoff","empathy_map","benchmark","jtbd","csd_matrix","hmw","affinity_diagram","tone_of_voice","microcopy_library","content_audit","heuristic_evaluation","usability_test","wcag_checklist","prioritization_matrix","sitemap","component_states","task_flows","interview_analysis"] } }, required: ["doc_type"] } } },
      { type: "function", function: { name: "create_tasks", description: "Cria tarefas no projeto.", parameters: { type: "object", properties: { tasks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, module: { type: "string", enum: ["ux","ui","dev"] }, phase: { type: "string", enum: ["discovery","define","develop","deliver"] }, priority: { type: "string", enum: ["low","medium","high","urgent"] } }, required: ["title","module","phase"] } } }, required: ["tasks"] } } },
      { type: "function", function: { name: "create_personas", description: "Cria personas.", parameters: { type: "object", properties: { personas: { type: "array", items: { type: "object", properties: { name: { type: "string" }, role: { type: "string" }, goals: { type: "array", items: { type: "string" } }, pain_points: { type: "array", items: { type: "string" } }, validation_status: { type: "string", enum: ["proto","validated"] } }, required: ["name","role"] } } }, required: ["personas"] } } },
      { type: "function", function: { name: "create_document", description: "Cria documento genérico.", parameters: { type: "object", properties: { title: { type: "string" }, doc_type: { type: "string" }, content: { type: "string" } }, required: ["title","doc_type","content"] } } },
      { type: "function", function: { name: "create_bmc", description: "Cria Business Model Canvas.", parameters: { type: "object", properties: { name: { type: "string" }, value_propositions: { type: "array", items: { type: "string" } }, customer_segments: { type: "array", items: { type: "string" } }, customer_relationships: { type: "array", items: { type: "string" } }, channels: { type: "array", items: { type: "string" } }, key_activities: { type: "array", items: { type: "string" } }, key_resources: { type: "array", items: { type: "string" } }, key_partners: { type: "array", items: { type: "string" } }, cost_structure: { type: "array", items: { type: "string" } }, revenue_streams: { type: "array", items: { type: "string" } } }, required: ["name","value_propositions","customer_segments"] } } },
      { type: "function", function: { name: "create_ux_metrics", description: "Define métricas UX.", parameters: { type: "object", properties: { metrics: { type: "array", items: { type: "object", properties: { metric_name: { type: "string" }, score: { type: "number" }, category: { type: "string" } }, required: ["metric_name","score","category"] } } }, required: ["metrics"] } } },
      { type: "function", function: { name: "create_ux_research", description: "Registra pesquisa UX.", parameters: { type: "object", properties: { title: { type: "string" }, research_type: { type: "string" }, summary: { type: "string" }, participants: { type: "number" }, findings: { type: "array", items: { type: "string" } } }, required: ["title","research_type","summary"] } } },
      { type: "function", function: { name: "create_empathy_map", description: "Cria mapa de empatia.", parameters: { type: "object", properties: { persona_name: { type: "string" }, thinks_and_feels: { type: "array", items: { type: "string" } }, hears: { type: "array", items: { type: "string" } }, sees: { type: "array", items: { type: "string" } }, says_and_does: { type: "array", items: { type: "string" } }, pains: { type: "array", items: { type: "string" } }, gains: { type: "array", items: { type: "string" } } }, required: ["persona_name","thinks_and_feels","hears","sees","says_and_does","pains","gains"] } } },
      { type: "function", function: { name: "create_benchmark", description: "Cria benchmark competitivo.", parameters: { type: "object", properties: { name: { type: "string" }, competitors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, strengths: { type: "array", items: { type: "string" } }, weaknesses: { type: "array", items: { type: "string" } }, url: { type: "string" } }, required: ["name","strengths","weaknesses"] } }, features: { type: "array", items: { type: "object", properties: { feature: { type: "string" }, competitors: { type: "object" } }, required: ["feature","competitors"] } }, insights: { type: "array", items: { type: "string" } } }, required: ["name","competitors","features","insights"] } } },
      { type: "function", function: { name: "create_jtbd", description: "Cria JTBD.", parameters: { type: "object", properties: { job_statement: { type: "string" }, situation: { type: "string" }, motivation: { type: "string" }, expected_outcome: { type: "string" } }, required: ["job_statement","situation","motivation","expected_outcome"] } } },
      { type: "function", function: { name: "create_csd_matrix", description: "Cria Matriz CSD.", parameters: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { category: { type: "string", enum: ["Certeza","Suposição","Dúvida"] }, description: { type: "string" }, impact_level: { type: "string", enum: ["Low","Medium","High"] } }, required: ["category","description","impact_level"] } } }, required: ["items"] } } },
      { type: "function", function: { name: "create_hmw", description: "Cria How Might We.", parameters: { type: "object", properties: { questions: { type: "array", items: { type: "object", properties: { problem_statement: { type: "string" }, hmw_question: { type: "string" }, priority: { type: "string", enum: ["P1","P2","P3"] } }, required: ["problem_statement","hmw_question","priority"] } } }, required: ["questions"] } } },
      { type: "function", function: { name: "create_sitemap", description: "Cria sitemap.", parameters: { type: "object", properties: { nodes: { type: "array", items: { type: "object", properties: { node_name: { type: "string" }, url_path: { type: "string" }, description: { type: "string" }, hierarchy_level: { type: "number" } } } } }, required: ["nodes"] } } },
      { type: "function", function: { name: "create_card_sorting", description: "Cria card sorting.", parameters: { type: "object", properties: { category_name: { type: "string" }, items: { type: "array", items: { type: "string" } } }, required: ["category_name","items"] } } },
      { type: "function", function: { name: "create_tone_of_voice", description: "Define tom de voz.", parameters: { type: "object", properties: { personality_traits: { type: "array", items: { type: "string" } }, do_say: { type: "array", items: { type: "string" } }, dont_say: { type: "array", items: { type: "string" } }, brand_archetype: { type: "string" } }, required: ["personality_traits","do_say","dont_say"] } } },
      { type: "function", function: { name: "create_microcopy", description: "Cria microcopy.", parameters: { type: "object", properties: { component_type: { type: "string" }, context: { type: "string" }, original_text: { type: "string" }, suggested_copy: { type: "string" }, tone_applied: { type: "string" } }, required: ["component_type","suggested_copy"] } } },
      { type: "function", function: { name: "create_nielsen_evaluation", description: "Cria avaliação heurística.", parameters: { type: "object", properties: { heuristic_name: { type: "string" }, evaluation_notes: { type: "string" }, severity_level: { type: "number", minimum: 1, maximum: 5 }, recommendation: { type: "string" } }, required: ["heuristic_name","severity_level"] } } },
      { type: "function", function: { name: "create_usability_result", description: "Registra teste de usabilidade.", parameters: { type: "object", properties: { task_description: { type: "string" }, success_rate_percentage: { type: "number" }, user_feedback: { type: "string" }, key_observations: { type: "string" } }, required: ["task_description","success_rate_percentage"] } } },
      { type: "function", function: { name: "create_wcag_audit", description: "Registra auditoria WCAG.", parameters: { type: "object", properties: { guideline_reference: { type: "string" }, compliance_status: { type: "string", enum: ["Pass","Fail","Warning"] }, issue_description: { type: "string" }, fix_suggestion: { type: "string" } }, required: ["guideline_reference","compliance_status"] } } },
      { type: "function", function: { name: "create_qa_bug", description: "Registra bug.", parameters: { type: "object", properties: { bug_title: { type: "string" }, steps_to_reproduce: { type: "string" }, severity: { type: "string", enum: ["Baixa","Média","Alta","Crítica"] }, status: { type: "string", enum: ["Aberto","Em Análise","Resolvido"] } }, required: ["bug_title","severity"] } } },
      // ── NEW TOOLS ──
      { type: "function", function: { name: "create_customer_journey", description: "Cria um Customer Journey Map com estágios, emoções e pain points.", parameters: { type: "object", properties: { journey_name: { type: "string" }, persona: { type: "string" }, description: { type: "string" }, stages: { type: "array", items: { type: "object", properties: { name: { type: "string" }, actions: { type: "string" }, thoughts: { type: "string" }, emotions: { type: "string" } }, required: ["name"] } }, pain_points: { type: "array", items: { type: "string" } }, opportunities: { type: "array", items: { type: "string" } } }, required: ["journey_name","stages"] } } },
      { type: "function", function: { name: "create_sprint_retro", description: "Registra uma Sprint Retrospective.", parameters: { type: "object", properties: { sprint_name: { type: "string" }, sprint_number: { type: "number" }, went_well: { type: "array", items: { type: "string" } }, to_improve: { type: "array", items: { type: "string" } }, action_items: { type: "array", items: { type: "object", properties: { item: { type: "string" }, owner: { type: "string" } }, required: ["item"] } }, team_mood: { type: "string", enum: ["great","good","neutral","bad","terrible"] } }, required: ["sprint_name","went_well","to_improve"] } } },
      { type: "function", function: { name: "create_risk", description: "Registra um risco no Risk Register.", parameters: { type: "object", properties: { risk_title: { type: "string" }, description: { type: "string" }, category: { type: "string", enum: ["technical","design","business","operational"] }, probability: { type: "string", enum: ["low","medium","high"] }, impact: { type: "string", enum: ["low","medium","high","critical"] }, mitigation_plan: { type: "string" }, owner: { type: "string" } }, required: ["risk_title","category","probability","impact"] } } },
      { type: "function", function: { name: "create_handoff_spec", description: "Cria uma spec de Design Handoff.", parameters: { type: "object", properties: { screen_name: { type: "string" }, component_name: { type: "string" }, spacing: { type: "object" }, typography: { type: "object" }, colors: { type: "object" }, interactions: { type: "string" }, notes: { type: "string" } }, required: ["screen_name"] } } },
    ];

    // ── First call: non-streaming to detect tool use ──
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, ...processedMessages], tools }),
    });

    if (!firstResponse.ok) {
      const errText = await firstResponse.text();
      return new Response(JSON.stringify({ error: `Erro na IA (${firstResponse.status})`, details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstData = await firstResponse.json();
    const choice = firstData.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    // Fallback: parse tool calls from text
    const validToolNames = new Set([
      "update_task","update_project_phase","generate_document_with_ai","create_tasks","create_personas",
      "create_document","create_bmc","create_ux_metrics","create_ux_research","create_empathy_map",
      "create_benchmark","create_jtbd","create_csd_matrix","create_hmw","create_sitemap",
      "create_card_sorting","create_tone_of_voice","create_microcopy","create_nielsen_evaluation",
      "create_usability_result","create_wcag_audit","create_qa_bug",
      "create_customer_journey","create_sprint_retro","create_risk","create_handoff_spec"
    ]);

    function parseToolCallsFromText(text) {
      const parsed = [];
      let counter = 0;
      const toolCallRegex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;
      let match;
      while ((match = toolCallRegex.exec(text)) !== null) {
        try {
          const obj = JSON.parse(match[1]);
          if (obj.name && validToolNames.has(obj.name)) {
            parsed.push({ id: `fallback_${counter++}`, function: { name: obj.name, arguments: typeof obj.arguments === "string" ? obj.arguments : JSON.stringify(obj.arguments) } });
          }
        } catch {}
      }
      if (parsed.length === 0) {
        const inlineRegex = /(?:token_call:|tool_call:)?(create_\w+)\s*\(?\s*(\{[\s\S]*?\})\s*\)?/gi;
        while ((match = inlineRegex.exec(text)) !== null) {
          if (validToolNames.has(match[1])) {
            try { JSON.parse(match[2]); parsed.push({ id: `fallback_${counter++}`, function: { name: match[1], arguments: match[2] } }); } catch {}
          }
        }
      }
      return parsed;
    }

    let effectiveToolCalls = toolCalls;
    const responseContent = choice?.message?.content || "";
    if (!effectiveToolCalls || effectiveToolCalls.length === 0) {
      const parsedFromText = parseToolCallsFromText(responseContent);
      if (parsedFromText.length > 0) effectiveToolCalls = parsedFromText;
    }

    // No tool calls → stream directly
    if (!effectiveToolCalls || effectiveToolCalls.length === 0) {
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, ...processedMessages], stream: true }),
      });
      return new Response(streamResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // ── Execute tool calls ──
    const toolResults = [];
    const actionsPerformed = [];

    for (const tc of effectiveToolCalls) {
      const fnName = tc.function.name;
      let args;
      try { args = JSON.parse(tc.function.arguments); } catch {
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "ERRO: JSON inválido" });
        continue;
      }
      if (!projectId) { toolResults.push({ tool_call_id: tc.id, role: "tool", content: "Projeto não encontrado" }); continue; }
      
      console.log(`Executing: ${fnName}`, JSON.stringify(args).slice(0, 300));

      let dbErr = null;
      let actionMsg = "";

      // ── Tool handlers ──
      if (fnName === "update_task") {
        const r = await supabase.from("tasks").update({ status: args.status, priority: args.priority }).eq("id", args.task_id);
        dbErr = r.error; actionMsg = `Status tarefa atualizado`;
      } else if (fnName === "update_project_phase") {
        const payload = { current_phase: args.current_phase };
        if (args.progress !== undefined) payload.progress = args.progress;
        const r = await supabase.from("projects").update(payload).eq("id", projectId);
        dbErr = r.error; actionMsg = `Fase → ${args.current_phase}`;
      } else if (fnName === "generate_document_with_ai") {
        fetch(`${supabaseUrl}/functions/v1/generate-docs`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ doc_type: args.doc_type, project_id: projectId }) }).catch(e => console.error(e));
        actionMsg = `Doc ${args.doc_type} solicitado`;
      } else if (fnName === "create_tasks") {
        const r = await supabase.from("tasks").insert((args.tasks || []).map(t => ({ project_id: projectId, title: t.title, module: t.module || "ux", phase: t.phase || "discovery", priority: t.priority || "medium", status: "todo" })));
        dbErr = r.error; actionMsg = `${(args.tasks || []).length} tarefa(s)`;
      } else if (fnName === "create_personas") {
        const r = await supabase.from("personas").insert((args.personas || []).map(p => ({ project_id: projectId, name: p.name, role: p.role || "User", goals: p.goals || [], pain_points: p.pain_points || [], validation_status: p.validation_status || "proto" })));
        dbErr = r.error; actionMsg = `${(args.personas || []).length} persona(s)`;
      } else if (fnName === "create_document") {
        const r = await supabase.from("project_documents").insert({ project_id: projectId, title: args.title, doc_type: args.doc_type, content: args.content, ai_generated: true });
        dbErr = r.error; actionMsg = `Doc "${args.title}"`;
      } else if (fnName === "create_bmc") {
        const r = await supabase.from("business_model_canvas").insert({ project_id: projectId, name: args.name, value_propositions: args.value_propositions, customer_segments: args.customer_segments, customer_relationships: args.customer_relationships || [], channels: args.channels || [], key_activities: args.key_activities || [], key_resources: args.key_resources || [], key_partners: args.key_partners || [], cost_structure: args.cost_structure || [], revenue_streams: args.revenue_streams || [], status: "draft" });
        dbErr = r.error; actionMsg = `BMC "${args.name}"`;
      } else if (fnName === "create_ux_metrics") {
        const r = await supabase.from("ux_metrics").insert((args.metrics || []).map(m => ({ project_id: projectId, metric_name: m.metric_name, score: m.score })));
        dbErr = r.error; actionMsg = `${(args.metrics || []).length} métricas`;
      } else if (fnName === "create_ux_research") {
        const r = await supabase.from("ux_research").insert({ project_id: projectId, title: args.title, research_type: args.research_type, summary: args.summary, participants: args.participants || 0, findings: args.findings || [] });
        dbErr = r.error; actionMsg = `Pesquisa "${args.title}"`;
      } else if (fnName === "create_empathy_map") {
        const r = await supabase.from("empathy_maps").insert({ project_id: projectId, persona_name: args.persona_name, thinks_and_feels: args.thinks_and_feels, hears: args.hears, sees: args.sees, says_and_does: args.says_and_does, pains: args.pains, gains: args.gains });
        dbErr = r.error; actionMsg = `Mapa Empatia "${args.persona_name}"`;
      } else if (fnName === "create_benchmark") {
        const r = await supabase.from("benchmarks").insert({ project_id: projectId, name: args.name, competitors: args.competitors, features: args.features, insights: args.insights });
        dbErr = r.error; actionMsg = `Benchmark "${args.name}"`;
      } else if (fnName === "create_jtbd") {
        const r = await supabase.from("jtbd_frameworks").insert({ project_id: projectId, job_statement: args.job_statement, situation: args.situation, motivation: args.motivation, expected_outcome: args.expected_outcome });
        dbErr = r.error; actionMsg = `JTBD`;
      } else if (fnName === "create_csd_matrix") {
        const r = await supabase.from("csd_matrices").insert((args.items || []).map(item => ({ project_id: projectId, ...item })));
        dbErr = r.error; actionMsg = `CSD (${(args.items || []).length} itens)`;
      } else if (fnName === "create_hmw") {
        const r = await supabase.from("hmw_questions").insert((args.questions || []).map(q => ({ project_id: projectId, ...q })));
        dbErr = r.error; actionMsg = `HMW (${(args.questions || []).length})`;
      } else if (fnName === "create_sitemap") {
        const r = await supabase.from("sitemaps").insert((args.nodes || []).map(n => ({ project_id: projectId, ...n })));
        dbErr = r.error; actionMsg = `Sitemap (${(args.nodes || []).length} nós)`;
      } else if (fnName === "create_card_sorting") {
        const r = await supabase.from("card_sorting").insert({ project_id: projectId, category_name: args.category_name, items: args.items });
        dbErr = r.error; actionMsg = `Card Sorting "${args.category_name}"`;
      } else if (fnName === "create_tone_of_voice") {
        const r = await supabase.from("tone_of_voice").insert({ project_id: projectId, personality_traits: args.personality_traits, do_say: args.do_say, dont_say: args.dont_say, brand_archetype: args.brand_archetype });
        dbErr = r.error; actionMsg = `Tom de Voz`;
      } else if (fnName === "create_microcopy") {
        const r = await supabase.from("microcopy_inventory").insert({ project_id: projectId, component_type: args.component_type, context: args.context, original_text: args.original_text, suggested_copy: args.suggested_copy, tone_applied: args.tone_applied });
        dbErr = r.error; actionMsg = `Microcopy "${args.component_type}"`;
      } else if (fnName === "create_nielsen_evaluation") {
        const r = await supabase.from("nielsen_heuristics").insert({ project_id: projectId, heuristic_name: args.heuristic_name, evaluation_notes: args.evaluation_notes, severity_level: args.severity_level, recommendation: args.recommendation });
        dbErr = r.error; actionMsg = `Heurística "${args.heuristic_name}"`;
      } else if (fnName === "create_usability_result") {
        const r = await supabase.from("usability_tests").insert({ project_id: projectId, task_description: args.task_description, success_rate_percentage: args.success_rate_percentage, user_feedback: args.user_feedback, key_observations: args.key_observations });
        dbErr = r.error; actionMsg = `Teste "${args.task_description}"`;
      } else if (fnName === "create_wcag_audit") {
        const r = await supabase.from("wcag_audits").insert({ project_id: projectId, guideline_reference: args.guideline_reference, compliance_status: args.compliance_status, issue_description: args.issue_description, fix_suggestion: args.fix_suggestion });
        dbErr = r.error; actionMsg = `WCAG ${args.guideline_reference}`;
      } else if (fnName === "create_qa_bug") {
        const r = await supabase.from("qa_bugs").insert({ project_id: projectId, bug_title: args.bug_title, steps_to_reproduce: args.steps_to_reproduce, severity: args.severity, status: args.status || "Aberto" });
        dbErr = r.error; actionMsg = `Bug "${args.bug_title}"`;
      } else if (fnName === "create_customer_journey") {
        const r = await supabase.from("customer_journeys").insert({ project_id: projectId, journey_name: args.journey_name, persona: args.persona || "", description: args.description || "", stages: args.stages || [], pain_points: args.pain_points || [], opportunities: args.opportunities || [] });
        dbErr = r.error; actionMsg = `Journey "${args.journey_name}"`;
      } else if (fnName === "create_sprint_retro") {
        const r = await supabase.from("sprint_retrospectives").insert({ project_id: projectId, sprint_name: args.sprint_name, sprint_number: args.sprint_number || 1, went_well: args.went_well || [], to_improve: args.to_improve || [], action_items: args.action_items || [], team_mood: args.team_mood || "neutral" });
        dbErr = r.error; actionMsg = `Retro "${args.sprint_name}"`;
      } else if (fnName === "create_risk") {
        const r = await supabase.from("risk_register").insert({ project_id: projectId, risk_title: args.risk_title, description: args.description || "", category: args.category || "technical", probability: args.probability || "medium", impact: args.impact || "medium", mitigation_plan: args.mitigation_plan || "", owner: args.owner || "" });
        dbErr = r.error; actionMsg = `Risco "${args.risk_title}"`;
      } else if (fnName === "create_handoff_spec") {
        const r = await supabase.from("design_handoff_specs").insert({ project_id: projectId, screen_name: args.screen_name, component_name: args.component_name || "", spacing: args.spacing || {}, typography: args.typography || {}, colors: args.colors || {}, interactions: args.interactions || "", notes: args.notes || "" });
        dbErr = r.error; actionMsg = `Handoff "${args.screen_name}"`;
      } else {
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: `Ferramenta desconhecida: ${fnName}` });
        continue;
      }

      if (dbErr) {
        actionsPerformed.push(`❌ ${fnName}: ${dbErr.message}`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
      } else {
        actionsPerformed.push(`✅ ${actionMsg}`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      }
    }

    // ── Stream final response ──
    const assistantMessage = (toolCalls && toolCalls.length > 0) ? choice.message : { role: "assistant", content: responseContent || "Executando ferramentas..." };

    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          assistantMessage,
          ...toolResults,
          { role: "user", content: `Ferramentas executadas. Resultado: ${actionsPerformed.join(", ")}. Resuma concisamente o que foi criado.` }
        ],
        stream: true,
      }),
    });

    const encoder = new TextEncoder();
    const actionPrefix = actionsPerformed.length > 0 ? `[Ações: ${actionsPerformed.join(", ")}]\n\n` : "";
    const prefixBytes = encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: actionPrefix } }] })}\n\n`);
    const reader = finalResponse.body!.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        if (actionPrefix) controller.enqueue(prefixBytes);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: "Erro interno", details: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
