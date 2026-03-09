import { useState, useCallback, useEffect } from "react";
import { fetchAiMessages, saveAiMessage } from "@/lib/api";
import { getAuthHeaders } from "@/lib/authHeaders";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`;

export function useAIChat(projectContext?: Record<string, unknown>) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load saved messages
  useEffect(() => {
    fetchAiMessages().then((data) => {
      if (data.length > 0) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
      setInitialized(true);
    });
  }, []);

  const send = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;

      const userMsg: Msg = { role: "user", content: input };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      // Save user message
      await saveAiMessage("user", input);

      let assistantSoFar = "";
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev.slice(0, updatedMessages.length), { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        const headers = await getAuthHeaders();
        const projectId = await getProjectId();
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: updatedMessages,
            projectContext,
            project_id: projectId,
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          const errMsg = errData.error || `Erro ${resp.status}`;
          toast.error(errMsg);
          setIsLoading(false);
          return;
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Save final assistant message
        if (assistantSoFar) {
          await saveAiMessage("assistant", assistantSoFar);
        }
      } catch (e) {
        console.error("AI chat error:", e);
        toast.error("Erro ao conectar com o Mentor IA");
      }

      setIsLoading(false);
    },
    [messages, isLoading, projectContext]
  );

  return { messages, isLoading, send, initialized };
}
