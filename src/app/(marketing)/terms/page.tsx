'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Shield, AlertTriangle, Scale, Clock } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 py-20 md:py-32">
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge variant="secondary" className="mb-4 animate-pulse bg-blue-400/10 text-blue-400 border-blue-400/20">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Terms of Service
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Please read these terms carefully before using Academia&apos;s academic project management platform.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Last updated: February 20, 2026
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  By accessing and using Academia (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                <p className="text-muted-foreground">
                  If you do not agree to abide by the above, please do not use this service. These terms apply to all users of the platform, including students, faculty, administrators, and institutions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  Description of Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Academia is a comprehensive academic project management platform designed to streamline collaboration between students, advisors, coordinators, and department heads in managing academic projects, theses, and defense processes.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold">Key Features:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Multi-tenant architecture for different institutions</li>
                    <li>Role-based access control (Department Head, Coordinator, Advisor, Student, Committee Member)</li>
                    <li>Project lifecycle management and tracking</li>
                    <li>Defense scheduling and evaluation system</li>
                    <li>Real-time notifications and communication</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  User Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold">You agree to:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Provide accurate and complete information when creating your account</li>
                    <li>Use the platform only for legitimate academic purposes</li>
                    <li>Respect intellectual property rights of others</li>
                    <li>Not engage in any harmful, illegal, or unauthorized activities</li>
                    <li>Comply with your institution&apos;s policies and guidelines</li>
                    <li>Report any security concerns or policy violations</li>
                    <li>Keep your contact information current</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-500" />
                  Prohibited Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The following activities are strictly prohibited when using Academia:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Sharing account credentials with unauthorized users</li>
                  <li>Uploading malicious software or viruses</li>
                  <li>Attempting to gain unauthorized access to other accounts or systems</li>
                  <li>Using the platform for commercial purposes without authorization</li>
                  <li>Harassing, threatening, or abusing other users</li>
                  <li>Submitting false or misleading information</li>
                  <li>Violating academic integrity policies</li>
                  <li>Circumventing security measures or access controls</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-blue-500" />
                  Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Academia respects intellectual property rights and expects users to do the same.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold">Platform Content:</h4>
                  <p className="text-muted-foreground ml-4">
                    The Service and its original content, features, and functionality are owned by Academia and are protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">User Content:</h4>
                  <p className="text-muted-foreground ml-4">
                    You retain ownership of content you submit to the platform. By submitting content, you grant Academia a license to use, display, and distribute it as necessary to provide the Service.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms.
                </p>
                <p className="text-muted-foreground">
                  Upon termination, your right to use the Service will cease immediately. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disclaimer and Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Academia makes no representations or warranties of any kind, express or implied, as to the operation of the Service or the information, content, or materials included therein.
                </p>
                <p className="text-muted-foreground">
                  In no event shall Academia be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which Academia operates, without regard to conflict of law provisions.
                </p>
                <p className="text-muted-foreground">
                  Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the applicable arbitration association.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> legal@academia.et</p>
                  <p><strong>Address:</strong> 123 Academic Way, University City, UC 12345</p>
                  <p><strong>Phone:</strong> +1 (234) 567-8900</p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground pt-8 border-t">
              <p>These terms of service were last updated on February 20, 2026. We may update these terms periodically to reflect changes in our services or legal requirements.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}