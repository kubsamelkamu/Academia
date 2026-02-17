"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Download, FileBarChart2, FileText } from "lucide-react"

type ReportPeriod = "Weekly" | "Monthly" | "Semester"

interface ReportTemplate {
  id: string
  title: string
  category: "Academic" | "Governance" | "Performance"
  period: ReportPeriod
  lastRun: string
}

const initialTemplates: ReportTemplate[] = [
  {
    id: "r1",
    title: "Faculty Workload Summary",
    category: "Academic",
    period: "Weekly",
    lastRun: "2 days ago",
  },
  {
    id: "r2",
    title: "Project Risk Escalation",
    category: "Performance",
    period: "Weekly",
    lastRun: "1 day ago",
  },
  {
    id: "r3",
    title: "Governance Compliance Snapshot",
    category: "Governance",
    period: "Monthly",
    lastRun: "5 days ago",
  },
]

const scheduledRuns = [
  { name: "Weekly Risk Digest", next: "Tomorrow, 08:00", status: "Active" },
  { name: "Monthly Faculty Audit", next: "Mar 1, 09:00", status: "Active" },
  { name: "Semester Executive Pack", next: "Jun 20, 11:00", status: "Paused" },
]

export default function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>("Weekly")
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates)

  const visibleTemplates = useMemo(
    () => templates.filter((item) => item.period === activePeriod),
    [activePeriod, templates]
  )

  const handleRunReport = (reportId: string) => {
    setTemplates((current) =>
      current.map((item) =>
        item.id === reportId
          ? {
              ...item,
              lastRun: "Just now",
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Reports"
        description="Generate and monitor reports for this department only."
        badge="Department Head"
      />

      <DashboardKpiGrid
        items={[
          { title: "Available Templates", value: "5", note: "Department-ready formats", icon: FileText },
          { title: "Exports This Month", value: "12", note: "PDF and spreadsheet outputs", icon: Download },
          { title: "Scheduled Reports", value: "3", note: "Automated in this department", icon: Calendar },
          { title: "Executive Summaries", value: "2", note: "Ready for head review", icon: FileBarChart2 },
        ]}
      />

      <DashboardSectionCard
        title="Reporting Period"
        description="Switch period to focus template runs and export cycles."
      >
        <div className="flex flex-wrap gap-2">
          {(["Weekly", "Monthly", "Semester"] as ReportPeriod[]).map((period) => (
            <Button
              key={period}
              type="button"
              size="sm"
              variant={activePeriod === period ? "default" : "outline"}
              onClick={() => setActivePeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </DashboardSectionCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardSectionCard
          className="xl:col-span-2"
          title="Report Templates"
          description="Run templates for the selected reporting period."
        >
          <div className="space-y-3">
            {visibleTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates available for this period.</p>
            ) : (
              visibleTemplates.map((template) => (
                <div key={template.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{template.title}</p>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Last run: {template.lastRun}</p>
                    <Button size="sm" variant="outline" onClick={() => handleRunReport(template.id)}>
                      Run Now
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Scheduled Runs"
          description="Automated schedules configured for this department."
        >
          <div className="space-y-3">
            {scheduledRuns.map((schedule) => (
              <div key={schedule.name} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{schedule.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Next run: {schedule.next}</p>
                <div className="mt-2">
                  <Badge variant={schedule.status === "Active" ? "secondary" : "outline"}>{schedule.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  )
}
