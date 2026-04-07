"use client"

import Link from "next/link"
import { useState, useEffect, useSyncExternalStore, useRef } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Menu,
  X,
  GraduationCap,
  Sun,
  Moon,
  Monitor,
  ArrowRight,
  BookOpen,
  Info,
  FileText,
  Zap,
  Sparkles,
} from "lucide-react"

/* ── nav links ── */
const navLinks = [
  { href: "/features", label: "Features", icon: Zap },
  { href: "/about",    label: "About",    icon: Info },
  { href: "/docs",     label: "Docs",     icon: BookOpen },
  { href: "/contact",  label: "Contact",  icon: FileText },
]

/* ── theme toggle ── */
type ThemeMode = "light" | "dark"
const THEME_CYCLE: ThemeMode[] = ["light", "dark"]
const themeConfig: Record<ThemeMode, { icon: React.ElementType; label: string; next: ThemeMode }> = {
  light:  { icon: Sun,     label: "Light mode",   next: "dark"   },
  dark:   { icon: Moon,    label: "Dark mode",    next: "light"  },
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) {
    return <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5" />
  }

  const current = (THEME_CYCLE.includes(theme as ThemeMode) ? theme : (resolvedTheme === 'dark' ? 'dark' : 'light')) as ThemeMode
  const { icon: Icon, label, next } = themeConfig[current]

  return (
    <motion.button
      type="button"
      aria-label={`Switch to ${themeConfig[next].label}`}
      title={label}
      onClick={() => setTheme(next)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
        resolvedTheme === "dark"
          ? "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
          : "bg-black/5 text-slate-600 hover:bg-black/10 hover:text-slate-900 border border-black/8",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, rotate: -45, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0,   scale: 1   }}
          exit={{    opacity: 0, rotate:  45, scale: 0.5 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

/* ── active indicator ── */
function ActiveIndicator() {
  return (
    <motion.span
      layoutId="nav-active-bar"
      className="absolute -bottom-1.5 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-[#ED5F45] shadow-[0_0_10px_rgba(237,95,69,0.5)]"
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
    />
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled]  = useState(false)
  const pathname   = usePathname()
  const headerRef  = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setIsMenuOpen(false)
    }, 0)
    return () => window.clearTimeout(id)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isMenuOpen])

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          isScrolled
            ? "border-b border-[#ED5F45]/20 bg-background/80 shadow-2xl shadow-black/5 backdrop-blur-2xl"
            : "border-b border-transparent bg-background/0"
        )}
      >
        <div className="flex h-20 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
          {/* ── Logo ── */}
          <Link
            href="/"
            className="group relative flex items-center gap-3 outline-none"
            aria-label="Academia home"
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: -3 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ED5F45] via-[#F47A64] to-[#ED5F45] transition-shadow duration-300"
            >
              <GraduationCap className="h-5.5 w-5.5 text-white" aria-hidden />
            </motion.div>

            <div className="flex flex-col leading-tight">
              <span className="text-xl font-black tracking-tight text-[#ED5F45] sm:text-2xl">
                Academia<span className="text-[#ED5F45]">.</span>
              </span>
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Innovation Platform
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(href + "/")
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative px-4 py-2 text-[0.875rem] font-black uppercase tracking-widest transition-all duration-300",
                    active
                      ? "text-[#ED5F45]"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                  )}
                >
                  <span className="relative z-10">{label}</span>
                  {active && <ActiveIndicator />}
                  <motion.span
                    className="absolute inset-0 rounded-xl bg-[#ED5F45]/0"
                    whileHover={{ backgroundColor: "rgba(237,95,69,0.08)" }}
                  />
                </Link>
              )
            })}
          </nav>

          {/* ── Desktop tools ── */}
          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

            <Link
              href="/login"
              className="text-sm font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-[#ED5F45] dark:text-slate-400 dark:hover:text-[#ED5F45]"
            >
              Sign in
            </Link>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/register"
                className="group relative flex h-11 items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-6 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#ED5F45] dark:bg-white dark:text-slate-900 dark:hover:bg-[#ED5F45] dark:hover:text-white"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Get Started
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            </motion.div>
          </div>

          {/* ── Mobile tools ── */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <motion.button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-300",
                isMenuOpen
                  ? "border-[#ED5F45] bg-[#ED5F45]/10 text-[#ED5F45]"
                  : "border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              )}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile full-screen drawer ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-md md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white p-8 shadow-2xl dark:bg-slate-900 md:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-12">
                   <Link href="/" className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#ED5F45] flex items-center justify-center text-white font-black text-xl">A</div>
                      <span className="font-black text-xl tracking-tight">Academia<span className="text-[#ED5F45]">.</span></span>
                   </Link>
                   <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                      <X className="h-6 w-6" />
                   </Button>
                </div>

                <nav className="flex flex-col gap-4">
                  {navLinks.map(({ href, label, icon: Icon }, i) => (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl p-4 text-lg font-black uppercase tracking-widest transition-all",
                          pathname === href ? "bg-[#ED5F45] text-white" : "hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                         <Icon className="h-5 w-5" />
                         {label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-auto space-y-4">
                  <Link
                    href="/login"
                    className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-slate-200 text-sm font-black uppercase tracking-widest dark:border-white/10"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#ED5F45] text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#ED5F45]/30"
                  >
                    Join Academia
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
