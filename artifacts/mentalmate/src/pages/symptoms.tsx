import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { usePredictCondition, SymptomInputSeverity } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, Info, Stethoscope, Search, ShieldAlert, ArrowRight, X, Plus,
  Wind, Brain, Dumbbell, Heart, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Meditation": <Brain className="w-4 h-4 text-primary" />,
  "Breathing": <Wind className="w-4 h-4 text-blue-500" />,
  "Movement": <Dumbbell className="w-4 h-4 text-green-500" />,
  "Self-Care": <Heart className="w-4 h-4 text-rose-400" />,
  "Wellness": <Heart className="w-4 h-4 text-rose-400" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Meditation": "bg-primary/10 border-primary/20",
  "Breathing": "bg-blue-500/10 border-blue-500/20",
  "Movement": "bg-green-500/10 border-green-500/20",
  "Self-Care": "bg-rose-400/10 border-rose-400/20",
  "Wellness": "bg-rose-400/10 border-rose-400/20",
};

export default function SymptomsPage() {
  const predictCondition = usePredictCondition();

  const [symptomInput, setSymptomInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<SymptomInputSeverity>(SymptomInputSeverity.mild);
  const [duration, setDuration] = useState("");

  const addSymptom = () => {
    const trimmed = symptomInput.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
    }
    setSymptomInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSymptom();
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const handleSubmit = () => {
    if (symptoms.length === 0) return;
    predictCondition.mutate({
      data: { symptoms, severity, duration: duration || undefined }
    });
  };

  const prediction = predictCondition.data as any;

  const recommendations = prediction?.recommendations ?? [];
  const conditions = prediction?.conditions ?? [];
  const seekHelp = prediction?.seekHelpImmediately ?? false;
  const seekHelpReason = prediction?.seekHelpReason ?? null;

  const highRiskConditions = conditions.filter((c: any) => c.likelihood === "high");
  const shouldRecommendDoctor = seekHelp || highRiskConditions.length > 0 || severity === "severe";

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <header className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight"
          >
            Symptom Check
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Describe how you're feeling to receive supportive guidance.
          </motion.p>
        </header>

        <div className="grid gap-8 md:grid-cols-5">
          {/* Input Panel */}
          <div className="md:col-span-2 space-y-6">
            <Card className="rounded-3xl border-border/50 shadow-sm bg-card overflow-hidden">
              <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
                <CardTitle className="text-lg">Your Symptoms</CardTitle>
                <CardDescription>Enter what you're experiencing</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label>What are you feeling?</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g., fatigue, sadness..."
                        value={symptomInput}
                        onChange={(e) => setSymptomInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pl-9 rounded-xl h-11"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={addSymptom}
                      disabled={!symptomInput.trim()}
                      className="rounded-xl h-11 w-11 shrink-0"
                      aria-label="Add symptom"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Press Enter or click + to add each symptom</p>

                  {symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {symptoms.map(s => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          {s}
                          <button
                            onClick={() => removeSymptom(s)}
                            className="text-primary/70 hover:text-primary rounded-full hover:bg-primary/10 p-0.5 transition-colors"
                            aria-label={`Remove ${s}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Overall Severity</Label>
                  <Select value={severity} onValueChange={(val) => setSeverity(val as SymptomInputSeverity)}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SymptomInputSeverity.mild}>Mild — manageable</SelectItem>
                      <SelectItem value={SymptomInputSeverity.moderate}>Moderate — interferes somewhat</SelectItem>
                      <SelectItem value={SymptomInputSeverity.severe}>Severe — disrupts daily life</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Duration (optional)</Label>
                  <Input
                    placeholder="e.g., 2 weeks, a few days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={symptoms.length === 0 || predictCondition.isPending}
                  className="w-full rounded-xl h-12 shadow-sm"
                >
                  {predictCondition.isPending ? "Analyzing..." : "Analyze Symptoms"}
                  {!predictCondition.isPending && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-muted/40 rounded-2xl p-4 flex gap-3 text-sm text-muted-foreground border border-border/50">
              <Info className="w-5 h-5 shrink-0 text-primary mt-0.5" />
              <p>MENTALMATE is a supportive wellness companion, not a substitute for professional medical advice, diagnosis, or treatment.</p>
            </div>
          </div>

          {/* Results Panel */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {prediction ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Seek help immediately banner */}
                  {seekHelp && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 flex gap-4">
                      <ShieldAlert className="w-8 h-8 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h3 className="font-semibold text-destructive">Seek immediate support</h3>
                        <p className="text-sm text-destructive-foreground/90">
                          {seekHelpReason || "Based on your symptoms, we strongly recommend contacting a healthcare professional or crisis line right away."}
                        </p>
                        <p className="text-xs font-medium text-destructive/80 pt-1">Crisis Lifeline: <strong>988</strong> | Crisis Text: Text HOME to <strong>741741</strong></p>
                      </div>
                    </div>
                  )}

                  {/* Doctor recommendation */}
                  {!seekHelp && shouldRecommendDoctor && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3">
                      <UserCheck className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-700">Consider consulting a professional</p>
                        <p className="text-xs text-orange-600/80 mt-0.5">Your symptoms may benefit from an evaluation by a licensed mental health or medical professional.</p>
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      Preliminary Assessment
                    </h2>
                    <div className="space-y-3">
                      {conditions.map((condition: any, idx: number) => (
                        <Card key={idx} className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card/50 hover:bg-card transition-colors">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-semibold text-foreground">{condition.name}</h3>
                              <Badge
                                variant="outline"
                                className={`px-3 py-1 rounded-full whitespace-nowrap text-xs
                                  ${condition.likelihood === "high" ? "bg-destructive/10 text-destructive border-destructive/20" : ""}
                                  ${condition.likelihood === "moderate" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : ""}
                                  ${condition.likelihood === "low" ? "bg-secondary/10 text-secondary-foreground border-secondary/20" : ""}
                                `}
                              >
                                {condition.likelihood} likelihood
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{condition.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Wellness Guidance */}
                  {recommendations.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <Heart className="w-5 h-5 text-primary" />
                        Wellness Guidance
                      </h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {recommendations.map((rec: any, idx: number) => {
                          const cat = typeof rec === "string" ? "Wellness" : (rec.category || "Wellness");
                          const title = typeof rec === "string" ? "Recommendation" : (rec.title || "Recommendation");
                          const desc = typeof rec === "string" ? rec : (rec.description || "");
                          return (
                            <div
                              key={idx}
                              className={`rounded-2xl border p-4 space-y-2 ${CATEGORY_COLORS[cat] || "bg-muted/30 border-border/50"}`}
                            >
                              <div className="flex items-center gap-2">
                                {CATEGORY_ICONS[cat] || <Heart className="w-4 h-4 text-primary" />}
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</span>
                              </div>
                              <p className="text-sm font-medium text-foreground">{title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {prediction.disclaimer || "This analysis is for guidance only and is not a medical diagnosis. Always consult a licensed professional for proper evaluation and care."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/50 rounded-3xl bg-muted/5"
                >
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                    <Stethoscope className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Awaiting Symptoms</h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Enter your symptoms on the left. You'll receive a supportive preliminary assessment along with personalized wellness guidance including breathing exercises, meditation tips, and more.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

