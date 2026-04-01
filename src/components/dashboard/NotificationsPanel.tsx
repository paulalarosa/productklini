import { useState } from "react";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectId } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  info:    "bg-status-discovery/20 text-status-discovery",
  warning: "bg-status-deliver/20   text-status-deliver",
  success: "bg-status-develop/20   text-status-develop",
  error:   "bg-destructive/20      text-destructive",
};

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchNotifications(): Promise<Notification[]> {
  const projectId = await getProjectId();
  if (!projectId) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Notification[]) ?? [];
}

// ─── Utilitário de tempo ──────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
  if (mins < 1)  return "agora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Realtime — canal dedicado para notificações
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 0, // sempre fresco — dados driven por realtime
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Mutations ───────────────────────────────────────────────────────────────

  const markRead = useMutation({
    mutationFn: (id: string) =>
      supabase.from("notifications").update({ is_read: true }).eq("id", id),
    // Optimistic update — marca como lido antes da resposta do servidor
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<Notification[]>(["notifications"]);
      queryClient.setQueryData<Notification[]>(["notifications"], old =>
        old?.map(n => n.id === id ? { ...n, is_read: true } : n) ?? [],
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(["notifications"], ctx?.prev);
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const projectId = await getProjectId();
      if (!projectId) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("project_id", projectId)
        .eq("is_read", false);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<Notification[]>(["notifications"]);
      queryClient.setQueryData<Notification[]>(["notifications"], old =>
        old?.map(n => ({ ...n, is_read: true })) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["notifications"], ctx?.prev);
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) =>
      supabase.from("notifications").delete().eq("id", id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<Notification[]>(["notifications"]);
      queryClient.setQueryData<Notification[]>(["notifications"], old =>
        old?.filter(n => n.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(["notifications"], ctx?.prev);
    },
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-md hover:bg-accent transition-colors"
        aria-label={`Notificações${unreadCount > 0 ? ` — ${unreadCount} não lidas` : ""}`}
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{   opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="fixed right-2 top-14 md:absolute md:right-0 md:top-full md:mt-2 w-[calc(100vw-1rem)] max-w-[320px] max-h-[70vh] md:max-h-96 glass-card rounded-lg border border-border z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <span className="text-xs font-semibold text-foreground">Notificações</span>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      title="Marcar todas como lidas"
                      className="p-1 rounded hover:bg-accent transition-colors"
                      disabled={markAllRead.isPending}
                    >
                      <CheckCheck className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-accent transition-colors">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-8">Sem notificações</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2 px-3 py-2 border-b border-border/50 transition-colors ${
                        n.is_read ? "opacity-60" : "bg-accent/20"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${TYPE_COLORS[n.type] ?? TYPE_COLORS.info}`}>
                            {n.type}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground mt-0.5 break-words">{n.title}</p>
                        {n.message && (
                          <p className="text-[10px] text-muted-foreground break-words">{n.message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!n.is_read && (
                          <button
                            onClick={() => markRead.mutate(n.id)}
                            className="p-1 rounded hover:bg-accent"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification.mutate(n.id)}
                          className="p-1 rounded hover:bg-destructive/10"
                          title="Remover notificação"
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
