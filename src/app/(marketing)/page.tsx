"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useRef, useMemo, useSyncExternalStore } from "react"
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
  GraduationCap,
  Sparkles,
  Rocket,
  Award,
  TrendingUp,
  Globe,
  Clock,
  Heart,
  ChevronRight
} from "lucide-react"

// Brand color configuration
const BRAND_COLOR = "#ED5F45"
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

/* ── Animated Counter Component ── */
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""))
  const hasPlus = value.includes("+")

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = numericValue / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [numericValue])

  return (
    <span>
      {count}
      {hasPlus && "+"}
      {suffix}
    </span>
  )
}

const HERO_SLIDES = [
  { src: "/department head.png", label: "Department head" },
  { src: "/students.png", label: "Students" },
  { src: "/advisor.png", label: "Advisor" },
  { src: "/evaluator.png", label: "Evaluator" },
  { src: "/coordinator.png", label: "Coordinator" },
] as const

const HERO_SLIDE_INTERVAL_MS = 6500

/* ── Hero Slideshow — full-viewport sequence with cinematic transitions ── */
function HeroSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length)
    }, HERO_SLIDE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const slide = HERO_SLIDES[current]

  return (
    <div className="absolute inset-0 h-full min-h-[100dvh] w-full overflow-hidden bg-slate-950">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.src}
          className="absolute inset-0"
          initial={{
            opacity: 0,
            scale: 1.14,
            x: "4%",
            filter: "blur(14px) brightness(0.75)",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: "0%",
            filter: "blur(0px) brightness(1)",
          }}
          exit={{
            opacity: 0,
            scale: 0.94,
            x: "-6%",
            filter: "blur(10px) brightness(0.6)",
          }}
          transition={{
            duration: 1.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.06 }}
            transition={{
              duration: HERO_SLIDE_INTERVAL_MS / 1000,
              ease: "linear",
            }}
          >
            <Image
              src={slide.src}
              alt={slide.label}
              fill
              priority={current === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-slate-950/45 to-slate-950/92 dark:from-slate-950/92 dark:via-slate-950/55 dark:to-slate-950/96" />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_120%,rgba(237,95,69,0.12),transparent_55%)]" />

          {/* Role chip — ties each full-screen image to the story arc */}
          <motion.div
            className="absolute bottom-10 left-1/2 z-[1] flex -translate-x-1/2 px-5 sm:bottom-14"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
          >
            <span className="rounded-full border border-white/20 bg-black/35 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/90 shadow-lg backdrop-blur-md sm:text-sm">
              {slide.label}
            </span>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Step indicators */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] flex justify-center gap-2 pb-5 sm:pb-7">
        {HERO_SLIDES.map((s, i) => (
          <motion.div
            key={s.src}
            className="h-1.5 rounded-full bg-white/25"
            initial={false}
            animate={{
              width: i === current ? 40 : 8,
              backgroundColor: i === current ? "rgba(237,95,69,1)" : "rgba(255,255,255,0.25)",
              opacity: i === current ? 1 : 0.45,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  )
}

const PARTICLE_COUNT = 24

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 2 + (i % 4),
        duration: 12 + (i % 8) * 2,
        delay: (i % 5) * 0.4,
      })),
    []
  )

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[#ED5F45]/30 shadow-[0_0_12px_rgba(237,95,69,0.35)]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -28, 0],
            x: [0, 12, 0],
            opacity: [0.2, 0.55, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

export default function HomePage() {
  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const { scrollYProgress } = useScroll()

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative bg-slate-50 dark:bg-slate-950">

      {/* Hero — full viewport; backgrounds clipped to this section only */}
      <section className="relative isolate flex min-h-[100dvh] min-h-screen items-center overflow-hidden pt-24 pb-28 md:pb-24 md:pt-0">
        <HeroSlideshow />
        <FloatingParticles />
        <div className="pointer-events-none absolute inset-0 z-[2]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ED5F45]/15 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ED5F45]/50 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            initial={{ opacity: 0, y: 30 }}
            animate={isClient ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mx-auto max-w-[1600px] text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              className="inline-block"
            >
              <Badge className="mb-8 border-[#ED5F45]/30 bg-white/60 dark:bg-[#ED5F45]/10 text-[#ED5F45] px-8 py-3 text-sm rounded-full shadow-lg backdrop-blur-md">
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Next-Generation Academic Platform
                <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
              </Badge>
            </motion.div>

            <h1 className="mb-8 px-4 text-4xl font-black leading-[1.1] tracking-tighter text-white sm:px-0 sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="[text-shadow:0_2px_28px_rgba(0,0,0,0.55)]">Academic Project</span>{" "}
              <span className="inline-block whitespace-normal text-[#ED5F45] md:whitespace-nowrap">
                Management Excellence.
              </span>
            </h1>

            <p className="mt-8 text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-md md:text-slate-600 md:drop-shadow-none dark:text-slate-300">
              Streamline your university&apos;s academic project workflow from proposal to defense.
              Experience seamless collaboration with real-time visibility.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <MagnetButton>
                <Button size="lg" className="h-16 px-10 text-xl font-bold bg-[#ED5F45] hover:bg-[#D54A32] text-white shadow-2xl shadow-[#ED5F45]/20 rounded-2xl group transition-all duration-300 transform hover:scale-105 border-none" asChild>
                  <Link href="/register">
                    Launch Workspace <Rocket className="ml-3 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                </Button>
              </MagnetButton>

              <MagnetButton>
                <Button size="lg" variant="outline" className="h-16 border-2 border-white/40 bg-black/25 px-10 text-xl font-bold text-white backdrop-blur-sm hover:bg-white/10 md:border-[#ED5F45]/30 md:bg-transparent md:text-[#ED5F45] md:hover:bg-[#ED5F45]/10 rounded-2xl transition-all" asChild>
                  <Link href="/demo">
                    Watch Demo <Play className="ml-3 h-6 w-6" />
                  </Link>
                </Button>
              </MagnetButton>
            </div>

            <motion.div
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-200/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]"
              initial={{ opacity: 0 }}
              animate={isClient ? { opacity: 1 } : {}}
              transition={{ delay: 0.6, duration: 1 }}
            >
              {[
                { icon: Shield, text: "SOC 2 Compliant" },
                { icon: Globe, text: "GDPR Ready" },
                { icon: Clock, text: "99.9% Uptime" },
                { icon: Award, text: "Best in Class" }
              ].map((tag) => (
                <div key={tag.text} className="flex items-center gap-3">
                  <tag.icon className="h-4 w-4 text-[#ED5F45]" />
                  <span>{tag.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-40 bg-white dark:bg-slate-900 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#ED5F45_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-[0.03]" />

        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto max-w-3xl text-center mb-24"
          >
            <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
              The Process
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              How <span className="text-[#ED5F45]">Academia</span> Works
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Tailored specifically for the unique demands of higher education administration.
            </p>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-3 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ED5F45]/30 to-transparent -z-10" />

            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <TiltCard>
                  <div className="relative z-10 bg-white dark:bg-slate-900 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group h-full">
                    <div className="relative mb-8">
                      <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-[#ED5F45] to-[#F47A64] text-white text-3xl font-black flex items-center justify-center shadow-lg shadow-[#ED5F45]/30 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                        {index + 1}
                      </div>
                      <div className="absolute -top-4 -left-4 w-32 h-32 bg-[#ED5F45]/10 rounded-full blur-3xl -z-10 group-hover:bg-[#ED5F45]/20 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-[#ED5F45] transition-colors">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 font-semibold leading-relaxed mb-8">{step.description}</p>

                    <div className="mt-auto flex items-center text-[#ED5F45] font-black text-xs uppercase tracking-widest group/link cursor-pointer">
                      Learn detail <ChevronRight className="ml-1 h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-40 relative">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-24"
          >
            <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
              Capabilities
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Empowering <span className="text-[#ED5F45]">Every Role</span>
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Robust tools that empower students and faculty alike.
            </p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20, rotateX: 5 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: index * 0.07, duration: 0.45 }}
              >
                <TiltCard className="h-full">
                  <Card className="h-full border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden group transition-all duration-500 hover:shadow-2xl">
                    <CardContent className="p-10" style={{ transformStyle: "preserve-3d" }}>
                      <motion.div
                        style={{ translateZ: 30 }}
                        className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED5F45]/10 to-[#F47A64]/10 text-[#ED5F45] group-hover:bg-[#ED5F45] group-hover:text-white transition-all duration-300"
                      >
                        <feature.icon className="h-8 w-8 text-inherit" />
                      </motion.div>
                      <motion.h3 style={{ translateZ: 40 }} className="mb-4 font-black text-xl tracking-tighter uppercase">{feature.title}</motion.h3>
                      <motion.p style={{ translateZ: 50 }} className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {feature.description}
                      </motion.p>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Compact Refined Layout */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-white dark:bg-slate-900 border-b border-border/50">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#ED5F45_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-[0.03]" />

        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, rotateX: 5 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1, type: "spring" }}
                viewport={{ once: true }}
              >
                <TiltCard>
                  <div className="text-center p-8 py-14 rounded-[2.5rem] bg-background border-[#ED5F45]/20 border shadow-xl transition-all duration-300 hover:shadow-[#ED5F45]/15 group">
                    <div className="text-5xl md:text-6xl font-black text-[#ED5F45] mb-6 tracking-tighter group-hover:scale-105 transition-transform duration-500">
                      <AnimatedCounter value={stat.value} />
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] uppercase text-xs mb-8">
                      {stat.label}
                    </div>
                    <div className="h-1.5 w-16 bg-[#ED5F45]/15 mx-auto rounded-full overflow-hidden">
                      <motion.div
                        initial={{ x: "-100%" }}
                        whileInView={{ x: "0%" }}
                        transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                        className="h-full w-full bg-[#ED5F45]"
                      />
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 md:py-40 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-24"
          >
            <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
              Social Proof
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Trusted by <span className="text-[#ED5F45]">Departments</span>
            </h2>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 50, scale: 0.95, rotateY: 15 }}
                animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.95, rotateY: -15 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                style={{ perspective: "1000px" }}
              >
                <TiltCard>
                  <Card className="bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[3rem] overflow-hidden">
                    <CardContent className="p-12 md:p-20 relative" style={{ transformStyle: "preserve-3d" }}>
                      <motion.div style={{ translateZ: 20 }} className="absolute top-10 right-10 opacity-5">
                        <GraduationCap className="h-40 w-40 text-[#ED5F45]" />
                      </motion.div>
                      <motion.div style={{ translateZ: 40 }} className="flex mb-10 gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-6 w-6 fill-[#ED5F45] text-[#ED5F45]" />
                        ))}
                      </motion.div>
                      <motion.p style={{ translateZ: 60 }} className="text-2xl md:text-3xl text-slate-700 dark:text-slate-300 mb-12 font-medium italic leading-relaxed">
                        &quot;{testimonials[activeTestimonial].quote}&quot;
                      </motion.p>
                      <motion.div style={{ translateZ: 80 }} className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 ring-4 ring-[#ED5F45]/10">
                          <AvatarImage src={testimonials[activeTestimonial].avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-[#ED5F45] to-[#F47A64] text-white text-2xl font-black">
                            {testimonials[activeTestimonial].name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {testimonials[activeTestimonial].name}
                          </div>
                          <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                            {testimonials[activeTestimonial].role}
                          </div>
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-4 mt-12">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2.5 rounded-full transition-all duration-500 ${activeTestimonial === index
                    ? "w-12 bg-[#ED5F45]"
                    : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 md:py-40">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold">
              Visual Tour
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
              See <span className="text-[#ED5F45]">Academia</span> in Action
            </h2>
            <div className="relative group">
              <motion.div
                className="relative aspect-video bg-slate-200 dark:bg-slate-800 rounded-[3rem] overflow-hidden cursor-pointer shadow-2xl border border-slate-200 dark:border-slate-800"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.5 }}
                onClick={() => {
                  const video = document.getElementById('demo-video') as HTMLVideoElement;
                  if (video) {
                    if (video.paused) {
                      video.play();
                      document.getElementById('play-overlay')?.classList.add('opacity-0');
                    } else {
                      video.pause();
                      document.getElementById('play-overlay')?.classList.remove('opacity-0');
                    }
                  }
                }}
              >
                <video
                  id="demo-video"
                  className="absolute inset-0 w-full h-full object-cover"
                  src="/vedio.mp4"
                  loop
                  playsInline
                  onPlay={() => document.getElementById('play-overlay')?.classList.add('opacity-0')}
                  onPause={() => document.getElementById('play-overlay')?.classList.remove('opacity-0')}
                />
                <div
                  id="play-overlay"
                  className="absolute inset-0 bg-gradient-to-tr from-slate-950/60 via-slate-950/20 to-transparent flex items-center justify-center transition-opacity duration-500"
                >
                  <motion.div
                    className="bg-white/90 backdrop-blur-xl rounded-full p-8 shadow-2xl shadow-white/10"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Play className="h-12 w-12 text-[#ED5F45] fill-[#ED5F45]" />
                  </motion.div>
                </div>
                <div className="absolute bottom-10 left-10 pointer-events-none">
                  <Badge className="bg-black/60 backdrop-blur-md text-white border-none px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#ED5F45] animate-pulse" />
                    University Experience Demo
                  </Badge>
                </div>
              </motion.div>

              {/* Decorative elements around the video */}
              <div className="absolute -top-6 -right-6 h-32 w-32 bg-[#ED5F45]/20 blur-3xl -z-10 group-hover:bg-[#ED5F45]/30 transition-colors duration-700" />
              <div className="absolute -bottom-6 -left-6 h-32 w-32 bg-[#ED5F45]/20 blur-3xl -z-10 group-hover:bg-[#ED5F45]/30 transition-colors duration-700" />
            </div>
          </motion.div>
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
              <Card className="relative overflow-hidden bg-slate-950 border-none shadow-2xl rounded-[4rem] min-h-[500px] flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ED5F45]/40 via-transparent to-[#ED5F45]/20" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#ED5F45]/20 blur-[100px]"
                />

                <CardContent className="relative p-12 md:p-24 text-center z-10" style={{ transformStyle: "preserve-3d" }}>
                  <motion.div style={{ translateZ: 50 }}>
                    <Heart className="h-16 w-16 text-[#ED5F45] mx-auto mb-10 animate-pulse" />
                  </motion.div>
                  <motion.h2 style={{ translateZ: 80 }} className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-10 leading-tight">
                    Ready to transform your<br />
                    <span className="text-[#ED5F45]">Academic Workflow?</span>
                  </motion.h2>
                  <motion.p style={{ translateZ: 60 }} className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                    Join 500+ universities already using Academia to deliver exceptional
                    thesis and capstone project experiences.
                  </motion.p>
                  <motion.div style={{ translateZ: 100 }} className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <MagnetButton>
                      <Button size="lg" className="h-16 px-12 text-xl font-black bg-[#ED5F45] hover:bg-white hover:text-[#ED5F45] text-white shadow-2xl rounded-2xl transition-all" asChild>
                        <Link href="/register/department">
                          Start Now — It&apos;s Free <Sparkles className="ml-3 h-6 w-6" />
                        </Link>
                      </Button>
                    </MagnetButton>
                    <MagnetButton>
                      <Button size="lg" variant="outline" className="h-16 px-12 text-xl font-bold border-2 border-white/20 text-white hover:bg-white/10 rounded-2xl backdrop-blur-md" asChild>
                        <Link href="/contact">Schedule Demo</Link>
                      </Button>
                    </MagnetButton>
                  </motion.div>
                  <motion.div style={{ translateZ: 40 }} className="mt-16 text-white/30 flex flex-wrap items-center justify-center gap-8 text-sm font-bold uppercase tracking-widest leading-none">
                    <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> No setup fees</span>
                    <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Cancel anytime</span>
                    <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Priority support</span>
                  </motion.div>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
        <p>© {new Date().getFullYear()} ACADEMIA. ENGINEERED FOR ACADEMIC EXCELLENCE.</p>
      </footer>
    </div>
  )
}

