"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, FileText, Filter } from "lucide-react"

type ReportFilter = "All" | "Weekly" | "Cycle" | "Final"

interface CommitteeReport {
  id: string
  name: string
  generatedOn: string
  type: Exclude<ReportFilter, "All">
}

const initialReports: CommitteeReport[] = [
  { id: "cr1", name: "Weekly Title Decision Summary", generatedOn: "Feb 15, 2026", type: "Weekly" },
  { id: "cr2", name: "Submission Cycle Approval Matrix", generatedOn: "Feb 12, 2026", type: "Cycle" },
  { id: "cr3", name: "Final Committee Review Register", generatedOn: "Feb 08, 2026", type: "Final" },
]

export function CommitteeReportsPage() {
  const [filter, setFilter] = useState<ReportFilter>("All")
  const [downloaded, setDownloaded] = useState<string[]>([])

  const visibleReports = useMemo(
    () => initialReports.filter((report) => (filter === "All" ? true : report.type === filter)),
    [filter]
  )

  const markDownloaded = (reportId: string) => {
    setDownloaded((current) => (current.includes(reportId) ? current : [...current, reportId]))
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Reports"
        description="Generate and download committee reports for title decisions and evaluations."
        badge="Committee"
      />

      <DashboardKpiGrid
        items={[
          { title: "Available Reports", value: "9", note: "Across all periods", icon: FileText },
          { title: "Weekly Reports", value: "4", note: "Recent snapshots", icon: BarChart3 },
          { title: "Downloads", value: `${downloaded.length}`, note: "This session", icon: Download },
          { title: "Active Filter", value: filter, note: "Report type view", icon: Filter },
        ]}
      />

      <DashboardSectionCard
        title="Report Library"
        description="Filter report type and export the needed committee records."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Weekly", "Cycle", "Final"] as ReportFilter[]).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports available in this filter.</p>
          ) : (
            visibleReports.map((report) => (
              <div key={report.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{report.name}</p>
                    <p className="text-xs text-muted-foreground">Generated: {report.generatedOn}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.type}</Badge>
                    <Button size="sm" variant="outline" onClick={() => markDownloaded(report.id)}>
                      Download
                    </Button>
                    {downloaded.includes(report.id) ? <Badge variant="secondary">Downloaded</Badge> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}