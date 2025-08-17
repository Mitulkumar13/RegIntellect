import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, Scale, Shield } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Terms and conditions for using RadIntel CA
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                RadIntel CA provides regulatory and operational intelligence for informational purposes only. 
                This service does not provide medical, legal, or financial advice. Always consult with 
                qualified professionals for specific guidance related to your practice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                By accessing and using RadIntel CA ("the Service"), you accept and agree to be bound by 
                these Terms of Service. If you do not agree to these terms, you may not use the Service.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                These terms may be updated periodically. Continued use of the Service constitutes 
                acceptance of any revised terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                RadIntel CA is a regulatory intelligence platform that:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Monitors FDA device recalls and safety notices</li>
                <li>Tracks CMS payment and reimbursement changes</li>
                <li>Provides Federal Register deadline notifications</li>
                <li>Monitors California state regulatory sources</li>
                <li>Offers financial impact analysis tools</li>
                <li>Delivers email alerts and notifications</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                All information is derived from publicly available regulatory sources and is provided 
                for informational purposes only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">As a user of RadIntel CA, you agree to:</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Provide accurate account information</li>
                <li>Maintain the security of your login credentials</li>
                <li>Use the Service in compliance with applicable laws</li>
                <li>Not attempt to breach system security or access unauthorized data</li>
                <li>Not misrepresent information or engage in fraudulent activity</li>
                <li>Verify important information with original regulatory sources</li>
                <li>Consult qualified professionals for medical, legal, or financial advice</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="h-5 w-5 mr-2" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                <strong>To the maximum extent permitted by law:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>RadIntel CA is provided "as is" without warranties of any kind</li>
                <li>We do not guarantee accuracy, completeness, or timeliness of information</li>
                <li>We are not liable for decisions made based on information provided</li>
                <li>We are not responsible for damages arising from use of the Service</li>
                <li>Our liability is limited to the amount paid for the Service</li>
                <li>We are not liable for third-party content or external websites</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                RadIntel CA and its content are protected by intellectual property laws:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>The platform design, software, and original content are our property</li>
                <li>You may not copy, distribute, or create derivative works</li>
                <li>Regulatory data remains the property of government agencies</li>
                <li>You retain ownership of your account preferences and settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy and Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Your privacy is important to us:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>We collect minimal personal information necessary for service delivery</li>
                <li>No Protected Health Information (PHI) is collected or processed</li>
                <li>All data comes from publicly available regulatory sources</li>
                <li>See our Privacy Policy for detailed information handling practices</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We strive to maintain reliable service but cannot guarantee:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Continuous, uninterrupted service availability</li>
                <li>Real-time delivery of all regulatory updates</li>
                <li>Accuracy of third-party data sources</li>
                <li>Compatibility with all devices or browsers</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                We reserve the right to modify, suspend, or discontinue the Service with notice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Either party may terminate this agreement:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>You may cancel your account at any time</li>
                <li>We may suspend or terminate accounts for terms violations</li>
                <li>We may discontinue the Service with reasonable notice</li>
                <li>Upon termination, your right to use the Service ceases immediately</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                These Terms of Service are governed by the laws of California, United States. 
                Any disputes will be resolved in the appropriate courts of California.
              </p>
            </CardContent>
          </Card>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These Terms of Service were last updated on August 17, 2025.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              For questions about these terms, contact us at legal@radintel.ca
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}