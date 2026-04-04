'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'

/* ─────────────────────────── helpers ─────────────────────────── */

const container = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

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
    color: 'sky',
  },
  {
    step: '02',
    title: 'Invite your team',
    description: 'Add coordinators, advisors, evaluators, and students with the right permissions from day one.',
    icon: Users,
    color: 'violet',
  },
  {
    step: '03',
    title: 'Launch & track projects',
    description: 'Students submit proposals, advisors review, and the entire workflow flows automatically with alerts and milestones.',
    icon: GitBranch,
    color: 'emerald',
  },
  {
    step: '04',
    title: 'Schedule and evaluate',
    description: 'Defense scheduling, evaluator assignments, rubric-based grading, and final outcome publishing—all in one place.',
    icon: Trophy,
    color: 'amber',
  },
]

const bentoFeatures = [
  {
    title: 'Project Management',
    description: 'Full lifecycle tracking from proposal submission to final defense. Monitor milestones, deadlines, and deliverables in one structured workspace.',
    icon: GitBranch,
    details: ['Multi-stage workflow management', 'Milestone & deadline tracking', 'Document version control', 'Progress visualization'],
    size: 'large',
    gradient: 'from-sky-500/10 to-blue-600/5',
    accent: 'sky',
  },
  {
    title: 'Smart Scheduling',
    description: 'Conflict-free defense scheduling with automated room booking and calendar sync.',
    icon: Calendar,
    details: ['Automated conflict detection', 'Room & resource booking', 'Calendar integration', 'Reminders via email & SMS'],
    size: 'small',
    gradient: 'from-violet-500/10 to-purple-600/5',
    accent: 'violet',
  },
  {
    title: 'Team Collaboration',
    description: 'Real-time messaging, file sharing, and task assignment between students and advisors.',
    icon: Users,
    details: ['Real-time messaging', 'File sharing & comments', 'Task assignment', 'Activity feeds'],
    size: 'small',
    gradient: 'from-emerald-500/10 to-teal-600/5',
    accent: 'emerald',
  },
  {
    title: 'Analytics & Reports',
    description: 'Comprehensive department-wide insights into project progress, advisor workloads, and outcomes—exportable in one click.',
    icon: BarChart3,
    details: ['Custom reports & metrics', 'Progress tracking', 'Performance analytics', 'Export capabilities'],
    size: 'large',
    gradient: 'from-amber-500/10 to-orange-600/5',
    accent: 'amber',
  },
  {
    title: 'Smart Notifications',
    description: 'Deadline reminders, status updates, and activity digests delivered intelligently.',
    icon: Bell,
    details: ['Email & SMS alerts', 'Customisable preferences', 'Deadline reminders', 'Activity digests'],
    size: 'small',
    gradient: 'from-rose-500/10 to-pink-600/5',
    accent: 'rose',
  },
  {
    title: 'Document Hub',
    description: 'Centralised secure cloud storage with version history and template library.',
    icon: FileText,
    details: ['Secure cloud storage', 'Version history', 'Format conversion', 'Template library'],
    size: 'small',
    gradient: 'from-cyan-500/10 to-sky-600/5',
    accent: 'cyan',
  },
]

