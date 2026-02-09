"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Menu, Plus, ChevronRight } from "lucide-react"
import { useSidebarStore } from "@/store/sidebar-store"
import Link from "next/link"

interface DashboardHeaderProps {
  notificationCount?: number
}

export function DashboardHeader({ notificationCount = 0 }: DashboardHeaderProps) {
  const { toggle } = useSidebarStore()
  const pathname = usePathname()

  // Generate breadcrumbs from pathname
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

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>New Project</DropdownMenuItem>
            <DropdownMenuItem>New Task</DropdownMenuItem>
            <DropdownMenuItem>Schedule Defense</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notificationCount === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                <>
                  <DropdownMenuItem className="flex flex-col items-start p-4">
                    <span className="font-medium">New project submitted</span>
                    <span className="text-xs text-muted-foreground">2 minutes ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start p-4">
                    <span className="font-medium">Defense scheduled</span>
                    <span className="text-xs text-muted-foreground">1 hour ago</span>
                  </DropdownMenuItem>
                </>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications" className="w-full cursor-pointer text-center">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}