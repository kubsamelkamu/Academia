"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileArchive,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  ListChecks,
  MessageSquare,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getAdvisorSubmittedDocuments,
  getEvaluatorProjectEvaluationDetail,
  type AdvisorEvaluationDashboardStage,
} from "@/lib/api/advisor"
import { useAuthStoreHydrated } from "@/lib/hooks/use-auth-store-hydrated"
import { cn } from "@/lib/utils"

import {
  type EvaluatorProjectDetail,
  type EvaluatorProjectDocument,
  type MilestoneStatus,
} from "./advisor-evaluator-project-detail-data"
import { AdvisorEvaluatorStageMenu } from "./advisor-evaluator-stage-menu"

function formatDate(dateString: string) {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return dateString
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, "_")
  if (s === "completed" || s === "approved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
  }
  if (s === "in_progress" || s === "in-progress") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-400"
  }
  if (s === "pending" || s === "pending_review") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-400"
  }
  if (s === "overdue" || s === "rejected") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }
  return ""
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ")
  return (
    <Badge variant="outline" className={cn("capitalize", statusBadgeClass(status))}>
      {label}
    </Badge>
  )
}

function MilestoneIcon({ status }: { status: MilestoneStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
    case "in-progress":
      return <Clock className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
    case "overdue":
      return <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
    default:
      return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
  }
}

