import { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { useCreateMoodLog, useGetMoodLogs, MoodLogMood, CreateMoodLogMood } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Frown, Meh, Wind, Zap, Coffee, Camera, X, Loader2, ScanFace } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const MOODS = [
  { value: CreateMoodLogMood.happy, label: "Happy", icon: Smile, color: "text-green-500", bg: "bg-green-500/10" },
  { value: CreateMoodLogMood.calm, label: "Calm", icon: Wind, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: CreateMoodLogMood.tired, label: "Tired", icon: Coffee, color: "text-slate-500", bg: "bg-slate-500/10" },
  { value: CreateMoodLogMood.meh, label: "Sad", icon: Frown, color: "text-indigo-400", bg: "bg-indigo-400/10", apiValue: CreateMoodLogMood.sad },
  { value: CreateMoodLogMood.stressed, label: "Stressed", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
  { value: CreateMoodLogMood.anxious, label: "Anxious", icon: Meh, color: "text-red-400", bg: "bg-red-400/10" },
];

const MOOD_MAP: Record<string, CreateMoodLogMood> = {
  happy: CreateMoodLogMood.happy,
  joyful: CreateMoodLogMood.happy,
  excited: CreateMoodLogMood.happy,
  calm: CreateMoodLogMood.calm,
  relaxed: CreateMoodLogMood.calm,
  neutral: CreateMoodLogMood.calm,
  tired: CreateMoodLogMood.tired,
  exhausted: CreateMoodLogMood.tired,
  sad: CreateMoodLogMood.sad,
  unhappy: CreateMoodLogMood.sad,
  depressed: CreateMoodLogMood.sad,
  stressed: CreateMoodLogMood.stressed,
  overwhelmed: CreateMoodLogMood.stressed,
  anxious: CreateMoodLogMood.anxious,
  worried: CreateMoodLogMood.anxious,
  fearful: CreateMoodLogMood.anxious,
};

export default function MoodPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMood = useCreateMoodLog();
  const { data: logs } = useGetMoodLogs();

  const [selectedMood, setSelectedMood] = useState<CreateMoodLogMood | null>(null);
  const [stressLevel, setStressLevel] = useState([5]);
  const [note, setNote] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedMoodLabel, setDetectedMoodLabel] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast({ title: "Camera access denied", description: "Please allow camera permission in your browser.", variant: "destructive" });
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ✅ FIXED: save → translate to right edge → flip X → draw at (0,0) → restore
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    const base64Image = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    setIsAnalyzing(true);
    stopCamera();

    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
                {
                  type: "text",
                  text: `Analyze the facial expression in this image and detect the person's emotional state.

Respond ONLY in this exact JSON format, nothing else, no markdown:
{
  "mood": "happy|calm|tired|sad|stressed|anxious",
  "confidence": "low|medium|high",
  "stressLevel": <number 1-10>,
  "note": "<one short warm supportive sentence>"
}

Rules:
- mood must be exactly one of: happy, calm, tired, sad, stressed, anxious
- stressLevel: 1-3 for happy/calm, 4-6 for tired/sad, 7-10 for stressed/anxious`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);

      const mappedMood = MOOD_MAP[result.mood?.toLowerCase()] ?? CreateMoodLogMood.calm;
      setSelectedMood(mappedMood);
      setStressLevel([result.stressLevel ?? 5]);
      setDetectedMoodLabel(result.mood);
      if (result.note) setNote(result.note);

      toast({
        title: `Mood detected: ${result.mood}`,
        description: `Confidence: ${result.confidence}. You can adjust if needed.`,
      });
    } catch {
      toast({ title: "Analysis failed", description: "Could not analyze mood. Please try again or select manually.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({ title: "Please select a mood", variant: "destructive" });
      return;
    }

    createMood.mutate({
      data: {
        mood: selectedMood,
        stressLevel: stressLevel[0],
        note: note.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Mood logged successfully", description: "Thank you for checking in." });
        setSelectedMood(null);
        setStressLevel([5]);
        setNote("");
        setDetectedMoodLabel(null);
        queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wellness"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wellness/activity"] });
      }
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight">How are you feeling?</h1>
          <p className="text-muted-foreground">Take a moment to pause and check in with yourself.</p>
        </header>

        {/* Camera Modal */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-3xl overflow-hidden shadow-2xl w-full max-w-md"
              >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanFace className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Mood Detection</span>
                  </div>
                  <button onClick={stopCamera} className="rounded-full p-1 hover:bg-muted transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative bg-black">
                  {/* ✅ Mirror video: scaleX(-1) */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-video object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-primary/60 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Position your face in the circle and click Capture
                  </p>
                  <Button onClick={captureAndAnalyze} className="w-full rounded-full h-12">
                    <Camera className="w-4 h-4 mr-2" />
                    Capture & Analyze
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        <Card className="rounded-3xl shadow-sm border-border/50 bg-card overflow-hidden">
          <CardContent className="p-6 md:p-10 space-y-10">

            {/* Camera Detect Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <ScanFace className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-medium text-foreground">Auto-detect your mood</p>
                <p className="text-sm text-muted-foreground">Let AI analyze your facial expression via camera</p>
              </div>
              <Button
                variant="outline"
                onClick={startCamera}
                disabled={isAnalyzing}
                className="rounded-full border-primary/30 hover:bg-primary/10 shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Open Camera
                  </>
                )}
              </Button>
            </div>

            {/* Detected mood banner */}
            <AnimatePresence>
              {detectedMoodLabel && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-2xl"
                >
                  <ScanFace className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700">
                    AI detected: <strong className="capitalize">{detectedMoodLabel}</strong> — you can adjust below if needed
                  </p>
                  <button onClick={() => setDetectedMoodLabel(null)} className="ml-auto text-green-600 hover:text-green-800">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mood Selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground">Select your mood</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {MOODS.map((m) => {
                  const isActive = selectedMood === (m.apiValue || m.value);
                  const val = m.apiValue || m.value;
                  return (
                    <button
                      key={m.label}
                      onClick={() => setSelectedMood(val as CreateMoodLogMood)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-200 border ${
                        isActive
                          ? `border-primary bg-primary/5 ring-2 ring-primary/20 scale-105`
                          : `border-border/50 bg-muted/20 hover:bg-muted/50 hover:scale-105`
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? m.bg : 'bg-background'}`}>
                        <m.icon className={`w-6 h-6 ${isActive ? m.color : 'text-muted-foreground'}`} />
                      </div>
                      <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stress Level */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Stress Level</label>
                <span className="text-sm text-muted-foreground font-mono">{stressLevel[0]}/10</span>
              </div>
              <Slider
                value={stressLevel}
                onValueChange={setStressLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Very Low</span>
                <span>Moderate</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground">Journal Note <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <Textarea
                placeholder="What's on your mind today?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[120px] rounded-2xl resize-none bg-muted/20 border-border/50 focus-visible:ring-primary/30 text-base p-4"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createMood.isPending || !selectedMood}
              className="w-full rounded-full h-14 text-base shadow-md"
            >
              {createMood.isPending ? "Saving..." : "Log Entry"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent History */}
        {logs && logs.length > 0 && (
          <div className="space-y-6 pt-6">
            <h2 className="text-xl font-semibold">Recent History</h2>
            <div className="space-y-4">
              {(Array.isArray(logs) ? logs : []).slice(0, 5).map((log) => {
                const moodDef = MOODS.find(m => (m.apiValue || m.value) === log.mood);
                const Icon = moodDef?.icon || Smile;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={log.id}
                  >
                    <Card className="rounded-2xl border-border/50 shadow-sm bg-card/50 hover:bg-card transition-colors">
                      <CardContent className="p-4 flex gap-4">
                        <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${moodDef?.bg || 'bg-muted'}`}>
                          <Icon className={`w-6 h-6 ${moodDef?.color || 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-foreground capitalize">{log.mood}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {log.note && <p className="text-sm text-muted-foreground truncate">{log.note}</p>}
                          {log.stressLevel && <p className="text-xs text-secondary font-medium mt-1">Stress: {log.stressLevel}/10</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}