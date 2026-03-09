"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
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
        <Button variant="outline" asChild>
          <Link href="/dashboard/department-head/reports">Back to Reports</Link>
        </Button>
      </div>
    )
  }

  const handleDownload = () => {
    toast.success("Report prepared", {
      description: `${report.title} (${report.type}) has been prepared for download.`,
    })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={report.title}
        description={report.description}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/department-head/reports" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Report details</CardTitle>
            <Badge variant="outline">{report.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Format</p>
              <p className="font-medium">{report.format}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last generated</p>
              <p className="font-medium">{report.lastGenerated}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Frequency</p>
              <p className="font-medium">{report.frequency}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-2">Metrics</p>
            <div className="flex flex-wrap gap-2">
              {report.metrics.map((m) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {report.tags.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
