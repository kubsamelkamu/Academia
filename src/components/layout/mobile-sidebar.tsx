"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useSidebarStore } from "@/store/sidebar-store"
import { Sidebar } from "./sidebar"
import { type UserRole } from "@/config/navigation"
import { useEffect, useState } from "react"

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
  const [isClient, setIsClient] = useState(false)
  const { isOpen, close } = useSidebarStore()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent side="left" className="w-72 p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation menu for the application
        </SheetDescription>
        <Sidebar user={user} />
      </SheetContent>
    </Sheet>
  )
}