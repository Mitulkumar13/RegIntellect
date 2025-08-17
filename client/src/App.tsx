import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Alerts from "@/pages/alerts";
import Archive from "@/pages/archive";
import Tools from "@/pages/tools";
import Status from "@/pages/status";
import NotFound from "@/pages/not-found";
import { AuthPage } from "@/pages/auth";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import LegalDisclaimer from "@/pages/legal-disclaimer";
import Disclaimer from "@/pages/disclaimer";
import { useState, useEffect } from "react";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Public pages that don't require authentication
    const publicPages = ['/', '/pricing', '/legal/disclaimer', '/about', '/contact', '/privacy', '/terms', '/auth'];
    const isPublicPage = publicPages.some(page => location === page || location.startsWith('/legal/'));
    
    if (isPublicPage) {
      setLoading(false);
      return;
    }

    // Check authentication status for protected pages
    fetch('/auth/me')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          if (!isPublicPage) {
            setLocation('/auth');
          }
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        if (!isPublicPage) {
          setLocation('/auth');
        }
      })
      .finally(() => setLoading(false));
  }, [location]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Public routes
  if (location === '/') return <Landing />;
  if (location === '/pricing') return <Pricing />;
  if (location === '/about') return <About />;
  if (location === '/contact') return <Contact />;
  if (location === '/privacy') return <Privacy />;
  if (location === '/terms') return <Terms />;
  if (location === '/legal/disclaimer') return <Disclaimer />;
  if (location === '/auth') return <AuthPage />;

  // Protected routes require authentication
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/archive" component={Archive} />
        <Route path="/tools" component={Tools} />
        <Route path="/status" component={Status} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
