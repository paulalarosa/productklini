import { useState } from "react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { ScrollText, Plus, Rocket, Bug, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ReleaseNote {
  id:           string;
  version:      string;
  date:         string;
  features:     string[];
  fixes:        string[];
  improvements: string[];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ReleaseNotesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-3 w-full rounded bg-muted/60 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Seção de itens de release ────────────────────────────────────────────────

function ReleaseSection({
  items,
  label,
  icon: Icon,
  colorClass,
}: {
  items:      string[];
  label:      string;
  icon:       React.ElementType;
  colorClass: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${colorClass}`}>
        <Icon className="w-3 h-3" />{label}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-xs text-foreground pl-4 relative before:content-['•'] before:absolute before:left-1"
            style={{ ["--tw-content" as string]: `"•"` }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ReleaseNotesPage() {
  const projectId   = useCurrentProjectId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ version: "", features: "", fixes: "", improvements: "" });

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ["release-notes", projectId],
    enabled:  !!projectId,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId!)
        .eq("doc_type", "release_notes")
        .order("created_at", { ascending: false });

      return (data ?? []).map(d => {
        const meta = (d.metadata ?? {}) as Record<string, unknown>;
        return {
          id:           d.id,
          version:      d.title,
          date:         d.created_at,
          features:     (meta.features     as string[]) ?? [],
          fixes:        (meta.fixes        as string[]) ?? [],
          improvements: (meta.improvements as string[]) ?? [],
        } as ReleaseNote;
      });
    },
  });

  const parse = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean);

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_documents").insert({
        project_id: projectId!,
        title:      form.version,
        content:    `Release ${form.version}`,
        doc_type:   "release_notes",
        metadata: {
          features:     parse(form.features),
          fixes:        parse(form.fixes),
          improvements: parse(form.improvements),
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] });
      setOpen(false);
      setForm({ version: "", features: "", fixes: "", improvements: "" });
      toast.success("Release notes publicada");
    },
    onError: () => toast.error("Erro ao publicar release notes"),
  });

  return (
    <ModulePage
      title="Release Notes"
      subtitle="Documentação de entregas por versão"
      icon={<ScrollText className="w-5 h-5 text-primary-foreground" />}
      actions={
        <div className="flex gap-2">
          <AIGenerateButton
            prompt="Com base nas tarefas concluídas, bugs corrigidos e melhorias implementadas no projeto, gere release notes organizadas por features novas, correções de bugs e melhorias. Use linguagem clara e orientada ao usuário final."
            invalidateKeys={[["release-notes"]]}
            label="Gerar com IA"
            size="sm"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova Release</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Release</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Versão (ex: v1.2.0)"
                  value={form.version}
                  onChange={e => setForm(p => ({ ...p, version: e.target.value }))}
                />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    ✨ Features (uma por linha)
                  </label>
                  <Textarea
                    rows={3}
                    value={form.features}
                    onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    🐛 Correções (uma por linha)
                  </label>
                  <Textarea
                    rows={3}
                    value={form.fixes}
                    onChange={e => setForm(p => ({ ...p, fixes: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    🔧 Melhorias (uma por linha)
                  </label>
                  <Textarea
                    rows={3}
                    value={form.improvements}
                    onChange={e => setForm(p => ({ ...p, improvements: e.target.value }))}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addMutation.mutate()}
                  disabled={!form.version || addMutation.isPending}
                >
                  {addMutation.isPending ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <ErrorBoundary level="section">
        {isLoading ? (
          <ReleaseNotesSkeleton />
        ) : releases.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Nenhuma release notes registrada"
            description="Documente suas entregas por versão para manter o histórico do produto."
            action={{ label: "Criar primeira release", onClick: () => setOpen(true) }}
          />
        ) : (
          <div className="space-y-4">
            {releases.map(release => (
              <Card key={release.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-primary" />
                      {release.version}
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(release.date), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ReleaseSection
                    items={release.features}
                    label="Features"
                    icon={Sparkles}
                    colorClass="text-primary"
                  />
                  <ReleaseSection
                    items={release.fixes}
                    label="Correções"
                    icon={Bug}
                    colorClass="text-destructive"
                  />
                  <ReleaseSection
                    items={release.improvements}
                    label="Melhorias"
                    icon={Wrench}
                    colorClass="text-amber-500"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

export default ReleaseNotesPage;
