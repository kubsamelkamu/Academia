"use client"

import Link from "next/link"
import { useState, useEffect, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
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
} from "lucide-react"

/* ── nav links ── */
const navLinks = [
  { href: "/features", label: "Features",  icon: Zap },
  { href: "/about",    label: "About",     icon: Info },
  { href: "/docs",     label: "Docs",      icon: BookOpen },
  { href: "/contact",  label: "Contact",   icon: FileText },
]

/* ── theme cycle: light → dark → system ── */
type ThemeMode = "light" | "dark" | "system"
const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"]

const themeConfig: Record<ThemeMode, { icon: React.ElementType; label: string; next: ThemeMode }> = {
  light:  { icon: Sun,     label: "Light mode",  next: "dark"   },
  dark:   { icon: Moon,    label: "Dark mode",   next: "system" },
  system: { icon: Monitor, label: "System theme", next: "light" },
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80" />
    )
  }

  const current = (THEME_CYCLE.includes(theme as ThemeMode) ? theme : "system") as ThemeMode
  const { icon: Icon, label, next } = themeConfig[current]

  return (
    <motion.button
      type="button"
      aria-label={`Switch to ${themeConfig[next].label}`}
      title={label}
      onClick={() => setTheme(next)}
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.93 }}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
        resolvedTheme === "dark"
          ? "border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
          : "border-border/70 bg-background/80 text-foreground hover:bg-muted/60",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0,   scale: 1   }}
          exit={{    opacity: 0, rotate:  30, scale: 0.7 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Icon className="h-4 w-4" aria-hidden />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

/* ── main header ── */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled]  = useState(false)
  const pathname = usePathname()

  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // close mobile menu on route change (defer to avoid synchronous setState in effect)
  useEffect(() => {
    queueMicrotask(closeMenu)
  }, [pathname])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border/60 bg-background/85 shadow-sm shadow-black/5 backdrop-blur-xl"
          : "border-b border-transparent bg-background/60 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link
          href="/"
          onClick={closeMenu}
          className="group flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          aria-label="Academia home"
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center"
          >
            {/* glow */}
            <div className="absolute inset-0 rounded-xl bg-sky-500/25 blur-md transition-all duration-300 group-hover:bg-sky-500/40" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
              <GraduationCap className="h-5 w-5 text-white" aria-hidden />
            </div>
          </motion.div>

          <div className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-extrabold tracking-tight text-foreground">
              Academia
            </span>
            <span className="text-[0.65rem] font-medium text-muted-foreground/80">
              Academic Platform
            </span>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-muted/70"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Desktop right actions ── */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />

          <div className="mx-1 h-5 w-px bg-border/60" />

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>

          <Button
            size="sm"
            className="group h-9 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-sky-500/25 dark:from-sky-500 dark:to-blue-500"
            asChild
          >
            <Link href="/register">
              Get started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        {/* ── Mobile right: theme + hamburger ── */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <motion.button
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((v) => !v)}
            whileTap={{ scale: 0.92 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-foreground transition-colors hover:bg-muted/60"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isMenuOpen ? "close" : "open"}
                initial={{ opacity: 0, rotate: -20 }}
                animate={{ opacity: 1, rotate: 0   }}
                exit={{    opacity: 0, rotate:  20 }}
                transition={{ duration: 0.18 }}
                className="absolute flex items-center justify-center"
              >
                {isMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="border-t border-border/50 bg-background/95 shadow-lg backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-1 px-4 pb-5 pt-4 sm:px-6">

              {/* mobile nav links */}
              <nav className="space-y-0.5" aria-label="Mobile navigation">
                {navLinks.map(({ href, label, icon: Icon }, i) => {
                  const active = pathname === href || pathname?.startsWith(href + "/")
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.045, duration: 0.25 }}
                    >
                      <Link
                        href={href}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-muted/70 text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sky-600 dark:text-sky-400" : "")} aria-hidden />
                        {label}
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* divider */}
              <div className="my-3 h-px bg-border/50" />

              {/* mobile CTA */}
              <motion.div
                className="flex flex-col gap-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.045 + 0.05 }}
              >
                <Button
                  variant="outline"
                  className="h-11 w-full justify-center rounded-xl text-sm font-medium"
                  asChild
                >
                  <Link href="/login" onClick={closeMenu}>Sign in</Link>
                </Button>
                <Button
                  className="h-11 w-full justify-center rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-sm font-semibold text-white shadow-md hover:from-sky-700 hover:to-blue-700 dark:from-sky-500 dark:to-blue-500"
                  asChild
                >
                  <Link href="/register" onClick={closeMenu}>
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
