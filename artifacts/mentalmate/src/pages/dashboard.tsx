import { useGetWellnessDashboard, useGetRecentActivity } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Heart, ArrowUpRight, Flame, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: dashboard, isLoading: dashboardLoading } = useGetWellnessDashboard();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

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
                        <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
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
