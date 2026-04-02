"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const StudentMessages = dynamic(
  () =>
    import("@/components/dashboard/student/messages-page").then(
      (m) => m.StudentMessagesPage
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-8rem)] min-h-[500px] items-center justify-center rounded-lg border bg-background shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

/** Static route wins over `[role]/[section]`; full client page avoids RSC + portal hydration issues. */
export default function StudentMessagesPageRoute() {
  return <StudentMessages />
}
