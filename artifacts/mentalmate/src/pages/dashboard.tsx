import { useState } from "react";
import { useGetWellnessDashboard, useGetRecentActivity, useUpdateWellnessData, getGetWellnessDashboardQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Heart, ArrowUpRight, Flame, MessageCircle, Sparkles, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: dashboard, isLoading: dashboardLoading } = useGetWellnessDashboard();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const updateWellness = useUpdateWellnessData();

  const [editing, setEditing] = useState(false);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [mentalHealthScore, setMentalHealthScore] = useState<number>(70);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState<number>(120);
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState<number>(80);

  const openEdit = () => {
    setStressLevel(dashboard?.stressLevel ?? 5);
    setMentalHealthScore(dashboard?.mentalHealthScore ?? 70);
    setBloodPressureSystolic(dashboard?.bloodPressureSystolic ?? 120);
    setBloodPressureDiastolic(dashboard?.bloodPressureDiastolic ?? 80);
    setEditing(true);
  };

  const handleSave = () => {
    updateWellness.mutate({
      data: {
        stressLevel,
        mentalHealthScore,
        bloodPressureSystolic,
        bloodPressureDiastolic,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWellnessDashboardQueryKey() });
        setEditing(false);
        toast({ title: "Wellness updated", description: "Your dashboard now reflects the latest values." });
      },
      onError: () => {
        toast({ title: "Update failed", description: "Could not save your wellness data. Please try again.", variant: "destructive" });
      }
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight"
          >
            Good to see you, {user?.firstName || "friend"}.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Here's a gentle overview of your wellbeing.
          </motion.p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Mental Health Score"
            value={dashboard?.mentalHealthScore ? `${dashboard.mentalHealthScore}/100` : "--"}
            icon={<Heart className="w-4 h-4 text-primary" />}
            description="Based on recent logs"
            loading={dashboardLoading}
            delay={0.2}
          />
          <StatCard
            title="Current Stress"
            value={dashboard?.stressLevel ? `${dashboard.stressLevel}/10` : "--"}
            icon={<Activity className="w-4 h-4 text-secondary" />}
            description="Last recorded level"
            loading={dashboardLoading}
            delay={0.3}
          />
          <StatCard
            title="Consistency Streak"
            value={dashboard?.streakDays ? `${dashboard.streakDays} Days` : "0 Days"}
            icon={<Flame className="w-4 h-4 text-destructive" />}
            description="Keep it up!"
            loading={dashboardLoading}
            delay={0.4}
          />
          <StatCard
            title="Chat Sessions"
            value={dashboard?.totalChatSessions ? `${dashboard.totalChatSessions}` : "0"}
            icon={<MessageCircle className="w-4 h-4 text-accent" />}
            description="Conversations so far"
            loading={dashboardLoading}
            delay={0.5}
          />
        </div>

        {/* Wellness Update Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="rounded-3xl border-border/50 shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/50 pb-4 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Activity className="w-5 h-5 text-secondary" />
                  Update Wellness Data
                </CardTitle>
                <CardDescription>Log your current stress, mood score, and blood pressure</CardDescription>
              </div>
              {!editing && (
                <Button variant="outline" size="sm" onClick={openEdit} className="rounded-full h-8 px-4 gap-2 shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                  Update
                </Button>
              )}
            </CardHeader>

            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <SliderField
                        label="Stress Level"
                        value={stressLevel}
                        onChange={setStressLevel}
                        min={1}
                        max={10}
                        step={1}
                        formatValue={(v) => `${v}/10`}
                        colorClass="accent-secondary"
                      />
                      <SliderField
                        label="Mental Health Score"
                        value={mentalHealthScore}
                        onChange={setMentalHealthScore}
                        min={1}
                        max={100}
                        step={1}
                        formatValue={(v) => `${v}/100`}
                        colorClass="accent-primary"
                      />
                      <SliderField
                        label="Blood Pressure — Systolic"
                        value={bloodPressureSystolic}
                        onChange={setBloodPressureSystolic}
                        min={90}
                        max={180}
                        step={1}
                        formatValue={(v) => `${v} mmHg`}
                        colorClass="accent-primary"
                      />
                      <SliderField
                        label="Blood Pressure — Diastolic"
                        value={bloodPressureDiastolic}
                        onChange={setBloodPressureDiastolic}
                        min={60}
                        max={120}
                        step={1}
                        formatValue={(v) => `${v} mmHg`}
                        colorClass="accent-primary"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={updateWellness.isPending}
                        className="rounded-xl h-10 px-6 gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {updateWellness.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                        disabled={updateWellness.isPending}
                        className="rounded-xl h-10 px-5 gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CardContent className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: "Stress Level", value: dashboard?.stressLevel ? `${dashboard.stressLevel}/10` : "--" },
                        { label: "Mental Health", value: dashboard?.mentalHealthScore ? `${dashboard.mentalHealthScore}/100` : "--" },
                        { label: "Systolic BP", value: dashboard?.bloodPressureSystolic ? `${dashboard.bloodPressureSystolic} mmHg` : "--" },
                        { label: "Diastolic BP", value: dashboard?.bloodPressureDiastolic ? `${dashboard.bloodPressureDiastolic} mmHg` : "--" },
                      ].map(item => (
                        <div key={item.label} className="bg-muted/30 rounded-2xl p-4 border border-border/50 space-y-1">
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          {dashboardLoading ? (
                            <Skeleton className="h-7 w-16" />
                          ) : (
                            <p className="text-xl font-semibold text-foreground">{item.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <Sparkles className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : activity?.length ? (
                <div className="divide-y divide-border/50">
                  {activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                      <div className="mt-1">
                        {item.type === "mood_logged" && <Heart className="w-5 h-5 text-primary" />}
                        {item.type === "chat_session" && <MessageCircle className="w-5 h-5 text-accent" />}
                        {item.type === "wellness_updated" && <Activity className="w-5 h-5 text-secondary" />}
                        {item.type === "milestone" && <Flame className="w-5 h-5 text-destructive" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No recent activity.</p>
                  <p className="text-sm mt-2">Start by logging your mood today.</p>
                  <Link href="/mood">
                    <Button variant="outline" className="mt-4 rounded-full">Log Mood</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card/50 flex flex-col items-center text-center justify-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">Need someone to talk to?</h3>
            <p className="text-muted-foreground text-sm">Your AI companion is here to listen and reflect with you.</p>
            <Link href="/chat">
              <Button className="rounded-full mt-4 w-full group">
                Start Chat <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function SliderField({ label, value, onChange, min, max, step, formatValue }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  colorClass?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
          {formatValue(value)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground/70">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, loading, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-2 bg-muted/50 rounded-full">{icon}</div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
