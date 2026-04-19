import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Sparkles, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="absolute top-0 w-full p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-primary">
          <img src="/logo.svg" alt="MENTALMATE" className="w-8 h-8" />
          <span className="font-semibold tracking-wide text-lg">MENTALMATE</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-full px-6 shadow-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary-foreground text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Your personal space for emotional wellbeing</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-[1.1]">
            A quiet room for your <br/>
            <span className="text-primary italic font-serif font-medium">mind to rest.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            MENTALMATE is your intimate digital sanctuary. Track your mood, reflect on your days, and find gentle support when you need it most.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="rounded-full px-8 text-base h-14 shadow-md group">
                Begin Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full px-4">
          <FeatureCard
            icon={<Heart className="w-6 h-6 text-destructive" />}
            title="Non-judgmental support"
            description="An AI companion ready to listen, reflect, and guide you through difficult moments without judgment."
            delay={0.2}
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6 text-primary" />}
            title="Meaningful insights"
            description="Understand your emotional patterns over time with gentle, beautifully visualized daily tracking."
            delay={0.4}
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-secondary" />}
            title="A safe sanctuary"
            description="Your thoughts are private and protected. A deeply personal space designed just for you."
            delay={0.6}
          />
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>MENTALMATE is a supportive wellness companion, not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="p-8 rounded-3xl bg-card border shadow-sm flex flex-col items-center text-center space-y-4 hover-elevate"
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
