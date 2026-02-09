"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useSidebarStore } from "@/store/sidebar-store"
import { Sidebar } from "./sidebar"
import { type UserRole } from "@/config/navigation"

interface MobileSidebarProps {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
  }
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const { isOpen, close } = useSidebarStore()

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent side="left" className="p-0 w-64">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation menu for the application
        </SheetDescription>
        <Sidebar user={user} />
      </SheetContent>
    </Sheet>
  )
}