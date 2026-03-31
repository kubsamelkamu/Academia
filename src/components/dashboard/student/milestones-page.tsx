"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Upload, Clock3, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import type { MilestoneTemplate } from "@/types/milestone-templates"

type MilestoneStatus = "pending" | "submitted" | "approved"

interface Milestone {
  id: string
  name: string
  dueDate: string
  status: MilestoneStatus
  submittedAt?: string
  sequence?: number
}

const myProject = {
  title: "AI-Driven Academic Assistant",
  milestones: [
    {
      id: "m1",
      name: "Project Proposal",
      dueDate: "2026-01-18",
      status: "approved",
      submittedAt: "2026-01-15",
    },
    {
      id: "m2",
      name: "Software Requirements Specification (SRS)",
      dueDate: "2026-02-05",
      status: "submitted",
      submittedAt: "2026-02-03",
    },
    {
      id: "m3",
      name: "System Design Document (SDD)",
      dueDate: "2026-03-20",
      status: "pending",
    },
    {
      id: "m4",
      name: "Implementation",
      dueDate: "2026-04-30",
      status: "pending",
    },
    {
      id: "m5",
      name: "Final Presentation",
      dueDate: "2026-05-30",
      status: "pending",
    },
  ] satisfies Milestone[],
}

function formatDate(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString()
}

function milestoneStatusBadge(status: MilestoneStatus) {
  if (status === "approved") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    )
  }
  if (status === "submitted") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Clock3 className="h-3 w-3 mr-1" />
        Submitted
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Clock3 className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  )
}

function normalizeMilestoneName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

function isProposalMilestoneName(name: string): boolean {
  return normalizeMilestoneName(name).includes("proposal")
}

function mapBackendStatus(status: string): MilestoneStatus {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  return "pending"
}

function addDays(baseDate: string, daysToAdd: number): string {
  const date = new Date(baseDate)
  if (Number.isNaN(date.getTime())) return baseDate
  const next = new Date(date)
  next.setDate(next.getDate() + Math.max(0, daysToAdd))
  return next.toISOString().split("T")[0]
}

function getActiveMilestoneTemplate(templates: MilestoneTemplate[]): MilestoneTemplate | null {
  if (!templates.length) return null
  return templates.find((t) => t.isActive) ?? templates[0]
}

function readProposalOverrideFromStorage(studentId: string | null): {
  status: MilestoneStatus
  submittedAt?: string
} | null {
  if (typeof window === "undefined") return null

  const host = window.location.host
  const candidateIds = [studentId?.trim() || "", "any", ""]

  for (const candidateId of candidateIds) {
    try {
      const storageKey = ["academia:proposal:lastSubmitted", host, candidateId].join(":")
      const raw = localStorage.getItem(storageKey)
      if (!raw) continue

      const parsed = JSON.parse(raw) as { status?: unknown; submittedAt?: unknown }
      const status = typeof parsed.status === "string" ? parsed.status : null
      const submittedAt = typeof parsed.submittedAt === "string" ? parsed.submittedAt : undefined
      if (status === "submitted" || status === "approved") {
        return { status, submittedAt }
      }
    } catch {
      // keep trying
    }
  }

  try {
    const prefix = `academia:proposal:lastSubmitted:${host}:`
    let best: { status: MilestoneStatus; submittedAt?: string; time: number } | null = null

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key || !key.startsWith(prefix)) continue

      const raw = localStorage.getItem(key)
      if (!raw) continue

      try {
        const parsed = JSON.parse(raw) as { status?: unknown; submittedAt?: unknown }
        const status = typeof parsed.status === "string" ? parsed.status : null
        const submittedAt = typeof parsed.submittedAt === "string" ? parsed.submittedAt : undefined
        if (status !== "submitted" && status !== "approved") continue

        const time = submittedAt ? Date.parse(submittedAt) : Number.NEGATIVE_INFINITY
        if (!best || (Number.isFinite(time) && time > best.time)) {
          best = { status, submittedAt, time: Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY }
        }
      } catch {
        // ignore malformed items
      }
    }

    if (best) return { status: best.status, submittedAt: best.submittedAt }
  } catch {
    // ignore localStorage scan failures
  }

  return null
}

