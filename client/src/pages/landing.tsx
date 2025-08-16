import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, AlertCircle, DollarSign, Clock, Database, Users } from 'lucide-react';

export function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Shield className="h-12 w-12 text-blue-600" />,
      title: "FDA & California Compliance",
      description: "Real-time monitoring of FDA recalls, CDPH alerts, and California RHB regulations specific to radiology."
    },
    {
      icon: <DollarSign className="h-12 w-12 text-green-600" />,
      title: "CMS Payment Intelligence",
      description: "Track CPT code changes and calculate financial impact for your specific modality mix."
    },
    {
      icon: <AlertCircle className="h-12 w-12 text-orange-600" />,
      title: "Smart Alert Prioritization",
      description: "AI-powered scoring ranks alerts by relevance to your devices and California location."
    },
    {
      icon: <Clock className="h-12 w-12 text-purple-600" />,
      title: "Deadline Tracking",
      description: "Never miss MQSA audits or compliance deadlines with automated reminders."
    },
    {
      icon: <Database className="h-12 w-12 text-indigo-600" />,
      title: "Vendor Advisories",
      description: "Security updates and firmware patches for GE, Siemens, Philips, and other major vendors."
    },
    {
      icon: <Users className="h-12 w-12 text-red-600" />,
      title: "Multi-Clinic Support",
      description: "Manage compliance across multiple California locations from a single dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            RadIntel CA
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Regulatory & Operational Intelligence for California Radiology Clinics
          </p>
          <p className="text-lg mb-8">
            Stay ahead of FDA recalls, California state regulations, CMS payment changes, and vendor advisories — all in one intelligent platform designed specifically for radiology.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation('/auth')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation('/pricing')}>
              View Pricing
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Built for California Radiology Clinics
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="p-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-none">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Start Your Free Trial Today
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join leading radiology clinics across California who trust RadIntel for their compliance and regulatory intelligence needs.
            </p>
            <Button size="lg" onClick={() => setLocation('/auth')}>
              Sign Up Now
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer Disclaimer */}
      <footer className="bg-slate-100 dark:bg-slate-900 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Regulatory & operational intelligence for radiology. For informational purposes only — not medical, legal, or financial advice.
          </p>
          <div className="mt-4 space-x-4">
            <button 
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setLocation('/privacy')}
            >
              Privacy Policy
            </button>
            <button 
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setLocation('/terms')}
            >
              Terms of Service
            </button>
            <button 
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setLocation('/legal/disclaimer')}
            >
              Full Disclaimer
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}