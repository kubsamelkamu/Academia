"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useSidebarStore } from "@/store/sidebar-store"
import { Sidebar } from "./sidebar"
import { type UserRole } from "@/config/navigation"
import { useEffect, useRef, startTransition } from "react"
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
  const { isOpen, close } = useSidebarStore()
  const pathname = usePathname()
  const previousPathnameRef = useRef(pathname)
  const isMobileViewport = useMediaQuery("(max-width: 1023px)")

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
    }
  }

  useEffect(() => {
    if (isMobileViewport || !isOpen) {
      return
    }

    close()
  }, [close, isMobileViewport, isOpen])

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
  }, [close, isMobileViewport, isOpen, pathname])

  if (!isMobileViewport) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <SheetContent side="left" className="flex h-full w-72 flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation menu for the application
        </SheetDescription>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Sidebar user={user} />
        </div>
      </SheetContent>
    </Sheet>
  )
}