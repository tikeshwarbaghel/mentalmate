import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { useEffect, useRef } from "react";

import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import ChatPage from "@/pages/chat";
import MoodPage from "@/pages/mood";
import AnalysisPage from "@/pages/analysis";
import DoctorsPage from "@/pages/doctors";
import SymptomsPage from "@/pages/symptoms";
import PrivacyPage from "@/pages/privacy";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: any) {
  return (
    <>
      <Show when="signed-in"><Component /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(261, 40%, 76%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInputBackground: "hsl(0, 0%, 98%)",
    colorText: "hsl(215, 25%, 27%)",
    colorTextSecondary: "hsl(215, 16%, 47%)",
    colorInputText: "hsl(215, 25%, 27%)",
    colorNeutral: "hsl(214, 32%, 91%)",
    borderRadius: "1rem",
    fontFamily: "Inter, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-lg rounded-2xl w-full overflow-hidden border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(215, 25%, 27%)" },
    headerSubtitle: { color: "hsl(215, 16%, 47%)" },
    socialButtonsBlockButtonText: { color: "hsl(215, 25%, 27%)" },
    formFieldLabel: { color: "hsl(215, 25%, 27%)" },
    footerActionLink: { color: "hsl(261, 40%, 76%)" },
    footerActionText: { color: "hsl(215, 16%, 47%)" },
    dividerText: { color: "hsl(215, 16%, 47%)" },
    formFieldSuccessText: { color: "hsl(84, 14%, 53%)" },
    alertText: { color: "hsl(0, 73%, 67%)" },
  },
};

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return <div className="p-4 text-destructive">Missing Clerk Publishable Key</div>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
            <Route path="/chat"><ProtectedRoute component={ChatPage} /></Route>
            <Route path="/mood"><ProtectedRoute component={MoodPage} /></Route>
            <Route path="/analysis"><ProtectedRoute component={AnalysisPage} /></Route>
            <Route path="/doctors"><ProtectedRoute component={DoctorsPage} /></Route>
            <Route path="/symptoms"><ProtectedRoute component={SymptomsPage} /></Route>
            <Route path="/privacy"><ProtectedRoute component={PrivacyPage} /></Route>
            <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>

            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
