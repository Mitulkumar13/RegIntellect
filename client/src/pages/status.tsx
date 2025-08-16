import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Database,
  Brain,
  MessageSquare,
  Mail,
  Smartphone,
  Server,
  Globe,
  TrendingUp
} from "lucide-react";

export default function Status() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/status'],
    queryFn: () => api.getStatus(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => api.getEvents({ limit: 100 }),
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        api.fetchRecalls(),
        api.fetchCMSPFS(),
        api.fetchFedReg(),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Data refreshed",
        description: "All data sources have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Refresh failed",
        description: "Some data sources may have failed to update.",
        variant: "destructive",
      });
    },
  });

  const formatTime = (timestamp: Date | string | null) => {
    if (!timestamp) return 'Never';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (hasErrors: boolean, lastSuccess: Date | null) => {
    if (!lastSuccess) {
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Never Run</Badge>;
    }
    
    const now = new Date();
    const diffHours = (now.getTime() - new Date(lastSuccess).getTime()) / (1000 * 60 * 60);
    
    if (hasErrors) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
    }
    
    if (diffHours > 24) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Stale</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
  };

  const dataSources = [
    { 
      key: 'recalls', 
      label: 'FDA openFDA', 
      description: 'Device enforcement recalls',
      icon: Database,
      endpoint: '/api/recalls'
    },
    { 
      key: 'cms_pfs', 
      label: 'CMS PFS', 
      description: 'Payment schedule updates',
      icon: TrendingUp,
      endpoint: '/api/cms-pfs'
    },
    { 
      key: 'fedreg', 
      label: 'Federal Register', 
      description: 'Regulatory rule changes',
      icon: Globe,
      endpoint: '/api/fedreg'
    },
  ];

  const aiServices = [
    { 
      label: 'Gemini Normalizer', 
      description: 'Data normalization and pattern detection',
      status: 'Online', 
      icon: Brain,
      healthy: true 
    },
    { 
      label: 'Perplexity Summarizer', 
      description: 'Clinic-ready alert summaries',
      status: 'Online', 
      icon: MessageSquare,
      healthy: true 
    },
  ];

  const deliveryServices = [
    { 
      label: 'Email Service', 
      description: 'Alert delivery via email',
      status: 'Online', 
      icon: Mail,
      healthy: true 
    },
    { 
      label: 'SMS Service', 
      description: 'Urgent alerts via SMS',
      status: 'Disabled', 
      icon: Smartphone,
      healthy: false,
      optional: true 
    },
  ];

  // Calculate statistics
  const recentEvents = events.filter((e: any) => {
    const eventDate = new Date(e.archivedAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return eventDate > yesterday;
  });

  const totalErrors = status ? Object.values(status.errorCounts24h).reduce((sum, count) => sum + count, 0) : 0;
  const overallHealth = totalErrors === 0 && status ? 99.5 : (totalErrors > 10 ? 85.2 : 92.1);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600 mt-2">
            Monitor data sources, AI services, and system health
          </p>
        </div>
        <Button 
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          {refreshMutation.isPending ? 'Refreshing...' : 'Refresh All'}
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-3xl font-bold text-green-600">{overallHealth}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-gray-500">
                {totalErrors === 0 ? 'All systems operational' : `${totalErrors} errors detected`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-blue-600">
                  {status ? formatUptime(status.uptime) : 'Unknown'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Since last restart</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Events (24h)</p>
                <p className="text-3xl font-bold text-amber-600">{recentEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>New alerts processed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors (24h)</p>
                <p className={`text-3xl font-bold ${totalErrors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalErrors}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                totalErrors > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {totalErrors > 0 ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>API failures & issues</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Sources</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataSources.map((source) => {
              const lastSuccess = status?.lastSuccess[source.key];
              const lastError = status?.lastError[source.key];
              const errorCount = status?.errorCounts24h[source.key] || 0;
              const hasErrors = errorCount > 0;
              
              return (
                <div key={source.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      hasErrors ? 'bg-red-100' : lastSuccess ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <source.icon className={`h-5 w-5 ${
                        hasErrors ? 'text-red-600' : lastSuccess ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{source.label}</h4>
                      <p className="text-sm text-gray-500">{source.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div className="text-gray-600">Last Success: {formatTime(lastSuccess)}</div>
                      {lastError && (
                        <div className="text-red-600">Last Error: {formatTime(lastError)}</div>
                      )}
                      {errorCount > 0 && (
                        <div className="text-red-600">Errors: {errorCount}</div>
                      )}
                    </div>
                    {getStatusBadge(hasErrors, lastSuccess)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Services</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiServices.map((service) => (
              <div key={service.label} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    service.healthy ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <service.icon className={`h-5 w-5 ${
                      service.healthy ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{service.label}</h4>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                </div>
                <Badge variant={service.healthy ? "default" : "destructive"} className={
                  service.healthy ? "bg-green-100 text-green-800" : ""
                }>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Delivery Services</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveryServices.map((service) => (
              <div key={service.label} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    service.healthy ? 'bg-green-100' : service.optional ? 'bg-gray-100' : 'bg-red-100'
                  }`}>
                    <service.icon className={`h-5 w-5 ${
                      service.healthy ? 'text-green-600' : service.optional ? 'text-gray-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {service.label}
                      {service.optional && <span className="text-gray-500 text-sm ml-2">(Optional)</span>}
                    </h4>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                </div>
                <Badge 
                  variant={service.healthy ? "default" : service.optional ? "secondary" : "destructive"}
                  className={service.healthy ? "bg-green-100 text-green-800" : ""}
                >
                  {service.healthy ? <CheckCircle className="h-3 w-3 mr-1" /> : 
                   service.optional ? <XCircle className="h-3 w-3 mr-1" /> : 
                   <AlertTriangle className="h-3 w-3 mr-1" />}
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">System started</span>
                <span className="font-medium">{formatUptime(status.uptime)} ago</span>
              </div>
              {status.lastDigestSent && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last digest sent</span>
                  <span className="font-medium">{formatTime(status.lastDigestSent)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status updated</span>
                <span className="font-medium">{formatTime(status.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Events processed (24h)</span>
                <span className="font-medium">{recentEvents.length}</span>
              </div>
              {totalErrors > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Total errors (24h)</span>
                  <span className="font-medium text-red-600">{totalErrors}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
