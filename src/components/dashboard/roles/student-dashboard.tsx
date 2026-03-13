"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Users,
} from "lucide-react"

interface Milestone {
  id: string
  name: string
  status: "pending" | "submitted" | "approved" | "overdue"
  dueDate: string
}

interface GradeSummary {
  advisorScore: number
  evaluatorScores: number[]
  finalScore: number
  grade: string
  status: "final" | "provisional" | "pending"
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  isManager?: boolean
}

interface StudentProjectOverview {
  title: string
  advisorName: string
  progress: number
  milestones: Milestone[]
  nextDeadlineLabel: string
  nextDeadlineDays: number
}

interface StudentDashboardData {
  project: StudentProjectOverview
  grade: GradeSummary | null
}

function useLiveTime(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function buildMockDashboardData(): StudentDashboardData {
  const now = new Date()
  const inDays = (d: number) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + d)
    return dt.toISOString().split("T")[0]
  }

  const milestones: Milestone[] = [
    {
      id: "m1",
      name: "Project Proposal Approved",
      status: "approved",
      dueDate: inDays(-30),
    },
    {
      id: "m2",
      name: "Software Requirements Specification (SRS)",
      status: "approved",
      dueDate: inDays(-7),
    },
    {
      id: "m3",
      name: "System Design Document (SDD)",
      status: "submitted",
      dueDate: inDays(3),
    },
    {
      id: "m4",
      name: "Implementation & Testing Report",
      status: "pending",
      dueDate: inDays(18),
    },
    {
      id: "m5",
      name: "Final Defense Presentation",
      status: "pending",
      dueDate: inDays(35),
    },
  ]

  const upcoming =
    milestones.find((m) => m.status === "pending" || m.status === "submitted") ?? milestones[milestones.length - 1]

  const daysToDeadline = Math.max(
    0,
    Math.ceil((new Date(upcoming.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )

  return {
    project: {
      title: "AI‑Driven Academic Assistant for Project Management",
      advisorName: "Dr. Alan Turing",
      progress: 58,
      milestones,
      nextDeadlineLabel: upcoming.name,
      nextDeadlineDays: daysToDeadline,
    },
    grade: {
      advisorScore: 34,
      evaluatorScores: [32, 35, 33],
      finalScore: 86,
      grade: "A-",
      status: "provisional",
    },
  }
}

interface StudentDashboardProps {
  userName?: string
}

export function StudentDashboard({ userName }: StudentDashboardProps = {}) {
  const data = useMemo(() => buildMockDashboardData(), [])

  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const myProjectGroupQuery = useMyProjectGroup(Boolean(accessToken))

  const myUserId = user?.id ? String(user.id) : null
  const myGroup = myProjectGroupQuery.data ?? null
  const myTeamMembers: TeamMember[] = myGroup
    ? [
        {
          id: myGroup.leader.id,
          name:
            `${myGroup.leader.firstName ?? ""} ${myGroup.leader.lastName ?? ""}`.trim() ||
            myGroup.leader.email,
          email: myGroup.leader.email,
          avatarUrl: myGroup.leader.avatarUrl,
          isManager: true,
        },
        ...(myGroup.members ?? []).map((member) => ({
          id: member.user.id,
          name:
            `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
        })),
      ]
    : []

  const welcomeTitle =
    userName && userName.trim().length > 0 ? `Welcome, ${userName.trim()}` : "Welcome"

  const now = useLiveTime(1000)
  const timeString = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(now),
    [now]
  )

  const completedMilestones = data.project.milestones.filter(
    (m) => m.status === "approved" || m.status === "submitted"
  ).length
  const totalMilestones = data.project.milestones.length

  const evaluatorAverage =
    data.grade && data.grade.evaluatorScores.length > 0
      ? data.grade.evaluatorScores.reduce((sum, n) => sum + n, 0) /
        data.grade.evaluatorScores.length
      : null

  const handleViewProject = () => {
    toast.message("Tip", {
      description:
        "Open the My Project section from the left sidebar to see full project details and submissions.",
    })
  }

  const handleFileConcern = () => {
    toast.warning("Grade concern submitted", {
      description: "Your coordinator will review your concern and get back to you.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {welcomeTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your project progress, team activity, and evaluation status in one place.
          </p>
        </div>
        <div className="mt-1 sm:mt-0 flex items-center text-sm text-muted-foreground">
          <span className="tabular-nums font-medium" aria-live="polite">
            {timeString}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold truncate">In Progress</p>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {data.project.title}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.project.progress}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {completedMilestones}/{totalMilestones}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Grade</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {data.grade ? data.grade.grade : "Pending"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.grade ? `${data.grade.finalScore}% overall` : "Not published yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Project Snapshot */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                {data.project.title}
              </CardTitle>
              <CardDescription>
                Advisor: <span className="font-medium">{data.project.advisorName}</span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewProject}>
              View full project
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Overall progress</span>
                <span className="font-medium">{data.project.progress}%</span>
              </div>
              <Progress value={data.project.progress} className="h-2" />
            </div>

            <div className="space-y-2">
              {data.project.milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <div className="space-y-1">
                    <p className="font-medium leading-tight">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(m.dueDate)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      m.status === "approved"
                        ? "default"
                        : m.status === "submitted"
                          ? "secondary"
                          : m.status === "overdue"
                            ? "destructive"
                            : "outline"
                    }
                    className="capitalize"
                  >
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items / Next Deadline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Next Deadline</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              {data.project.nextDeadlineLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm font-medium">
                {data.project.nextDeadlineDays === 0
                  ? "Due today"
                  : `Due in ${data.project.nextDeadlineDays} day${
                      data.project.nextDeadlineDays === 1 ? "" : "s"
                    }`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Submit early so your advisor has time to review and give feedback.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Upload latest document</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Make sure your SRS and SDD are up to date before implementation starts.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Check advisor comments</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Respond to any pending questions or requested clarifications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team & Grades */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Team */}
        <Link
          href="/dashboard/student/team"
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open Team page"
        >
          <Card className="cursor-pointer transition-colors hover:bg-muted/30 hover:border-muted-foreground/20 hover:opacity-95">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="group-hover:underline underline-offset-4">My Team</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {myProjectGroupQuery.isLoading ? "…" : `${myTeamMembers.length} members`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myProjectGroupQuery.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading your team…</p>
              ) : myProjectGroupQuery.isError ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Unable to load your team right now.
                </p>
              ) : myGroup ? (
                myTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        {member.avatarUrl ? (
                          <AvatarImage
                            src={member.avatarUrl}
                            alt={member.name || member.email}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {(member.name || member.email || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-tight truncate">
                            {member.name}
                          </p>
                          {myUserId && member.id === myUserId ? (
                            <Badge variant="outline" className="text-[11px]">
                              You
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {member.isManager && (
                      <Badge variant="secondary" className="text-[11px]">
                        Group Manager
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  You are not in a project group yet.
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>My Grades</span>
              {data.grade ? (
                <Badge
                  variant={
                    data.grade.status === "provisional"
                      ? "secondary"
                      : data.grade.status === "final"
                        ? "default"
                        : "outline"
                  }
                  className="capitalize"
                >
                  {data.grade.status}
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.grade ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Advisor score</p>
                    <p className="mt-1 text-xl font-semibold">
                      {data.grade.advisorScore}/40
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Evaluators avg.</p>
                    <p className="mt-1 text-xl font-semibold">
                      {evaluatorAverage != null
                        ? `${evaluatorAverage.toFixed(1)}/40`
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">Final score</p>
                    <p className="mt-1 text-xl font-semibold text-primary">
                      {data.grade.finalScore}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="text-xs text-muted-foreground">Grade</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {data.grade.grade}
                    </p>
                  </div>
                </div>

                {data.grade.status === "provisional" && (
                  <Button
                    variant="outline"
                    className="mt-1 w-full text-xs sm:text-sm"
                    onClick={handleFileConcern}
                  >
                    Raise a concern about this grade
                  </Button>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Grades are not yet published for this cycle.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

