import { useState } from "react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { ScrollText, Plus, Rocket, Bug, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReleaseNote {
  id: string;
  version: string;
  date: string;
  features: string[];
  fixes: string[];
  improvements: string[];
}

const ICON_MAP = {
  feature: { icon: Sparkles, color: "text-primary", label: "Feature" },
  fix: { icon: Bug, color: "text-destructive", label: "Fix" },
  improvement: { icon: Wrench, color: "text-amber-500", label: "Melhoria" },
};

export function ReleaseNotesPage() {
  const projectId = useCurrentProjectId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ version: "", features: "", fixes: "", improvements: "" });

  const { data: releases = [] } = useQuery({
    queryKey: ["release-notes", projectId],
    enabled: !!projectId,
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
          id: d.id,
          version: d.title,
          date: d.created_at,
          features: (meta.features as string[]) ?? [],
          fixes: (meta.fixes as string[]) ?? [],
          improvements: (meta.improvements as string[]) ?? [],
        } as ReleaseNote;
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const parse = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean);
      await supabase.from("project_documents").insert({
        project_id: projectId!,
        title: form.version,
        content: `Release ${form.version}`,
        doc_type: "release_notes",
        metadata: {
          features: parse(form.features),
          fixes: parse(form.fixes),
          improvements: parse(form.improvements),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] });
      setOpen(false);
      setForm({ version: "", features: "", fixes: "", improvements: "" });
      toast({ title: "Release notes criada" });
    },
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
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova Release</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Release</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Versão (ex: v1.2.0)" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">✨ Features (uma por linha)</label>
                  <Textarea rows={3} value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">🐛 Correções (uma por linha)</label>
                  <Textarea rows={3} value={form.fixes} onChange={e => setForm(p => ({ ...p, fixes: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">🔧 Melhorias (uma por linha)</label>
                  <Textarea rows={3} value={form.improvements} onChange={e => setForm(p => ({ ...p, improvements: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!form.version || addMutation.isPending}>Publicar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {releases.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma release notes registrada. Documente suas entregas aqui.</CardContent></Card>
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
                {release.features.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />Features</p>
                    <ul className="space-y-1">{release.features.map((f, i) => <li key={i} className="text-xs text-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-primary">  {f}</li>)}</ul>
                  </div>
                )}
                {release.fixes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-destructive mb-1 flex items-center gap-1"><Bug className="w-3 h-3" />Correções</p>
                    <ul className="space-y-1">{release.fixes.map((f, i) => <li key={i} className="text-xs text-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-destructive">  {f}</li>)}</ul>
                  </div>
                )}
                {release.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-500 mb-1 flex items-center gap-1"><Wrench className="w-3 h-3" />Melhorias</p>
                    <ul className="space-y-1">{release.improvements.map((f, i) => <li key={i} className="text-xs text-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-amber-500">  {f}</li>)}</ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ModulePage>
  );
}

export default ReleaseNotesPage;
