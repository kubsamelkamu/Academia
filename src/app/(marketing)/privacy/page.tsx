'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Eye, Lock, Cookie, Users, Mail } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your privacy is important to us. This policy explains how Academia collects, uses, and protects your information.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
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
                  <Eye className="h-5 w-5 text-blue-500" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold">Personal Information:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Name, email address, and contact information</li>
                    <li>Institutional affiliation and academic role</li>
                    <li>Profile information and preferences</li>
                    <li>Project and research data you upload</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Usage Information:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Log data and device information</li>
                    <li>IP address and location data</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and features used</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We use the information we collect to provide, maintain, and improve our services, and to communicate with you.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide and personalize our academic project management services</li>
                  <li>Process and manage academic projects, theses, and defense schedules</li>
                  <li>Facilitate collaboration between students, advisors, and faculty</li>
                  <li>Send important notifications and updates</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Analyze usage patterns to improve our platform</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-blue-500" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure data centers and infrastructure</li>
                  <li>Employee training on data protection</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cookie className="h-5 w-5 text-blue-500" />
                  Cookies and Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold">Types of Cookies:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                    <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                  </ul>
                </div>
                <p className="text-muted-foreground">
                  You can control cookie settings through your browser preferences. However, disabling certain cookies may affect platform functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You have certain rights regarding your personal information. Depending on your location, these may include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                  <li><strong>Objection:</strong> Object to certain types of processing</li>
                </ul>
                <p className="text-muted-foreground">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> privacy@academia.et</p>
                  <p><strong>Address:</strong> 123 Academic Way, University City, UC 12345</p>
                  <p><strong>Phone:</strong> +1 (234) 567-8900</p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground pt-8 border-t">
              <p>This privacy policy was last updated on February 20, 2026. We may update this policy periodically to reflect changes in our practices or legal requirements.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}