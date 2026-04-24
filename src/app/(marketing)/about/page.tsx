'use client'

import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Target,
  Users,
  Lightbulb,
  Award,
  Heart,
  Shield,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen,
  Rocket,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Play,
  Check,
  ChevronRight,
  Clock,
  Globe,
} from 'lucide-react'

const container = 'mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16'

// Brand color
const BRAND = "#ED5F45"
const BRAND_DARK = "#D54A32"
const BRAND_LIGHT = "#F47A64"

/* ── 3D Tilt Card Component ── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      className={`relative ${className}`}
    >
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        whileHover={{ translateZ: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── Magnetic Button Component ── */
function MagnetButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    x.set((e.clientX - centerX) * 0.1)
    y.set((e.clientY - centerY) * 0.1)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const missionItems = [
  {
    title: 'Streamlined processes',
    body: 'Simplify complex academic workflows from proposal to defense with clear stages, deadlines, and visibility.',
    icon: Target,
  },
  {
    title: 'Enhanced collaboration',
    body: 'Bring students, advisors, coordinators, and evaluators into one workspace with messaging, files, and notifications.',
    icon: Users,
  },
  {
    title: 'Quality assurance',
    body: 'Track milestones, reviews, and outcomes so departments can uphold standards without drowning in spreadsheets.',
    icon: Award,
  },
]

const storySteps = [
  {
    step: '01',
    title: 'The vision',
    body: 'Educators and technologists saw how fragmented tools slowed projects from intake to defense—and imagined something better.',
    icon: Lightbulb,
  },
  {
    step: '02',
    title: 'Research & partnerships',
    body: 'We worked with departments to map real workflows, pain points, and compliance needs before writing a line of product code.',
    icon: BookOpen,
  },
  {
    step: '03',
    title: 'Building Academia',
    body: 'We shipped a tenant-aware platform with roles, scheduling, documents, and analytics tuned for how campuses actually operate.',
    icon: Rocket,
  },
  {
    step: '04',
    title: 'Ongoing innovation',
    body: 'Feedback from institutions worldwide continues to shape the roadmap—security, integrations, and smarter automation.',
    icon: Sparkles,
  },
]

