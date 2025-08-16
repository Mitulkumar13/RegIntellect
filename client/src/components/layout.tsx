import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Scan, 
  LayoutDashboard, 
  Bell, 
  Archive, 
  Calculator, 
  Activity,
  RefreshCw,
  BellRing,
  MapPin
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => api.getEvents({ limit: 100 }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    queryFn: () => api.getStatus(),
    refetchInterval: 30000,
  });

  const urgentCount = events.filter(e => e.category === 'Urgent').length;
  const totalAlerts = events.filter(e => e.category !== 'Suppressed').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Fetch both federal and California sources
      await Promise.all([
        // Federal sources
        api.fetchRecalls(),
        api.fetchCMSPFS(),
        api.fetchFedReg(),
        api.fetchDrugRecalls(),
        api.fetchMAUDE(),
        // California sources
        api.fetchCaliforniaCDPH(),
        api.fetchCaliforniaRHB(),
        api.fetchCaliforniaMBC(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const navigationItems = [
    { href: "/dashboard", label: "Radiology Dashboard", icon: LayoutDashboard, active: location === "/" || location === "/dashboard" },
    { href: "/alerts", label: "Alerts", icon: Bell, badge: totalAlerts },
    { href: "/archive", label: "Archive", icon: Archive },
    { href: "/tools", label: "CPT Calculator", icon: Calculator },
    { href: "/status", label: "System Status", icon: Activity },
  ];

  const getStatusColor = () => {
    if (!status) return "bg-gray-500";
    const hasErrors = Object.values(status.errorCounts24h).some(count => count > 0);
    return hasErrors ? "bg-yellow-500" : "bg-green-500";
  };

  const formatLastUpdate = () => {
    if (!status) return "Unknown";
    
    const timestamps = Object.values(status.lastSuccess).filter(Boolean);
    if (timestamps.length === 0) return "Never";
    
    const latest = new Date(Math.max(...timestamps.map(t => new Date(t!).getTime())));
    const now = new Date();
    const diffMs = now.getTime() - latest.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Scan className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">RadIntel CA</h1>
              <p className="text-xs text-gray-500">Federal & California Compliance</p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <MapPin className="h-3 w-3 mr-1" />
            <span>California + Federal Sources</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant={item.label === "Active Alerts" && urgentCount > 0 ? "destructive" : "secondary"}
                    className="ml-auto"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Last Update</div>
            <div className="text-sm font-medium text-gray-900">{formatLastUpdate()}</div>
            <div className="flex items-center mt-2">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
              <span className="text-xs text-gray-600 ml-2">
                {Object.values(status?.errorCounts24h || {}).some(count => count > 0)
                  ? "Issues detected"
                  : "All systems operational"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Regulatory Dashboard</h2>
              <p className="text-gray-600">Monitor FDA, CMS, and Federal Register updates</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-primary hover:bg-primary/90"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
              <div className="relative">
                <Button variant="ghost" size="icon">
                  <BellRing className="h-5 w-5" />
                  {urgentCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
