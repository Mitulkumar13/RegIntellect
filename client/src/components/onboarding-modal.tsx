import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Zap, Users } from "lucide-react";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the onboarding modal
    const hasSeenOnboarding = localStorage.getItem('radintel-onboarding-seen');
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('radintel-onboarding-seen', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl" data-testid="onboarding-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-500" />
            Welcome to RadIntel CA
          </DialogTitle>
          <DialogDescription className="text-lg">
            Regulatory and operational intelligence designed for radiology practices in California
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Regulatory Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  FDA device recalls, CMS payment changes, and California state regulations
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Smart Scoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Intelligent prioritization based on relevance and urgency
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Radiology-Focused</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Built specifically for imaging practices and their unique needs
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Privacy by Design</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Zero PHI exposure - all data from public regulatory sources
                </p>
              </div>
            </div>
          </div>

          {/* Important Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Important Notice
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  RadIntel delivers regulatory, reimbursement and device-safety information for 
                  operational decision-making. It is for informational purposes only and is not 
                  medical, legal, or financial advice.
                </p>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="space-y-3">
            <h3 className="font-medium">Getting Started:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>Review alerts on your dashboard - they're categorized by urgency</li>
              <li>Use the CPT volume calculator in Tools to assess financial impact</li>
              <li>Configure your settings for email notifications and modality preferences</li>
              <li>Check the status page for robot health and data freshness</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Remind me later
          </Button>
          <Button onClick={handleComplete} data-testid="button-complete-onboarding">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}