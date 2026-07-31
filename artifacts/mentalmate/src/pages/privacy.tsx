import { AppLayout } from "@/components/layout";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Trash2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="space-y-10 max-w-3xl mx-auto">
        <header className="space-y-4 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight"
          >
            Privacy & Trust
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            Your mental health data is deeply personal. We treat it with the highest level of care and respect.
          </motion.p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <section className="bg-card border border-border/50 rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 text-secondary">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Data Protection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All your mood logs, chat history, and wellness data are encrypted in transit and at rest. We do not sell your personal information or health data to third parties, advertising networks, or data brokers.
                </p>
              </div>
            </div>

            <div className="h-px bg-border/50 w-full" />

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0 text-accent-foreground">
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Data Collection & Usage</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect only what is necessary to provide you with the MENTALMATE service:
                </p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-2">
                  <li>Account information (name, email) for authentication.</li>
                  <li>Mood logs and chat messages to generate insights and provide AI companionship.</li>
                  <li>Usage data to improve the app experience and ensure the service is running smoothly.</li>
                </ul>
              </div>
            </div>

            <div className="h-px bg-border/50 w-full" />

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Your Rights & Deletion</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You own your data. You have the right to request a full export of your personal information, or request the permanent deletion of your account and all associated data at any time through the Settings page.
                </p>
              </div>
            </div>
          </section>

          <p className="text-sm text-center text-muted-foreground/70 px-6">
            By using MENTALMATE, you acknowledge that this is a supportive tool and not a replacement for professional healthcare. In an emergency, please contact local emergency services or a crisis lifeline.
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}

