"use client"

import * as React from "react"
import Link from "next/link"
import {
  Download,
  RefreshCw,
  FolderKanban,
  ArrowRight,
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"

import type { AdvisorEvaluationDashboardStage } from "@/lib/api/advisor"
import { useAdvisorProjectEvaluationDashboard } from "@/lib/hooks/use-advisor-project-evaluation-dashboard"

export function AdvisorEvaluationsPage() {
  const evaluationStage: AdvisorEvaluationDashboardStage = "CAPSTONE_I"
  const evaluationDashboardQuery = useAdvisorProjectEvaluationDashboard(evaluationStage)

  const [isLoading, setIsLoading] = React.useState(false)
  const evaluationSummary = evaluationDashboardQuery.data?.summary
  const groupsBadge = evaluationDashboardQuery.isLoading
    ? "Loading groups"
    : `${evaluationSummary?.totalProjectGroups ?? 0} Groups`

  const handleRefresh = async () => {
    setIsLoading(true)
    const evaluationDashboardResult = await evaluationDashboardQuery.refetch()

    setIsLoading(false)

    if (evaluationDashboardResult.error) {
      toast.error("Failed to refresh group evaluations")
      return
    }

    toast.success("Group evaluations refreshed")
  }

  const handleExport = () => {
    toast.success("Export started", {
      description: "Group evaluation summary will be downloaded shortly.",
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardPageHeader
          title="Group Evaluations"
          description="Review evaluations by group, track progress, and evaluate pending students."
          badge={groupsBadge}
        />

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-5 w-5 text-primary" /> Capstone I
            </CardTitle>
            <CardDescription>
              Proposal, SDD, and early architecture evaluation for first-semester groups.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Start with proposal review and move to detailed student evaluation.
            </div>
            <Button asChild className="gap-1.5">
              <Link href="/dashboard/advisor/evaluations/capstone-i">
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-5 w-5 text-emerald-600" /> Capstone II
            </CardTitle>
            <CardDescription>
              Implementation, testing, and final defense evaluation for second-semester groups.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Use this page when Capstone I is complete and Capstone II reviews are ready.
            </div>
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/dashboard/advisor/evaluations/capstone-ii">
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
