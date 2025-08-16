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
          <DialogTitle>A quick note about using RadIntel</DialogTitle>
          <DialogDescription className="text-base leading-relaxed mt-3">
            RadIntel provides regulatory, reimbursement, and device-safety intelligence 
            to support operational decision-making. It is for informational purposes only 
            and is not medical, legal, or financial advice — consult qualified professionals 
            for clinical or legal decisions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2">
          <Button onClick={handleDismiss} className="w-full">
            Got it — continue
          </Button>
          <a href="/legal/disclaimer" className="text-xs text-center text-muted-foreground hover:underline">
            Read full disclaimer →
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}