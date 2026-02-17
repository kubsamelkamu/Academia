"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock3, FileText, Upload } from "lucide-react"

type SubmissionStatus = "All" | "Submitted" | "Pending"

interface SubmissionItem {
  id: string
  title: string
  due: string
  status: Exclude<SubmissionStatus, "All">
}

const initialSubmissions: SubmissionItem[] = [
  { id: "su1", title: "Chapter 3 Draft", due: "Feb 18", status: "Submitted" },
  { id: "su2", title: "Chapter 4 Draft", due: "Feb 20", status: "Pending" },
  { id: "su3", title: "Presentation Deck", due: "Feb 24", status: "Pending" },
]

export function StudentSubmissionsPage() {
  const [filter, setFilter] = useState<SubmissionStatus>("All")
  const [items, setItems] = useState(initialSubmissions)

  const visibleItems = useMemo(
    () => items.filter((item) => (filter === "All" ? true : item.status === filter)),
    [filter, items]
  )

  const markSubmitted = (itemId: string) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status: "Submitted" } : item))
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Submissions"
        description="Track your deliverables and submit pending items on time."
        badge="Student"
      />

      <DashboardKpiGrid
        items={[
          { title: "Total Deliverables", value: "9", note: "Current term", icon: FileText },
          { title: "Submitted", value: "6", note: "Accepted uploads", icon: CheckCircle2 },
          { title: "Pending", value: "3", note: "Need upload", icon: Clock3 },
          { title: "Last Upload", value: "2d", note: "Recent submission", icon: Upload },
        ]}
      />

      <DashboardSectionCard
        title="Submission Queue"
        description="Filter and update your current submissions."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Submitted", "Pending"] as SubmissionStatus[]).map((item) => (
            <Button
              key={item}
              size="sm"
              type="button"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{item.title}</p>
                <Badge variant={item.status === "Submitted" ? "secondary" : "outline"}>{item.status}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Due: {item.due}</p>
                {item.status === "Pending" ? (
                  <Button size="sm" variant="outline" onClick={() => markSubmitted(item.id)}>
                    Mark Submitted
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
