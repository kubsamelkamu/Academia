"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import DataTable, { Column } from "@/components/shared/DataTable"
import StatusBadge from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TimelineCard } from "@/components/timeline/TimelineCard"
import { StatusIndicator } from "@/components/timeline/StatusIndicator"
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardCheck,
  Calculator,
  MessageSquare,
  AlertTriangle,
  Send,
  UserPlus,
  CheckCircle2,
  TrendingUp,
  Clock,
  FileCheck,
  BarChart3,
  Timer,
  ArrowRight,
  Bell,
  GraduationCap,
  Zap,
  Activity,
  ChevronRight,
  Shield,
  Star,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  mockProjectTitles,
  mockProjects,
  mockEvaluations,
  mockGrades,
  mockComplaints,
  mockUsers,
  ProjectSummary,
  Grade,
  Complaint,
} from "@/data/mockData"
import { mockProjectTimelines, mockTimelineAlerts } from "@/data/timelineData"

export function CoordinatorDashboard() {
  const authUser = useAuthStore((state) => state.user)
  const displayName = authUser
    ? `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() || "Coordinator"
    : "Coordinator"

  // Live clock — same pattern as student dashboard
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const timeString = useMemo(
    () => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(now),
    [now]
  )

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null)
  const [selectedAdvisor, setSelectedAdvisor] = useState('')
  const [localGrades] = useState<Grade[]>(mockGrades)

  const pendingTitles = mockProjectTitles.filter(t => t.status === 'pending')
  const activeProjects = mockProjects.filter(p => p.status === 'in_progress')
  const pendingEvaluations = mockEvaluations.filter(e => e.status === 'pending')
  const openComplaints = mockComplaints.filter(c => c.status === 'open' || c.status === 'under_review')

  const advisors = mockUsers.filter(u => u.role === 'advisor')
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')

  const avgProgress = useMemo(() => {
    if (activeProjects.length === 0) return 0
    return Math.round(activeProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / activeProjects.length)
  }, [activeProjects])

  const handleAssignAdvisor = () => {
    toast.success('Assignments Saved', { description: 'Successfully updated project assignments.' })
    setAssignDialogOpen(false)
  }

  // Workflow stages use primary + secondary + muted — all theme-reactive
  const workflowStages = [
    { label: 'Title Review',  count: 5,  icon: FileText,     color: 'text-primary',            bg: 'bg-primary/10',       border: 'border-primary/20' },
    { label: 'In Progress',   count: 12, icon: Clock,         color: 'text-primary/70',          bg: 'bg-primary/[0.06]',   border: 'border-primary/10' },
    { label: 'Evaluation',    count: 8,  icon: ClipboardCheck,color: 'text-foreground',          bg: 'bg-muted',            border: 'border-border' },
    { label: 'Grading',       count: 4,  icon: Calculator,    color: 'text-muted-foreground',    bg: 'bg-muted/60',         border: 'border-border' },
    { label: 'Completed',     count: 25, icon: CheckCircle2,  color: 'text-primary',             bg: 'bg-primary/10',       border: 'border-primary/20' },
  ]

  // Quick actions — use primary for icon tints, muted for others
  const quickActions = [
    { href: "/dashboard/coordinator/title-management",  icon: Shield,       label: "Title Management",   description: "Forward validated titles to DC",  bg: "bg-primary/10",  color: "text-primary" },
    { href: "/dashboard/coordinator/notify-advisors",   icon: Bell,         label: "Notify Advisors",    description: "Send broadcast to all advisors",   bg: "bg-primary/10",  color: "text-primary" },
    { href: "/dashboard/coordinator/notify-evaluators", icon: Send,         label: "Notify Evaluators",  description: "Send broadcast to all evaluators", bg: "bg-primary/[0.06]", color: "text-primary/80" },
    { href: "/dashboard/coordinator/advisor-progress",  icon: BarChart3,    label: "Advisor Analytics",  description: "Monitor advisor performance",       bg: "bg-primary/10",  color: "text-primary" },
    { href: "/dashboard/coordinator/evaluator-progress",icon: Star,         label: "Evaluator Progress", description: "Track evaluation submissions",      bg: "bg-primary/[0.06]", color: "text-primary/80" },
    { href: "/dashboard/coordinator/grade-management",  icon: Calculator,   label: "Grade Management",   description: "Calculate & publish grades",        bg: "bg-muted",       color: "text-foreground" },
    { href: "/dashboard/coordinator/reports",           icon: FileCheck,    label: "Reports",            description: "Generate department reports",       bg: "bg-muted",       color: "text-foreground" },
    { href: "/dashboard/coordinator/messages",          icon: MessageSquare,label: "Messages",           description: "Communication center",             bg: "bg-muted",       color: "text-foreground" },
  ]

  const projectColumns: Column<ProjectSummary>[] = [
    { 
      key: 'title', header: 'Project',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
        <div>
            <p className="font-medium leading-tight">{p.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{p.groupName}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'advisorName', header: 'Advisor',
      render: (p) => p.advisorName ? (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{p.advisorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{p.advisorName}</span>
        </div>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
      )
    },
    {
      key: 'evaluators', header: 'Evaluators',
      render: (p) => {
        const count = (p.evaluatorIds ?? []).length
        return count > 0
          ? <Badge variant="secondary" className="text-xs">{count} assigned</Badge>
          : <Badge variant="outline" className="text-muted-foreground text-xs">None</Badge>
      }
    },
    {
      key: 'progress', header: 'Progress',
      render: (p) => (
        <div className="w-28 space-y-1">
          <span className="text-xs font-medium">{p.progress}%</span>
          <Progress value={p.progress} className="h-1.5" />
        </div>
      )
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions', header: '',
      render: (p) => (
        <Dialog open={assignDialogOpen && selectedProject?.id === p.id} onOpenChange={(open) => {
          setAssignDialogOpen(open)
          if (open) setSelectedProject(p)
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Manage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Project Assignment</DialogTitle>
              <DialogDescription>Assign or change advisors and evaluators for this project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Project</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedProject?.title}</p>
              </div>
              <div>
                <Label>Assign Advisor</Label>
                <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select an advisor" /></SelectTrigger>
                  <SelectContent>
                    {advisors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assign Evaluators</Label>
                <Select>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select evaluators" /></SelectTrigger>
                  <SelectContent>
                    {evaluators.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAssignAdvisor}>Save Assignments</Button>
            </div>
          </DialogContent>
        </Dialog>
      )
    },
  ]

  const gradeColumns: Column<Grade>[] = [
    { 
      key: 'studentName', header: 'Student',
      render: (g) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{g.studentName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{g.studentName}</span>
        </div>
      )
    },
    {
      key: 'finalScore', header: 'Score',
      render: (g) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">{g.finalScore.toFixed(1)}%</span>
          <Progress value={g.finalScore} className="w-16 h-1.5" />
        </div>
      )
    },
    { key: 'grade', header: 'Grade', render: (g) => <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">{g.grade}</Badge> },
    { key: 'status', header: 'Status', render: (g) => <StatusBadge status={g.status} /> },
  ]

  const complaintColumns: Column<Complaint>[] = [
    { 
      key: 'studentName', header: 'Student',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-destructive/10 text-destructive">{c.studentName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{c.studentName}</span>
        </div>
      )
    },
    { key: 'targetType', header: 'Type', render: (c) => <Badge variant="outline" className="capitalize text-xs">{c.targetType}</Badge> },
    { key: 'reason', header: 'Issue', render: (c) => <p className="max-w-[200px] truncate text-sm text-muted-foreground">{c.reason}</p> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions', header: '',
      render: (c) => (
        <Link href={`/dashboard/coordinator/complaints/${c.id}`}>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" /> Review
          </Button>
        </Link>
      )
    },
  ]

  const unreadAlerts = mockTimelineAlerts.filter(a => !a.isRead)

  const evaluatorMetrics = useMemo(() => evaluators.map(ev => {
    const assigned = mockProjects.filter(p => (p.evaluatorIds ?? []).includes(ev.id))
    const submitted = mockEvaluations.filter(e => e.evaluatorId === ev.id && (e.status === 'submitted' || e.status === 'reviewed')).length
    const pending = mockEvaluations.filter(e => e.evaluatorId === ev.id && e.status === 'pending').length
    const completion = assigned.length > 0 ? Math.round((submitted / assigned.length) * 100) : 0
    return { ...ev, assigned: assigned.length, submitted, pending, completion }
  }), [evaluators])

  const gradeFinalizationPct = localGrades.length > 0
    ? Math.round((localGrades.filter(g => g.status === 'final').length / localGrades.length) * 100)
    : 45

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* ── Page Header — matches student/advisor style ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingTitles.length > 0 || openComplaints.length > 0 ? (
              <>
                <span className="font-medium text-foreground">{pendingTitles.length}</span> pending titles,{" "}
                <span className="font-medium text-foreground">{pendingEvaluations.length}</span> evaluations and{" "}
                <span className="font-medium text-foreground">{openComplaints.length}</span> open complaints awaiting attention.
              </>
            ) : (
              "All tasks are up to date — great job keeping things running smoothly."
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0 shrink-0">
          <span className="tabular-nums text-sm font-medium text-muted-foreground" aria-live="polite">
            {timeString}
          </span>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/dashboard/coordinator/notify-advisors">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Bell className="h-4 w-4" /> Notify Advisors
              </Button>
            </Link>
            <Link href="/dashboard/coordinator/notify-evaluators">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Send className="h-4 w-4" /> Notify Evaluators
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile-only quick-notify row */}
      <div className="flex sm:hidden gap-2">
        <Link href="/dashboard/coordinator/notify-advisors" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Bell className="h-4 w-4" /> Notify Advisors
          </Button>
        </Link>
        <Link href="/dashboard/coordinator/notify-evaluators" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Send className="h-4 w-4" /> Notify Evaluators
          </Button>
        </Link>
      </div>

      {/* ── KPI Cards — all theme-reactive ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Titles */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending Titles</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{pendingTitles.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">From DC Committee</p>
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden w-24">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((pendingTitles.length / 10) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active Projects</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{activeProjects.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Avg {avgProgress}% progress</p>
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden w-24">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${avgProgress}%` }} />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Evaluations */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending Evaluations</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{pendingEvaluations.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Awaiting submission</p>
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden w-24">
                <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${Math.min((pendingEvaluations.length / 15) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <ClipboardCheck className="h-5 w-5 text-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Open Complaints */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open Complaints</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{openComplaints.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Require resolution</p>
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden w-24">
                <div className="h-full rounded-full bg-destructive/60 transition-all" style={{ width: `${Math.min((openComplaints.length / 10) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Workflow Pipeline ── */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Project Workflow Pipeline
              </CardTitle>
              <CardDescription>Real-time status of all projects across the academic workflow</CardDescription>
            </div>
            <Link href="/dashboard/coordinator/projects">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {workflowStages.map((stage, index) => (
              <React.Fragment key={stage.label}>
                <div className={`relative flex-1 rounded-xl border ${stage.border} ${stage.bg} p-4 text-center transition-all hover:shadow-sm`}>
                  <stage.icon className={`h-6 w-6 mx-auto mb-2 ${stage.color}`} />
                  <p className={`text-2xl font-bold ${stage.color}`}>{stage.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stage.label}</p>
              </div>
                {index < workflowStages.length - 1 && (
                  <ChevronRight className="hidden sm:block h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Timeline Alerts + System Overview ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {unreadAlerts.length > 0 ? (
            <Card className="border-none shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-destructive" />
                  </div>
                  Timeline Alerts
                  <Badge variant="destructive" className="ml-auto text-xs">{unreadAlerts.length} unread</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unreadAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                    <StatusIndicator
                      status={alert.severity === 'critical' ? 'overdue' : alert.severity === 'high' ? 'at_risk' : 'on_track'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">{alert.severity}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm h-full flex items-center justify-center">
              <CardContent className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="font-medium">All timelines on track</p>
                <p className="text-sm text-muted-foreground mt-1">No alerts to show</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* System Overview — all bg-primary bars */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Title Approval Rate",  value: 78 },
              { label: "Project Completion",   value: 65 },
              { label: "Evaluation Coverage",  value: 82 },
              { label: "Grade Finalization",   value: gradeFinalizationPct },
            ].map((item, i) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${item.value}%`, opacity: 1 - i * 0.15 }}
                  />
                  </div>
                </div>
              ))}
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall System Health</span>
              <Badge variant="secondary" className="text-xs">Good</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Project Timelines ── */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Timelines</CardTitle>
              <CardDescription>Countdown and progress tracking for active projects</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">{mockProjectTimelines.length} tracked</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockProjectTimelines.slice(0, 4).map((timeline) => {
              const project = mockProjects.find(p => p.id === timeline.projectId)
              return <TimelineCard key={timeline.projectId} timeline={timeline} projectTitle={project?.title || 'Unknown Project'} />
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Tabs: Projects / Advisors / Evaluators / Grades / Complaints ── */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="h-10 w-full sm:w-auto flex overflow-x-auto sm:overflow-visible">
          <TabsTrigger value="projects" className="gap-1.5 text-xs sm:text-sm shrink-0">
            <LayoutDashboard className="h-4 w-4 hidden sm:block" />
            Projects
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{activeProjects.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="advisors" className="gap-1.5 text-xs sm:text-sm shrink-0">
            <Users className="h-4 w-4 hidden sm:block" />
            Advisors
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{advisors.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="evaluators" className="gap-1.5 text-xs sm:text-sm shrink-0">
            <Star className="h-4 w-4 hidden sm:block" />
            Evaluators
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{evaluators.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5 text-xs sm:text-sm shrink-0">
            <Calculator className="h-4 w-4 hidden sm:block" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="complaints" className="gap-1.5 text-xs sm:text-sm shrink-0">
            <AlertTriangle className="h-4 w-4 hidden sm:block" />
            Complaints
            {openComplaints.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{openComplaints.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Projects */}
        <TabsContent value="projects">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Manage assignments and monitor progress</CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
              <Link href="/dashboard/coordinator/notify-advisors">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Bell className="h-4 w-4" /> Notify Advisors
                  </Button>
                </Link>
                <Link href="/dashboard/coordinator/projects">
                  <Button size="sm" className="gap-1.5">
                    View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable data={mockProjects.slice(0, 5)} columns={projectColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advisors */}
        <TabsContent value="advisors">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Advisor Performance</CardTitle>
                <CardDescription>Monitor advisor workload, progress, and performance metrics</CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/dashboard/coordinator/notify-advisors">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Send className="h-4 w-4" /> Notify All
                  </Button>
                </Link>
                <Link href="/dashboard/coordinator/advisor-progress">
                  <Button size="sm" className="gap-1.5">
                    Full Analytics <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {advisors.map((advisor) => {
                  const advisorProjects = mockProjects.filter(p => p.advisorId === advisor.id)
                  const avgProg = advisorProjects.length > 0
                    ? Math.round(advisorProjects.reduce((s, p) => s + (p.progress || 0), 0) / advisorProjects.length)
                    : 0
                  const perfLabel = avgProg >= 75 ? 'Excellent' : avgProg >= 50 ? 'Good' : 'Attention'
                  return (
                    <div key={advisor.id} className="flex items-center gap-4 rounded-xl border p-3 hover:bg-muted/40 transition-colors">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{advisor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{advisor.name}</p>
                        <p className="text-xs text-muted-foreground">{advisor.email}</p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1 w-28 shrink-0">
                        <div className="flex justify-between w-full text-xs">
                          <span className="text-muted-foreground">{advisorProjects.length} proj</span>
                          <span className="font-medium">{avgProg}%</span>
                        </div>
                        <Progress value={avgProg} className="h-1.5 w-full" />
                      </div>
                      <Badge variant={avgProg >= 50 ? 'secondary' : 'outline'} className="text-xs shrink-0">{perfLabel}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluators */}
        <TabsContent value="evaluators">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Evaluator Progress
                </CardTitle>
                <CardDescription>Track evaluation submission status and evaluator workload</CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/dashboard/coordinator/notify-evaluators">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Send className="h-4 w-4" /> Notify All
                  </Button>
                </Link>
                <Link href="/dashboard/coordinator/evaluator-progress">
                  <Button size="sm" className="gap-1.5">
                    Full Analytics <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {evaluatorMetrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No evaluators assigned yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Assign evaluators to projects from the Projects tab</p>
                </div>
              ) : (
                evaluatorMetrics.map((ev) => {
                  const statusLabel = ev.completion >= 75 ? 'On Track' : ev.completion >= 40 ? 'In Progress' : ev.pending > 0 ? 'Pending' : 'No Tasks'
                  return (
                    <div key={ev.id} className="flex items-center gap-4 rounded-xl border p-3 hover:bg-muted/40 transition-colors">
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{ev.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background border flex items-center justify-center">
                          <Star className="h-2.5 w-2.5 text-primary fill-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ev.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{ev.email}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                        <div className="text-center">
                          <p className="font-semibold text-foreground text-sm">{ev.assigned}</p>
                          <p>Assigned</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-primary text-sm">{ev.submitted}</p>
                          <p>Submitted</p>
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold text-sm ${ev.pending > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{ev.pending}</p>
                          <p>Pending</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-24 space-y-1 shrink-0">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Done</span>
                          <span className="font-medium">{ev.completion}%</span>
                        </div>
                        <Progress value={ev.completion} className="h-1.5" />
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{statusLabel}</Badge>
                    </div>
                  )
                })
              )}

              {evaluatorMetrics.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span><span className="font-semibold text-foreground">{evaluatorMetrics.reduce((s, e) => s + e.assigned, 0)}</span> assigned</span>
                      <span><span className="font-semibold text-primary">{evaluatorMetrics.reduce((s, e) => s + e.submitted, 0)}</span> submitted</span>
                      <span><span className={`font-semibold ${evaluatorMetrics.reduce((s, e) => s + e.pending, 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{evaluatorMetrics.reduce((s, e) => s + e.pending, 0)}</span> pending</span>
                    </div>
                    <Link href="/dashboard/coordinator/evaluator-progress">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
                        <BarChart3 className="h-3.5 w-3.5" /> Detailed Report
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades */}
        <TabsContent value="grades">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Grade Overview</CardTitle>
                <CardDescription>Student grades and finalization status</CardDescription>
              </div>
              <Link href="/dashboard/coordinator/grade-management">
                <Button size="sm" className="gap-1.5 shrink-0">
                  <Calculator className="h-4 w-4" /> Manage Grades
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable data={localGrades.slice(0, 5)} columns={gradeColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints */}
        <TabsContent value="complaints">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Complaint Management</CardTitle>
                <CardDescription>Review and resolve student disputes</CardDescription>
              </div>
              <Link href="/dashboard/coordinator/complaints">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable data={mockComplaints} columns={complaintColumns} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Quick Actions ── */}
                <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Navigate to key features</p>
                </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer">
                <div className={`h-10 w-10 rounded-xl ${action.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
        </Link>
          ))}
              </div>
      </div>
    </div>
  )
}
