"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { LogOut, ChevronDown, User, Settings, GraduationCap } from "lucide-react"
import { motion } from "framer-motion"

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
  const navItems = navigationConfig[user.role]

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
      className="flex h-full w-64 flex-col border-r border-blue-200/50 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/50 dark:from-blue-950/20 dark:via-gray-900 dark:to-blue-950/20"
      initial={{ x: -64, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="border-b border-blue-100/50 px-6 py-4 bg-gradient-to-r from-blue-500/5 to-blue-600/5"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold group">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <GraduationCap className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
          </motion.div>
          <span className="text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Academia
          </span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Academic Project Management</p>
      </motion.div>

      <ScrollArea className="flex-1 px-3 py-4">
        <motion.p
          className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Navigation
        </motion.p>
        <nav className="flex flex-col gap-1" aria-label="Sidebar navigation">
          {navItems.map((item: NavItem, index) => {
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
                      ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 shadow-sm"
                      : "text-muted-foreground hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700"
                  )}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10"
                      layoutId="activeNav"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <motion.span
                    className={cn(
                      "relative flex h-7 w-7 items-center justify-center rounded-md transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                        : "bg-muted text-muted-foreground group-hover:bg-gradient-to-r group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-600"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.span>
                  <span className="relative flex-1">{item.title}</span>
                  {item.badge && (
                    <motion.span
                      className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-1 text-xs text-white shadow-sm"
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
        className="border-t border-blue-100/50 p-4 bg-gradient-to-r from-blue-500/5 to-blue-600/5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-lg border border-blue-200/50 px-3 py-2 bg-white/50 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300"
              >
                <Avatar className="h-8 w-8 ring-2 ring-blue-200/50">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start text-sm">
                  <span className="font-medium text-gray-900">{user.name}</span>
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
          <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border-blue-200/50">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-colors">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-colors">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive hover:bg-red-50 transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </motion.div>
  )
}