import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import FilterControls from "@/components/filter-controls";
import AlertCard from "@/components/alert-card";
import type { FilterState, Event } from "@/types";

export default function Alerts() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    source: 'all',
    dateRange: 'all'
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events', filters],
    queryFn: () => api.getEvents({
      limit: 100,
      category: filters.category !== 'all' ? filters.category : undefined,
      source: filters.source !== 'all' ? filters.source : undefined,
    }),
  });

  // Filter to show only non-suppressed alerts
  const activeEvents = events.filter((event: Event) => event.category !== 'Suppressed');

  const filteredEvents = activeEvents.filter((event: Event) => {
    if (filters.category !== 'all' && event.category.toLowerCase() !== filters.category) {
      return false;
    }
    if (filters.source !== 'all' && event.source !== filters.source) {
      return false;
    }
    return true;
  });

  const urgentCount = activeEvents.filter((e: Event) => e.category === 'Urgent').length;
  const infoCount = activeEvents.filter((e: Event) => e.category === 'Informational').length;
  const digestCount = activeEvents.filter((e: Event) => e.category === 'Digest').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Alerts</h1>
        <p className="text-gray-600 mt-2">
          Current regulatory alerts requiring attention ({activeEvents.length} total)
        </p>
      </div>

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
            <p className="text-gray-500">
              {activeEvents.length === 0 
                ? "No active alerts at this time."
                : "No alerts found matching your filters."}
            </p>
          </div>
        ) : (
          filteredEvents.map((event: Event) => (
            <AlertCard key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
