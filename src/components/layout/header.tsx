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
type ThemeMode = "light" | "dark" | "system"
const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"]
const themeConfig: Record<ThemeMode, { icon: React.ElementType; label: string; next: ThemeMode }> = {
  light:  { icon: Sun,     label: "Light mode",   next: "dark"   },
  dark:   { icon: Moon,    label: "Dark mode",    next: "system" },
  system: { icon: Monitor, label: "System theme", next: "light"  },
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) {
    return <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5" />
  }

  const current = (THEME_CYCLE.includes(theme as ThemeMode) ? theme : "system") as ThemeMode
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
        "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
        resolvedTheme === "dark"
          ? "bg-white/8 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10"
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

/* ── dot active indicator ── */
function ActiveDot() {
  return (
    <motion.span
      layoutId="nav-active-dot"
      className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500"
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
    />
  )
}

/* ── main header ── */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled]  = useState(false)
  const [hasBg, setHasBg]            = useState(false)
  const pathname   = usePathname()
  const closeMenu  = () => setIsMenuOpen(false)
  const headerRef  = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setIsScrolled(y > 12)
      setHasBg(y > 60)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => { queueMicrotask(closeMenu) }, [pathname])

  /* lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isMenuOpen])

  return (
    <>
      {/* ── Full-width sticky header ── */}
      <motion.header
        ref={headerRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "border-b border-border/60 bg-background/90 shadow-sm shadow-black/6 backdrop-blur-2xl"
            : "border-b border-transparent bg-background/60 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <motion.div
            className="relative flex w-full items-center justify-between"
          >


            {/* ── Logo ── */}
            <Link
              href="/"
              onClick={closeMenu}
              className="group relative flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-xl"
              aria-label="Academia home"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative flex h-8 w-8 shrink-0 items-center justify-center"
              >
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
                  <GraduationCap className="h-4.5 w-4.5 text-white drop-shadow" aria-hidden />
                </div>
              </motion.div>

              <div className="flex flex-col leading-none">
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-[1rem] font-black tracking-tight text-transparent dark:from-emerald-400 dark:via-green-400 dark:to-teal-400">
                  Academia
                </span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Platform
                </span>
              </div>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex" aria-label="Main navigation">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href || pathname?.startsWith(href + "/")
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative rounded-xl px-3.5 py-2 text-[0.8125rem] font-semibold transition-all duration-200",
                      active
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    {/* hover bg bead */}
                    <motion.span
                      className={cn(
                        "absolute inset-0 rounded-xl transition-opacity",
                        active
                          ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                          : "bg-transparent group-hover:bg-slate-100/80",
                      )}
                      whileHover={active ? {} : { backgroundColor: "rgba(148,163,184,0.12)" }}
                    />
                    <span className="relative">{label}</span>
                    {active && <ActiveDot />}
                  </Link>
                )
              })}
            </nav>

            {/* ── Desktop right ── */}
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />

              <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-white/10" />

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-[0.8125rem] font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Sign in
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/register"
                  className="group relative flex h-9 items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-4 text-[0.8125rem] font-bold text-white transition-all"
                >
                  {/* shimmer sweep */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
                  <Sparkles className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  Get started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </motion.div>
            </div>

            {/* ── Mobile right: theme + hamburger ── */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <motion.button
                type="button"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((v) => !v)}
                whileTap={{ scale: 0.88 }}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                  "border bg-white/60 dark:bg-white/8",
                  isMenuOpen
                    ? "border-emerald-400/50 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/12",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isMenuOpen ? "close" : "open"}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                    exit={{    opacity: 0, rotate:  90, scale: 0.5 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="absolute flex items-center justify-center"
                  >
                    {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* ── Mobile full-screen drawer ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            />

            {/* drawer */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-[76px] z-50 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl shadow-black/15 backdrop-blur-2xl dark:border-white/8 dark:bg-slate-900/95 md:hidden"
            >
              {/* top gradient accent */}
              <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

              <div className="p-3">
                {/* mobile nav links */}
                <nav className="space-y-0.5" aria-label="Mobile navigation">
                  {navLinks.map(({ href, label, icon: Icon }, i) => {
                    const active = pathname === href || pathname?.startsWith(href + "/")
                    return (
                      <motion.div
                        key={href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.28, ease: "easeOut" }}
                      >
                        <Link
                          href={href}
                          onClick={closeMenu}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150",
                            active
                              ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 dark:from-emerald-500/12 dark:to-green-500/12 dark:text-emerald-400"
                              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white",
                          )}
                        >
                          <span className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                            active
                              ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 dark:bg-white/6 dark:text-slate-400 dark:group-hover:bg-white/10",
                          )}>
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          {label}
                          {active && (
                            <motion.span
                              layoutId="mobile-active-dot"
                              className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"
                            />
                          )}
                        </Link>
                      </motion.div>
                    )
                  })}
                </nav>

                {/* divider */}
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/8" />

                {/* mobile CTA */}
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.05 + 0.05 }}
                >
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white/60 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-sm font-bold text-white transition-all"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
                    <Sparkles className="h-4 w-4 opacity-80" aria-hidden />
                    Get started free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
