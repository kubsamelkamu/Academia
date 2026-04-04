'use client'

import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
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
} from 'lucide-react'

const container = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

const accent = {
  sky: {
    iconBg: 'bg-sky-100 dark:bg-sky-950/70',
    icon: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200/60 dark:border-sky-800/50',
  },
  violet: {
    iconBg: 'bg-violet-100 dark:bg-violet-950/70',
    icon: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200/60 dark:border-violet-800/50',
  },
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    icon: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/60 dark:border-emerald-800/50',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-950/70',
    icon: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200/60 dark:border-amber-800/50',
  },
} as const

function useCountUp(target: number, duration = 1600) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(id)
      } else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(id)
  }, [inView, target, duration])

  return { ref, count }
}

function StatBlock({
  value,
  suffix,
  label,
  sub,
}: {
  value: number
  suffix: string
  label: string
  sub?: string
}) {
  const { ref, count } = useCountUp(value)
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center shadow-sm backdrop-blur-sm">
      <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        <span ref={ref}>{count.toLocaleString()}</span>
        <span className="text-sky-600 dark:text-sky-400">{suffix}</span>
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

const missionItems = [
  {
    title: 'Streamlined processes',
    body: 'Simplify complex academic workflows from proposal to defense with clear stages, deadlines, and visibility.',
    icon: Target,
    key: 'sky' as const,
  },
  {
    title: 'Enhanced collaboration',
    body: 'Bring students, advisors, coordinators, and evaluators into one workspace with messaging, files, and notifications.',
    icon: Users,
    key: 'violet' as const,
  },
  {
    title: 'Quality assurance',
    body: 'Track milestones, reviews, and outcomes so departments can uphold standards without drowning in spreadsheets.',
    icon: Award,
    key: 'emerald' as const,
  },
]

const storySteps = [
  {
    step: '01',
    title: 'The vision',
    body: 'Educators and technologists saw how fragmented tools slowed projects from intake to defense—and imagined something better.',
    icon: Lightbulb,
    key: 'amber' as const,
  },
  {
    step: '02',
    title: 'Research & partnerships',
    body: 'We worked with departments to map real workflows, pain points, and compliance needs before writing a line of product code.',
    icon: BookOpen,
    key: 'sky' as const,
  },
  {
    step: '03',
    title: 'Building Academia',
    body: 'We shipped a tenant-aware platform with roles, scheduling, documents, and analytics tuned for how campuses actually operate.',
    icon: Rocket,
    key: 'violet' as const,
  },
  {
    step: '04',
    title: 'Ongoing innovation',
    body: 'Feedback from institutions worldwide continues to shape the roadmap—security, integrations, and smarter automation.',
    icon: Sparkles,
    key: 'emerald' as const,
  },
]

const values = [
  {
    title: 'Innovation',
    body: 'We iterate quickly so academic software keeps pace with how teaching and research evolve.',
    icon: Lightbulb,
    key: 'sky' as const,
  },
  {
    title: 'Community',
    body: 'Strong programs depend on people. We design for trust, clarity, and inclusion across every role.',
    icon: Heart,
    key: 'rose' as const,
  },
  {
    title: 'Integrity',
    body: 'Data protection, audit-friendly workflows, and honest communication are non-negotiable.',
    icon: Shield,
    key: 'emerald' as const,
  },
] as const

const valueAccent = {
  ...accent,
  rose: {
    iconBg: 'bg-rose-100 dark:bg-rose-950/70',
    icon: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200/60 dark:border-rose-800/50',
  },
}

export default function AboutPage() {
  return (
    <div className="min-w-0 overflow-x-hidden">
      {/* Hero */}
      <section className="relative border-b border-border/50 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-sky-400/12 blur-[100px] dark:bg-sky-500/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[400px] rounded-full bg-violet-400/10 blur-[90px] dark:bg-violet-500/8"
          aria-hidden
        />

        <div className={cn(container, 'relative py-16 sm:py-20 lg:py-24')}>
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <Badge className="mb-4 inline-flex gap-1.5 border-sky-200/80 bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-800/70 dark:bg-sky-950/60 dark:text-sky-200">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                About Academia
              </Badge>

              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl xl:text-6xl">
                <span className="bg-gradient-to-r from-sky-600 via-blue-500 to-violet-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-blue-400 dark:to-violet-400">
                  Empowering
                </span>{' '}
                <span className="text-foreground">academic excellence</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg">
                Academia exists to modernise how universities run academic projects—from proposals and supervision
                to defenses and outcomes—so every stakeholder can focus on learning, not logistics.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  size="lg"
                  className="group h-12 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-7 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] dark:from-sky-500 dark:to-blue-500"
                  asChild
                >
                  <Link href="/register">
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-2xl px-7 text-base" asChild>
                  <Link href="/features">Explore features</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
                {['Built with institutions', 'Security-first', 'Designed for every role'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative w-full max-w-md flex-shrink-0 lg:max-w-none lg:w-[42%]"
              initial={{ opacity: 0, x: 28, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 }}
            >
              <div className="absolute -inset-2 rounded-[1.6rem] bg-gradient-to-br from-sky-400/20 via-blue-500/10 to-violet-500/20 blur-xl dark:from-sky-500/15" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 shadow-2xl shadow-sky-900/15 dark:shadow-sky-900/25">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src="/sign-in-campus.jpg"
                    alt="University campus"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/15 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-sky-200">Our mission</p>
                      <p className="text-sm font-bold text-white">Campuses deserve calmer, clearer workflows</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
                      <GraduationCap className="h-5 w-5 text-white" aria-hidden />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b border-border/50 bg-muted/25 py-16 dark:bg-muted/10 sm:py-20 lg:py-24">
        <div className={container}>
          <motion.div
            className="mx-auto mb-12 max-w-2xl text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <Badge className="mb-3 border-emerald-200/80 bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200">
              Our mission
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why we built Academia</h2>
            <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">
              A single platform that streamlines workflows, strengthens collaboration, and helps every stakeholder succeed.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {missionItems.map((item, i) => {
              const a = accent[item.key]
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  whileHover={{ y: -4 }}
                  className={cn(
                    'rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg',
                    a.border,
                  )}
                >
                  <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl', a.iconBg)}>
                    <Icon className={cn('h-6 w-6', a.icon)} aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Story timeline */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className={container}>
          <motion.div
            className="mx-auto mb-14 max-w-2xl text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-3 border-violet-200/80 bg-violet-100/70 px-3 py-1 text-xs font-semibold text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-200">
              Our story
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From idea to platform</h2>
            <p className="mt-3 text-pretty text-muted-foreground sm:text-lg">
              Academia bridges gaps in traditional project management—so faculty spend less time coordinating and more time mentoring.
            </p>
          </motion.div>

          <div className="relative mx-auto max-w-3xl">
            <div
              className="pointer-events-none absolute left-[1.125rem] top-3 bottom-3 hidden w-px bg-gradient-to-b from-sky-300 via-violet-300 to-emerald-300 dark:from-sky-700 dark:via-violet-700 dark:to-emerald-700 sm:block md:left-1/2 md:-ml-px"
              aria-hidden
            />

            <ul className="space-y-10 sm:space-y-14">
              {storySteps.map((s, i) => {
                const a = accent[s.key]
                const Icon = s.icon
                const isRight = i % 2 === 1
                return (
                  <motion.li
                    key={s.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ delay: i * 0.06, duration: 0.45 }}
                    className={cn(
                      'relative flex flex-col gap-4 sm:flex-row sm:items-center',
                      'md:gap-0',
                      isRight ? 'md:flex-row-reverse' : '',
                    )}
                  >
                    <div className="hidden flex-1 md:block" />
                    <div className="relative z-10 flex shrink-0 justify-start sm:pl-0 md:w-24 md:justify-center md:px-0">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white shadow-md',
                          s.key === 'amber' && 'bg-gradient-to-br from-amber-500 to-orange-600',
                          s.key === 'sky' && 'bg-gradient-to-br from-sky-500 to-blue-600',
                          s.key === 'violet' && 'bg-gradient-to-br from-violet-500 to-purple-600',
                          s.key === 'emerald' && 'bg-gradient-to-br from-emerald-500 to-teal-600',
                        )}
                      >
                        {s.step}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex-1 rounded-2xl border bg-card p-5 shadow-sm sm:ml-12 md:ml-0',
                        a.border,
                        isRight ? 'md:mr-6 md:text-right' : 'md:ml-6 md:text-left',
                      )}
                    >
                      <div className={cn('mb-3 flex items-center gap-2', isRight && 'md:flex-row-reverse md:justify-end')}>
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', a.iconBg)}>
                          <Icon className={cn('h-5 w-5', a.icon)} aria-hidden />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-gradient-to-b from-sky-50/40 to-transparent py-16 dark:from-sky-950/20 sm:py-20">
        <div className={container}>
          <motion.p
            className="mb-8 text-center text-sm font-medium text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Trusted by teams who need reliability at scale
          </motion.p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatBlock value={500} suffix="+" label="Institutions" sub="Departments & programs" />
            <StatBlock value={50} suffix="K+" label="Students & researchers" sub="On active workflows" />
            <StatBlock value={99} suffix=".9%" label="Target uptime" sub="Enterprise-ready infrastructure" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className={container}>
          <motion.div
            className="mx-auto mb-12 max-w-2xl text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our values</h2>
            <p className="mt-3 text-muted-foreground sm:text-lg">Principles that guide how we build and partner with campuses.</p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {values.map((v, i) => {
              const a = valueAccent[v.key]
              const Icon = v.icon
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    'group rounded-2xl border bg-card/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md',
                    a.border,
                  )}
                >
                  <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105', a.iconBg)}>
                    <Icon className={cn('h-6 w-6', a.icon)} aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-violet-700 p-10 text-center shadow-2xl shadow-sky-900/30 sm:p-14 dark:from-sky-700 dark:via-blue-700 dark:to-violet-800"
          >
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <Badge className="mb-4 border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                Join the community
              </Badge>
              <h2 className="text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Ready to bring calmer workflows to your department?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-sky-100 sm:text-base">
                Start a free trial, invite your team, and see how Academia fits your academic project lifecycle.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="group h-12 rounded-2xl bg-white px-8 text-base font-semibold text-sky-700 shadow-lg hover:bg-white/90"
                  asChild
                >
                  <Link href="/register">
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-2xl border border-white/30 px-8 text-base font-semibold text-white hover:bg-white/15"
                  asChild
                >
                  <Link href="/contact">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Talk to us
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
