import { AppLayout } from "@/components/layout";
import { useGetWeeklyMoodSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Brain, Sparkles, TrendingUp, AlertCircle } from "lucide-react";

const MOOD_COLORS: Record<string, string> = {
  happy: "hsl(142, 71%, 45%)",    // green
  sad: "hsl(226, 71%, 40%)",      // indigo
  stressed: "hsl(24, 98%, 50%)",  // orange
  anxious: "hsl(0, 84%, 60%)",    // red
  calm: "hsl(217, 91%, 60%)",     // blue
  tired: "hsl(215, 16%, 47%)",    // slate
};

export default function AnalysisPage() {
  const { data: summary, isLoading } = useGetWeeklyMoodSummary();

  const moodPieData = summary ? Object.entries(summary.moodCounts).map(([name, value]) => ({
    name,
    value
  })).filter(d => d.value > 0) : [];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <header className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight"
          >
            Weekly Analysis
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Discover your emotional patterns and reflect on your week.
          </motion.p>
        </header>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 rounded-3xl col-span-full" />
            <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-3xl" />
          </div>
        ) : summary ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {/* Insights Card */}
            <Card className="col-span-full bg-primary/5 border-primary/20 shadow-none rounded-3xl overflow-hidden">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-3 text-center md:text-left flex-1">
                  <h2 className="text-xl font-semibold text-foreground">Your Weekly Insight</h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {summary.insight || "Keep logging your moods to uncover deeper insights into your emotional wellbeing."}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                    <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Dominant: <span className="capitalize">{summary.dominantMood || "None"}</span></span>
                    </div>
                    {summary.averageStress != null && (
                      <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">Avg Stress: {summary.averageStress.toFixed(1)}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stress Trends */}
            <Card className="lg:col-span-2 rounded-3xl border-border/50 shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Stress Level Patterns
                </CardTitle>
                <CardDescription>Your reported stress levels over the past 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summary.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                        formatter={(value) => [`${value}/10`, 'Stress Level']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="stressLevel" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--secondary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Mood Distribution */}
            <Card className="rounded-3xl border-border/50 shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChart className="w-5 h-5 text-primary" />
                  Mood Distribution
                </CardTitle>
                <CardDescription>Breakdown of your emotional states</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {moodPieData.length > 0 ? (
                  <>
                    <div className="h-[220px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={moodPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {moodPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || 'hsl(var(--primary))'} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                            itemStyle={{ color: 'var(--foreground)', textTransform: 'capitalize' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-3xl font-semibold text-foreground">{moodPieData.reduce((a, b) => a + b.value, 0)}</span>
                        <span className="text-xs text-muted-foreground">Logs</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {moodPieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-muted/50">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MOOD_COLORS[entry.name] || 'hsl(var(--primary))' }} />
                          <span className="capitalize text-muted-foreground">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                    <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
                    <p>Not enough data yet.<br/>Log your mood to see distribution.</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Unable to load weekly summary.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
