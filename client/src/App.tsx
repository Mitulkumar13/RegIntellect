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
import { useState, useEffect } from "react";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check authentication status
    fetch('/auth/me')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          if (location !== '/auth') {
            setLocation('/auth');
          }
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        if (location !== '/auth') {
          setLocation('/auth');
        }
      })
      .finally(() => setLoading(false));
  }, [location]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
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
