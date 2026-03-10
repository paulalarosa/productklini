import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/authHeaders";
import { getProjectId } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`;

interface AIGenerateButtonProps {
  /** The prompt to send to the AI mentor */
  prompt: string;
  /** Button label */
  label?: string;
  /** Query keys to invalidate after generation */
  invalidateKeys?: string[][];
  /** Optional variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Optional size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Optional className */
  className?: string;
}

export function AIGenerateButton({
  prompt,
  label = "Gerar com IA",
  invalidateKeys = [],
  variant = "default",
  size = "default",
  className,
}: AIGenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const projectId = await getProjectId();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          project_id: projectId,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      // Consume the stream to complete the request
      if (resp.body) {
        const reader = resp.body.getReader();
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }

      // Small delay to let database writes propagate
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Invalidate relevant queries
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }

      // Also invalidate common keys that tools may have written to
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["empathy-maps"] });
      queryClient.invalidateQueries({ queryKey: ["benchmarks"] });
      queryClient.invalidateQueries({ queryKey: ["jtbd"] });
      queryClient.invalidateQueries({ queryKey: ["csd"] });
      queryClient.invalidateQueries({ queryKey: ["hmw"] });
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["sitemaps"] });
      queryClient.invalidateQueries({ queryKey: ["card-sorting"] });
      queryClient.invalidateQueries({ queryKey: ["tone-of-voice"] });
      queryClient.invalidateQueries({ queryKey: ["microcopy"] });
      queryClient.invalidateQueries({ queryKey: ["nielsen"] });
      queryClient.invalidateQueries({ queryKey: ["usability-tests"] });
      queryClient.invalidateQueries({ queryKey: ["wcag"] });
      queryClient.invalidateQueries({ queryKey: ["qa-bugs"] });

      toast.success("Conteúdo gerado com sucesso!");
    } catch (e: unknown) {
      console.error("AI generate error:", e);
      const error = e as Error;
      toast.error(error.message || "Erro ao gerar conteúdo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      {isLoading ? "Gerando..." : label}
    </Button>
  );
}
