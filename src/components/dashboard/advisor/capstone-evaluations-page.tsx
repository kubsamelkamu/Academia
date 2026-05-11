"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FolderKanban,
  MoreHorizontal,
  PlayCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  Eye,
  Target,
  FileText,
  BarChart3,
  ShieldAlert,
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { AdvisorEvaluationDashboardStage } from "@/lib/api/advisor"
import { useAdvisorProjectEvaluationDashboard, useAdvisorProjectEvaluationDashboardWithOptions } from "@/lib/hooks/use-advisor-project-evaluation-dashboard"

type CapstoneStage = "Capstone I" | "Capstone II"

type GroupRow = {
  id: string
  projectId: string
  groupName: string
  projectTitle: string
  stage: CapstoneStage
  progress: number
  pending: number
  evaluated: number
  evaluationStatus: string
  nextAction: string
  dueLabel: string
  criteria: string[]
}

function formatEvaluationStatusLabel(status: string) {
  return status.toLowerCase().replace(/_/g, " ")
}

function formatOptionalDateTime(value: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function nextActionLabel(nextAction: string) {
  switch (nextAction) {
    case "START_EVALUATION":
      return "Start evaluation"
    case "COMPLETE_STUDENT_EVALUATION":
      return "Complete remaining scores"
    case "VIEW_SUBMITTED_EVALUATION":
      return "View submitted evaluation"
    default:
      return "Open evaluation"
  }
}

function nextActionCta(nextAction: string, fallback: string) {
  switch (nextAction) {
    case "START_EVALUATION":
      return fallback
    case "COMPLETE_STUDENT_EVALUATION":
      return "Continue scoring"
    case "VIEW_SUBMITTED_EVALUATION":
      return "View submitted"
    default:
      return fallback
  }
}

function evaluationStatusBadgeClass(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
    case "IN_PROGRESS":
      return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800"
    default:
      return "bg-muted text-foreground border-border"
  }
}

function toApiStage(stage: CapstoneStage): AdvisorEvaluationDashboardStage {
  return stage === "Capstone I" ? "CAPSTONE_I" : "CAPSTONE_II"
}

function criteriaForStage(stage: CapstoneStage) {
  return stage === "Capstone I"
    ? ["Proposal clarity", "SDD readiness", "Problem definition", "Advisor approval"]
    : ["Implementation completeness", "Testing evidence", "Final results", "Defense readiness"]
}

function formatDueLabel(submittedAt: string | null, nextAction: string) {
  if (submittedAt) {
    const formatted = formatOptionalDateTime(submittedAt)
    if (formatted) {
      return `Submitted ${formatted}`
    }
  }

  if (nextAction === "START_EVALUATION") {
    return "Ready to evaluate"
  }

  if (nextAction === "COMPLETE_STUDENT_EVALUATION") {
    return "Partially scored"
  }

  if (nextAction === "VIEW_SUBMITTED_EVALUATION") {
    return "Submitted"
  }

  return "Awaiting update"
}

function stageConfig(stage: CapstoneStage) {
  if (stage === "Capstone I") {
    return {
      accent: "text-primary",
      chip: "bg-primary/10 text-primary border-primary/20",
      subtitle: "Proposal, scope, and SDD-oriented evaluation",
      cta: "Evaluate Capstone I",
    }
  }

  return {
    accent: "text-emerald-600",
    chip: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
    subtitle: "Implementation, testing, and final defense evaluation",
    cta: "Evaluate Capstone II",
  }
}

function progressGateForStage(stage: CapstoneStage, progress: number) {
  if (stage === "Capstone I") {
    return {
      allowed: progress > 50,
      message: "Capstone I evaluation unlocks after the group milestone progress exceeds 50%.",
    }
  }

  return {
    allowed: progress === 100,
    message: "Capstone II evaluation unlocks only when the group milestone progress reaches 100%.",
  }
}

