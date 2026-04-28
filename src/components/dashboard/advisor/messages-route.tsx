"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

function MessagesLoadingShell() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[60vh] items-center justify-center rounded-lg border bg-background shadow-sm sm:min-h-[500px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

/** Chat UI uses Radix portals; load client-only to avoid SSR/hydration removeChild errors. */
export const AdvisorMessagesRoute = dynamic(
  () => import("./messages-hub-page").then((m) => m.AdvisorMessagesHubPage),
  { ssr: false, loading: MessagesLoadingShell }
)
