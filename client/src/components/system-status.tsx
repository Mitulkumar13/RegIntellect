import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemStatus() {
  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    queryFn: () => api.getStatus(),
    refetchInterval: 30000,
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

  const getStatusColor = (hasErrors: boolean, lastSuccess: Date | null) => {
    if (!lastSuccess) return 'bg-gray-400';
    if (hasErrors) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const dataSources = [
    { key: 'recalls', label: 'FDA openFDA', endpoint: '/api/recalls' },
    { key: 'cms_pfs', label: 'CMS PFS', endpoint: '/api/cms-pfs' },
    { key: 'fedreg', label: 'Federal Register', endpoint: '/api/fedreg' },
  ];

  const aiServices = [
    { label: 'Gemini Normalizer', status: 'Online', color: 'bg-green-500' },
    { label: 'Perplexity Summarizer', status: 'Online', color: 'bg-green-500' },
  ];

  const deliveryServices = [
    { label: 'Email Service', status: 'Online', info: 'Ready', color: 'bg-green-500' },
    { label: 'SMS Service', status: 'Disabled', info: 'Optional', color: 'bg-gray-400' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status & Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Data Sources</h4>
            <div className="space-y-2">
              {dataSources.map((source) => {
                const lastSuccess = status?.lastSuccess[source.key];
                const errorCount = status?.errorCounts24h[source.key] || 0;
                const hasErrors = errorCount > 0;
                
                return (
                  <div key={source.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(hasErrors, lastSuccess)}`} />
                      <span className="text-sm text-gray-700">{source.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(lastSuccess || null)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">AI Services</h4>
            <div className="space-y-2">
              {aiServices.map((service) => (
                <div key={service.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${service.color}`} />
                    <span className="text-sm text-gray-700">{service.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{service.status}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Delivery</h4>
            <div className="space-y-2">
              {deliveryServices.map((service) => (
                <div key={service.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${service.color}`} />
                    <span className="text-sm text-gray-700">{service.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{service.info}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {status && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Uptime:</span>
                <div className="font-medium">
                  {Math.floor(status.uptime / 3600)}h {Math.floor((status.uptime % 3600) / 60)}m
                </div>
              </div>
              <div>
                <span className="text-gray-500">Last Digest:</span>
                <div className="font-medium">{formatTime(status.lastDigestSent)}</div>
              </div>
              <div>
                <span className="text-gray-500">Total Errors (24h):</span>
                <div className="font-medium">
                  {Object.values(status.errorCounts24h).reduce((sum, count) => sum + count, 0)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Last Update:</span>
                <div className="font-medium">{formatTime(status.timestamp)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
