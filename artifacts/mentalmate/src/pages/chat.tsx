import { useState, useRef, useEffect, useCallback } from "react";
import { useGetChatHistory, useSendChatMessage, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, AlertTriangle, User, Sparkles, Plus, X, Trash2, MessageCircle, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

type LocalMessage = {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  isCrisis: boolean;
  createdAt: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: LocalMessage[];
  createdAt: string;
};

const STORAGE_KEY = "mentalmate-chat-sessions";

function loadSessions(): ChatSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch { }
}

function VoiceWaveform({ isListening, onStop }: { isListening: boolean; onStop: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isListening) {
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / bufferLength;
        dataArray.forEach((value, i) => {
          const barHeight = (value / 255) * canvas.height;
          ctx.fillStyle = `hsla(261, 40%, 60%, 0.8)`;
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
        });
        animRef.current = requestAnimationFrame(draw);
      };
      draw();
    }).catch(() => onStop());

    return () => {
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, [isListening, onStop]);

  if (!isListening) return null;

  return (
    <canvas ref={canvasRef} width={200} height={40} className="rounded-lg" />
  );
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useGetChatHistory();
  const sendMessage = useSendChatMessage();

  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[] | null>(null);
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [lastCrisisAt, setLastCrisisAt] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleSendRef = useRef<() => void>(() => {});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const voiceTimerRef = useRef<any>(null);
  const voiceTextRef = useRef("");
  const wasVoiceRef = useRef(false);

  const stopVoice = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    clearTimeout(voiceTimerRef.current);
    try { recognitionRef.current?.stop(); } catch { }
    try { recognitionRef.current?.abort(); } catch { }
    recognitionRef.current = null;
  }, []);

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported. Please use Chrome.");
      return;
    }

    voiceTextRef.current = "";
    setInput("");
    isListeningRef.current = true;
    setIsListening(true);

    const startRecognition = () => {
      if (!isListeningRef.current) return;

      const rec = new SR();
      rec.lang = "";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          voiceTextRef.current += (voiceTextRef.current ? " " : "") + transcript;
          setInput(voiceTextRef.current);

          clearTimeout(voiceTimerRef.current);
          voiceTimerRef.current = setTimeout(() => {
            const text = voiceTextRef.current.trim();
            if (text) {
              isListeningRef.current = false;
              setIsListening(false);
              voiceTextRef.current = text;
              setIsVoiceMode(true);
              wasVoiceRef.current = true;
              setTimeout(() => {
                handleSendRef.current();
              }, 100);
            }
          }, 2000);
        }
      };

      rec.onend = () => {
        if (isListeningRef.current) {
          setTimeout(startRecognition, 100);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === "no-speech" && isListeningRef.current) {
          setTimeout(startRecognition, 100);
        } else if (e.error !== "aborted") {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
      try { rec.start(); } catch { }
    };

    startRecognition();
  }, [stopVoice]);

  useEffect(() => {
    if (localMessages === null && history !== undefined) {
      setLocalMessages([]);
    }
  }, [history, localMessages]);

  const displayMessages = localMessages ?? [];
  const hasCrisis = !crisisDismissed && displayMessages.some(m => m.isCrisis);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => { scrollToBottom(); }, [displayMessages]);

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

  const updateSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    saveSessions(updated);
  };

  const handleSend = useCallback(() => {
    const currentInput = voiceTextRef.current.trim() || input.trim();
    if (!currentInput || sendMessage.isPending) return;
    const wasVoice = wasVoiceRef.current;
    wasVoiceRef.current = false;
    voiceTextRef.current = "";
    setInput("");
    setIsVoiceMode(false);

    const messageText = currentInput;
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

        setLocalMessages(prev => {
          const withoutOpt = (prev ?? []).filter(m => m.id !== userMsg.id);
          const realUserMsg: LocalMessage = {
            id: `usr-${res.id}`,
            role: "user",
            content: messageText,
            isCrisis: res.isCrisis,
            createdAt: userMsg.createdAt,
          };
          const updated = [...withoutOpt, realUserMsg, assistantMsg];
          setSessions(prev => {
            const exists = prev.find(s => s.id === activeSessionId);
            let newSessions;
            if (exists) {
              newSessions = prev.map(s => s.id === activeSessionId ? { ...s, messages: updated } : s);
            } else {
              const newSession: ChatSession = {
                id: activeSessionId ?? `session-${Date.now()}`,
                title: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : ""),
                messages: updated,
                createdAt: userMsg.createdAt,
              };
              newSessions = [newSession, ...prev];
            }
            saveSessions(newSessions);
            return newSessions;
          });
          return updated;
        });

if (wasVoice && (res as any).audioBase64) {
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
          }
          const audio = new Audio(`data:audio/mpeg;base64,${(res as any).audioBase64}`);
          currentAudioRef.current = audio;
          audio.play();
        }

        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
      },
      onError: () => {
        setLocalMessages(prev => (prev ?? []).filter(m => m.id !== userMsg.id));
      }
    });
  }, [input, sendMessage, queryClient, activeSessionId, isVoiceMode]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const handleNewChat = async () => {
    try {
      await fetch("/api/chat", { method: "DELETE", credentials: "include" });
    } catch { }
    const newId = `session-${Date.now()}`;
    setActiveSessionId(newId);
    setLocalMessages([]);
    setCrisisDismissed(false);
    setLastCrisisAt(null);
    queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
  };

  const handleLoadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setLocalMessages(session.messages);
    setCrisisDismissed(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    updateSessions(updated);
    if (activeSessionId === sessionId) {
      setLocalMessages([]);
      setActiveSessionId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100dvh-8rem)] max-h-[800px] border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-border/50 bg-muted/20 flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-border/50">
                <Button onClick={handleNewChat} className="w-full rounded-xl gap-2 text-sm" size="sm">
                  <Plus className="w-4 h-4" />
                  New Chat
                </Button>
              </div>
              <ScrollArea className="flex-1 p-2">
                {sessions.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No chats yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => handleLoadSession(session)}
                        className={`group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
                          activeSessionId === session.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1 truncate text-xs">{session.title}</span>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="bg-muted/30 border-b border-border/50 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(p => !p)} className="text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Companion</h2>
                <p className="text-xs text-muted-foreground">Always here to listen</p>
              </div>
            </div>
            <Button
              variant="outline" size="sm" onClick={handleNewChat}
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
                        <li>iCall (India): <strong>9152987821</strong></li>
                        <li>Vandrevala Foundation: <strong>1860-2662-345</strong> (24/7, free)</li>
                        <li>AASRA: <strong>9820466627</strong></li>
                        <li>Emergency Services: <strong>112</strong></li>
                      </ul>
                    </div>
                    <button onClick={() => setCrisisDismissed(true)} className="text-destructive/60 hover:text-destructive shrink-0 p-1 rounded-full hover:bg-destructive/10">
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
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center gap-3 mb-3 max-w-3xl mx-auto"
                >
                  <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-2 w-full">
                    <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0" />
                    <VoiceWaveform isListening={isListening} onStop={stopVoice} />
                    <span className="text-xs text-muted-foreground ml-auto">Listening... will send after 2s of silence</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 max-w-3xl mx-auto"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className="flex-1 rounded-full bg-muted/30 border-border/50 h-12 px-6 focus-visible:ring-primary/30"
                disabled={sendMessage.isPending}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={isListening ? stopVoice : startVoice}
                className={`rounded-full w-12 h-12 shrink-0 border-border/50 transition-colors ${
                  isListening
                    ? "bg-destructive/10 border-destructive/40 text-destructive animate-pulse"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                disabled={sendMessage.isPending}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
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
      </div>
    </AppLayout>
  );
}