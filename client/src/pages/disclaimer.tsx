import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, FileText, Users } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Legal Disclaimer
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Important information about the use of RadIntel CA platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Disclaimer */}
          <Card className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Primary Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium text-lg">
                RadIntel CA provides regulatory and operational intelligence for informational purposes only. 
                This platform does not provide medical, legal, or financial advice.
              </p>
            </CardContent>
          </Card>

          {/* Detailed Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Information Purpose Only
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                The information provided by RadIntel CA is sourced from publicly available regulatory databases 
                and announcements from federal agencies (FDA, CMS) and California state agencies (CDPH, RHB). 
                This information is presented for informational and educational purposes only.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>RadIntel CA does not:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                <li>Provide medical advice or recommendations</li>
                <li>Offer legal guidance or regulatory compliance advice</li>
                <li>Give financial or business strategy recommendations</li>
                <li>Replace professional consultation with qualified experts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Professional Consultation Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Users should always consult with qualified professionals before taking any action based on 
                information provided by RadIntel CA:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                <li><strong>Medical decisions:</strong> Consult with licensed physicians and medical professionals</li>
                <li><strong>Legal compliance:</strong> Consult with healthcare attorneys and compliance officers</li>
                <li><strong>Financial planning:</strong> Consult with certified financial advisors and accountants</li>
                <li><strong>Regulatory actions:</strong> Consult with regulatory compliance specialists</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                RadIntel CA and its operators shall not be liable for any direct, indirect, incidental, 
                consequential, or punitive damages arising from:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                <li>Use or inability to use the platform</li>
                <li>Reliance on information provided by the platform</li>
                <li>Decisions made based on platform data</li>
                <li>Delayed, incomplete, or inaccurate information</li>
                <li>System downtime or technical issues</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sources and Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                RadIntel CA aggregates information from official government sources including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                <li>FDA openFDA API and enforcement databases</li>
                <li>CMS Physician Fee Schedule and payment data</li>
                <li>Federal Register regulatory announcements</li>
                <li>California Department of Public Health alerts</li>
                <li>California Radiologic Health Branch notices</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                While we strive for accuracy and timeliness, we cannot guarantee that all information 
                is complete, current, or error-free. Users should verify important information with 
                original sources before taking action.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy and PHI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                RadIntel CA is designed with privacy by design principles:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                <li>No Protected Health Information (PHI) is collected, stored, or transmitted</li>
                <li>All data processed comes from public regulatory sources</li>
                <li>User preferences and practice volumes are stored locally on user devices</li>
                <li>No patient data or clinical information is accessed or processed</li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By using RadIntel CA, you acknowledge that you have read, understood, and agree to this disclaimer. 
              This disclaimer may be updated periodically without notice.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Last updated: August 17, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}