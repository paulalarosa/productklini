import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageHeader } from "@/components/ui/responsive-layout";
import { Accessibility, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function AccessibilitySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 text-center space-y-2">
            <div className="h-10 w-16 rounded bg-muted animate-pulse mx-auto" />
            <div className="h-3 w-20 rounded bg-muted/60 animate-pulse mx-auto" />
          </div>
        ))}
      </div>
      <div className="h-2 rounded-full bg-muted animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-3 w-full rounded bg-muted/60 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AccessibilityScorePage() {
  const projectId = useCurrentProjectId();

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["wcag-audits", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("wcag_audits").select("*").eq("project_id", projectId);
      return data ?? [];
    },
    enabled: !!projectId,
  });

  const total = audits.length;
  const pass  = audits.filter(a => a.compliance_status === "Pass").length;
  const fail  = audits.filter(a => a.compliance_status === "Fail").length;
  const warn  = audits.filter(a => a.compliance_status === "Warning").length;
  const score = total > 0 ? Math.round((pass / total) * 100) : 0;

  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-destructive";
  const scoreLabel = score >= 80 ? "Bom" : score >= 50 ? "Atenção" : "Crítico";

  const grouped = audits.reduce<Record<string, typeof audits>>((acc, a) => {
    const prefix = a.guideline_reference?.split(".").slice(0, 2).join(".") || "Outro";
    (acc[prefix] = acc[prefix] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accessibility Score"
        description="Score consolidado de acessibilidade WCAG 2.1"
        actions={
          <AIGenerateButton
            prompt="Realize uma auditoria completa de acessibilidade WCAG 2.1 nível AA. Avalie percepção, operação, compreensão e robustez. Registre cada item como Pass, Fail ou Warning."
            label="Auditar com IA" invalidateKeys={[["wcag-audits"]]} variant="outline" size="sm"
          />
        }
      />

      <ErrorBoundary level="section">
        {isLoading ? <AccessibilitySkeleton /> : total === 0 ? (
          <EmptyState icon={Accessibility} title="Nenhuma auditoria WCAG"
            description="Execute uma auditoria para obter o score de acessibilidade do projeto." />
        ) : (
          <>
            {/* Score cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className={`text-5xl font-bold ${scoreColor}`}>{score}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Score Geral</p>
                  <Badge className={`mt-2 text-[10px] ${scoreColor}`}>{scoreLabel}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" /><span className="text-2xl font-bold">{pass}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Aprovados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" /><span className="text-2xl font-bold">{warn}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Avisos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <XCircle className="w-5 h-5" /><span className="text-2xl font-bold">{fail}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Reprovados</p>
                </CardContent>
              </Card>
            </div>

            <Progress value={score} className="h-2" />

            {/* Agrupado por guideline */}
            <div className="space-y-4">
              {Object.entries(grouped).sort().map(([group, items]) => {
                const groupPass  = items.filter(i => i.compliance_status === "Pass").length;
                const groupScore = Math.round((groupPass / items.length) * 100);
                return (
                  <Card key={group} className="animate-fade-in">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">WCAG {group}</CardTitle>
                        <Badge variant={groupScore >= 80 ? "default" : "destructive"} className="text-[10px]">
                          {groupScore}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1.5">
                        {items.map(item => (
                          <div key={item.id} className="flex items-start gap-2 text-xs">
                            {item.compliance_status === "Pass"
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                              : item.compliance_status === "Fail"
                              ? <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                              : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            }
                            <div>
                              <span className="font-medium">{item.guideline_reference}</span>
                              {item.issue_description && (
                                <span className="text-muted-foreground ml-1">— {item.issue_description}</span>
                              )}
                              {item.fix_suggestion && (
                                <p className="text-primary text-[10px] mt-0.5">Fix: {item.fix_suggestion}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </ErrorBoundary>
    </div>
  );
}
