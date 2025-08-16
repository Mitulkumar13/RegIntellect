import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LegalDisclaimer() {
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
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Legal Disclaimer</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Informational Use Only</h2>
            <p className="text-muted-foreground leading-relaxed">
              RadIntel ("the Service") provides regulatory, reimbursement, and device-safety intelligence 
              to support operational decision-making in radiology practices. All information provided through 
              the Service is for informational purposes only and is not intended to be, nor should it be 
              construed as, medical advice, legal counsel, or financial guidance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Not Medical Advice</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service does not provide medical advice. All content related to medical devices, 
              drug recalls, or clinical practices is presented for informational and operational 
              awareness only. Clinical decisions should always be made in consultation with qualified 
              healthcare professionals based on individual patient needs and circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Not Legal Advice</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service provides information about regulatory requirements and compliance matters 
              for general informational purposes. This information does not constitute legal advice 
              and should not be relied upon as such. For specific legal questions or compliance 
              concerns, please consult with qualified legal counsel familiar with healthcare 
              regulations in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Not Financial Advice</h2>
            <p className="text-muted-foreground leading-relaxed">
              Any financial calculations, reimbursement estimates, or economic impact analyses 
              provided by the Service are for informational purposes only. These should not be 
              considered financial advice or used as the sole basis for financial decisions. 
              Consult with qualified financial advisors for specific financial planning and 
              decision-making.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Sources and Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service aggregates information from various public sources including FDA, CMS, 
              state regulatory agencies, and equipment manufacturers. While we strive to provide 
              accurate and timely information, we cannot guarantee the completeness, accuracy, 
              or timeliness of all data. Users should verify critical information through 
              official sources before taking action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Professional Consultation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users of the Service should consult appropriate professionals for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Clinical decisions or medical device safety concerns</li>
              <li>Legal compliance and regulatory interpretations</li>
              <li>Financial planning and reimbursement strategies</li>
              <li>Specific operational decisions affecting patient care</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              RadIntel and its affiliates shall not be liable for any direct, indirect, incidental, 
              special, consequential, or punitive damages resulting from your use of or inability 
              to use the Service, including but not limited to damages for loss of profits, goodwill, 
              use, data, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using the Service, you acknowledge that you have read, understood, and agree to 
              this disclaimer. You agree to use the information provided by RadIntel solely for 
              informational purposes and to seek appropriate professional advice for specific 
              medical, legal, or financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this disclaimer or the Service, please{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact us
              </Link>.
            </p>
          </section>

          <section className="border-t pt-6 mt-12">
            <p className="text-sm text-muted-foreground">
              Last updated: August 2025
            </p>
          </section>
        </div>
      </div>

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