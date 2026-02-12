'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Calendar,
  Users,
  BarChart3,
  Shield,
  Zap,
  GitBranch,
  Bell,
  FileText,
  Video,
  CheckCircle,
} from 'lucide-react'
import { useState } from 'react'

export default function FeaturesPage() {
  const [activeRole, setActiveRole] = useState(0)
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/50 to-primary/5 py-20 md:py-32">
        <motion.div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          animate={{ x: [0, 100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge variant="secondary" className="mb-4 animate-pulse">All-in-One Academic Platform</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Everything you need to manage academic projects
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From proposal to defense, Academia provides every tool for departments, advisors, and students to collaborate, track, and succeed—beautifully and efficiently.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="px-8 py-3 text-lg" asChild>
                  <Link href="/register/department">Start Free Trial</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="px-8 py-3 text-lg" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </motion.div>
            </div>
            <motion.div 
              className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <span>✨ Free for small departments</span>
              <span>• No credit card required</span>
              <span>• 14-day trial</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section - Animated Cards */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Core Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful tools designed for academic project management
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.03 }}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {feature.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Features Section - Tabbed & Animated */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for Every Role</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tailored features for departments, advisors, and students
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:justify-center gap-6 mb-8">
            {roleFeatures.map((role, idx) => {
              const Icon = role.icon
              return (
                <motion.button
                  key={role.role}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-2 rounded-full border border-primary/20 bg-background hover:bg-primary/10 transition-colors text-primary font-semibold shadow-sm"
                  onClick={() => setActiveRole(idx)}
                  aria-selected={activeRole === idx}
                  style={{ outline: activeRole === idx ? '2px solid var(--primary)' : undefined }}
                >
                  <Icon className="h-5 w-5" />
                  {role.role}
                </motion.button>
              )
            })}
          </div>
          <motion.div
            key={roleFeatures[activeRole].role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    {(() => {
                      const Icon = roleFeatures[activeRole].icon
                      return <Icon className="h-8 w-8 text-primary" />
                    })()}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{roleFeatures[activeRole].role}</CardTitle>
                    <CardDescription>{roleFeatures[activeRole].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {roleFeatures[activeRole].features.map((feature) => (
                    <div key={feature.title} className="space-y-2">
                      <h4 className="font-semibold">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Advanced Capabilities</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Enterprise-grade features for growing institutions
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription className="mt-2">{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-4">
                  Ready to transform your project management?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Start your free trial today and see how Academia can help your department thrive.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="px-8 py-3 text-lg" asChild>
                      <Link href="/register/department">Start Free Trial</Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" className="px-8 py-3 text-lg" asChild>
                      <Link href="/pricing">View Pricing</Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}



const coreFeatures = [
  {
    title: 'Project Management',
    icon: GitBranch,
    description: 'Comprehensive project lifecycle tracking from proposal to completion',
    details: [
      'Multi-stage workflow management',
      'Milestone tracking and deadlines',
      'Document version control',
      'Progress visualization',
    ],
  },
  {
    title: 'Defense Scheduling',
    icon: Calendar,
    description: 'Intelligent scheduling system for project defenses and presentations',
    details: [
      'Automated conflict detection',
      'Room and resource booking',
      'Calendar integration',
      'Email and SMS reminders',
    ],
  },
  {
    title: 'Team Collaboration',
    icon: Users,
    description: 'Seamless collaboration tools for students and advisors',
    details: [
      'Real-time messaging',
      'File sharing and comments',
      'Task assignment',
      'Activity feeds',
    ],
  },
  {
    title: 'Analytics Dashboard',
    icon: BarChart3,
    description: 'Comprehensive insights into project progress and performance',
    details: [
      'Custom reports and metrics',
      'Progress tracking',
      'Performance analytics',
      'Export capabilities',
    ],
  },
  {
    title: 'Smart Notifications',
    icon: Bell,
    description: 'Stay informed with intelligent notification system',
    details: [
      'Email and SMS alerts',
      'Customizable preferences',
      'Deadline reminders',
      'Activity updates',
    ],
  },
  {
    title: 'Document Management',
    icon: FileText,
    description: 'Centralized document storage and version control',
    details: [
      'Secure cloud storage',
      'Version history',
      'Format conversion',
      'Template library',
    ],
  },
]

const roleFeatures = [
  {
    role: 'For Departments',
    icon: Shield,
    description: 'Administrative tools to manage the entire department efficiently',
    features: [
      {
        title: 'Advisor Management',
        description: 'Easily manage advisor profiles, workload, and availability',
      },
      {
        title: 'Project Oversight',
        description: 'Monitor all projects across the department in real-time',
      },
      {
        title: 'Defense Coordination',
        description: 'Schedule and manage defense sessions with automated logistics',
      },
      {
        title: 'Reporting & Analytics',
        description: 'Generate comprehensive reports on department performance',
      },
    ],
  },
  {
    role: 'For Advisors',
    icon: Users,
    description: 'Tools to effectively guide and mentor student projects',
    features: [
      {
        title: 'Project Dashboard',
        description: 'View and manage all your advised projects in one place',
      },
      {
        title: 'Feedback System',
        description: 'Provide structured feedback and track revisions',
      },
      {
        title: 'Meeting Scheduler',
        description: 'Set availability and let students book meetings',
      },
      {
        title: 'Progress Tracking',
        description: 'Monitor student progress and identify issues early',
      },
    ],
  },
  {
    role: 'For Students',
    icon: BookOpen,
    description: 'Everything students need to succeed in their projects',
    features: [
      {
        title: 'Project Workspace',
        description: 'Centralized hub for all project-related activities',
      },
      {
        title: 'Advisor Communication',
        description: 'Direct messaging and meeting scheduling with advisors',
      },
      {
        title: 'Document Submission',
        description: 'Submit and track all project deliverables',
      },
      {
        title: 'Defense Preparation',
        description: 'Access defense schedules and preparation resources',
      },
    ],
  },
]

const advancedFeatures = [
  {
    title: 'Custom Workflows',
    icon: Zap,
    description: 'Configure project workflows to match your department\'s unique processes and requirements',
  },
  {
    title: 'Video Integration',
    icon: Video,
    description: 'Built-in video conferencing for remote meetings and virtual defenses',
  },
  {
    title: 'Advanced Security',
    icon: Shield,
    description: 'Enterprise-grade security with SSO, 2FA, and role-based access control',
  },
  {
    title: 'Automated Backups',
    icon: CheckCircle,
    description: 'Regular automated backups ensure your data is always safe and recoverable',
  },
]