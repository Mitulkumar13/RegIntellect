import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown,
  Scan,
  MapPin,
  AlertTriangle
} from "lucide-react";
import type { Event } from "@/types";

interface AlertCardProps {
  event: Event;
}

export default function AlertCard({ event }: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: (helpful: boolean) => api.submitFeedback(event.id, helpful),
    onSuccess: () => {
      setFeedbackSubmitted(true);
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'Informational':
        return 'bg-amber-100 text-amber-800';
      case 'Digest':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'openFDA':
        return 'bg-blue-100 text-blue-800';
      case 'CMS':
        return 'bg-green-100 text-green-800';
      case 'Federal Register':
        return 'bg-purple-100 text-purple-800';
      case 'CDPH':
        return 'bg-orange-100 text-orange-800';
      case 'RHB':
        return 'bg-red-100 text-red-800';
      case 'MBC':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBorderColor = (category: string) => {
    switch (category) {
      case 'Urgent':
        return 'border-l-red-500';
      case 'Informational':
        return 'border-l-amber-500';
      case 'Digest':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatFinancialImpact = (delta: { old: number; new: number } | null) => {
    if (!delta) return null;
    
    const impact = delta.new - delta.old;
    const sign = impact >= 0 ? '+' : '';
    const color = impact >= 0 ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`font-medium ${color}`}>
        {sign}${Math.abs(impact).toFixed(2)}/month
      </span>
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Unknown';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return 'Unknown';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateObj);
  };

  return (
    <Card className={`border-l-4 ${getBorderColor(event.category)} border-r border-b border-t border-gray-200`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Badge className={getCategoryColor(event.category)}>
                {event.category.toUpperCase()}
              </Badge>
              <Badge className={getSourceColor(event.source)}>
                {event.source === 'openFDA' ? 'FDA RECALL' : 
                 event.source === 'CMS' ? 'CMS PFS' : 
                 event.source === 'CDPH' ? 'CA HEALTH' :
                 event.source === 'RHB' ? 'CA RADIOLOGY' :
                 event.source === 'MBC' ? 'CA MEDICAL BOARD' :
                 'FEDERAL'}
              </Badge>
              {event.modalityType && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Scan className="h-3 w-3" />
                  {event.modalityType}
                </Badge>
              )}
              <span className="text-sm text-gray-500">{formatTimeAgo(event.archivedAt)}</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  event.category === 'Urgent' ? 'bg-red-500' : 
                  event.category === 'Informational' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs text-gray-600">Score: {event.score}</span>
              </div>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {event.title}
            </h4>
            
            {event.summary && (
              <p className="text-gray-700 mb-3">
                {event.summary}
              </p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              {event.manufacturer && (
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>{event.manufacturer}</span>
                </div>
              )}
              {event.californiaRegion && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.californiaRegion}</span>
                </div>
              )}
              {event.radiologyImpact && (
                <div className="flex items-center space-x-1">
                  <AlertTriangle className={`h-4 w-4 ${
                    event.radiologyImpact === 'High' ? 'text-red-600' :
                    event.radiologyImpact === 'Medium' ? 'text-amber-600' :
                    'text-green-600'
                  }`} />
                  <span className={
                    event.radiologyImpact === 'High' ? 'text-red-600 font-medium' :
                    event.radiologyImpact === 'Medium' ? 'text-amber-600' :
                    ''
                  }>
                    {event.radiologyImpact} Impact
                  </span>
                </div>
              )}
              {event.sourceDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.sourceDate)}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                {formatFinancialImpact(event.delta) || <span className="text-gray-600">Impact TBD</span>}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 ml-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => feedbackMutation.mutate(true)}
              disabled={feedbackSubmitted || feedbackMutation.isPending}
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              Helpful
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => feedbackMutation.mutate(false)}
              disabled={feedbackSubmitted || feedbackMutation.isPending}
              className="hover:bg-gray-100"
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              Not Helpful
            </Button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:text-primary/80 p-0 h-auto"
              >
                <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                View Details & Sources
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Source:</strong> {event.source}<br />
                    <strong>Event ID:</strong> {event.sourceId}<br />
                    {event.classification && (
                      <>
                        <strong>Classification:</strong> {event.classification}<br />
                      </>
                    )}
                    {event.reasons.length > 0 && (
                      <>
                        <strong>Scoring Reasons:</strong><br />
                        <ul className="list-disc list-inside mt-1">
                          {event.reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <div>
                    {event.deviceName && (
                      <>
                        <strong>Device:</strong> {event.deviceName}<br />
                      </>
                    )}
                    {event.model && (
                      <>
                        <strong>Model:</strong> {event.model}<br />
                      </>
                    )}
                    {event.reason && (
                      <>
                        <strong>Reason:</strong> {event.reason}<br />
                      </>
                    )}
                    {event.cptCodes && event.cptCodes.length > 0 && (
                      <>
                        <strong>CPT Codes:</strong> {event.cptCodes.join(', ')}<br />
                      </>
                    )}
                    {event.delta && (
                      <>
                        <strong>Rate Change:</strong> ${event.delta.old} → ${event.delta.new}<br />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
