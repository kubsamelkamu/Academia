"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import {
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  Shield,
  Zap,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Star,
  Play,
  Check,
  GraduationCap
} from "lucide-react"

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 py-20 md:py-32">
        {isClient && (
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        )}
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isClient ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge variant="secondary" className="mb-4 animate-pulse bg-blue-400/10 text-blue-400 border-blue-400/20">
              <GraduationCap className="h-4 w-4 mr-2" />
              Academic Project Management Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Academic Project Management
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent block mt-2">
                Made Simple
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Streamline your university&apos;s academic project workflow from proposal to defense. 
              Collaborate seamlessly, track progress, and manage student projects effortlessly with AI-powered insights.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="px-8 py-4 text-lg bg-blue-400 hover:bg-blue-500 shadow-xl hover:shadow-2xl transition-all duration-300 group" asChild>
                  <Link href="/register/department">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              ✨ Free for small departments • No credit card required • 14-day trial
            </p>
            <motion.div
              className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={isClient ? { opacity: 1 } : { opacity: 1 }}
              transition={{ delay: isClient ? 1 : 0, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                GDPR Ready
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                99.9% Uptime
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How Academia Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in minutes with our streamlined workflow
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative">
                  <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-400 text-white text-2xl font-bold">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="absolute top-8 left-full ml-4 h-6 w-6 text-muted-foreground hidden md:block" />
                  )}
                </div>
                <h3 className="mb-3 font-semibold text-xl">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage academic projects
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed specifically for universities and colleges
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/10">
                      <feature.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Trusted by Leading Universities
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what educators say about Academia
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-blue-400/10 to-blue-500/10">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              See Academia in Action
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Watch how our platform transforms academic project management
            </p>
            <motion.div 
              className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <motion.div 
                  className="bg-white rounded-full p-4"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play className="h-8 w-8 text-blue-400 ml-1" />
                </motion.div>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <Badge variant="secondary">Demo Video</Badge>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <Card className="relative overflow-hidden bg-gradient-to-r from-blue-400/10 via-blue-400/5 to-background border-2 border-blue-400/20">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Ready to transform your academic workflow?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join hundreds of universities already using Academia
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="px-8 py-3 text-lg bg-blue-400 hover:bg-blue-500" asChild>
                      <Link href="/register/department">Get Started Free</Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-blue-400 text-blue-400 hover:bg-blue-400/10" asChild>
                      <Link href="/contact">Contact Sales</Link>
                    </Button>
                  </motion.div>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  No setup fees • Cancel anytime • Enterprise support available
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}

const steps = [
  {
    title: "Set Up Your Department",
    description: "Create your university profile and invite faculty members in minutes."
  },
  {
    title: "Configure Projects",
    description: "Define project templates, deadlines, and evaluation criteria."
  },
  {
    title: "Launch & Monitor",
    description: "Students submit projects, advisors review, and defenses are scheduled automatically."
  }
]

const features = [
  {
    title: "Project Tracking",
    description: "Monitor all projects from proposal submission to final defense in one place.",
    icon: FileText,
  },
  {
    title: "Team Collaboration",
    description: "Students, advisors, and committees work together seamlessly.",
    icon: Users,
  },
  {
    title: "Defense Scheduling",
    description: "Automated scheduling with calendar integration for all stakeholders.",
    icon: Calendar,
  },
  {
    title: "Progress Monitoring",
    description: "Track milestones, submissions, and feedback in real-time.",
    icon: CheckCircle2,
  },
  {
    title: "Secure & Compliant",
    description: "Enterprise-grade security with role-based access control.",
    icon: Shield,
  },
  {
    title: "Fast & Reliable",
    description: "Built for performance with 99.9% uptime guarantee.",
    icon: Zap,
  },
  {
    title: "Analytics Dashboard",
    description: "Comprehensive insights into project completion rates and trends.",
    icon: BarChart3,
  },
  {
    title: "Communication Hub",
    description: "Built-in messaging and notification system for all updates.",
    icon: MessageSquare,
  },
]

const testimonials = [
  {
    quote: "Academia has revolutionized how we manage our computer science projects. The automation saves us hours every week.",
    name: "Dr. Sarah Johnson",
    role: "Department Chair, MIT",
    avatar: "/avatars/sarah.jpg"
  },
  {
    quote: "Our students love the intuitive interface, and advisors can focus more on mentoring rather than paperwork.",
    name: "Prof. Michael Chen",
    role: "Advisor, Stanford University",
    avatar: "/avatars/michael.jpg"
  },
  {
    quote: "The analytics features help us identify at-risk projects early and provide timely interventions.",
    name: "Dr. Emily Rodriguez",
    role: "Program Director, UC Berkeley",
    avatar: "/avatars/emily.jpg"
  }
]

const stats = [
  { value: "500+", label: "Universities" },
  { value: "50K+", label: "Students" },
  { value: "99.9%", label: "Uptime" },
]