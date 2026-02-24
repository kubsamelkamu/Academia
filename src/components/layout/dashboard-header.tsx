"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, ChevronRight, User, Settings, LogOut } from "lucide-react"
import { useSidebarStore } from "@/store/sidebar-store"
import Link from "next/link"
import { type UserRole } from "@/config/navigation"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface DashboardHeaderProps {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
  }
  notificationCount?: number
}

export function DashboardHeader({ user, notificationCount = 0 }: DashboardHeaderProps) {
  const { toggle } = useSidebarStore()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    useAuthStore.getState().logout()
    router.replace("/login")
  }

  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean)
    const breadcrumbs = paths.map((path, index) => {
      const href = "/" + paths.slice(0, index + 1).join("/")
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
      
      return { label, href }
    })
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

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
    <motion.header
      className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6 shadow-sm"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-accent transition-all duration-300"
          onClick={toggle}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </motion.div>

      <nav className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <motion.div
            key={crumb.href}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            {index > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="truncate font-medium text-primary">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hidden truncate rounded-md px-2 py-1 transition-all duration-300 hover:bg-accent hover:text-primary sm:inline"
              >
                {crumb.label}
              </Link>
            )}
          </motion.div>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <NotificationBell initialCount={notificationCount} />
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-accent transition-all duration-300">
                <Avatar className="h-10 w-10 ring-2 ring-border transition-all duration-300">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur-sm border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer transition-colors hover:bg-accent">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer transition-colors hover:bg-accent">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
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
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </motion.header>
  )
}