function DocTypeIcon({ type }: { type: EvaluatorProjectDocument["type"] }) {
  const cls = "h-5 w-5 text-muted-foreground"
  switch (type) {
    case "pdf":
    case "docx":
      return <FileText className={cls} aria-hidden />
    case "zip":
      return <FileArchive className={cls} aria-hidden />
    case "image":
      return <ImageIcon className={cls} aria-hidden />
    default:
      return <FileText className={cls} aria-hidden />
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function normalizeDashboardStage(rawStage: string | null): AdvisorEvaluationDashboardStage {
  const normalized = rawStage?.trim().toUpperCase().replace(/-/g, "_")
  return normalized === "CAPSTONE_II" ? "CAPSTONE_II" : "CAPSTONE_I"
}

function formatDashboardStageLabel(stage: AdvisorEvaluationDashboardStage) {
  return stage === "CAPSTONE_II" ? "Capstone II" : "Capstone I"
}

function formatBytes(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return "—"
  }

  if (sizeBytes >= 1_000_000) {
    return `${(sizeBytes / 1_000_000).toFixed(1)} MB`
  }

  if (sizeBytes >= 1_000) {
    return `${Math.round(sizeBytes / 1_000)} KB`
  }

  return `${sizeBytes} B`
}

function normalizeProjectStatus(status: string) {
  const normalized = status.trim().toLowerCase().replace(/[_\s]+/g, "-")
  if (normalized === "active") {
    return "in_progress"
  }

  return normalized.replace(/-/g, "_")
}

function toMilestoneStatus(status: string): MilestoneStatus {
  const normalized = status.trim().toLowerCase().replace(/[_\s]+/g, "-")
  if (["approved", "completed", "evaluated", "submitted"].includes(normalized)) {
    return normalized === "submitted" ? "in-progress" : "completed"
  }
  if (["in-progress", "inprogress"].includes(normalized)) {
    return "in-progress"
  }
  if (["rejected", "overdue"].includes(normalized)) {
    return "overdue"
  }
  return "pending"
}

function toDocumentType(mimeType: string, fileName: string): EvaluatorProjectDocument["type"] {
  const normalizedMimeType = mimeType.toLowerCase()
  const normalizedFileName = fileName.toLowerCase()

  if (normalizedMimeType.includes("pdf") || normalizedFileName.endsWith(".pdf")) {
    return "pdf"
  }
  if (normalizedMimeType.includes("word") || normalizedFileName.endsWith(".doc") || normalizedFileName.endsWith(".docx")) {
    return "docx"
  }
  if (normalizedMimeType.startsWith("image/")) {
    return "image"
  }
  if (normalizedMimeType.includes("zip") || normalizedFileName.endsWith(".zip")) {
    return "zip"
  }
  return "other"
}

function mapDetailToProjectView(
  detail: Awaited<ReturnType<typeof getEvaluatorProjectEvaluationDetail>>,
  submittedDocuments: Awaited<ReturnType<typeof getAdvisorSubmittedDocuments>>["documents"],
): EvaluatorProjectDetail {
  const nextMilestone = [...detail.milestones]
    .filter((milestone) => !["approved", "completed"].includes(milestone.status.trim().toLowerCase()))
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0]

  const evaluationHistory = detail.evaluation.submittedAt || detail.evaluation.lastSavedAt
    ? [{
        date: detail.evaluation.submittedAt ?? detail.evaluation.lastSavedAt ?? detail.generatedAt,
        evaluator: detail.advisor.fullName,
        type: `${detail.stage.replace("_", " ")} evaluation`,
        score: detail.evaluation.averageScoreGiven,
        scoreMax: 100,
        feedback:
          detail.evaluation.studentsEvaluated > 0
            ? `${detail.evaluation.studentsEvaluated} of ${detail.evaluation.totalStudents} students evaluated.`
            : "Evaluation draft saved.",
      }]
    : []

  const milestoneDocuments: EvaluatorProjectDocument[] = detail.milestones
    .filter((milestone) => milestone.approvedSubmission)
    .map((milestone) => ({
      id: `milestone-${milestone.id}-${milestone.approvedSubmission!.submissionId}`,
      name: milestone.approvedSubmission!.fileName,
      type: toDocumentType(milestone.approvedSubmission!.mimeType, milestone.approvedSubmission!.fileName),
      size: formatBytes(milestone.approvedSubmission!.sizeBytes),
      uploadedAt: milestone.approvedSubmission!.approvedAt,
      status: "approved",
      url: milestone.approvedSubmission!.fileUrl,
      note: `${milestone.title} milestone`,
    }))

  const submittedProjectDocuments: EvaluatorProjectDocument[] = submittedDocuments
    .filter((document) => document.project.id === detail.project.id)
    .map((document) => ({
      id: document.submissionId,
      name: document.documentName,
      type: toDocumentType(document.mimeType, document.documentName),
      size: formatBytes(document.sizeBytes),
      uploadedAt: document.uploadedAt,
      status: document.approvedAt ? "approved" : document.status.toLowerCase().includes("reject") ? "rejected" : "pending_review",
      url: document.fileUrl,
    }))

  const dedupedDocuments = new Map<string, EvaluatorProjectDocument>()

  for (const document of [...milestoneDocuments, ...submittedProjectDocuments]) {
    const documentKey = [document.name.trim().toLowerCase(), document.url?.trim().toLowerCase() ?? "", document.status].join("::")
    if (!dedupedDocuments.has(documentKey)) {
      dedupedDocuments.set(documentKey, document)
    }
  }

  return {
    id: detail.project.id,
    title: detail.project.title,
    description: detail.group.objectives || "No project summary is available yet.",
    group: detail.group.name,
    advisor: detail.advisor.fullName,
    status: normalizeProjectStatus(detail.project.status),
    progress: detail.milestoneProgress.progressPercent,
    dueDate: nextMilestone?.dueDate ?? detail.project.createdAt,
    startDate: detail.project.createdAt,
    category: detail.stage.replace("_", " "),
    technologies: detail.group.technologies,
    teamMembers: detail.students.map((student) => ({
      name: student.fullName,
      role: detail.group.leader?.id === student.userId ? "Leader" : "Member",
      email: student.email,
    })),
    milestones: detail.milestones.map((milestone) => ({
      name: milestone.title,
      status: toMilestoneStatus(milestone.status),
      dueDate: milestone.dueDate,
      completedDate: milestone.approvedSubmission?.approvedAt ?? milestone.submittedAt,
      file: milestone.approvedSubmission
        ? {
            name: milestone.approvedSubmission.fileName,
            url: milestone.approvedSubmission.fileUrl,
            size: formatBytes(milestone.approvedSubmission.sizeBytes),
            mimeType: milestone.approvedSubmission.mimeType,
          }
        : null,
    })),
    documents: [...dedupedDocuments.values()].sort(
      (left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime(),
    ),
    evaluationHistory,
    nextEvaluation: {
      date: nextMilestone?.dueDate ?? detail.generatedAt,
      type: nextMilestone?.title ?? `${detail.stage.replace("_", " ")} review`,
      evaluator: detail.advisor.fullName,
      venue: detail.group.name,
    },
    linkedSessionId: "",
  }
}

export function AdvisorEvaluatorProjectDetailPage({ projectId }: { projectId: string }) {
  const authHydrated = useAuthStoreHydrated()
  const searchParams = useSearchParams()
  const stage = React.useMemo(
    () => normalizeDashboardStage(searchParams.get("stage")),
    [searchParams],
  )
  const detailQuery = useQuery({
    queryKey: ["advisor", "evaluator-project-detail", projectId, stage],
    queryFn: () => getEvaluatorProjectEvaluationDetail(projectId, stage),
    enabled: authHydrated && Boolean(projectId),
    staleTime: 30_000,
    retry: 1,
  })
  const submittedDocumentsQuery = useQuery({
    queryKey: ["advisor", "submitted-documents", "evaluator-project-detail", projectId],
    queryFn: getAdvisorSubmittedDocuments,
    enabled: authHydrated && Boolean(projectId),
    staleTime: 30_000,
    retry: 1,
  })

  const detail = React.useMemo(() => {
    if (!detailQuery.data) return null
    return mapDetailToProjectView(detailQuery.data, submittedDocumentsQuery.data?.documents ?? [])
  }, [detailQuery.data, submittedDocumentsQuery.data?.documents])

  if (!authHydrated || detailQuery.isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center animate-in fade-in">
        <FileText className="h-12 w-12 text-muted-foreground" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold">Loading project</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fetching evaluator project details from the backend.</p>
        </div>
      </div>
    )
  }

  if (detailQuery.error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center animate-in fade-in">
        <FileText className="h-12 w-12 text-muted-foreground" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold">Project could not be loaded</h1>
          <p className="mt-1 text-sm text-muted-foreground">{detailQuery.error.message}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/advisor/evaluator/projects?stage=${stage}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to projects
          </Link>
        </Button>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center animate-in fade-in">
        <FileText className="h-12 w-12 text-muted-foreground" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold">Project not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No project with id <span className="font-mono">{projectId}</span>.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/advisor/evaluator/projects?stage=${stage}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to projects
          </Link>
        </Button>
      </div>
    )
  }

  return <ProjectDetailBody detail={detail} stage={stage} />
}

