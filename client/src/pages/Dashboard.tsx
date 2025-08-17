import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Building2, Activity, FileText } from 'lucide-react';

interface DashboardData {
  activeAlerts: number;
  overdueCompliance: number;
  devicesCount: number;
  cptProfilesCount: number;
  recentAlerts: any[];
  upcomingCompliance: any[];
}

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/clinics/dashboard'],
    enabled: true
  });

  const { data: systemStatus } = useQuery({
    queryKey: ['/api/status']
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 animate-pulse mb-1"></div>
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = [
    {
      title: "Active Alerts",
      value: dashboardData?.activeAlerts || 0,
      description: "Unacknowledged alerts requiring attention",
      icon: AlertTriangle,
      trend: dashboardData?.activeAlerts && dashboardData.activeAlerts > 5 ? "high" : "normal"
    },
    {
      title: "Equipment",
      value: dashboardData?.devicesCount || 0,
      description: "Registered imaging devices",
      icon: Activity,
      trend: "normal"
    },
    {
      title: "CPT Profiles",
      value: dashboardData?.cptProfilesCount || 0,
      description: "Configured procedure codes",
      icon: FileText,
      trend: "normal"
    },
    {
      title: "Compliance Items",
      value: dashboardData?.overdueCompliance || 0,
      description: "Items requiring attention",
      icon: Clock,
      trend: dashboardData?.overdueCompliance && dashboardData.overdueCompliance > 0 ? "high" : "good"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            California radiology compliance and regulatory intelligence
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {systemStatus?.lastSuccess && (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              System Active
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${
                stat.trend === 'high' ? 'text-red-500' : 
                stat.trend === 'good' ? 'text-green-500' : 
                'text-muted-foreground'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>
              Latest regulatory and compliance notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData?.recentAlerts?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No recent alerts
              </div>
            ) : (
              dashboardData?.recentAlerts?.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <Badge variant={
                      alert.priority === 'CRITICAL' ? 'destructive' :
                      alert.priority === 'HIGH' ? 'default' :
                      alert.priority === 'MEDIUM' ? 'secondary' : 'outline'
                    }>
                      {alert.priority}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.source} • {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                    {alert.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {alert.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            {(dashboardData?.activeAlerts || 0) > 0 && (
              <div className="pt-3">
                <Button variant="outline" size="sm" className="w-full" data-testid="view-all-alerts">
                  View All Alerts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Calendar</CardTitle>
            <CardDescription>
              Upcoming compliance deadlines and renewals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData?.upcomingCompliance?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No upcoming compliance items
              </div>
            ) : (
              dashboardData?.upcomingCompliance?.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.type} • Due: {new Date(item.dueDate).toLocaleDateString()}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                </div>
              ))
            )}
            {(dashboardData?.overdueCompliance || 0) > 0 && (
              <div className="pt-3">
                <Button variant="outline" size="sm" className="w-full" data-testid="view-compliance">
                  View All Compliance Items
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Data collection and monitoring system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {systemStatus ? (
              Object.entries(systemStatus.lastSuccess || {}).map(([source, lastSuccess]) => (
                <div key={source} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium capitalize">{source.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {lastSuccess ? 
                        `Last updated: ${new Date(lastSuccess as string).toLocaleString()}` :
                        'No recent updates'
                      }
                    </p>
                  </div>
                  <div>
                    <Badge variant={lastSuccess ? "default" : "secondary"}>
                      {lastSuccess ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-4 text-muted-foreground">
                Loading system status...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}