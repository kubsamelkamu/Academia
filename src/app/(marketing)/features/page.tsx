'use client'

import { motion, useInView, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
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
  ArrowRight,
  Lock,
  LayoutGrid,
  Sparkles,
  GraduationCap,
  Trophy,
  ClipboardCheck,
  MessageSquare,
  Star,
  ChevronRight,
  Layers,
  Globe,
  Cpu,
  TrendingUp,
  Award,
  Heart,
  Play,
} from 'lucide-react'

/* ─────────────────────────── helpers ─────────────────────────── */

const container = 'mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16'

// Brand color
const BRAND = "#ED5F45"
const BRAND_DARK = "#D54A32"
const BRAND_LIGHT = "#F47A64"

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(id) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(id)
  }, [inView, target, duration])

  return { ref, count }
}

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

/* ─────────────────────────── data ─────────────────────────── */

const stats = [
  { value: 500, suffix: '+', label: 'Institutions', icon: GraduationCap },
  { value: 12000, suffix: '+', label: 'Projects managed', icon: GitBranch },
  { value: 98, suffix: '%', label: 'Satisfaction rate', icon: Star },
  { value: 40, suffix: '%', label: 'Time saved', icon: Zap },
]

const steps = [
  {
    step: '01',
    title: 'Register your department',
    description: 'Create an institution account and configure your department structure, roles, and project categories in minutes.',
    icon: GraduationCap,
  },
  {
    step: '02',
    title: 'Invite your team',
    description: 'Add coordinators, advisors, evaluators, and students with the right permissions from day one.',
    icon: Users,
  },
  {
    step: '03',
    title: 'Launch & track projects',
    description: 'Students submit proposals, advisors review, and the entire workflow flows automatically with alerts and milestones.',
    icon: GitBranch,
  },
  {
    step: '04',
    title: 'Schedule and evaluate',
    description: 'Defense scheduling, evaluator assignments, rubric-based grading, and final outcome publishing—all in one place.',
    icon: Trophy,
  },
]

const bentoFeatures = [
  {
    title: 'Project Management',
    description: 'Full lifecycle tracking from proposal submission to final defense. Monitor milestones, deadlines, and deliverables in one structured workspace.',
    icon: GitBranch,
    details: ['Multi-stage workflow management', 'Milestone & deadline tracking', 'Document version control', 'Progress visualization'],
    size: 'large',
  },
  {
    title: 'Smart Scheduling',
    description: 'Conflict-free defense scheduling with automated room booking and calendar sync.',
    icon: Calendar,
    details: ['Automated conflict detection', 'Room & resource booking', 'Calendar integration', 'Reminders via email & SMS'],
    size: 'small',
  },
  {
    title: 'Team Collaboration',
    description: 'Real-time messaging, file sharing, and task assignment between students and advisors.',
    icon: Users,
    details: ['Real-time messaging', 'File sharing & comments', 'Task assignment', 'Activity feeds'],
    size: 'small',
  },
  {
    title: 'Analytics & Reports',
    description: 'Comprehensive department-wide insights into project progress, advisor workloads, and outcomes—exportable in one click.',
    icon: BarChart3,
    details: ['Custom reports & metrics', 'Progress tracking', 'Performance analytics', 'Export capabilities'],
    size: 'large',
  },
  {
    title: 'Smart Notifications',
    description: 'Deadline reminders, status updates, and activity digests delivered intelligently.',
    icon: Bell,
    details: ['Email & SMS alerts', 'Customisable preferences', 'Deadline reminders', 'Activity digests'],
    size: 'small',
  },
  {
    title: 'Document Hub',
    description: 'Centralised secure cloud storage with version history and template library.',
    icon: FileText,
    details: ['Secure cloud storage', 'Version history', 'Format conversion', 'Template library'],
    size: 'small',
  },
]

