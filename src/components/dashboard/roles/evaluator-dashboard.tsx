"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  ClipboardCheck,
  FolderKanban,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Sparkles,
  FileText,
  MessageSquare,
  Award,
  Target,
  Zap,
  ArrowRight,
  Activity,
  GraduationCap,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { mockProjects, mockEvaluations, mockGrades } from "@/data/mockData"

const EVALUATOR_ID = "u6"
const EVALUATOR_NAME = "Dr. David Martinez"

const MOCK_RUBRIC_CATEGORIES = [
  { key: "technical", label: "Technical Implementation", weight: 40, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "presentation", label: "Presentation Quality", weight: 20, color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "documentation", label: "Documentation", weight: 20, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "innovation", label: "Innovation & Impact", weight: 20, color: "text-amber-500", bg: "bg-amber-500/10" },
]

interface EvaluationRecord {
  id: string
  projectId: string
  projectTitle: string
  groupName: string
  advisor: string
  status: "pending" | "in_progress" | "submitted" | "reviewed"
  dueDate: string
  scores: {
    technical: number
    presentation: number
    documentation: number
    innovation: number
  }
  finalScore: number
  comments: string
  defenseDate: string
  defenseRoom: string
}

const mockEvaluationRecords: EvaluationRecord[] = [
  {
    id: "er1",
    projectId: "p1",
    projectTitle: "AI-Driven Academic Assistant",
    groupName: "AI Research Group",
    advisor: "Prof. Lisa Anderson",
    status: "pending",
    dueDate: "2024-02-15",
    scores: { technical: 0, presentation: 0, documentation: 0, innovation: 0 },
    finalScore: 0,
    comments: "",
    defenseDate: "2024-02-10T09:00:00Z",
    defenseRoom: "Room A-201",
  },
  {
    id: "er2",
    projectId: "p2",
    projectTitle: "Real-Time Campus Analytics",
    groupName: "Data Analytics Team",
    advisor: "Dr. Michael Brown",
    status: "submitted",
    dueDate: "2024-01-30",
    scores: { technical: 34, presentation: 17, documentation: 16, innovation: 18 },
    finalScore: 85,
    comments: "Good technical implementation with room for improvement in documentation.",
    defenseDate: "2024-01-28T14:00:00Z",
    defenseRoom: "Room B-105",
  },
  {
    id: "er3",
    projectId: "p3",
    projectTitle: "Secure Research Data Platform",
    groupName: "Security Systems",
    advisor: "Prof. Emily Davis",
    status: "in_progress",
    dueDate: "2024-02-20",
    scores: { technical: 30, presentation: 0, documentation: 0, innovation: 0 },
    finalScore: 0,
    comments: "",
    defenseDate: "2024-02-18T10:00:00Z",
    defenseRoom: "Room C-310",
  },
  {
    id: "er4",
    projectId: "p4",
    projectTitle: "Smart Campus Navigation",
    groupName: "Mobile Dev Team",
    advisor: "Dr. Robert Taylor",
    status: "reviewed",
    dueDate: "2024-01-20",
    scores: { technical: 37, presentation: 18, documentation: 19, innovation: 15 },
    finalScore: 89,
    comments: "Excellent mobile app with strong UX design. Navigation algorithm is impressive.",
    defenseDate: "2024-01-18T11:00:00Z",
    defenseRoom: "Room A-101",
  },
]

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-300", dot: "bg-amber-400", Icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-300", dot: "bg-blue-400", Icon: Activity },
  submitted: { label: "Submitted", color: "bg-violet-500/10 text-violet-600 border-violet-300", dot: "bg-violet-400", Icon: CheckCircle2 },
  reviewed: { label: "Reviewed", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300", dot: "bg-emerald-400", Icon: Award },
}