const values = [
  {
    title: 'Innovation',
    body: 'We iterate quickly so academic software keeps pace with how teaching and research evolve.',
    icon: Lightbulb,
  },
  {
    title: 'Community',
    body: 'Strong programs depend on people. We design for trust, clarity, and inclusion across every role.',
    icon: Heart,
  },
  {
    title: 'Integrity',
    body: 'Data protection, audit-friendly workflows, and honest communication are non-negotiable.',
    icon: Shield,
  },
] as const

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#ED5F45_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-[0.03]" />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center pt-24 pb-20">
        <div className={container}>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
                Our Mission
              </Badge>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-8">
                Empowering <span className="text-[#ED5F45]">Academic</span><br />
                Excellence.
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-10">
                Academia exists to modernize how universities run academic projects—from proposals 
                to final defenses—so every stakeholder can focus on learning, not logistics.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <MagnetButton>
                  <Button size="lg" className="h-16 px-10 text-xl font-black bg-[#ED5F45] hover:bg-[#D54A32] text-white shadow-2xl rounded-2xl group transition-all" asChild>
                    <Link href="/register">
                      Launch Workspace <Rocket className="ml-3 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </Button>
                </MagnetButton>
                <MagnetButton>
                  <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold border-2 border-[#ED5F45]/30 text-[#ED5F45] hover:bg-[#ED5F45]/10 rounded-2xl transition-all" asChild>
                    <Link href="/features">
                      Explore Features <ArrowRight className="ml-3 h-6 w-6" />
                    </Link>
                  </Button>
                </MagnetButton>
              </div>
            </motion.div>

            <motion.div 
              className="flex-1 relative"
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{ perspective: "1000px" }}
            >
              <TiltCard>
                <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                  <Image
                    src="/about.png"
                    alt="About Academia"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#ED5F45]/40 to-transparent flex items-end p-12">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <p className="text-white text-lg font-black tracking-tight">ENGINEERED FOR EXCELLENCE</p>
                      <p className="text-white/70 text-sm font-medium">Supporting institutions worldwide</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 md:py-40 relative">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Why we built <span className="text-[#ED5F45]">Academia</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto">
              A single platform that streamlines workflows, strengthens collaboration, and helps every stakeholder succeed.
            </p>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-3">
            {missionItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <TiltCard className="h-full">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all h-full group">
                    <div className="h-16 w-16 bg-[#ED5F45]/10 rounded-2xl flex items-center justify-center text-[#ED5F45] mb-8 group-hover:bg-[#ED5F45] group-hover:text-white transition-colors">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight uppercase">{item.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.body}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 md:py-40 bg-slate-50 dark:bg-slate-950 px-6">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Our <span className="text-[#ED5F45]">Values</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium">Principles that guide how we build and partner with campuses.</p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <TiltCard className="h-full">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl h-full transition-all group">
                    <div className="h-16 w-16 bg-[#ED5F45]/10 rounded-2xl flex items-center justify-center text-[#ED5F45] mb-8 group-hover:rotate-12 transition-transform">
                      <v.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight uppercase group-hover:text-[#ED5F45] transition-colors">{v.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{v.body}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Timeline */}
      <section className="py-24 md:py-40">
        <div className={container}>
          <div className="text-center mb-24">
            <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
              Our Story
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              From idea to <span className="text-[#ED5F45]">Platform</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {storySteps.map((s, i) => (
              <motion.div 
                key={s.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex items-start gap-8 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse text-right"}`}
              >
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-[#ED5F45] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#ED5F45]/30">
                  {s.step}
                </div>
                <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 shadow-lg">
                  <h3 className="text-2xl font-black mb-4 text-[#ED5F45]">{s.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-24 md:py-40">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, rotateX: 10 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            style={{ perspective: "1500px" }}
          >
            <TiltCard>
              <div className="relative overflow-hidden bg-slate-950 border-none shadow-2xl rounded-[4rem] min-h-[500px] flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ED5F45]/40 via-transparent to-[#ED5F45]/20" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#ED5F45]/20 blur-[100px]"
                />

                <div className="relative p-12 md:p-24 text-center z-10" style={{ transformStyle: "preserve-3d" }}>
                  <motion.div style={{ translateZ: 50 }}>
                    <Heart className="h-16 w-16 text-[#ED5F45] mx-auto mb-10 animate-pulse" />
                  </motion.div>
                  <motion.h2 style={{ translateZ: 80 }} className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-10 leading-tight">
                    Ready to build the<br />
                    <span className="text-[#ED5F45]">Future of Education?</span>
                  </motion.h2>
                  <motion.p style={{ translateZ: 60 }} className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                    Join institutions already using Academia to deliver exceptional
                    academic and project management experiences.
                  </motion.p>
                  <motion.div style={{ translateZ: 100 }} className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <MagnetButton>
                      <Button size="lg" className="h-16 px-12 text-xl font-black bg-[#ED5F45] hover:bg-white hover:text-[#ED5F45] text-white shadow-2xl rounded-2xl transition-all" asChild>
                        <Link href="/register">
                          Get Started Now <ArrowRight className="ml-3 h-6 w-6" />
                        </Link>
                      </Button>
                    </MagnetButton>
                    <MagnetButton>
                      <Button size="lg" variant="outline" className="h-16 px-12 text-xl font-bold border-2 border-white/20 text-white hover:bg-white/10 rounded-2xl backdrop-blur-md" asChild>
                        <Link href="/contact">Message Us <MessageSquare className="ml-3 h-6 w-6" /></Link>
                      </Button>
                    </MagnetButton>
                  </motion.div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
        <p>© {new Date().getFullYear()} ACADEMIA. ENGINEERED FOR ACADEMIC EXCELLENCE.</p>
      </footer>
    </div>
  )
}