export function StudentMilestonesPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null
  const myProjectGroupQuery = useMyProjectGroup(Boolean(accessToken))

  const [progressDialogOpen, setProgressDialogOpen] = useState(false)
  const [weekEnding, setWeekEnding] = useState("")
  const [summary, setSummary] = useState("")
  const [blockers, setBlockers] = useState("")
  const [proposalOverride, setProposalOverride] = useState<{
    status: MilestoneStatus
    submittedAt?: string
  } | null>(() => {
    return readProposalOverrideFromStorage(studentId)
  })

  useEffect(() => {
    const nextOverride = readProposalOverrideFromStorage(studentId)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nextOverride) setProposalOverride(nextOverride)
  }, [studentId])

  const { data: templatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 100,
  })

  const activeTemplate = useMemo(() => {
    const templates = templatesData?.templates ?? []
    return getActiveMilestoneTemplate(templates)
  }, [templatesData?.templates])

  const { data: projectsData } = useStudentProjects({
    departmentId,
    studentId,
  })

  const activeProject = useMemo(() => {
    const items = projectsData?.items ?? []
    if (!items.length) return null

    return (
      items.find((project) => project.status.toLowerCase() === "in-progress") ??
      items.find((project) => project.status.toLowerCase() === "active") ??
      items[0]
    )
  }, [projectsData?.items])

  const { data: projectMilestonesData } = useProjectMilestones({
    projectId: activeProject?.id,
    enabled: Boolean(activeProject?.id),
  })

  const milestones = useMemo<Milestone[]>(() => {
    const templates = templatesData?.templates ?? []
    const activeTemplate = getActiveMilestoneTemplate(templates)

    const templateMilestones: Milestone[] = (() => {
      if (!activeTemplate?.milestones?.length) return []
      const baseDate = activeTemplate.createdAt

      let cumulativeDays = 0
      return activeTemplate.milestones
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .map((milestone) => {
          cumulativeDays += Math.max(0, milestone.defaultDurationDays ?? 0)
          return {
            id: `${activeTemplate.templateId}:${milestone.sequence}`,
            name: milestone.title,
            dueDate: addDays(baseDate, cumulativeDays),
            status: "pending" as const,
            sequence: milestone.sequence,
          }
        })
    })()

    const projectMilestonesByName = new Map(
      (projectMilestonesData?.items ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title),
        milestone,
      ])
    )

    if (templateMilestones.length) {
      return templateMilestones.map((templateMilestone) => {
        const matchedProjectMilestone = projectMilestonesByName.get(
          normalizeMilestoneName(templateMilestone.name)
        )

        const maybeOverride =
          proposalOverride &&
          isProposalMilestoneName(templateMilestone.name) &&
          templateMilestone.status === "pending"

        if (!matchedProjectMilestone) {
          if (!maybeOverride) return templateMilestone

          return {
            ...templateMilestone,
            status: proposalOverride.status,
            submittedAt: proposalOverride.submittedAt,
          }
        }

        const mapped: Milestone = {
          id: matchedProjectMilestone.id,
          name: templateMilestone.name,
          dueDate: matchedProjectMilestone.dueDate,
          status: mapBackendStatus(matchedProjectMilestone.status),
          submittedAt: matchedProjectMilestone.submittedAt ?? undefined,
          sequence: templateMilestone.sequence,
        }

        if (proposalOverride && isProposalMilestoneName(templateMilestone.name) && mapped.status === "pending") {
          return {
            ...mapped,
            status: proposalOverride.status,
            submittedAt: proposalOverride.submittedAt ?? mapped.submittedAt,
          }
        }

        return mapped
      })
    }

    return myProject.milestones
  }, [projectMilestonesData?.items, templatesData?.templates, proposalOverride])

  const completedMilestones = milestones.filter((m) => m.status === "approved").length
  const totalMilestones = milestones.length
  const progressPercent = totalMilestones ? (completedMilestones / totalMilestones) * 100 : 0
  const projectDisplayName = myProjectGroupQuery.data?.name?.trim() || myProject.title

  const handleSubmitMilestone = (milestone: Milestone) => {
    router.push(`/dashboard/student/upload-documents?milestone=${encodeURIComponent(milestone.name)}`)
  }

  const handleSubmitProgress = () => {
    if (!weekEnding || !summary.trim()) {
      toast.error("Week ending date and progress summary are required")
      return
    }

    toast.success("Progress report submitted")
    setProgressDialogOpen(false)
    setWeekEnding("")
    setSummary("")
    setBlockers("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Milestones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your project milestones and submit progress updates.
          </p>
        </div>

        <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Submit Progress Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Weekly Progress Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="week-ending">Week Ending</Label>
                <Input
                  id="week-ending"
                  type="date"
                  value={weekEnding}
                  onChange={(e) => setWeekEnding(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Progress Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Summarize this week's progress..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blockers">Blockers / Challenges</Label>
                <Textarea
                  id="blockers"
                  placeholder="Any blockers, dependencies, or risks..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <Input id="attachments" type="file" multiple />
              </div>
              <Button className="w-full" onClick={handleSubmitProgress}>
                Submit Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">{projectDisplayName}</h3>
              <p className="text-sm text-muted-foreground">
                {completedMilestones} of {totalMilestones} milestones completed
              </p>
            </div>
            <span className="text-2xl font-bold text-primary">{progressPercent.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Milestones</CardTitle>
          <CardDescription>
            Submit pending milestones through the upload flow.
            {activeTemplate ? (
              <span className="block mt-1">
                Template: {activeTemplate.name} • {activeTemplate.isActive ? "Active" : "Inactive"} • Created {formatDate(activeTemplate.createdAt)}
              </span>
            ) : null}
            {milestones.length ? (
              <span className="block mt-1">
                Sequences: {milestones.map((m, idx) => m.sequence ?? idx + 1).join(" • ")}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="rounded-lg border bg-muted/30 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    milestone.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : milestone.status === "submitted"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {milestone.status === "approved" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    milestone.sequence ?? index + 1
                  )}
                </div>
                <div>
                  <p className="font-medium">{milestone.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {formatDate(milestone.dueDate)}
                    </span>
                    {milestone.submittedAt && (
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        Submitted: {formatDate(milestone.submittedAt)}
                      </span>
                    )}
                    {milestone.status === "pending" && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="h-3 w-3" />
                        Awaiting submission
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {milestoneStatusBadge(milestone.status)}
                {milestone.status === "pending" && (
                  <Button size="sm" onClick={() => handleSubmitMilestone(milestone)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
