"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useSidebarStore } from "@/store/sidebar-store"
import { Sidebar } from "./sidebar"
import { type UserRole } from "@/config/navigation"
import { useEffect, useRef, useState, startTransition } from "react"
import { usePathname } from "next/navigation"

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
  const pathname = usePathname()
  const previousPathnameRef = useRef(pathname)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  useEffect(() => {
    const previousPathname = previousPathnameRef.current
    if (previousPathname === pathname) {
      return
    }

    previousPathnameRef.current = pathname

    if (!isOpen) {
      return
    }

    // Defer close so route + portal trees finish reconciling (avoids removeChild on null with React 19 / Radix).
    startTransition(() => close())
  }, [close, isOpen, pathname])

  if (!isClient) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
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