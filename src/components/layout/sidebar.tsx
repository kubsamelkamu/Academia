"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { navigationConfig, type UserRole, type NavItem } from "@/config/navigation"
import { LogOut, ChevronDown, Settings, GraduationCap, Bell } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"

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
  const navItems = navigationConfig[user.role]

  const handleLogout = React.useCallback(() => {
    useAuthStore.getState().logout()
    router.replace("/login")
  }, [router])
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

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      department_head: "Department Head",
      coordinator: "Coordinator",
      advisor: "Advisor",
      student: "Student",
      department_committee: "Committee Member",
    }
    return labels[role]
  }

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.div
      className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
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
            <GraduationCap className="h-6 w-6 text-sidebar-primary transition-colors" />
          </motion.div>
          <span className="text-xl text-sidebar-primary">
            Academia
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Academic Project Management</p>
      </motion.div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Sidebar navigation">
          {sidebarNav.map((item: NavItem, index) => {
            const isRootDashboard = /^\/dashboard\/[^/]+$/.test(item.href)
            const isActive = isRootDashboard
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <motion.div
                key={item.href}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
              >
                <Link
                  href={item.href}
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
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "bg-sidebar-accent/60 text-sidebar-accent-foreground group-hover:bg-sidebar-primary/10 group-hover:text-sidebar-primary"
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
              </motion.div>
            )
          })}
        </nav>
      </ScrollArea>

      <motion.div
        className="border-t border-sidebar-border p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-lg border border-sidebar-border px-3 py-2 bg-sidebar/60 backdrop-blur-sm hover:bg-sidebar-accent transition-all duration-300"
              >
                <Avatar className="h-8 w-8 ring-2 ring-sidebar-ring/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start text-sm">
                  <span className="font-medium text-sidebar-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-sm border-border">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer transition-colors hover:bg-accent">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-colors"
              onSelect={(event) => {
                event.preventDefault()
                handleLogout()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </motion.div>
  )
}