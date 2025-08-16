import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import type { FilterState } from "@/types";

interface FilterControlsProps {
  onFilterChange: (filters: FilterState) => void;
  urgentCount: number;
  infoCount: number;
  digestCount: number;
}

export default function FilterControls({ 
  onFilterChange, 
  urgentCount, 
  infoCount, 
  digestCount 
}: FilterControlsProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    source: 'all',
    dateRange: 'all'
  });

  const handleCategoryChange = (category: FilterState['category']) => {
    const newFilters = { ...filters, category };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSourceChange = (source: string) => {
    const newFilters = { ...filters, source: source as FilterState['source'] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const categoryButtons = [
    { key: 'urgent', label: `Urgent (${urgentCount})`, active: filters.category === 'urgent', variant: 'urgent' },
    { key: 'informational', label: `Informational (${infoCount})`, active: filters.category === 'informational', variant: 'info' },
    { key: 'digest', label: `Digest (${digestCount})`, active: filters.category === 'digest', variant: 'digest' },
    { key: 'all', label: 'All', active: filters.category === 'all', variant: 'default' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex space-x-2">
            {categoryButtons.map((button) => (
              <Button
                key={button.key}
                variant={button.active ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(button.key as FilterState['category'])}
                className={
                  button.active && button.variant === 'urgent'
                    ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                    : button.active && button.variant === 'info'
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                    : button.active && button.variant === 'digest'
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                    : ""
                }
              >
                {button.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filters.source} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="openFDA">FDA Recalls</SelectItem>
                <SelectItem value="CMS">CMS PFS</SelectItem>
                <SelectItem value="Federal Register">Federal Register</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
