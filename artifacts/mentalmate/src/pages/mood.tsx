import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCreateMoodLog, useGetMoodLogs, MoodLogMood, CreateMoodLogMood } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Smile, Frown, Meh, Wind, Zap, Coffee } from "lucide-react";
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

export default function MoodPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMood = useCreateMoodLog();
  const { data: logs } = useGetMoodLogs();

  const [selectedMood, setSelectedMood] = useState<CreateMoodLogMood | null>(null);
  const [stressLevel, setStressLevel] = useState([5]);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({ title: "Please select a mood", variant: "destructive" });
      return;
    }

    createMood.mutate({
      data: {
        mood: selectedMood,
        stressLevel: stressLevel[0],
        note: note.trim() || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Mood logged successfully", description: "Thank you for checking in." });
        setSelectedMood(null);
        setStressLevel([5]);
        setNote("");
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

        <Card className="rounded-3xl shadow-sm border-border/50 bg-card overflow-hidden">
          <CardContent className="p-6 md:p-10 space-y-10">
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

        {logs && logs.length > 0 && (
          <div className="space-y-6 pt-6">
            <h2 className="text-xl font-semibold">Recent History</h2>
            <div className="space-y-4">
              {logs.slice(0, 5).map((log) => {
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
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
