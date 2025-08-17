import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, Users, AlertTriangle } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About RadIntel CA
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Regulatory and operational intelligence designed specifically for radiology practices in California
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle>Regulatory Compliance</CardTitle>
              <CardDescription>
                Stay ahead of FDA device recalls, CMS payment changes, and California state regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                We monitor multiple federal and state sources to ensure you never miss critical regulatory updates 
                that could impact your practice operations, patient safety, or financial performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-yellow-500 mb-4" />
              <CardTitle>Real-Time Intelligence</CardTitle>
              <CardDescription>
                Automated monitoring with intelligent scoring and prioritization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Our deterministic scoring system evaluates each alert based on source credibility, financial impact, 
                and relevance to radiology practices, ensuring you focus on what matters most.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-green-500 mb-4" />
              <CardTitle>Built for Radiology</CardTitle>
              <CardDescription>
                Designed specifically for the unique needs of imaging practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                From CPT code changes to device recalls affecting MRI, CT, mammography, and other modalities, 
                RadIntel understands the specific challenges facing radiology practices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>
                Zero PHI exposure with secure, compliant architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                All data processed is from public regulatory sources. No patient health information is collected, 
                stored, or transmitted. Client preferences and volumes are stored locally on your device.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
            RadIntel CA was created to help California radiology practices navigate the complex regulatory landscape 
            with confidence. By automating the monitoring of federal and state sources, we free up your valuable time 
            to focus on patient care while ensuring you stay compliant and informed.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Disclaimer</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  RadIntel provides regulatory and operational intelligence for informational purposes only. 
                  This platform does not provide medical, legal, or financial advice. Always consult with 
                  qualified professionals for specific guidance related to your practice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}