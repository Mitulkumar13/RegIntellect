import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import FilterControls from "@/components/filter-controls";
import AlertCard from "@/components/alert-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { FilterState, Event } from "@/types";

export default function Archive() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    source: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(50);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events', filters, limit],
    queryFn: () => api.getEvents({
      limit,
      category: filters.category !== 'all' ? filters.category : undefined,
      source: filters.source !== 'all' ? filters.source : undefined,
    }),
  });

  const filteredEvents = events.filter((event: Event) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!event.title.toLowerCase().includes(searchLower) &&
          !event.summary?.toLowerCase().includes(searchLower) &&
          !event.manufacturer?.toLowerCase().includes(searchLower) &&
          !event.deviceName?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Category filter
    if (filters.category !== 'all' && event.category.toLowerCase() !== filters.category) {
      return false;
    }

    // Source filter
    if (filters.source !== 'all' && event.source !== filters.source) {
      return false;
    }

    return true;
  });

  const urgentCount = events.filter((e: Event) => e.category === 'Urgent').length;
  const infoCount = events.filter((e: Event) => e.category === 'Informational').length;
  const digestCount = events.filter((e: Event) => e.category === 'Digest').length;
  const suppressedCount = events.filter((e: Event) => e.category === 'Suppressed').length;

  const loadMore = () => {
    setLimit(prev => prev + 50);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
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
        <h1 className="text-3xl font-bold text-gray-900">Alert Archive</h1>
        <p className="text-gray-600 mt-2">
          Historical regulatory alerts and events ({events.length} loaded)
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search alerts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Enhanced Filter Controls (includes Suppressed) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Filter Archives</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex space-x-2">
              <Button
                variant={filters.category === 'urgent' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, category: prev.category === 'urgent' ? 'all' : 'urgent' }))}
                className={filters.category === 'urgent' ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" : ""}
              >
                Urgent ({urgentCount})
              </Button>
              <Button
                variant={filters.category === 'informational' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, category: prev.category === 'informational' ? 'all' : 'informational' }))}
                className={filters.category === 'informational' ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200" : ""}
              >
                Informational ({infoCount})
              </Button>
              <Button
                variant={filters.category === 'digest' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, category: prev.category === 'digest' ? 'all' : 'digest' }))}
                className={filters.category === 'digest' ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" : ""}
              >
                Digest ({digestCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
              >
                All
              </Button>
            </div>
          </div>
        </div>
        {suppressedCount > 0 && (
          <div className="mt-3 text-sm text-gray-500">
            Note: {suppressedCount} suppressed alerts are not shown (score &lt; 50)
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm 
                ? "No alerts found matching your search."
                : "No alerts found matching your filters."}
            </p>
          </div>
        ) : (
          <>
            {filteredEvents.map((event: Event) => (
              <AlertCard key={event.id} event={event} />
            ))}
            
            {events.length >= limit && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  Load More Events
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