function ProjectDetailBody({
  detail,
  stage,
}: {
  detail: EvaluatorProjectDetail
  stage: AdvisorEvaluationDashboardStage
}) {
  const avgPast =
    detail.evaluationHistory.length > 0
      ? (
          detail.evaluationHistory.reduce((s, e) => s + e.score, 0) / detail.evaluationHistory.length
        ).toFixed(1)
      : null

  return (
    <div className="flex w-full max-w-none flex-col gap-8 pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" className="w-fit gap-2" asChild>
          <Link href={`/dashboard/advisor/evaluator/projects?stage=${stage}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to projects
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/advisor/evaluator?stage=${stage}`}>Evaluator hub</Link>
          </Button>
        </div>
      </div>

      <PageHeader
        title={detail.title}
        description={`${formatDashboardStageLabel(stage)} project by ${detail.group} · Advisor: ${detail.advisor}`}
      />

      <section aria-label="Overview" className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-xl leading-snug">{detail.title}</CardTitle>
                <p className="mt-1 text-muted-foreground">{detail.group}</p>
              </div>
              <StatusBadge status={detail.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Project details</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Advisor</dt>
                    <dd className="text-right font-medium">{detail.advisor}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="text-right">{detail.category}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Start</dt>
                    <dd className="text-right">{formatDate(detail.startDate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Due</dt>
                    <dd className="text-right">{formatDate(detail.dueDate)}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Progress</h4>
                <Progress value={detail.progress} className="h-2" />
                <p className="mt-2 text-sm text-muted-foreground">{detail.progress}% complete</p>
                {detail.technologies.length > 0 ? (
                  <>
                    <h4 className="mb-2 mt-4 font-medium">Technologies</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.technologies.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs font-normal">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">Next evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{formatDate(detail.nextEvaluation.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{detail.nextEvaluation.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{detail.nextEvaluation.evaluator}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{detail.nextEvaluation.venue}</span>
            </div>
            {detail.linkedSessionId ? (
              <Button className="mt-2 w-full btn-gradient" size="sm" asChild>
                <Link href={`/dashboard/advisor/evaluator/scheduled/${detail.linkedSessionId}`}>
                  <Eye className="mr-2 h-4 w-4" aria-hidden />
                  View session details
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {avgPast ? (
        <section aria-label="Quick stats" className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" aria-hidden />
                Avg past score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{avgPast}</p>
              <p className="text-xs text-muted-foreground">From recorded reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageSquare className="h-4 w-4" aria-hidden />
                Reviews logged
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{detail.evaluationHistory.length}</p>
              <p className="text-xs text-muted-foreground">Evaluation events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Star className="h-4 w-4" aria-hidden />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{detail.milestones.length}</p>
              <p className="text-xs text-muted-foreground">Tracked phases</p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section aria-label="Project detail tabs">
        <Tabs defaultValue="team" className="w-full gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
            <TabsTrigger value="team" className="text-xs sm:text-sm">
              Team
            </TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs sm:text-sm">
              Milestones
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm">
              Documents
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-xs sm:text-sm">
              Evaluation history
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-0 outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team members</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roster in this demo — check the advisor team view.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detail.teamMembers.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
                      >
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback className="text-xs font-medium">{initials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="mt-0 outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No milestones in this demo.</p>
                ) : (
                  detail.milestones.map((m) => (
                    <div
                      key={m.name}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center"
                    >
                      <MilestoneIcon status={m.status} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-medium">{m.name}</h4>
                          <StatusBadge status={m.status} />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Due {formatDate(m.dueDate)}</span>
                          {m.completedDate ? <span>Completed {formatDate(m.completedDate)}</span> : null}
                        </div>
                        {m.file ? (
                          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border/60 bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex items-start gap-3">
                              <DocTypeIcon type={toDocumentType(m.file.mimeType ?? "", m.file.name)} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{m.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {m.file.size ? `${m.file.size} · ` : ""}Milestone file
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={m.file.url} target="_blank" rel="noreferrer">
                                <Download className="mr-2 h-4 w-4" aria-hidden />
                                Download
                              </Link>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-0 outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files listed — use the document library.</p>
                ) : (
                  detail.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <DocTypeIcon type={doc.type} />
                        <div className="min-w-0">
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.size} · Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                          {doc.note ? <p className="text-xs text-muted-foreground">{doc.note}</p> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <StatusBadge status={doc.status} />
                        {doc.url ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={doc.url} target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4" aria-hidden />
                              Download
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() =>
                              toast.message("Download", { description: `${doc.name} — connect storage API.` })
                            }
                          >
                            <Download className="mr-2 h-4 w-4" aria-hidden />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-0 outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evaluation history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {detail.evaluationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No past evaluations recorded in this demo.</p>
                ) : (
                  detail.evaluationHistory.map((ev, i) => (
                    <div key={`${ev.date}-${i}`} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium">{ev.type}</h4>
                        <Badge variant="outline">
                          {ev.score}/{ev.scoreMax ?? 100}
                        </Badge>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{formatDate(ev.date)}</span>
                        <span>By {ev.evaluator}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{ev.feedback}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section aria-label="Evaluation actions" className="space-y-4">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-background shadow-md shadow-primary/[0.06]">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-xl tracking-tight">Ready to evaluate</CardTitle>
            <CardDescription className="text-pretty text-sm leading-relaxed">
              Open the evaluator form for this stage, enter one 0–100 score per student, save drafts as needed, then submit once the full review is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex gap-3 rounded-xl border border-border/60 bg-background/80 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FolderOpen className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold">Review materials</p>
                  <p className="mt-1 text-xs text-muted-foreground">Skim milestones, team, and documents in the tabs above.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-border/60 bg-background/80 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold">Open the rubric</p>
                  <p className="mt-1 text-xs text-muted-foreground">See each criterion&apos;s max share of the rubric total.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-border/60 bg-background/80 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListChecks className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold">Score each line</p>
                  <p className="mt-1 text-xs text-muted-foreground">The evaluator form records one final 0–100 score and optional comment for each student.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <AdvisorEvaluatorStageMenu
                projectId={detail.id}
                trigger={
                  <Button
                    size="lg"
                    className="btn-gradient group h-12 min-h-12 gap-2 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-[transform,box-shadow] hover:shadow-xl hover:shadow-primary/30"
                  >
                    <ClipboardCheck className="h-5 w-5 shrink-0" aria-hidden />
                    Start evaluation
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Button>
                }
              />
              <Button variant="outline" size="lg" className="h-12 min-h-12 rounded-xl border-primary/25 bg-background/90" asChild>
                <Link href={`/dashboard/advisor/evaluator/rubric?stage=${stage}`}>
                  <BookOpen className="mr-2 h-5 w-5" aria-hidden />
                  View rubric
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
