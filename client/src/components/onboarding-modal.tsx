import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-blue-600" />
            <DialogTitle>A quick note about how to use RadIntel</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            RadIntel delivers regulatory, reimbursement and device-safety information for operational decision-making. 
            It is for informational purposes only and is not medical, legal, or financial advice. 
            You may use it to inform operational actions; consult appropriate professionals for clinical or legal decisions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleDismiss} className="w-full">
            Got it — continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}