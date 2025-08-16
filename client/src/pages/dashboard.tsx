import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import MetricsGrid from "@/components/metrics-grid";
import FilterControls from "@/components/filter-controls";
import AlertCard from "@/components/alert-card";
import ImpactCalculator from "@/components/impact-calculator";
import SystemStatus from "@/components/system-status";
import { OnboardingModal } from "@/components/onboarding-modal";
import { Info } from "lucide-react";
import type { FilterState, Event } from "@/types";

export default function Dashboard() {
  // Show onboarding modal on first visit
  const [showOnboarding] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    source: 'all',
    dateRange: 'all'
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events', filters],
    queryFn: () => api.getEvents({
      limit: 50,
      category: filters.category !== 'all' ? filters.category : undefined,
      source: filters.source !== 'all' ? filters.source : undefined,
    }),
  });

  const filteredEvents = events.filter((event: Event) => {
    if (filters.category !== 'all' && event.category.toLowerCase() !== filters.category) {
      return false;
    }
    if (filters.source !== 'all' && event.source !== filters.source) {
      return false;
    }
    return true;
  });

  const urgentCount = events.filter((e: Event) => e.category === 'Urgent').length;
  const infoCount = events.filter((e: Event) => e.category === 'Informational').length;
  const digestCount = events.filter((e: Event) => e.category === 'Digest').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Modal */}
      <OnboardingModal />
      
      {/* Dashboard Header with Disclaimer */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>For information only. Not medical advice.</span>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <MetricsGrid />

      {/* Filter Controls */}
      <FilterControls
        onFilterChange={setFilters}
        urgentCount={urgentCount}
        infoCount={infoCount}
        digestCount={digestCount}
      />

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No alerts found matching your filters.</p>
          </div>
        ) : (
          filteredEvents.map((event: Event) => (
            <AlertCard key={event.id} event={event} />
          ))
        )}
      </div>

      {/* Impact Calculator */}
      <ImpactCalculator />

      {/* System Status */}
      <SystemStatus />
    </div>
  );
}
