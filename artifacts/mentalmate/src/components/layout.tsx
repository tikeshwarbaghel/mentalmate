import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  MessageCircleHeart, 
  SmilePlus, 
  PieChart, 
  Stethoscope, 
  Activity,
  ShieldCheck,
  Settings,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Companion", url: "/chat", icon: MessageCircleHeart },
  { title: "Mood Tracker", url: "/mood", icon: SmilePlus },
  { title: "Weekly Analysis", url: "/analysis", icon: PieChart },
  { title: "Doctors", url: "/doctors", icon: Stethoscope },
  { title: "Symptom Check", url: "/symptoms", icon: Activity },
];

const bottomNavItems = [
  { title: "Privacy", url: "/privacy", icon: ShieldCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background selection:bg-primary/20">
        <Sidebar variant="sidebar" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
          <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-3 px-2 py-1">
              <img src="/logo.svg" alt="MENTALMATE" className="w-7 h-7" />
              <span className="font-semibold tracking-wide text-foreground">MENTALMATE</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Your Space
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        tooltip={item.title}
                        className="gap-3 transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium hover:bg-muted/50 rounded-xl px-3 py-2"
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  {bottomNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        className="gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => signOut()}
                      className="gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate text-foreground">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : "Companion"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </span>
              </div>
            </div>
            <p className="text-[10px] leading-tight text-muted-foreground/70 px-2 text-center">
              MENTALMATE is a supportive wellness companion, not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/40 md:hidden">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          </header>
          <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
