import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Info, 
  DollarSign, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Scan,
  MapPin
} from "lucide-react";

export default function MetricsGrid() {
  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => api.getEvents({ limit: 100 }),
  });

  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    queryFn: () => api.getStatus(),
  });

  const urgentCount = events.filter(e => e.category === 'Urgent').length;
  const infoCount = events.filter(e => e.category === 'Informational').length;
  
  // California-specific metrics
  const californiaAlerts = events.filter(e => 
    ['CDPH', 'RHB', 'MBC'].includes(e.source) || e.state === 'CA'
  ).length;
  
  // Count by modality type
  const radiologyDevices = events.filter(e => e.modalityType).length;
  
  // Calculate financial impact from recent CMS events
  const cmsEvents = events.filter(e => e.source === 'CMS' && e.delta);
  const totalImpact = cmsEvents.reduce((sum, event) => {
    if (event.delta) {
      return sum + (event.delta.new - event.delta.old);
    }
    return sum;
  }, 0);
  
  const estimatedMonthlyImpact = totalImpact * 30; // Rough estimate for demo

  const systemHealth = status && Object.values(status.errorCounts24h).every(count => count === 0) ? 99.2 : 85.5;

  const recentUrgent = events.filter(e => {
    if (e.category !== 'Urgent') return false;
    const eventDate = new Date(e.archivedAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return eventDate > yesterday;
  }).length;

  const metrics = [
    {
      title: "CA Urgent Alerts",
      value: urgentCount.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      trend: recentUrgent > 0 ? "up" : "none",
      trendText: recentUrgent > 0 ? `${recentUrgent} new today` : "No change",
      trendColor: recentUrgent > 0 ? "text-red-500" : "text-gray-400"
    },
    {
      title: "CA Compliance", 
      value: californiaAlerts.toString(),
      icon: MapPin,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "none",
      trendText: "California-specific",
      trendColor: "text-blue-500"
    },
    {
      title: "Radiology Devices",
      value: radiologyDevices.toString(),
      icon: Scan,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: "none",
      trendText: "Device alerts",
      trendColor: "text-purple-500"
    },
    {
      title: "CPT Impact",
      value: estimatedMonthlyImpact >= 0 
        ? `+$${Math.abs(estimatedMonthlyImpact).toFixed(0)}`
        : `-$${Math.abs(estimatedMonthlyImpact).toFixed(0)}`,
      icon: DollarSign,
      color: estimatedMonthlyImpact >= 0 ? "text-green-600" : "text-red-600",
      bgColor: estimatedMonthlyImpact >= 0 ? "bg-green-100" : "bg-red-100",
      trend: estimatedMonthlyImpact >= 0 ? "down" : "up",
      trendText: "Monthly estimate",
      trendColor: estimatedMonthlyImpact >= 0 ? "text-green-500" : "text-red-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
              </div>
              <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                <metric.icon className={`${metric.color} text-xl`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {metric.trend === "up" && <TrendingUp className={`h-4 w-4 mr-1 ${metric.trendColor}`} />}
              {metric.trend === "down" && <TrendingDown className={`h-4 w-4 mr-1 ${metric.trendColor}`} />}
              {metric.trend === "none" && <Minus className={`h-4 w-4 mr-1 ${metric.trendColor}`} />}
              <span className="text-gray-500">{metric.trendText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
