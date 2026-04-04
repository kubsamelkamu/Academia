"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navigationConfig, type UserRole, type NavItem } from "@/config/navigation"
import { LogOut, Bell, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"
import { useSidebarStore } from "@/store/sidebar-store"

interface SidebarProps {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const closeSidebar = useSidebarStore((state) => state.close)
  const navItems = navigationConfig[user.role]

  const handleLogout = React.useCallback(() => {
    closeSidebar()
    useAuthStore.getState().logout()
    router.replace("/login")
  }, [closeSidebar, router])

  const handleNavigation = React.useCallback(() => {
    closeSidebar()
  }, [closeSidebar])

  const sidebarNav = React.useMemo(() => {
    const filtered = navItems.filter((i) => i.href !== "/dashboard/settings" && i.href !== "/dashboard/profile")
    const hasNotifications = filtered.some((i) => i.href === "/dashboard/notifications")
    if (!hasNotifications) {
      return [
        ...filtered,
        ({ href: "/dashboard/notifications", title: "Notifications", icon: Bell } as NavItem),
      ]
    }
    return filtered
  }, [navItems])

  /** Check whether a pathname is "active" for a given href */
  const isItemActive = React.useCallback((href: string) => {
    const isRootDashboard = /^\/dashboard\/[^/]+$/.test(href)
    return isRootDashboard ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }, [pathname])

  /** For parent groups: auto-expand if any child is currently active */
  const defaultOpen = React.useMemo(() => {
    const open = new Set<string>()
    sidebarNav.forEach(item => {
      if (item.children) {
        const anyChildActive = item.children.some(c => c.href && isItemActive(c.href))
        if (anyChildActive) open.add(item.title)
      }
    })
    return open
  }, [sidebarNav, isItemActive])

  const [openGroups, setOpenGroups] = React.useState<Set<string>>(defaultOpen)

  const toggleGroup = React.useCallback((title: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(title)) { next.delete(title) } else { next.add(title) }
      return next
    })
  }, [])

  return (
    <motion.div
      className="flex h-full min-h-0 w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      initial={{ x: -64, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="border-b border-sidebar-border px-6 py-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 font-semibold select-none">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Image
              src="/favicon.png"
              alt="Academia"
              width={24}
              height={24}
              className="h-6 w-6"
              priority
            />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Academia
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Academic Project Management</p>
      </motion.div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Sidebar navigation">
          {sidebarNav.map((item: NavItem, index) => {
            const Icon = item.icon
            const hasChildren = !!(item.children && item.children.length > 0)
            const isGroupOpen = openGroups.has(item.title)
            const isActive = item.href ? isItemActive(item.href) : false
            /** Parent group is visually "active" if any child is active */
            const isGroupActive = hasChildren && item.children!.some(c => c.href && isItemActive(c.href))

            return (
              <motion.div
                key={item.title}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
              >
                {/* ── Parent group item (no href, just toggles) ── */}
                {hasChildren ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.title)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 overflow-hidden",
                        isGroupActive
                          ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary"
                      )}
                    >
                      {isGroupActive && (
                        <motion.div
                          className="absolute inset-0 bg-sidebar-primary/10"
                          layoutId={`activeNav-group-${item.title}`}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <motion.span
                        className={cn(
                          "relative flex h-7 w-7 items-center justify-center rounded-md transition-all duration-300",
                          isGroupActive
                            ? "bg-sidebar-primary/20 text-sidebar-foreground shadow-sm"
                            : "bg-sidebar-accent/60 text-sidebar-accent-foreground group-hover:bg-sidebar-primary/10 group-hover:text-sidebar-accent-foreground"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.span>
                      <span className="relative flex-1 text-left">{item.title}</span>
                      <motion.span
                        animate={{ rotate: isGroupOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative"
                      >
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      </motion.span>
                    </button>

                    {/* ── Child items ── */}
                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
                        <motion.div
                          key="children"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border/60 pl-3 pb-1">
                            {item.children!.map((child, ci) => {
                              if (!child.href) return null
                              const ChildIcon = child.icon
                              const childActive = isItemActive(child.href)
                              return (
                                <motion.div
                                  key={child.href}
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: ci * 0.04, duration: 0.2 }}
                                >
                                  <Link
                                    href={child.href}
                                    onClick={handleNavigation}
                                    aria-current={childActive ? "page" : undefined}
                                    className={cn(
                                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 overflow-hidden",
                                      childActive
                                        ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-primary"
                                    )}
                                  >
                                    {childActive && (
                                      <motion.div
                                        className="absolute inset-0 bg-sidebar-primary/10"
                                        layoutId="activeNav"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                      />
                                    )}
                                    <motion.span
                                      className={cn(
                                        "relative flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200",
                                        childActive
                                          ? "bg-sidebar-primary/20 text-sidebar-foreground"
                                          : "bg-sidebar-accent/60 text-sidebar-accent-foreground group-hover:bg-sidebar-primary/10"
                                      )}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <ChildIcon className="h-3.5 w-3.5" />
                                    </motion.span>
                                    <span className="relative flex-1 text-xs">{child.title}</span>
                                    {child.badge && (
                                      <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-primary px-1 text-[10px] text-sidebar-primary-foreground">
                                        {child.badge}
                                      </span>
                                    )}
                                  </Link>
                                </motion.div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* ── Regular flat item ── */
                  <Link
                    href={item.href ?? "#"}
                    onClick={handleNavigation}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 overflow-hidden",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-sidebar-primary/10"
                        layoutId="activeNav"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <motion.span
                      className={cn(
                        "relative flex h-7 w-7 items-center justify-center rounded-md transition-all duration-300",
                        isActive
                          ? "bg-sidebar-primary/20 text-sidebar-foreground shadow-sm"
                          : "bg-sidebar-accent/60 text-sidebar-accent-foreground group-hover:bg-sidebar-primary/10 group-hover:text-sidebar-accent-foreground"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.span>
                    <span className="relative flex-1">{item.title}</span>
                    {item.badge && (
                      <motion.span
                        className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1 text-xs text-sidebar-primary-foreground shadow-sm"
                        whileHover={{ scale: 1.1 }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </nav>
      </ScrollArea>

      <motion.div
        className="shrink-0 border-t border-sidebar-border p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start gap-3 rounded-lg border border-sidebar-border px-3 py-2 bg-sidebar/60 backdrop-blur-sm hover:bg-sidebar-accent transition-all duration-300"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}