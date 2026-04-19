import { AppLayout } from "@/components/layout";
import { useUser, useClerk } from "@clerk/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { LogOut, User as UserIcon, Bell, Shield, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "We are preparing your data. A download link will be emailed to you shortly.",
    });
  };

  const handleDelete = () => {
    toast({
      title: "Account Deletion Request",
      description: "Please contact support to permanently delete your account and all associated data.",
      variant: "destructive",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <header className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight"
          >
            Settings
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Manage your account and preferences.
          </motion.p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="rounded-3xl border-border/50 shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24 ring-4 ring-primary/5">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-4 text-center md:text-left flex-1">
                <div>
                  <h3 className="text-xl font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</p>
                </div>
                <div className="pt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50 inline-block">
                  Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-3xl border-border/50 shadow-sm bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>Manage your personal data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start rounded-xl h-12 text-muted-foreground" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-3" />
                  Export My Data
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-xl h-12 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/50 shadow-sm bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                  Session
                </CardTitle>
                <CardDescription>Manage your current session</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => signOut()} 
                  className="w-full rounded-xl h-12"
                  variant="secondary"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
