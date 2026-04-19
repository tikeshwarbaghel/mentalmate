import { useState, useRef, useEffect } from "react";
import { useGetChatHistory, useSendChatMessage, ChatMessageRole } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, AlertTriangle, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useGetChatHistory();
  const sendMessage = useSendChatMessage();
  
  const [input, setInput] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasCrisis = history?.some(m => m.isCrisis) || optimisticMessages.some(m => m.isCrisis);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, optimisticMessages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;

    const messageText = input.trim();
    setInput("");

    // Optimistic UI update for user message
    const newMsg = {
      id: Date.now(),
      role: ChatMessageRole.user,
      content: messageText,
      createdAt: new Date().toISOString(),
      isCrisis: false
    };
    
    setOptimisticMessages(prev => [...prev, newMsg]);

    sendMessage.mutate({ data: { message: messageText } }, {
      onSuccess: (res) => {
        // Add assistant response to optimistic messages
        setOptimisticMessages(prev => [...prev, res]);
        queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      },
      onError: () => {
        setOptimisticMessages(prev => prev.filter(m => m.id !== newMsg.id));
      }
    });
  };

  const allMessages = [...(history || []), ...optimisticMessages.filter(om => 
    !(history || []).some(hm => hm.id === om.id)
  )];

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-8rem)] max-h-[800px] border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
        
        <div className="bg-muted/30 border-b border-border/50 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Companion</h2>
            <p className="text-xs text-muted-foreground">Always here to listen</p>
          </div>
        </div>

        <AnimatePresence>
          {hasCrisis && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-destructive/10 border-b border-destructive/20 p-4 text-sm"
            >
              <div className="flex items-start gap-3 max-w-3xl mx-auto">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1 text-destructive-foreground">
                  <p className="font-semibold text-destructive">If you are in crisis, please reach out for help immediately.</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-destructive/90">
                    <li>National Suicide Prevention Lifeline: <strong>988</strong> (call or text)</li>
                    <li>Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></li>
                    <li>Emergency services: <strong>911</strong></li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-[70%] rounded-2xl rounded-tl-sm bg-muted" />
                <Skeleton className="h-16 w-[60%] rounded-2xl rounded-tr-sm bg-primary/10 ml-auto" />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground py-20">
                <Sparkles className="w-12 h-12 text-primary/30" />
                <p>Start a conversation. How are you feeling right now?</p>
              </div>
            ) : (
              allMessages.map((msg, idx) => {
                const isUser = msg.role === ChatMessageRole.user;
                return (
                  <motion.div 
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isUser ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/50 text-foreground rounded-tl-sm'}`}>
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
            className="flex items-center gap-2 max-w-3xl mx-auto relative"
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