const roleFeatures = [
  {
    role: 'Department Heads',
    icon: Shield,
    description: 'Administrative oversight to keep programs, people, and policies aligned.',
    features: [
      { title: 'Program Oversight', description: 'Track projects, defenses, and outcomes across the department.' },
      { title: 'Role & Access Control', description: 'Ensure the right people have the right access at the right time.' },
      { title: 'Advisor Management', description: 'Balance workloads, approvals, and advisor assignments.' },
      { title: 'Reporting & Analytics', description: 'Generate comprehensive reports on department performance.' },
    ],
  },
  {
    role: 'Coordinators',
    icon: Calendar,
    description: 'Operational tools to keep projects moving and defenses on schedule.',
    features: [
      { title: 'Project Assignment', description: 'Coordinate student placement, advisor assignment, and approvals.' },
      { title: 'Defense Scheduling', description: 'Organise defenses with conflict checks and clear timelines.' },
      { title: 'Communication Hub', description: 'Send announcements and keep stakeholders aligned in one place.' },
      { title: 'Operational Reporting', description: 'Spot bottlenecks early with status dashboards and exports.' },
    ],
  },
  {
    role: 'Advisors',
    icon: Users,
    description: 'Tools to effectively guide and mentor student projects.',
    features: [
      { title: 'Project Dashboard', description: 'View and manage all your advised projects in one place.' },
      { title: 'Feedback System', description: 'Provide structured feedback and track revisions.' },
      { title: 'Meeting Scheduler', description: 'Set availability and let students book meetings easily.' },
      { title: 'Progress Tracking', description: 'Monitor student progress and identify issues early.' },
    ],
  },
  {
    role: 'Evaluators',
    icon: ClipboardCheck,
    description: 'Structured evaluation tools for committee members and reviewers.',
    features: [
      { title: 'Evaluation Forms', description: 'Use consistent rubrics to review submissions and defenses.' },
      { title: 'Scoring & Notes', description: 'Capture scores and qualitative feedback in one workflow.' },
      { title: 'Defense Participation', description: 'Access schedules, project materials, and committee context.' },
      { title: 'Final Recommendations', description: 'Submit outcomes and recommendations with an audit trail.' },
    ],
  },
  {
    role: 'Students',
    icon: BookOpen,
    description: 'Everything students need to succeed in their academic projects.',
    features: [
      { title: 'Project Workspace', description: 'Centralised hub for all project-related activities.' },
      { title: 'Advisor Communication', description: 'Direct messaging and meeting scheduling with advisors.' },
      { title: 'Document Submission', description: 'Submit and track all project deliverables easily.' },
      { title: 'Defense Preparation', description: 'Access defense schedules and preparation resources.' },
    ],
  },
]

const advancedFeatures = [
  { title: 'Custom Workflows', icon: Zap, description: "Configure project workflows to match your department's unique processes and requirements." },
  { title: 'Video Integration', icon: Video, description: 'Built-in video conferencing for remote meetings and virtual defenses with recording support.' },
  { title: 'Enterprise Security', icon: Shield, description: 'Enterprise-grade security with SSO, 2FA, audit logs, and role-based access control.' },
  { title: 'AI-Assisted Review', icon: Cpu, description: 'Smart suggestions for advisor matching, scheduling optimisation, and project similarity checks.' },
  { title: 'Multi-campus Support', icon: Globe, description: 'Manage multiple departments or campuses under one organisation with isolated data tenants.' },
  { title: 'Deep Integrations', icon: Layers, description: 'Connect with LMS platforms, calendar services, email providers, and institutional SSO.' },
]

/* ─────────────────────────── campus carousel ─────────────────────────── */

const campusSlides = [
  { src: '/sign-in-campus.jpg', alt: 'Main campus administration building' },
  { src: '/sign-in-campus2.jpg', alt: 'Campus academic block and grounds' },
  { src: '/sign-in-campus3.jpg', alt: 'Campus dormitories surrounded by greenery' },
]

function HeroCampusCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % campusSlides.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="relative w-full max-w-[520px] flex-shrink-0 lg:w-[52%]"
      initial={{ opacity: 0, x: 40, scale: 0.96, rotateY: 20 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
      style={{ perspective: "1200px" }}
    >
      <motion.div
        whileHover={{ rotateY: -10, rotateX: 5 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className={`absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[${BRAND}]/20 via-[${BRAND}]/10 to-[${BRAND}]/20 blur-xl dark:from-[${BRAND}]/15 dark:to-[${BRAND}]/15`} />

        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/60 shadow-2xl shadow-slate-900/20 dark:border-slate-700/60 dark:shadow-slate-900/30">
          <AnimatePresence mode="sync">
            <motion.div
              key={campusSlides[current].src}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            >
              <Image
                src={campusSlides[current].src}
                alt={campusSlides[current].alt}
                fill
                className="object-cover"
                priority={current === 0}
                sizes="(max-width: 1024px) 100vw, 52vw"
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-5 pb-4">
            <div>
              <p className="text-xs font-medium text-sky-200">Academia Platform</p>
              <p className="text-sm font-bold text-white">Built for university campuses</p>
            </div>
            <div className="flex items-center gap-1.5">
              {campusSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    i === current ? 'w-6 bg-white' : 'w-2 bg-white/45 hover:bg-white/70',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.9, translateZ: 40 }}
          animate={{ opacity: 1, y: 0, scale: 1, translateZ: 40 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          className="absolute -right-4 -top-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/90"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-[${BRAND}]/10`}>
            <TrendingUp className={`h-4 w-4 text-[${BRAND}]`} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-medium text-muted-foreground">Projects tracked</p>
            <p className="text-sm font-bold text-foreground">12,000+</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9, translateZ: 60 }}
          animate={{ opacity: 1, y: 0, scale: 1, translateZ: 60 }}
          transition={{ delay: 0.7, duration: 0.45 }}
          className="absolute -bottom-5 -right-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/90"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-[${BRAND}]/10`}>
            <Award className={`h-4 w-4 text-[${BRAND}]`} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-medium text-muted-foreground">Satisfaction rate</p>
            <p className="text-sm font-bold text-foreground">98%</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -12, scale: 0.9, translateZ: 80 }}
          animate={{ opacity: 1, x: 0, scale: 1, translateZ: 80 }}
          transition={{ delay: 0.85, duration: 0.45 }}
          className="absolute -left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/90"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-[${BRAND}]/10`}>
            <GraduationCap className={`h-4 w-4 text-[${BRAND}]`} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-medium text-muted-foreground">Institutions</p>
            <p className="text-sm font-bold text-foreground">500+</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────── stat counter ─────────────────────────── */

function StatCard({ value, suffix, label, icon: Icon }: typeof stats[0]) {
  const { ref, count } = useCountUp(value)
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className={`mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[${BRAND}]/10 text-[${BRAND}]`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        <span ref={ref}>{count.toLocaleString()}</span>
        <span className={`text-[${BRAND}]`}>{suffix}</span>
      </p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
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

/* ─────────────────────────── page ─────────────────────────── */

export default function FeaturesPage() {
  const [activeRole, setActiveRole] = useState(0)
  const role = roleFeatures[activeRole]

  return (
    <div className="min-w-0 overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#ED5F45]/10 blur-[120px] dark:bg-[#ED5F45]/8" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-[400px] w-[500px] rounded-full bg-[#ED5F45]/8 blur-[100px] dark:bg-[#ED5F45]/6" aria-hidden />

        <div className={cn(container, 'relative py-16 sm:py-20 lg:py-24')}>
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">

            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              <Badge className="mb-5 inline-flex gap-1.5 border-[#ED5F45]/30 bg-[#ED5F45]/10 px-4 py-1.5 text-xs font-semibold text-[#ED5F45]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                All-in-one academic platform
              </Badge>

              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl xl:text-6xl">
                <span className={`bg-gradient-to-r from-[${BRAND}] via-[${BRAND_LIGHT}] to-[${BRAND}] bg-clip-text text-transparent`}>
                  Everything you need
                </span>
                <br />
                <span className="text-foreground">to run academic projects</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg">
                From proposal to defense, Academia keeps departments, coordinators, advisors,
                evaluators, and students aligned — with clear workflows, scheduling, and
                real-time visibility.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  size="lg"
                  className="group h-13 rounded-2xl bg-[#ED5F45] px-8 text-base font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#D54A32] hover:shadow-[#ED5F45]/20 shadow-[#ED5F45]/10"
                  asChild
                >
                  <Link href="/register">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-2xl border-slate-300 bg-background/70 px-8 text-base backdrop-blur-sm hover:bg-muted/50 dark:border-slate-600"
                  asChild
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
                {['No credit card required', 'Free 30-day trial', 'GDPR compliant', 'SOC 2 ready'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-[#ED5F45]" />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            <HeroCampusCarousel />

          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative py-20 overflow-hidden border-b border-border/50 bg-muted/20 dark:bg-muted/10">
        <div className="absolute inset-x-0 -top-px h-24 bg-gradient-to-b from-background to-transparent" />
        <div className={container}>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30, rotateX: 5 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.6 }}
              >
                <TiltCard>
                  <div className="p-8 rounded-[2.5rem] bg-background border shadow-xl flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:border-[#ED5F45]/30 group">
                    <div className="mb-6 h-14 w-14 rounded-2xl bg-[#ED5F45]/10 flex items-center justify-center text-[#ED5F45] group-hover:scale-110 transition-transform">
                      <s.icon className="h-7 w-7" />
                    </div>
                    <StatCard {...s} />
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-white dark:bg-slate-900 border-b border-border/50">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#ED5F45_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-[0.03]" />

        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto mb-20 max-w-2xl text-center"
          >
            <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#ED5F45]">
              The Implementation
            </Badge>
            <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl mb-6">
              Up and running in <span className="text-[#ED5F45]">four steps</span>
            </h2>
            <p className="mt-3 text-pretty text-xl text-muted-foreground font-medium">
              Academia is designed to get your team productive from day one.
            </p>
          </motion.div>

          <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-[3.5rem] hidden border-t-2 border-dashed border-[#ED5F45]/20 lg:block opacity-50" aria-hidden />

            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    delay: i * 0.15,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }}
                >
                  <TiltCard>
                    <div className="relative z-10 p-10 rounded-[3rem] border shadow-2xl bg-background flex flex-col items-center text-center group h-full transition-all duration-500 hover:shadow-[#ED5F45]/10 border-[#ED5F45]/20">
                      <div className="mb-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] border-2 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 bg-[#ED5F45]/10 border-[#ED5F45]/20">
                        <Icon className="h-8 w-8 text-[#ED5F45]" aria-hidden />
                        <span className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#ED5F45] text-xs font-black text-white ring-4 ring-background">
                          {i + 1}
                        </span>
                      </div>
                      <div className="min-h-[120px] flex flex-col items-center">
                        <h3 className="text-xl font-black text-foreground mb-4 tracking-tight group-hover:text-[#ED5F45] transition-colors uppercase">{s.title}</h3>
                        <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Core features bento grid ── */}
      <section className="border-y border-border/50 bg-muted/20 py-16 sm:py-20 lg:py-28 dark:bg-muted/10">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <Badge className="mb-3 border-[#ED5F45]/30 bg-[#ED5F45]/10 px-3 py-1 text-xs font-semibold text-[#ED5F45]">
              Core features
            </Badge>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Tools for the <span className="text-[#ED5F45]">full project lifecycle</span>
            </h2>
            <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">
              Designed for real university workflows — nothing unnecessary, nothing missing.
            </p>
          </motion.div>

          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bentoFeatures.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20, rotateX: 5 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.07, duration: 0.45 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-2xl border-[#ED5F45]/20',
                    f.size === 'large' && 'sm:col-span-2 lg:col-span-1',
                  )}
                >
                  <TiltCard className="h-full">
                    <div className="relative p-6 h-full" style={{ transformStyle: "preserve-3d" }}>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ED5F45]/5 via-transparent to-[#ED5F45]/5 opacity-60 dark:opacity-40" />

                      <div className="relative">
                        <motion.div style={{ translateZ: 30 }} className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#ED5F45]/10">
                          <Icon className="h-6 w-6 text-[#ED5F45]" aria-hidden />
                        </motion.div>
                        <motion.h3 style={{ translateZ: 40 }} className="mb-2 text-lg font-semibold text-foreground">{f.title}</motion.h3>
                        <motion.p style={{ translateZ: 50 }} className="mb-4 text-sm leading-relaxed text-muted-foreground">{f.description}</motion.p>
                        <motion.ul style={{ translateZ: 60 }} className="space-y-2">
                          {f.details.map((d) => (
                            <li key={d} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ED5F45]" aria-hidden />
                              <span className="text-muted-foreground">{d}</span>
                            </li>
                          ))}
                        </motion.ul>
                      </div>

                      <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 bg-[#ED5F45]/10">
                        <ChevronRight className="h-4 w-4 text-[#ED5F45]" />
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Why Academia – value props strip ── */}
      <section className="py-16 sm:py-20">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Why institutions <span className="text-[#ED5F45]">choose Academia</span>
            </h2>
            <p className="mt-3 text-muted-foreground sm:text-lg">
              Security, clarity, and collaboration — without sacrificing flexibility.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'Secure by default',
                body: 'Role-based access and institution-scoped data help teams collaborate without oversharing.',
              },
              {
                icon: LayoutGrid,
                title: 'Designed for campuses',
                body: 'Workflows mirror how departments actually run projects, reviews, and defenses.',
              },
              {
                icon: BarChart3,
                title: 'Visibility for everyone',
                body: 'Dashboards and notifications keep advisors, students, and admins aligned in real time.',
              },
            ].map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <TiltCard>
                  <div className="rounded-2xl border p-7 shadow-sm bg-card h-full border-[#ED5F45]/20" style={{ transformStyle: "preserve-3d" }}>
                    <motion.div style={{ translateZ: 30 }} className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ED5F45]/10">
                      <v.icon className="h-6 w-6 text-[#ED5F45]" />
                    </motion.div>
                    <motion.h3 style={{ translateZ: 40 }} className="mb-2 text-lg font-semibold text-foreground">{v.title}</motion.h3>
                    <motion.p style={{ translateZ: 50 }} className="text-sm leading-relaxed text-muted-foreground">{v.body}</motion.p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="border-y border-border/50 bg-muted/20 py-16 sm:py-20 lg:py-28 dark:bg-muted/10">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-10 max-w-2xl text-center"
          >
            <Badge className="mb-3 border-[#ED5F45]/30 bg-[#ED5F45]/10 px-3 py-1 text-xs font-semibold text-[#ED5F45]">
              Built for every role
            </Badge>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              One platform, <span className="text-[#ED5F45]">every perspective</span>
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground sm:text-lg">
              Switch between roles to see how Academia works for your team.
            </p>
          </motion.div>

          <div
            role="tablist"
            aria-label="Features by role"
            className="-mx-4 mb-8 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
          >
            {roleFeatures.map((r, idx) => {
              const Icon = r.icon
              const selected = activeRole === idx
              return (
                <motion.button
                  key={r.role}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`role-tab-${idx}`}
                  aria-controls={`role-panel-${idx}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all sm:text-base',
                    selected
                      ? 'bg-[#ED5F45]/10 text-[#ED5F45] border-[#ED5F45]/30 shadow-md'
                      : 'border-border bg-background/90 text-foreground hover:bg-muted/50',
                  )}
                  onClick={() => setActiveRole(idx)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">{r.role}</span>
                </motion.button>
              )
            })}
          </div>

          <motion.div
            key={role.role}
            role="tabpanel"
            id={`role-panel-${activeRole}`}
            aria-labelledby={`role-tab-${activeRole}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <TiltCard>
              <div className="mx-auto max-w-4xl rounded-3xl border p-6 shadow-md sm:p-8 bg-card border-[#ED5F45]/20" style={{ transformStyle: "preserve-3d" }}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <motion.div style={{ translateZ: 40 }} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#ED5F45]/10">
                    {(() => { const Icon = role.icon; return <Icon className="h-8 w-8 text-[#ED5F45]" aria-hidden /> })()}
                  </motion.div>
                  <motion.div style={{ translateZ: 60 }}>
                    <h3 className="text-xl font-bold text-foreground sm:text-2xl">{role.role}</h3>
                    <p className="mt-1 text-base text-muted-foreground">{role.description}</p>
                  </motion.div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {role.features.map((f, fi) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: fi * 0.05, duration: 0.3 }}
                      style={{ translateZ: 20 + fi * 5 }}
                      className="rounded-xl border p-4 bg-muted/30 dark:bg-muted/10 border-[#ED5F45]/20"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#ED5F45]" />
                        <div>
                          <h4 className="font-semibold text-foreground">{f.title}</h4>
                          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── Advanced capabilities ── */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <Badge className="mb-3 border-[#ED5F45]/30 bg-[#ED5F45]/10 px-3 py-1 text-xs font-semibold text-[#ED5F45]">
              Advanced capabilities
            </Badge>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Built for departments that <span className="text-[#ED5F45]">need scale</span>
            </h2>
            <p className="mt-3 text-muted-foreground sm:text-lg">
              Deeper controls for security, customisation, and enterprise readiness.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {advancedFeatures.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="group flex gap-4 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md border-[#ED5F45]/20 bg-card"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ED5F45]/10">
                    <Icon className="h-5 w-5 text-[#ED5F45]" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonial strip ── */}
      <section className="border-y border-border/50 bg-gradient-to-b from-[#ED5F45]/5 to-white py-16 dark:from-[#ED5F45]/10 dark:to-slate-950/0">
        <div className={container}>
          <div className="mx-auto mb-10 max-w-xl text-center">
            <div className="mb-2 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-[#ED5F45] text-[#ED5F45]" />
              ))}
            </div>
            <p className="text-xl font-semibold text-foreground">
              &ldquo;Academia cut our defense scheduling time by 60 %. What took weeks now takes hours.&rdquo;
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Dr. Amara Diallo — Head of Computer Science, University of Tunis
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: 'Finally a platform that understands how academic supervision actually works. Advisors love it.',
                name: 'Prof. Karim Bensaid',
                role: 'Department Coordinator',
              },
              {
                quote: 'Students are more engaged and deadlines are met. The milestone tracking is a game-changer.',
                name: 'Dr. Fatima El-Amin',
                role: 'Academic Advisor',
              },
              {
                quote: 'The role-based access is exactly what we needed. Everyone sees only what they should.',
                name: 'Yassine Touati',
                role: 'IT Administrator',
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-[#ED5F45]/20 bg-background/80 p-6 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-[#ED5F45] text-[#ED5F45]" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium CTA Section ── */}
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
                    Ready to modernize academic<br />
                    <span className="text-[#ED5F45]">Project Management?</span>
                  </motion.h2>
                  <motion.p style={{ translateZ: 60 }} className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                    Join 500+ institutions already using Academia to deliver exceptional
                    project and thesis management experiences.
                  </motion.p>
                  <motion.div style={{ translateZ: 100 }} className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <MagnetButton>
                      <Button size="lg" className="h-16 px-12 text-xl font-black bg-[#ED5F45] hover:bg-white hover:text-[#ED5F45] text-white shadow-2xl rounded-2xl transition-all" asChild>
                        <Link href="/register">
                          Start Now — It&apos;s Free <Sparkles className="ml-3 h-6 w-6" />
                        </Link>
                      </Button>
                    </MagnetButton>
                    <MagnetButton>
                      <Button size="lg" variant="outline" className="h-16 px-12 text-xl font-bold border-2 border-white/20 text-white hover:bg-white/10 rounded-2xl backdrop-blur-md" asChild>
                        <Link href="/login">Sign In <Play className="ml-3 h-6 w-6" /></Link>
                      </Button>
                    </MagnetButton>
                  </motion.div>
                  <motion.div style={{ translateZ: 40 }} className="mt-16 text-white/30 flex flex-wrap items-center justify-center gap-8 text-sm font-bold uppercase tracking-widest leading-none">
                    <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> No setup fees</span>
                    <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Cancel anytime</span>
                    <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Priority support</span>
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