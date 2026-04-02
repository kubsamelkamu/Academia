"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

function MessagesLoadingShell() {
  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[500px] items-center justify-center rounded-lg border bg-background shadow-sm">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

/** Chat UI uses Radix portals; load client-only to avoid SSR/hydration removeChild errors. */
export const StudentMessagesRoute = dynamic(
  () => import("./messages-page").then((m) => m.StudentMessagesPage),
  { ssr: false, loading: MessagesLoadingShell }
)
