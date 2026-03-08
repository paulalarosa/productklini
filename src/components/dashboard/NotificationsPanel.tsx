import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectId } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeColors: Record<string, string> = {
  info: "bg-status-discovery/20 text-status-discovery",
  warning: "bg-status-deliver/20 text-status-deliver",
  success: "bg-status-develop/20 text-status-develop",
  error: "bg-destructive/20 text-destructive",
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const projectId = await getProjectId();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("project_id", PROJECT_ID).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-1.5 rounded-md hover:bg-accent transition-colors">
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
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-96 glass-card rounded-lg border border-border z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">Notificações</span>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} title="Marcar todas como lidas" className="p-1 rounded hover:bg-accent transition-colors">
                      <CheckCheck className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-accent transition-colors">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-8">Sem notificações</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`flex items-start gap-2 px-3 py-2 border-b border-border/50 transition-colors ${n.is_read ? "opacity-60" : "bg-accent/20"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${typeColors[n.type] || typeColors.info}`}>{n.type}</span>
                          <span className="text-[9px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground mt-0.5">{n.title}</p>
                        {n.message && <p className="text-[10px] text-muted-foreground">{n.message}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!n.is_read && (
                          <button onClick={() => markRead(n.id)} className="p-0.5 rounded hover:bg-accent"><Check className="w-3 h-3 text-muted-foreground" /></button>
                        )}
                        <button onClick={() => deleteNotification(n.id)} className="p-0.5 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-muted-foreground" /></button>
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