export function AdvisorCapstoneEvaluationsPage({ stage }: { stage: CapstoneStage }) {
  const router = useRouter()
  const dashboardStage = toApiStage(stage)
  const evaluationDashboardQuery = useAdvisorProjectEvaluationDashboard(dashboardStage)
  const capstoneIPrereqDashboardQuery = useAdvisorProjectEvaluationDashboardWithOptions("CAPSTONE_I", {
    enabled: stage === "Capstone II",
  })
  const [search, setSearch] = React.useState("")
  const [quickFeedbackOpen, setQuickFeedbackOpen] = React.useState(false)
  const [revisionOpen, setRevisionOpen] = React.useState(false)
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = React.useState("")
  const [revisionReason, setRevisionReason] = React.useState("")
  const [revisionDeadline, setRevisionDeadline] = React.useState("")

  const cfg = stageConfig(stage)
  const stageCriteria = criteriaForStage(stage)

  const capstoneISubmittedByProjectId = React.useMemo(() => {
    if (stage !== "Capstone II") {
      return new Map<string, boolean>()
    }

    const projectGroups = capstoneIPrereqDashboardQuery.data?.projectGroups ?? []
    const mapping = new Map<string, boolean>()

    projectGroups.forEach((group) => {
      const isSubmitted = Boolean(group.evaluation.submittedAt) || group.evaluation.status === "SUBMITTED"
      mapping.set(group.projectId, isSubmitted)
    })

    return mapping
  }, [capstoneIPrereqDashboardQuery.data?.projectGroups, stage])

  const capstoneIPrereqState = React.useCallback(
    (projectId: string) => {
      if (stage !== "Capstone II") {
        return { blocked: false, checking: false }
      }

      if (capstoneIPrereqDashboardQuery.isLoading || capstoneIPrereqDashboardQuery.isFetching) {
        return { blocked: true, checking: true }
      }

      if (capstoneIPrereqDashboardQuery.error) {
        return { blocked: true, checking: false }
      }

      return {
        blocked: capstoneISubmittedByProjectId.get(projectId) !== true,
        checking: false,
      }
    },
    [capstoneIPrereqDashboardQuery.error, capstoneIPrereqDashboardQuery.isFetching, capstoneIPrereqDashboardQuery.isLoading, capstoneISubmittedByProjectId, stage],
  )

  const progressGateState = React.useCallback(
    (progress: number) => {
      const gate = progressGateForStage(stage, progress)
      return {
        blocked: !gate.allowed,
        message: gate.message,
      }
    },
    [stage],
  )
  const groups = React.useMemo(() => {
    const projectGroups = evaluationDashboardQuery.data?.projectGroups ?? []
    const mappedGroups: GroupRow[] = projectGroups.map((group) => ({
      id: group.group.id,
      projectId: group.projectId,
      groupName: group.group.name,
      projectTitle: group.projectTitle,
      stage,
      progress: group.milestones.progressPercent,
      pending: group.evaluation.studentsPendingEvaluation,
      evaluated: group.evaluation.studentsEvaluated,
      evaluationStatus: group.evaluation.status,
      nextAction: group.nextAction,
      dueLabel: formatDueLabel(group.evaluation.submittedAt, group.nextAction),
      criteria: stageCriteria,
    }))

    return mappedGroups.filter((group) => (
      !search
      || group.groupName.toLowerCase().includes(search.toLowerCase())
      || group.projectTitle.toLowerCase().includes(search.toLowerCase())
    ))
  }, [evaluationDashboardQuery.data?.projectGroups, search, stage, stageCriteria])

  const totalPending = groups.reduce((sum, group) => sum + group.pending, 0)
  const avgProgress = groups.length > 0 ? Math.round(groups.reduce((sum, group) => sum + group.progress, 0) / groups.length) : 0
  const totalEvaluated = groups.reduce((sum, group) => sum + group.evaluated, 0)
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null

  const openQuickFeedback = (groupId: string) => {
    setSelectedGroupId(groupId)
    setFeedbackMessage("")
    setQuickFeedbackOpen(true)
  }

  const openRequestRevision = (groupId: string) => {
    setSelectedGroupId(groupId)
    setRevisionReason("")
    setRevisionDeadline("")
    setRevisionOpen(true)
  }

  const submitQuickFeedback = () => {
    if (!selectedGroup) return
    if (!feedbackMessage.trim()) return

    setQuickFeedbackOpen(false)
    toast.success("Quick feedback sent", {
      description: `Feedback submitted for ${selectedGroup.groupName}.`,
    })
  }

  const submitRevision = () => {
    if (!selectedGroup) return
    if (!revisionReason.trim() || !revisionDeadline.trim()) return

    setRevisionOpen(false)
    toast.success("Revision request sent", {
      description: `Revision requested for ${selectedGroup.groupName}.`,
    })
  }

  const handleRefresh = async () => {
    const result = await evaluationDashboardQuery.refetch()

    if (result.error) {
      toast.error("Failed to refresh stage data")
      return
    }

    toast.success("Stage data refreshed")
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/advisor/evaluations">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {stage}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(stage === "Capstone I" ? "/dashboard/advisor/evaluations/capstone-ii" : "/dashboard/advisor/evaluations/capstone-i") }>
            Switch to {stage === "Capstone I" ? "Capstone II" : "Capstone I"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefresh} disabled={evaluationDashboardQuery.isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <DashboardPageHeader
        title={`${stage} Evaluation Dashboard`}
        description="Review advised groups, track scoring progress, and open the next advisor action for this stage."
        badge={`${groups.length} groups`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Groups</p>
            <p className={`text-2xl font-semibold ${cfg.accent}`}>{groups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Students</p>
            <p className={`text-2xl font-semibold ${cfg.accent}`}>{totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg. Progress</p>
            <p className={`text-2xl font-semibold ${cfg.accent}`}>{avgProgress}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className={`h-5 w-5 ${cfg.accent}`} />
            {stage} Criteria
          </CardTitle>
          <CardDescription>What to verify before marking a group complete</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {stageCriteria.map((item) => (
            <Badge key={item} variant="outline" className={`${cfg.chip} px-3 py-1`}>
              {item}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups or projects..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          const prereq = capstoneIPrereqState(group.projectId)
          const progressGate = progressGateState(group.progress)
          const isBlocked = (stage === "Capstone II" && (prereq.checking || prereq.blocked)) || progressGate.blocked
          const blockedReason =
            stage === "Capstone II" && prereq.checking
              ? "Checking whether Capstone I evaluation is submitted."
              : stage === "Capstone II" && prereq.blocked
                ? "Locked until Capstone I evaluation is submitted for this project."
                : progressGate.message

          return (
          <Card key={group.id} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderKanban className={`h-5 w-5 ${cfg.accent}`} />
                    {group.groupName}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">{group.projectTitle}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge variant="outline" className={cfg.chip}>{group.stage}</Badge>
                  <Badge variant="outline" className={evaluationStatusBadgeClass(group.evaluationStatus)}>
                    {formatEvaluationStatusLabel(group.evaluationStatus)}
                  </Badge>
                  {isBlocked ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800">
                      Locked
                    </Badge>
                  ) : null}
                  {stage === "Capstone II" && prereq.checking ? (
                    <Badge variant="outline" className="bg-muted text-foreground border-border">
                      Checking Capstone I
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{group.progress}%</span>
                </div>
                <Progress value={group.progress} className="h-2" />
              </div>

              <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
                <p className="text-xs text-muted-foreground">Next action</p>
                <p className="mt-1 font-medium">{nextActionLabel(group.nextAction)}</p>
                {stage === "Capstone II" && prereq.checking ? (
                  <p className="mt-1 text-xs text-muted-foreground">Capstone II is locked while we verify Capstone I submission.</p>
                ) : stage === "Capstone II" && prereq.blocked ? (
                  <p className="mt-1 text-xs text-amber-700">Locked until Capstone I evaluation is submitted for this project.</p>
                ) : progressGate.blocked ? (
                  <p className="mt-1 text-xs text-amber-700">{progressGate.message}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">{group.dueLabel}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {isBlocked ? (
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                          toast.error("Evaluation is locked", {
                            description: blockedReason,
                          })
                        }}
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        View Detail (locked)
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.projectId}/detail`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Detail
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {isBlocked ? (
                      <>
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault()
                            toast.error("Evaluation is locked", {
                              description: blockedReason,
                            })
                          }}
                        >
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Open evaluation (locked)
                        </DropdownMenuItem>
                        {stage === "Capstone II" ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/advisor/evaluations/capstone-i/${group.projectId}/open`}>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Open Capstone I evaluation
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.projectId}/open`}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {nextActionCta(group.nextAction, cfg.cta)}
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No groups found for this stage</p>
            <p className="mt-1 text-xs text-muted-foreground">Try changing the search term.</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" /> Stage Summary
          </CardTitle>
          <CardDescription>Overview of groups currently in {stage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Students needing evaluation</span>
            <span className="font-semibold">{totalPending}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Students already evaluated</span>
            <span className="font-semibold">{totalEvaluated}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Stage coverage</span>
            <span className="font-semibold">{avgProgress}%</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={quickFeedbackOpen} onOpenChange={setQuickFeedbackOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Feedback</DialogTitle>
            <DialogDescription>
              {selectedGroup ? `${selectedGroup.groupName} • ${selectedGroup.projectTitle}` : "Provide short feedback for this group."}
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label>Feedback</Label>
                <Textarea
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  placeholder="Write concise advisor feedback..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setQuickFeedbackOpen(false)}>Cancel</Button>
                <Button onClick={submitQuickFeedback} disabled={!feedbackMessage.trim()}>Send Feedback</Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              {selectedGroup ? `${selectedGroup.groupName} • ${selectedGroup.projectTitle}` : "Request a revision for this group submission."}
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label>Revision Notes</Label>
                <Textarea
                  value={revisionReason}
                  onChange={(event) => setRevisionReason(event.target.value)}
                  placeholder="List what needs to be revised..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Revision Deadline</Label>
                <Input type="date" value={revisionDeadline} onChange={(event) => setRevisionDeadline(event.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRevisionOpen(false)}>Cancel</Button>
                <Button onClick={submitRevision} disabled={!revisionReason.trim() || !revisionDeadline.trim()}>Send Request</Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  )
}