const quickActions = [
  { href: "/dashboard/evaluator/evaluations", icon: ClipboardCheck, label: "My Evaluations", description: "Submit & manage scores", color: "text-violet-600", bg: "bg-violet-500/10" },
  { href: "/dashboard/evaluator/assigned-projects", icon: FolderKanban, label: "Assigned Projects", description: "View project details", color: "text-blue-600", bg: "bg-blue-500/10" },
  { href: "/dashboard/evaluator/schedule", icon: Calendar, label: "Defense Schedule", description: "Upcoming defense sessions", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { href: "/dashboard/evaluator/reports", icon: BarChart3, label: "Evaluation Reports", description: "Summary & analytics", color: "text-amber-600", bg: "bg-amber-500/10" },
  { href: "/dashboard/evaluator/messages", icon: MessageSquare, label: "Messages", description: "Coordinator communications", color: "text-indigo-600", bg: "bg-indigo-500/10" },
]

export function EvaluatorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const myProjects = useMemo(
    () => mockProjects.filter(p => (p.evaluatorIds ?? []).includes(EVALUATOR_ID)),
    []
  )
  const myEvaluations = mockEvaluationRecords
  const pendingCount = myEvaluations.filter(e => e.status === "pending").length
  const submittedCount = myEvaluations.filter(e => e.status === "submitted").length
  const reviewedCount = myEvaluations.filter(e => e.status === "reviewed").length
  const inProgressCount = myEvaluations.filter(e => e.status === "in_progress").length

  const avgScore = useMemo(() => {
    const scored = myEvaluations.filter(e => e.finalScore > 0)
    if (scored.length === 0) return 0
    return Math.round(scored.reduce((s, e) => s + e.finalScore, 0) / scored.length)
  }, [myEvaluations])

  const upcomingDefenses = myEvaluations
    .filter(e => new Date(e.defenseDate) >= new Date())
    .sort((a, b) => new Date(a.defenseDate).getTime() - new Date(b.defenseDate).getTime())

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,white)]" />
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 opacity-80" />
              <span className="text-sm font-medium opacity-80">Evaluator Workspace</span>
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight">
              Welcome, {EVALUATOR_NAME.split(" ").slice(-1)[0]}!
            </h1>
            <p className="text-sm opacity-75">
              {pendingCount > 0 ? (
                <>You have <span className="font-semibold">{pendingCount} pending evaluation{pendingCount !== 1 ? "s" : ""}</span> to complete.</>
              ) : (
                "All evaluations are up to date. Great work!"
              )}
              {upcomingDefenses.length > 0 && (
                <> <span className="font-semibold">{upcomingDefenses.length} defense session{upcomingDefenses.length !== 1 ? "s" : ""}</span> scheduled.</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end shrink-0">
            <Link href="/dashboard/evaluator/evaluations">
              <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm gap-1.5">
                <ClipboardCheck className="h-4 w-4" /> My Evaluations
              </Button>
            </Link>
            <Link href="/dashboard/evaluator/schedule">
              <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm gap-1.5">
                <Calendar className="h-4 w-4" /> Defense Schedule
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Assigned Projects",
            value: myProjects.length,
            subtitle: "Under evaluation",
            icon: FolderKanban,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            bar: (myProjects.length / 10) * 100,
          },
          {
            label: "Pending Evaluations",
            value: pendingCount,
            subtitle: `${inProgressCount} in progress`,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            bar: (pendingCount / myEvaluations.length) * 100,
          },
          {
            label: "Submitted",
            value: submittedCount + reviewedCount,
            subtitle: `${reviewedCount} reviewed`,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            bar: ((submittedCount + reviewedCount) / myEvaluations.length) * 100,
          },
          {
            label: "Avg Score Given",
            value: `${avgScore}%`,
            subtitle: "Across all evaluations",
            icon: Target,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            bar: avgScore,
          },
        ].map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-30`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${stat.bg.replace('/10', '/60')} ${stat.color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(stat.bar, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Evaluation Status Pipeline */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-500" />
                Evaluation Pipeline
              </CardTitle>
              <CardDescription>Track your evaluation progress across all assigned projects</CardDescription>
            </div>
            <Link href="/dashboard/evaluator/evaluations">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {[
              { label: "Pending", count: pendingCount, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock },
              { label: "In Progress", count: inProgressCount, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Activity },
              { label: "Submitted", count: submittedCount, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: ClipboardCheck },
              { label: "Reviewed", count: reviewedCount, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Award },
            ].map((stage, i) => (
              <React.Fragment key={stage.label}>
                <div className={`relative flex-1 rounded-xl border ${stage.border} ${stage.bg} p-4 text-center transition-all hover:shadow-sm`}>
                  <stage.icon className={`h-5 w-5 mx-auto mb-2 ${stage.color}`} />
                  <p className={`text-2xl font-bold font-display ${stage.color}`}>{stage.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stage.label}</p>
                </div>
                {i < 3 && <ChevronRight className="hidden sm:block h-5 w-5 text-muted-foreground/30 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-10 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <FolderKanban className="h-4 w-4 hidden sm:block" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-1.5 text-xs sm:text-sm">
            <ClipboardCheck className="h-4 w-4 hidden sm:block" /> Evaluations
            {pendingCount > 0 && (
              <Badge className="ml-1 text-xs px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-300">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs sm:text-sm">
            <Calendar className="h-4 w-4 hidden sm:block" /> Defenses
          </TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="overview">
          <div className="space-y-3">
            {myProjects.map(project => {
              const evalRecord = myEvaluations.find(e => e.projectId === project.id)
              const sConfig = statusConfig[evalRecord?.status ?? "pending"]
              const StatusIcon = sConfig.Icon
              return (
                <Card key={project.id} className="group transition-all duration-200 hover:shadow-md hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Project Icon */}
                      <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                        <GraduationCap className="h-5 w-5 text-violet-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold leading-tight">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{project.groupName} · Advisor: {project.advisorName}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`text-xs ${sConfig.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {sConfig.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Project Progress</span>
                              <span className="font-medium">{project.progress ?? 0}%</span>
                            </div>
                            <Progress value={project.progress ?? 0} className="h-1.5" />
                          </div>
                        </div>

                        {/* Rubric Scores (if evaluated) */}
                        {evalRecord && evalRecord.finalScore > 0 && (
                          <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {MOCK_RUBRIC_CATEGORIES.map(cat => (
                              <div key={cat.key} className={`rounded-lg ${cat.bg} px-2.5 py-2 text-center`}>
                                <p className={`text-lg font-bold ${cat.color}`}>
                                  {evalRecord.scores[cat.key as keyof typeof evalRecord.scores]}/{cat.weight}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.label.split(" ")[0]}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {evalRecord && (
                              <>
                                {evalRecord.defenseDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(evalRecord.defenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    {" "}{evalRecord.defenseRoom}
                                  </span>
                                )}
                                {evalRecord.finalScore > 0 && (
                                  <span className="flex items-center gap-1 font-semibold text-violet-600">
                                    <Star className="h-3 w-3" />
                                    Score: {evalRecord.finalScore}/100
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <Link href={`/dashboard/evaluator/evaluations${evalRecord ? `/${evalRecord.id}` : ""}`}>
                            <Button size="sm" variant={evalRecord?.status === "pending" ? "default" : "outline"} className={`h-8 gap-1.5 text-xs ${evalRecord?.status === "pending" ? "btn-gradient" : ""}`}>
                              {evalRecord?.status === "pending" ? (
                                <><ClipboardCheck className="h-3.5 w-3.5" /> Start Evaluation</>
                              ) : evalRecord?.status === "in_progress" ? (
                                <><Activity className="h-3.5 w-3.5" /> Continue</>
                              ) : (
                                <><FileText className="h-3.5 w-3.5" /> View Details</>
                              )}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations">
          <div className="space-y-3">
            {myEvaluations.map(ev => {
              const sConfig = statusConfig[ev.status]
              const StatusIcon = sConfig.Icon
              const totalWeight = MOCK_RUBRIC_CATEGORIES.reduce((s, c) => s + c.weight, 0)
              const scored = Object.values(ev.scores).some(v => v > 0)
              return (
                <Card key={ev.id} className="group transition-all hover:shadow-md hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 h-10 w-10 rounded-xl ${sConfig.color.split(" ").slice(0, 2).join(" ")} flex items-center justify-center shrink-0`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm leading-tight truncate">{ev.projectTitle}</h3>
                            <p className="text-xs text-muted-foreground">{ev.groupName} · Due {new Date(ev.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                          </div>
                          <Badge className={`text-xs shrink-0 ${sConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {sConfig.label}
                          </Badge>
                        </div>

                        {scored && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Rubric breakdown:</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {MOCK_RUBRIC_CATEGORIES.map(cat => (
                                <div key={cat.key} className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1.5">
                                  <div className={`h-2 w-2 rounded-full shrink-0 ${cat.bg.replace('/10', '')} ${cat.color.replace('text-', 'bg-')}`} />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{cat.label.split(" ")[0]}</p>
                                    <p className={`text-xs font-bold ${cat.color}`}>{ev.scores[cat.key as keyof typeof ev.scores]}/{cat.weight}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ev.comments && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">&quot;{ev.comments}&quot;</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(ev.defenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {ev.defenseRoom}
                            </span>
                            {ev.finalScore > 0 && (
                              <span className={`font-bold text-sm ${ev.finalScore >= 85 ? "text-emerald-600" : ev.finalScore >= 70 ? "text-blue-600" : "text-amber-600"}`}>
                                {ev.finalScore}/{totalWeight}
                              </span>
                            )}
                          </div>
                          <Link href={`/dashboard/evaluator/evaluations/${ev.id}`}>
                            <Button size="sm" variant={ev.status === "pending" ? "default" : "outline"} className={`h-8 gap-1.5 text-xs ${ev.status === "pending" || ev.status === "in_progress" ? "btn-gradient" : ""}`}>
                              {ev.status === "pending" ? "Start" : ev.status === "in_progress" ? "Continue" : "View"}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Defense Schedule Tab */}
        <TabsContent value="schedule">
          <div className="space-y-4">
            {myEvaluations
              .sort((a, b) => new Date(a.defenseDate).getTime() - new Date(b.defenseDate).getTime())
              .map(ev => {
                const isPast = new Date(ev.defenseDate) < new Date()
                const isToday = new Date(ev.defenseDate).toDateString() === new Date().toDateString()
                const sConfig = statusConfig[ev.status]
                const StatusIcon = sConfig.Icon
                return (
                  <Card key={ev.id} className={`transition-all hover:shadow-md ${isToday ? "border-violet-400 dark:border-violet-600" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 text-center rounded-xl p-2 min-w-[56px] ${isToday ? "bg-violet-500 text-white" : isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                          <p className="text-lg font-bold leading-none">
                            {new Date(ev.defenseDate).getDate()}
                          </p>
                          <p className="text-xs font-medium">
                            {new Date(ev.defenseDate).toLocaleDateString("en-US", { month: "short" })}
                          </p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm">{ev.projectTitle}</h3>
                              <p className="text-xs text-muted-foreground">{ev.groupName}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isToday && <Badge className="text-xs bg-violet-500 text-white">Today</Badge>}
                              {isPast && !isToday && <Badge variant="outline" className="text-xs text-muted-foreground">Past</Badge>}
                              <Badge className={`text-xs ${sConfig.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {sConfig.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ev.defenseDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {ev.defenseRoom}
                            </span>
                            <span className="flex items-center gap-1">
                              <Avatar className="h-3 w-3">
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{ev.advisor.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {ev.advisor}
                            </span>
                          </div>
                          {ev.status === "pending" && !isPast && (
                            <Link href={`/dashboard/evaluator/evaluations/${ev.id}`}>
                              <Button size="sm" className="mt-2 h-7 text-xs btn-gradient gap-1">
                                <ClipboardCheck className="h-3 w-3" /> Prepare Evaluation
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Performance Snapshot + Quick Actions Row */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Rubric Averages */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-violet-500" />
              </div>
              My Scoring Averages
            </CardTitle>
            <CardDescription>Average scores given per rubric category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_RUBRIC_CATEGORIES.map(cat => {
              const scored = myEvaluations.filter(e => e.scores[cat.key as keyof typeof e.scores] > 0)
              const avg = scored.length > 0
                ? Math.round(scored.reduce((s, e) => s + e.scores[cat.key as keyof typeof e.scores], 0) / scored.length)
                : 0
              const pct = Math.round((avg / cat.weight) * 100)
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${cat.color}`}>{cat.label}</span>
                    <span className="text-muted-foreground">{avg}/{cat.weight} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.bg.replace('/10', '/60')} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Overall Average</span>
              <span className="font-bold text-violet-600">{avgScore}/100</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-emerald-500" />
              </div>
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickActions.map(action => (
                <Link key={action.href} href={action.href}>
                  <div className="group flex items-center gap-3 rounded-xl border bg-card/50 px-4 py-3 transition-all hover:shadow-sm hover:border-primary/20 hover:bg-muted/30 cursor-pointer">
                    <div className={`h-9 w-9 rounded-lg ${action.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                      <action.icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary p-2.5 text-primary-foreground shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-none">DC Committee Access</p>
              <p className="text-sm text-muted-foreground">Open the committee project workspace from your evaluator dashboard.</p>
            </div>
          </div>
          <Button asChild className="w-full gap-1.5 sm:w-auto">
            <Link href="/dashboard/department-committee/assigned-projects">
              Access DC Committee
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