const accentMap: Record<string, { bg: string; text: string; border: string; check: string }> = {
  sky:    { bg: 'bg-sky-100 dark:bg-sky-950/70',    text: 'text-sky-700 dark:text-sky-300',    border: 'border-sky-200/60 dark:border-sky-800/50',    check: 'text-sky-600 dark:text-sky-400' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-950/70', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200/60 dark:border-violet-800/50', check: 'text-violet-600 dark:text-violet-400' },
  emerald:{ bg: 'bg-emerald-100 dark:bg-emerald-950/70', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200/60 dark:border-emerald-800/50', check: 'text-emerald-600 dark:text-emerald-400' },
  amber:  { bg: 'bg-amber-100 dark:bg-amber-950/70', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200/60 dark:border-amber-800/50',  check: 'text-amber-600 dark:text-amber-400' },
  rose:   { bg: 'bg-rose-100 dark:bg-rose-950/70',  text: 'text-rose-700 dark:text-rose-300',  border: 'border-rose-200/60 dark:border-rose-800/50',  check: 'text-rose-600 dark:text-rose-400' },
  cyan:   { bg: 'bg-cyan-100 dark:bg-cyan-950/70',  text: 'text-cyan-700 dark:text-cyan-300',  border: 'border-cyan-200/60 dark:border-cyan-800/50',  check: 'text-cyan-600 dark:text-cyan-400' },
}

const roleFeatures = [
  {
    role: 'Department Heads',
    icon: Shield,
    description: 'Administrative oversight to keep programs, people, and policies aligned.',
    color: 'sky',
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
    color: 'violet',
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
    color: 'emerald',
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
    color: 'amber',
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
    color: 'rose',
    features: [
      { title: 'Project Workspace', description: 'Centralised hub for all project-related activities.' },
      { title: 'Advisor Communication', description: 'Direct messaging and meeting scheduling with advisors.' },
      { title: 'Document Submission', description: 'Submit and track all project deliverables easily.' },
      { title: 'Defense Preparation', description: 'Access defense schedules and preparation resources.' },
    ],
  },
]

const advancedFeatures = [
  { title: 'Custom Workflows', icon: Zap, description: "Configure project workflows to match your department's unique processes and requirements.", color: 'violet' },
  { title: 'Video Integration', icon: Video, description: 'Built-in video conferencing for remote meetings and virtual defenses with recording support.', color: 'sky' },
  { title: 'Enterprise Security', icon: Shield, description: 'Enterprise-grade security with SSO, 2FA, audit logs, and role-based access control.', color: 'emerald' },
  { title: 'AI-Assisted Review', icon: Cpu, description: 'Smart suggestions for advisor matching, scheduling optimisation, and project similarity checks.', color: 'amber' },
  { title: 'Multi-campus Support', icon: Globe, description: 'Manage multiple departments or campuses under one organisation with isolated data tenants.', color: 'rose' },
  { title: 'Deep Integrations', icon: Layers, description: 'Connect with LMS platforms, calendar services, email providers, and institutional SSO.', color: 'cyan' },
]

/* ─────────────────────────── campus carousel ─────────────────────────── */

const campusSlides = [
  { src: '/sign-in-campus.jpg',  alt: 'Main campus administration building' },
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
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
    >
      {/* outer glow ring */}
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-sky-400/20 via-blue-500/10 to-violet-500/20 blur-xl dark:from-sky-500/15 dark:to-violet-500/15" />

      {/* image card */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/60 shadow-2xl shadow-sky-900/20 dark:border-slate-700/60 dark:shadow-sky-900/30">

        {/* crossfade slides */}
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

        {/* bottom gradient fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />

        {/* bottom bar: label + dot indicators */}
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

      {/* floating badge — top-right */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.45 }}
        className="absolute -right-4 -top-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/90"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/70">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-medium text-muted-foreground">Projects tracked</p>
          <p className="text-sm font-bold text-foreground">12,000+</p>
        </div>
      </motion.div>

      {/* floating badge — bottom-right */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.45 }}
        className="absolute -bottom-5 -right-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/90"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/70">
          <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-medium text-muted-foreground">Satisfaction rate</p>
          <p className="text-sm font-bold text-foreground">98%</p>
        </div>
      </motion.div>

      {/* floating badge — left-center */}
      <motion.div
        initial={{ opacity: 0, x: -12, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.85, duration: 0.45 }}
        className="absolute -left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/90"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/70">
          <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-medium text-muted-foreground">Institutions</p>
          <p className="text-sm font-bold text-foreground">500+</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────── stat counter ─────────────────────────── */

function StatCard({ value, suffix, label, icon: Icon }: typeof stats[0]) {
  const { ref, count } = useCountUp(value)
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        <span ref={ref}>{count.toLocaleString()}</span>
        <span className="text-sky-600 dark:text-sky-400">{suffix}</span>
      </p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

/* ─────────────────────────── page ─────────────────────────── */

export default function FeaturesPage() {
  const [activeRole, setActiveRole] = useState(0)
  const role = roleFeatures[activeRole]
  const roleAccent = accentMap[role.color]

  return (
    <div className="min-w-0 overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        {/* ambient glow blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-sky-400/10 blur-[120px] dark:bg-sky-500/8" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-[400px] w-[500px] rounded-full bg-violet-400/8 blur-[100px] dark:bg-violet-500/6" aria-hidden />

        <div className={cn(container, 'relative py-16 sm:py-20 lg:py-24')}>
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">

            {/* ── left: text ── */}
          <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              <Badge className="mb-5 inline-flex gap-1.5 border-sky-200/80 bg-sky-100/80 px-4 py-1.5 text-xs font-semibold text-sky-800 dark:border-sky-800/70 dark:bg-sky-950/60 dark:text-sky-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
              All-in-one academic platform
            </Badge>

              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl xl:text-6xl">
                <span className="bg-gradient-to-r from-sky-600 via-blue-500 to-violet-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-blue-400 dark:to-violet-400">
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
                  className="group h-12 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-8 text-base font-semibold shadow-lg shadow-sky-900/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-900/25 dark:from-sky-500 dark:to-blue-500"
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

              {/* trust row */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
                {['No credit card required', 'Free 30-day trial', 'GDPR compliant', 'SOC 2 ready'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    {t}
                  </span>
                ))}
              </div>
          </motion.div>

            {/* ── right: campus image carousel ── */}
            <HeroCampusCarousel />

          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-border/50 bg-muted/20 py-14 dark:bg-muted/10">
        <div className={container}>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
              >
                <StatCard {...s} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <Badge className="mb-3 border-violet-200/80 bg-violet-100/70 px-3 py-1 text-xs font-semibold text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-200">
              How it works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Up and running in four steps
            </h2>
            <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">
              Academia is designed to get your team productive from day one.
            </p>
          </motion.div>

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* connector line */}
            <div className="pointer-events-none absolute left-0 right-0 top-[3.5rem] hidden border-t-2 border-dashed border-border/60 lg:block" aria-hidden />

            {steps.map((s, i) => {
              const Icon = s.icon
              const a = accentMap[s.color]
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  className="relative flex flex-col items-center gap-4 text-center"
                >
                  <div className={cn('relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 shadow-sm', a.bg, a.border)}>
                    <Icon className={cn('h-6 w-6', a.text)} aria-hidden />
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                  </div>
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
            <Badge className="mb-3 border-sky-200/80 bg-sky-100/70 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-200">
              Core features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tools for the full project lifecycle
            </h2>
            <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">
              Designed for real university workflows — nothing unnecessary, nothing missing.
            </p>
          </motion.div>

          {/* bento grid: large | small small / small small | large */}
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bentoFeatures.map((f, i) => {
              const a = accentMap[f.accent]
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.07, duration: 0.45 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg',
                    a.border,
                    f.size === 'large' && 'sm:col-span-2 lg:col-span-1',
                  )}
                >
                  {/* tinted bg */}
                  <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 dark:opacity-40', f.gradient)} />

                  <div className="relative">
                    <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl', a.bg)}>
                      <Icon className={cn('h-6 w-6', a.text)} aria-hidden />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                    <ul className="space-y-2">
                      {f.details.map((d) => (
                        <li key={d} className="flex items-start gap-2 text-sm">
                          <CheckCircle className={cn('mt-0.5 h-4 w-4 shrink-0', a.check)} aria-hidden />
                          <span className="text-muted-foreground">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* hover arrow */}
                  <div className={cn('absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100', a.bg)}>
                    <ChevronRight className={cn('h-4 w-4', a.text)} />
                  </div>
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
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why institutions choose Academia
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
                color: 'emerald',
              },
              {
                icon: LayoutGrid,
                title: 'Designed for campuses',
                body: 'Workflows mirror how departments actually run projects, reviews, and defenses.',
                color: 'sky',
              },
              {
                icon: BarChart3,
                title: 'Visibility for everyone',
                body: 'Dashboards and notifications keep advisors, students, and admins aligned in real time.',
                color: 'violet',
              },
            ].map((v, i) => {
              const a = accentMap[v.color]
              return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn('rounded-2xl border p-7 shadow-sm', a.border, 'bg-card')}
                >
                  <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', a.bg)}>
                    <v.icon className={cn('h-6 w-6', a.text)} />
                    </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </motion.div>
              )
            })}
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
            <Badge className="mb-3 border-emerald-200/80 bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200">
              Built for every role
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One platform, every perspective
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground sm:text-lg">
              Switch between roles to see how Academia works for your team.
            </p>
          </motion.div>

          {/* role pills */}
          <div
            role="tablist"
            aria-label="Features by role"
            className="-mx-4 mb-8 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
          >
            {roleFeatures.map((r, idx) => {
              const Icon = r.icon
              const selected = activeRole === idx
              const a = accentMap[r.color]
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
                      ? cn('shadow-md', a.bg, a.text, a.border)
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

          {/* role panel */}
          <motion.div
            key={role.role}
            role="tabpanel"
            id={`role-panel-${activeRole}`}
            aria-labelledby={`role-tab-${activeRole}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={cn('mx-auto max-w-4xl rounded-3xl border p-6 shadow-md sm:p-8', roleAccent.border, 'bg-card')}
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl', roleAccent.bg)}>
                {(() => { const Icon = role.icon; return <Icon className={cn('h-8 w-8', roleAccent.text)} aria-hidden /> })()}
                  </div>
              <div>
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">{role.role}</h3>
                <p className="mt-1 text-base text-muted-foreground">{role.description}</p>
                  </div>
                </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {role.features.map((f, fi) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: fi * 0.05, duration: 0.3 }}
                  className={cn('rounded-xl border p-4', roleAccent.border, 'bg-muted/30 dark:bg-muted/10')}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className={cn('mt-0.5 h-5 w-5 shrink-0', roleAccent.check)} />
                    <div>
                      <h4 className="font-semibold text-foreground">{f.title}</h4>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                    </div>
                  </div>
                </motion.div>
                  ))}
                </div>
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
            <Badge className="mb-3 border-amber-200/80 bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200">
              Advanced capabilities
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for departments that need scale
            </h2>
            <p className="mt-3 text-muted-foreground sm:text-lg">
              Deeper controls for security, customisation, and enterprise readiness.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {advancedFeatures.map((f, i) => {
              const a = accentMap[f.color]
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={cn(
                    'group flex gap-4 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
                    a.border, 'bg-card',
                  )}
                >
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', a.bg)}>
                    <Icon className={cn('h-5 w-5', a.text)} aria-hidden />
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
      <section className="border-y border-border/50 bg-gradient-to-b from-sky-50/50 to-white py-16 dark:from-sky-950/20 dark:to-slate-950/0">
        <div className={container}>
          <div className="mx-auto mb-10 max-w-xl text-center">
            <div className="mb-2 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
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
                className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
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

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-violet-700 p-10 text-center shadow-2xl shadow-sky-900/30 sm:p-14 lg:p-20 dark:from-sky-700 dark:via-blue-700 dark:to-violet-800"
          >
            {/* decorative circles */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <Badge className="mb-5 border-white/30 bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                Free 30-day trial · No credit card needed
              </Badge>

              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to modernise academic<br className="hidden sm:block" /> project management?
                </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-sky-100 sm:text-lg">
                  Register your department, invite your team, and move proposals, reviews, and defenses
                into one structured workspace — starting today.
                </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    size="lg"
                  className="h-13 group rounded-2xl bg-white px-8 text-base font-semibold text-sky-700 shadow-lg transition-all hover:scale-[1.02] hover:bg-white/90 hover:shadow-xl"
                    asChild
                  >
                    <Link href="/register">
                    Create department account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-13 rounded-2xl border border-white/30 px-8 text-base font-semibold text-white hover:bg-white/15"
                  asChild
                >
                  <Link href="/login">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Already have an account?
                  </Link>
                  </Button>
                </div>

              {/* mini trust row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-sky-100/80">
                {['500+ institutions', 'GDPR compliant', '99.9 % uptime SLA', 'SOC 2 ready'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
