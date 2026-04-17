"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Download, FolderKanban, Users, TrendingUp } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import type { AdvisorEvaluationDashboardStage } from "@/lib/api/advisor"
import { useAuthStoreHydrated } from "@/lib/hooks/use-auth-store-hydrated"
import { useAdvisorProjectEvaluationDashboardWithOptions } from "@/lib/hooks/use-advisor-project-evaluation-dashboard"
import { useAdvisorProjectEvaluationDetail } from "@/lib/hooks/use-advisor-project-evaluation-detail"
import { useAdvisorProjectsWithOptions } from "@/lib/hooks/use-advisor-projects"
import type { CapstoneStage } from "./capstone-evaluation-data"

type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

type DetailStudentRow = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  progress: number
  evaluationStatus: EvaluationStatus
}

function toApiStage(stage: CapstoneStage): AdvisorEvaluationDashboardStage {
  return stage === "Capstone I" ? "CAPSTONE_I" : "CAPSTONE_II"
}

function toEvaluationStatus(status?: string | null): EvaluationStatus {
  const normalized = status?.trim().toUpperCase() ?? "PENDING"

  if (["EVALUATED", "COMPLETED", "APPROVED"].includes(normalized)) {
    return "Evaluated"
  }

  if (["NEEDS_REVISION", "REJECTED"].includes(normalized)) {
    return "Needs Revision"
  }

  return "Pending Review"
}

function formatOptionalDate(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString()
}

function formatOptionalDateTime(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function milestoneProgressValue(status?: string | null) {
  const normalized = status?.trim().toUpperCase() ?? "PENDING"

  if (normalized === "APPROVED") {
    return 100
  }

  if (normalized === "SUBMITTED") {
    return 70
  }

  if (normalized === "REJECTED") {
    return 10
  }

  return 25
}

function formatMilestoneStatus(status?: string | null) {
  return (status ?? "PENDING").toLowerCase().replace(/_/g, " ")
}

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const style =
    status === "Evaluated"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
      : status === "Needs Revision"
        ? "bg-rose-500/10 text-rose-600 border-rose-200"
        : "bg-amber-500/10 text-amber-600 border-amber-200"

  return <Badge variant="outline" className={`${style} border`}>{status}</Badge>
}

export function AdvisorCapstoneGroupDetailPage({ stage, projectId }: { stage: CapstoneStage; projectId: string }) {
  const authHydrated = useAuthStoreHydrated()
  const dashboardStage = toApiStage(stage)
  const projectsQuery = useAdvisorProjectsWithOptions({
    enabled: authHydrated,
  })
  const dashboardQuery = useAdvisorProjectEvaluationDashboardWithOptions(dashboardStage, {
    enabled: authHydrated,
  })
  const resolvedProjectId = React.useMemo(() => {
    const advisorProjects = projectsQuery.data ?? []
    const matchedAdvisorProject = advisorProjects.find(
      (project) => project.id === projectId || project.group.id === projectId
    )

    if (matchedAdvisorProject) {
      return matchedAdvisorProject.id
    }

    const projectGroups = dashboardQuery.data?.projectGroups ?? []
    const matchedProject = projectGroups.find(
      (group) => group.projectId === projectId || group.group.id === projectId
    )

    return matchedProject?.projectId ?? ""
  }, [dashboardQuery.data?.projectGroups, projectId, projectsQuery.data])

  const detailQuery = useAdvisorProjectEvaluationDetail(resolvedProjectId, dashboardStage, {
    enabled: authHydrated && Boolean(resolvedProjectId),
  })
  const detail = detailQuery.data
  const pendingStudents = detail?.evaluation.studentsPendingEvaluation ?? 0
  const evaluatedStudents = detail?.evaluation.studentsEvaluated ?? 0
  const avgProgress = detail?.milestoneProgress.progressPercent ?? 0
  const isLoading = !authHydrated || projectsQuery.isLoading || dashboardQuery.isLoading || (Boolean(resolvedProjectId) && detailQuery.isLoading)

  const students = React.useMemo<DetailStudentRow[]>(() => {
    return (detail?.students ?? []).map((student) => {
      const currentStageStatus = toEvaluationStatus(student.evaluation.status)
      const progress = currentStageStatus === "Evaluated" ? 100 : avgProgress

      return {
        id: student.userId,
        name: student.fullName,
        email: student.email,
        avatarUrl: student.avatarUrl,
        progress,
        evaluationStatus: currentStageStatus,
      }
    })
  }, [avgProgress, detail?.students, stage])

  const evaluationStatusLabel = detail?.evaluation.status.toLowerCase().replace(/_/g, " ") ?? "not started"
  const submittedAtLabel = formatOptionalDateTime(detail?.evaluation.submittedAt)

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardPageHeader
          title={`${stage} Group Detail`}
          description="Review project context, approved milestones, and the current advisor evaluation state for this group."
          badge={isLoading ? "Loading..." : detail?.group.name ?? "—"}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={stage === "Capstone I" ? "/dashboard/advisor/evaluations/capstone-i" : "/dashboard/advisor/evaluations/capstone-ii"}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
      </div>

      {projectsQuery.error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{projectsQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {dashboardQuery.error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{dashboardQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {detailQuery.error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{detailQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : authHydrated && !projectsQuery.isLoading && !dashboardQuery.isLoading && !projectsQuery.error && !dashboardQuery.error && !resolvedProjectId ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">The selected evaluation project could not be found for this stage.</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{stage}</Badge>
            <Badge variant="secondary">{detail?.group.totalMembers ?? 0} members</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Group Name</p>
                  <p className="font-medium">{detail?.group.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FolderKanban className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{detail?.project.title ?? "—"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due</p>
                  <p className="font-medium">{formatOptionalDate(detail?.milestones?.[0]?.dueDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Stage Progress</p>
                  <p className="font-medium">{avgProgress}%</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pending Students</p>
                <p className="text-2xl font-semibold text-amber-600">{pendingStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Evaluated Students</p>
                <p className="text-2xl font-semibold text-emerald-600">{evaluatedStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Milestone Progress</p>
                <p className="text-2xl font-semibold text-primary">{avgProgress}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Evaluation Status</p>
                <p className="text-2xl font-semibold text-primary capitalize">{evaluationStatusLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {detail?.evaluation.submittedAt ? `Submitted ${submittedAtLabel}` : "Not submitted yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestones</CardTitle>
          <CardDescription>Approved and in-flight milestones that provide context for advisor scoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(detail?.milestones ?? []).map((milestone) => (
            <div key={milestone.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{milestone.title}</p>
                  <p className="text-xs text-muted-foreground">{milestone.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatOptionalDate(milestone.dueDate)}
                    {milestone.submittedAt ? ` • Submitted ${formatOptionalDate(milestone.submittedAt)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {milestone.approvedSubmission?.fileUrl ? (
                    <Button asChild variant="outline" size="sm" className="h-8">
                      <a
                        href={milestone.approvedSubmission.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={milestone.approvedSubmission.fileName}
                      >
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  ) : null}
                  <Badge variant="outline" className="capitalize">{formatMilestoneStatus(milestone.status)}</Badge>
                </div>
              </div>
              <Progress value={milestoneProgressValue(milestone.status)} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>Current advisor scoring state for each student in this stage.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>{stage} Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatarUrl ?? undefined} alt={student.name} />
                        <AvatarFallback className="text-xs">{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <span>{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                  <TableCell>
                    <div className="w-40 space-y-1">
                      <p className="text-xs text-muted-foreground">{student.progress}%</p>
                      <Progress value={student.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={student.evaluationStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
