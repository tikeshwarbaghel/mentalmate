import { useState, useRef, useEffect, useCallback } from "react";
import { useGetChatHistory, useSendChatMessage, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, AlertTriangle, User, Sparkles, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

type LocalMessage = {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  isCrisis: boolean;
  createdAt: string;
};

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useGetChatHistory();
  const sendMessage = useSendChatMessage();

  const [input, setInput] = useState("");
  // Local messages override: if non-null, we're in a local session (after New Chat or on first load)
  const [localMessages, setLocalMessages] = useState<LocalMessage[] | null>(null);
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [lastCrisisAt, setLastCrisisAt] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync from history on initial load only
  useEffect(() => {
    if (localMessages === null && history !== undefined) {
      setLocalMessages(
        (history || []).map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          isCrisis: m.isCrisis,
          createdAt: m.createdAt,
        }))
      );
    }
  }, [history, localMessages]);

  const displayMessages = localMessages ?? [];

  const hasCrisis = !crisisDismissed && displayMessages.some(m => m.isCrisis);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  // When a new crisis message arrives, un-dismiss the alert
  useEffect(() => {
    const latestCrisis = displayMessages.filter(m => m.isCrisis).at(-1);
    if (latestCrisis) {
      const ts = new Date(latestCrisis.createdAt).getTime();
      if (lastCrisisAt !== ts) {
        setLastCrisisAt(ts);
        setCrisisDismissed(false);
      }
    }
  }, [displayMessages, lastCrisisAt]);

  const handleSend = useCallback(() => {
    if (!input.trim() || sendMessage.isPending) return;

    const messageText = input.trim();
    setInput("");

    const userMsg: LocalMessage = {
      id: `opt-${Date.now()}`,
      role: "user",
      content: messageText,
      isCrisis: false,
      createdAt: new Date().toISOString(),
    };

    setLocalMessages(prev => [...(prev ?? []), userMsg]);

    sendMessage.mutate({ data: { message: messageText } }, {
      onSuccess: (res) => {
        const assistantMsg: LocalMessage = {
          id: res.id,
          role: res.role as "user" | "assistant",
          content: res.content,
          isCrisis: res.isCrisis,
          createdAt: res.createdAt,
        };
        // Replace the optimistic user message with real data + add assistant response
        setLocalMessages(prev => {
          const withoutOpt = (prev ?? []).filter(m => m.id !== userMsg.id);
          const realUserMsg: LocalMessage = {
            id: `usr-${res.id}`,
            role: "user",
            content: messageText,
            isCrisis: res.isCrisis,
            createdAt: userMsg.createdAt,
          };
          return [...withoutOpt, realUserMsg, assistantMsg];
        });
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
      },
      onError: () => {
        setLocalMessages(prev => (prev ?? []).filter(m => m.id !== userMsg.id));
      }
    });
  }, [input, sendMessage, queryClient]);

  const handleNewChat = async () => {
    try {
      await fetch("/api/chat", { method: "DELETE", credentials: "include" });
    } catch {
      // silently ignore
    }
    setLocalMessages([]);
    setCrisisDismissed(false);
    setLastCrisisAt(null);
    queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-8rem)] max-h-[800px] border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">

        <div className="bg-muted/30 border-b border-border/50 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Companion</h2>
              <p className="text-xs text-muted-foreground">Always here to listen</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="rounded-full h-8 px-3 gap-1.5 text-xs border-border/60 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </Button>
        </div>

        <AnimatePresence>
          {hasCrisis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-destructive/10 border-b border-destructive/20 overflow-hidden"
            >
              <div className="p-4 text-sm">
                <div className="flex items-start gap-3 max-w-3xl mx-auto">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1 text-destructive-foreground flex-1">
                    <p className="font-semibold text-destructive">If you are in crisis, please reach out for help immediately.</p>
                    <ul className="list-disc list-inside pl-4 space-y-1 text-destructive/90">
                      <li>National Suicide Prevention Lifeline: <strong>988</strong> (call or text)</li>
                      <li>Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></li>
                      <li>Emergency services: <strong>911</strong></li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setCrisisDismissed(true)}
                    className="text-destructive/60 hover:text-destructive transition-colors shrink-0 p-1 rounded-full hover:bg-destructive/10"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
            {isLoading && localMessages === null ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-[70%] rounded-2xl rounded-tl-sm bg-muted" />
                <Skeleton className="h-16 w-[60%] rounded-2xl rounded-tr-sm bg-primary/10 ml-auto" />
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground py-20">
                <Sparkles className="w-12 h-12 text-primary/30" />
                <p>Start a conversation. How are you feeling right now?</p>
              </div>
            ) : (
              displayMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={`${msg.id}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isUser ? "bg-muted" : "bg-primary/10 text-primary"}`}>
                        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl ${isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 text-foreground rounded-tl-sm"}`}>
                        <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            {sendMessage.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-4 rounded-2xl bg-muted/50 rounded-tl-sm flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border/50">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 max-w-3xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full bg-muted/30 border-border/50 h-12 px-6 focus-visible:ring-primary/30"
              disabled={sendMessage.isPending}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full w-12 h-12 shrink-0 shadow-sm"
              disabled={!input.trim() || sendMessage.isPending}
            >
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
