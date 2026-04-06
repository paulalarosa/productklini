import { supabase } from "@/integrations/supabase/client";
import { getProjectId } from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type NotificationType = "info" | "warning" | "success" | "error";

interface CreateNotificationParams {
  type:     NotificationType;
  title:    string;
  message?: string;
}

// ─── Função principal ─────────────────────────────────────────────────────────
// Usada quando o evento acontece no frontend e não há trigger de DB disponível.
// Ex: import de reviews concluído, análise de IA finalizada, export de PDF.

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const projectId = await getProjectId();
  if (!projectId) return;

  await supabase.from("notifications").insert({
    project_id: projectId,
    type:       params.type,
    title:      params.title,
    message:    params.message ?? null,
    is_read:    false,
  });
  // Erros são silenciosos — notificações são não-críticas
}

// ─── Helpers semânticos ───────────────────────────────────────────────────────
// Facilitam o uso nos componentes sem precisar lembrar os tipos

export const notify = {
  success: (title: string, message?: string) =>
    createNotification({ type: "success", title, message }),

  error: (title: string, message?: string) =>
    createNotification({ type: "error", title, message }),

  warning: (title: string, message?: string) =>
    createNotification({ type: "warning", title, message }),

  info: (title: string, message?: string) =>
    createNotification({ type: "info", title, message }),
};
