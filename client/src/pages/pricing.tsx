import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "For individual radiologists",
      features: [
        "FDA device recalls",
        "Basic email alerts",
        "5 saved filters",
        "7-day history",
        "Community support"
      ],
      notIncluded: [
        "AI summaries",
        "SMS alerts",
        "API access",
        "Priority support"
      ],
      cta: "Start Free",
      href: "/auth"
    },
    {
      name: "Starter",
      price: "$99",
      period: "per month",
      description: "For small clinics",
      popular: true,
      features: [
        "Everything in Free",
        "AI-powered summaries",
        "Unlimited saved filters",
        "90-day history",
        "Email + SMS alerts",
        "5 team members",
        "Email support"
      ],
      notIncluded: [
        "API access",
        "Custom integrations"
      ],
      cta: "Start Trial",
      href: "/auth"
    },
    {
      name: "Pro",
      price: "$299",
      period: "per month",
      description: "For multi-site practices",
      features: [
        "Everything in Starter",
        "Unlimited team members",
        "API access",
        "Custom integrations",
        "1-year history",
        "Priority support",
        "Custom training",
        "SLA guarantee"
      ],
      notIncluded: [],
      cta: "Contact Sales",
      href: "/contact"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="cursor-pointer">
              <h1 className="text-2xl font-bold text-primary">RadIntel</h1>
              <p className="text-xs text-muted-foreground">California Regulatory Intelligence</p>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/about" className="text-sm hover:text-primary">About</Link>
            <Link href="/contact" className="text-sm hover:text-primary">Contact</Link>
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your practice
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 opacity-50">
                      <X className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href={plan.href}>
                  <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Can I change plans later?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Do you offer discounts for multiple clinics?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, we offer volume discounts for practices with 5+ locations. Contact our sales team for details.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is there a setup fee?</h4>
              <p className="text-sm text-muted-foreground">
                No, there are no setup fees for any plan. You can start using RadIntel immediately after signing up.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards and ACH transfers for annual plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-xs text-muted-foreground">
            © 2025 RadIntel. For informational purposes only — not medical, legal, or financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}