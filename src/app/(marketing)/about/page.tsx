'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  Users,
  Lightbulb,
  Award,
  Heart,
  Shield,
} from 'lucide-react'

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 py-20 md:py-32">
        <motion.div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
            <Badge variant="secondary" className="mb-4 animate-pulse bg-blue-400/10 text-blue-400 border-blue-400/20">
              About Us
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Empowering
              </span>
              <br />Academic Excellence
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Academia is dedicated to revolutionizing academic project management, fostering collaboration between students, advisors, and departments.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="px-8 py-3 text-lg bg-blue-400 hover:bg-blue-500">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8 py-3 text-lg border-blue-400 text-blue-400 hover:bg-blue-400/10">
                <Link href="/features">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-muted">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              To provide a comprehensive platform that streamlines academic project workflows, enhances collaboration, and ensures successful outcomes for all stakeholders.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-blue-400" />
                  <CardTitle>Streamlined Processes</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Simplify complex academic workflows from proposal to defense with our intuitive platform.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-blue-400" />
                  <CardTitle>Enhanced Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Foster better communication and teamwork between students, advisors, and department staff.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Award className="h-8 w-8 text-blue-400" />
                  <CardTitle>Quality Assurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Ensure high standards and successful project outcomes through comprehensive tracking and evaluation tools.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">Our Story</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Founded to transform academic project management, Academia bridges gaps in traditional workflows. Our founders—educators and technologists—recognized the challenges faced by students and faculty in managing complex projects.
            </p>
          </div>
          <ol className="relative border-l-2 border-blue-400/20 max-w-2xl mx-auto">
            <li className="mb-12 ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-400 text-white">1</span>
              <h3 className="text-xl font-semibold">The Vision</h3>
              <p className="mt-2 text-muted-foreground">A desire to empower academic excellence and collaboration sparked the idea for Academia.</p>
            </li>
            <li className="mb-12 ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-400 text-white">2</span>
              <h3 className="text-xl font-semibold">Research & Collaboration</h3>
              <p className="mt-2 text-muted-foreground">We partnered with universities to understand real-world needs and pain points in project management.</p>
            </li>
            <li className="mb-12 ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-400 text-white">3</span>
              <h3 className="text-xl font-semibold">Building Academia</h3>
              <p className="mt-2 text-muted-foreground">Our team designed and built a platform that anticipates the future of academic project management.</p>
            </li>
            <li className="ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-400 text-white">4</span>
              <h3 className="text-xl font-semibold">Ongoing Innovation</h3>
              <p className="mt-2 text-muted-foreground">We continue to evolve, driven by feedback from the academic community worldwide.</p>
            </li>
          </ol>
        </div>
      </section>
      
      {/* Stats Section - Animated */}
      <section className="py-20 bg-gradient-to-r from-blue-400/10 to-blue-500/10">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { value: '500+', label: 'Universities' },
              { value: '50K+', label: 'Students' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, index) => (
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

      {/* Values */}
      <section className="py-20 bg-muted">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">Our Values</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Lightbulb className="h-8 w-8 text-blue-400" />
                  <CardTitle>Innovation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We continuously innovate to meet the evolving needs of academic institutions.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Heart className="h-8 w-8 text-blue-400" />
                  <CardTitle>Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We believe in building strong academic communities through better collaboration tools.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-blue-400" />
                  <CardTitle>Integrity</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We maintain the highest standards of data security and academic integrity.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold">Join the Academia Community</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Be part of the revolution in academic project management. Start your journey today.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-blue-400 hover:bg-blue-500">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-blue-400 text-blue-400 hover:bg-blue-400/10">
                <Link href="/features">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}