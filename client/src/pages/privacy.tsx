import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Database, Lock, AlertTriangle } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            How RadIntel CA protects your privacy and handles data
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy by Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                RadIntel CA is built with privacy as a fundamental principle. We process only public regulatory 
                data and maintain zero exposure to Protected Health Information (PHI).
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>No patient data is collected, stored, or processed</li>
                <li>All data comes from publicly available regulatory sources</li>
                <li>User preferences stored locally on your device only</li>
                <li>No PHI or clinical information access</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-medium">Information We Collect:</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email address for login and alerts</li>
                <li><strong>Usage Data:</strong> Platform usage patterns for service improvement</li>
                <li><strong>Practice Preferences:</strong> Modality selections and notification settings</li>
                <li><strong>CPT Volume Data:</strong> Stored locally on your device, never transmitted</li>
              </ul>
              
              <h3 className="font-medium mt-6">Information We Do NOT Collect:</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Patient health information (PHI)</li>
                <li>Clinical data or medical records</li>
                <li>Financial account information</li>
                <li>Detailed practice operations data</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Send regulatory alerts and notifications via email</li>
                <li>Customize alert relevance based on your modality preferences</li>
                <li>Improve service quality and platform functionality</li>
                <li>Provide technical support when requested</li>
                <li>Ensure platform security and prevent abuse</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Encrypted data transmission (TLS/SSL)</li>
                <li>Secure authentication and session management</li>
                <li>Regular security updates and monitoring</li>
                <li>Limited access controls and audit logging</li>
                <li>Secure cloud infrastructure with backup systems</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We do not sell, rent, or share your personal information with third parties except:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>With trusted service providers bound by confidentiality agreements</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of email notifications</li>
                <li>Export your data (where applicable)</li>
                <li>Request information about data processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                RadIntel CA uses minimal cookies and tracking:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for login and security</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics:</strong> Basic usage statistics to improve the platform</li>
                <li><strong>No Advertising:</strong> We do not use tracking for advertising purposes</li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Data Source Disclaimer
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  All regulatory data processed by RadIntel CA comes from public government sources 
                  (FDA, CMS, CDPH, etc.). No private or confidential information is accessed or processed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This Privacy Policy was last updated on August 17, 2025. We may update this policy 
              periodically to reflect changes in our practices or applicable laws.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              For questions about this Privacy Policy, contact us at privacy@radintel.ca
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}