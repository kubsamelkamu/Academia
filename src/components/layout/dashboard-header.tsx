"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Menu, ChevronRight, User, Settings, LogOut } from "lucide-react"
import { useSidebarStore } from "@/store/sidebar-store"
import Link from "next/link"
import { type UserRole } from "@/config/navigation"
import { motion } from "framer-motion"

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
      className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-blue-200/50 bg-gradient-to-r from-white/95 via-blue-50/30 to-blue-100/30 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6 shadow-sm"
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
          className="lg:hidden hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
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
                <ChevronRight className="h-4 w-4 text-blue-400" />
              </motion.div>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="truncate font-medium text-foreground bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hidden truncate transition-all duration-300 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:px-2 hover:py-1 hover:rounded-md sm:inline"
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-red-600 shadow-sm"
                    >
                      {notificationCount}
                    </Badge>
                  </motion.div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-sm border-blue-200/50">
              <DropdownMenuLabel className="text-blue-700">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notificationCount === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  <>
                    <DropdownMenuItem className="flex flex-col items-start p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-colors">
                      <span className="font-medium">New project submitted</span>
                      <span className="text-xs text-muted-foreground">2 minutes ago</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-colors">
                      <span className="font-medium">Defense scheduled</span>
                      <span className="text-xs text-muted-foreground">1 hour ago</span>
                    </DropdownMenuItem>
                  </>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications" className="w-full cursor-pointer text-center hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-colors">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 transition-all duration-300">
                <Avatar className="h-10 w-10 ring-2 ring-blue-200/50 hover:ring-blue-300/50 transition-all duration-300">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border-blue-200/50" align="end" forceMount>
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
                <Link href="/dashboard/profile" className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-colors">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-colors">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive hover:bg-red-50 transition-colors">
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