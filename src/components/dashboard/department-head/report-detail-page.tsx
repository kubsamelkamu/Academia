"use client"

import React from "react"
import { Download } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getReportById } from "@/lib/mock/reports"
import { toast } from "sonner"

interface ReportDetailPageProps {
  reportId: string
}

export function ReportDetailPage({ reportId }: ReportDetailPageProps) {
  const report = getReportById(reportId)

  if (!report) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Report not found"
          description="The requested report could not be found."
        />
        <DashboardBackLink href="/dashboard/department-head/reports" variant="outline" />
      </div>
    )
  }

  const handleDownload = () => {
    toast.success("Report prepared", {
      description: `${report.title} (${report.type}) has been prepared for download.`,
    })
  }

  return (
    <div className="min-h-screen bg-background/50 py-6">
      <div className="mx-auto min-w-0 max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
        <DashboardPageHeader
          title={report.title}
          description={report.description}
          actions={
            <div className="flex flex-wrap gap-2">
              <DashboardBackLink href="/dashboard/department-head/reports" variant="outline" />
              <Button size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button size="sm" variant="secondary" onClick={() => toast.success("Report refreshed", { description: "Latest report data is now loaded." })}>
                Refresh
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <Card className="space-y-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Overview</CardTitle>
                <Badge variant="secondary">{report.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Format</p>
                  <p className="font-medium">{report.format}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Frequency</p>
                  <p className="font-medium">{report.frequency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Last generated</p>
                  <p className="font-medium">{report.lastGenerated}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Trend</p>
                  <p className="font-medium capitalize">{report.trend}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>
            </CardContent>
          </Card>

          <Card className="sticky top-6 h-fit">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleDownload}>
                Download Report
              </Button>
              <Button className="w-full" variant="outline" onClick={() => toast.success("Schedule updated", { description: "Report schedule has been updated." })}>
                Schedule Next Run
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => toast.success("Insights open", { description: "Visual dashboard opened in a new tab." })}>
                Open Insight Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Metrics included</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {report.metrics.map((metric) => (
                <Badge key={metric} variant="secondary">
                  {metric}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {report.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This section can hold a sample table, progress bars, or mini chart preview. Use real data from analytics backend when available.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-xl font-semibold">94%</p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">Issues Flagged</p>
                <p className="text-xl font-semibold">7</p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">Action Items</p>
                <p className="text-xl font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