const steps = [
  {
    title: "Set Up Your Department",
    description: "Launch your university profile and onboard faculty members in a matter of minutes."
  },
  {
    title: "Configure Projects",
    description: "Define intelligent project templates, deadlines, and dynamic evaluation criteria."
  },
  {
    title: "Launch & Monitor",
    description: "Students submit work, faculty reviews, and defenses are scheduled with precision."
  }
]

const features = [
  {
    title: "Project Tracking",
    description: "Real-time visibility into every project from initial proposal to successful final defense.",
    icon: FileText,
  },
  {
    title: "Team Collaboration",
    description: "Proprietary collaboration spaces for students, advisors, and committee members.",
    icon: Users,
  },
  {
    title: "Defense Scheduling",
    description: "Automated committee scheduling with cloud calendar integration and resource mapping.",
    icon: Calendar,
  },
  {
    title: "Progress Monitoring",
    description: "Granular milestone tracking with automated nudges and performance analytics.",
    icon: CheckCircle2,
  },
  {
    title: "Vault Security",
    description: "Enterprise-grade document storage with strict role-based access and encryption.",
    icon: Shield,
  },
  {
    title: "High Performance",
    description: "Built on lightning-fast edge infrastructure for zero-latency administration.",
    icon: Zap,
  },
  {
    title: "Insight Analytics",
    description: "Comprehensive reporting on completion rates, faculty workload, and cohort trends.",
    icon: BarChart3,
  },
  {
    title: "Communication",
    description: "Centralized notification hub keeping everyone aligned on critical deadlines.",
    icon: MessageSquare,
  },
]

const testimonials = [
  {
    quote: "Academia has revolutionized how we manage our computer science projects. The level of automation has saved my department hundreds of administrative hours.",
    name: "Dr. Sarah Johnson",
    role: "Department Chair, MIT",
    avatar: ""
  },
  {
    quote: "The interface is intuitive for students and faculty alike. We've seen a 40% increase in on-time project completions since onboarding.",
    name: "Prof. Michael Chen",
    role: "Senior Advisor, Stanford University",
    avatar: ""
  },
  {
    quote: "Implementation was seamless, and the analytics provide deep insights we never had access to before.",
    name: "Dr. Emily Rodriguez",
    role: "Program Director, UC Berkeley",
    avatar: ""
  }
]

const stats = [
  { value: "500+", label: "Institutions" },
  { value: "50K+", label: "Active Students" },
  { value: "120K+", label: "Total Projects" },
  { value: "99.9%", label: "Uptime SLA" },
]