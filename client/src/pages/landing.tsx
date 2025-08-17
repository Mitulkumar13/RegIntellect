import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Bell, DollarSign, FileText, Activity, MapPin } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">RadIntel</h1>
            <p className="text-xs text-muted-foreground">California Regulatory Intelligence</p>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm hover:text-primary">Pricing</Link>
            <Link href="/about" className="text-sm hover:text-primary">About</Link>
            <Link href="/contact" className="text-sm hover:text-primary">Contact</Link>
            <Link href="/privacy" className="text-sm hover:text-primary">Privacy</Link>
            <Link href="/terms" className="text-sm hover:text-primary">Terms</Link>
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Radiology Regulatory & Operational Intelligence
          </h2>
          <p className="text-xl text-muted-foreground mb-2">
            California + Federal Coverage
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            Regulatory & operational intelligence for radiology. 
            For informational purposes only — not medical, legal, or financial advice.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">
          Comprehensive Regulatory Monitoring
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h4 className="font-semibold mb-2">FDA Device Recalls</h4>
              <p className="text-sm text-muted-foreground">
                Real-time monitoring of radiology device recalls with MAUDE signal tracking
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <DollarSign className="h-10 w-10 text-primary mb-4" />
              <h4 className="font-semibold mb-2">CMS Payment Updates</h4>
              <p className="text-sm text-muted-foreground">
                Track CPT code changes with financial impact calculator
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <MapPin className="h-10 w-10 text-primary mb-4" />
              <h4 className="font-semibold mb-2">California Compliance</h4>
              <p className="text-sm text-muted-foreground">
                CDPH, RHB, and MBC regulatory updates specific to California
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <FileText className="h-10 w-10 text-primary mb-4" />
              <h4 className="font-semibold mb-2">Federal Register</h4>
              <p className="text-sm text-muted-foreground">
                CMS rules, deadlines, and effective dates tracking
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <Bell className="h-10 w-10 text-primary mb-4" />
              <h4 className="font-semibold mb-2">Smart Alerts</h4>
              <p className="text-sm text-muted-foreground">
                AI-powered summarization with categorized urgency levels
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <Activity className="h-10 w-10 text-primary mb-4" />
              <h4 className="font-semibold mb-2">Vendor Advisories</h4>
              <p className="text-sm text-muted-foreground">
                Security and firmware updates from major equipment manufacturers
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary/10 dark:bg-primary/20 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Start Your Free Trial Today
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join leading radiology clinics in California using RadIntel for regulatory compliance and operational intelligence.
          </p>
          <Link href="/auth">
            <Button size="lg" className="px-12">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">RadIntel</h4>
              <p className="text-sm text-muted-foreground">
                Regulatory & operational intelligence for radiology.
              </p>
            </div>
            <div>
              <h5 className="font-medium mb-3">Product</h5>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-primary">
                  Pricing
                </Link>
                <Link href="/about" className="block text-sm text-muted-foreground hover:text-primary">
                  About
                </Link>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-3">Legal</h5>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
                <Link href="/legal/disclaimer" className="block text-sm text-muted-foreground hover:text-primary">
                  Disclaimer
                </Link>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-3">Contact</h5>
              <Link href="/contact" className="block text-sm text-muted-foreground hover:text-primary">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 RadIntel. For informational purposes only — not medical, legal, or financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}