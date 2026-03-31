"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  GraduationCap,
  ListFilter,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  BarChart3,
} from "lucide-react"
import StatusBadge from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockGrades, type Grade, mockStudentGroups } from "@/data/mockData"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeColor(score: number) {
  if (score >= 85) return "text-emerald-600"
  if (score >= 70) return "text-blue-600"
  if (score >= 50) return "text-amber-600"
  return "text-destructive"
}

function gradeBg(score: number) {
  if (score >= 85) return "bg-emerald-500/10"
  if (score >= 70) return "bg-blue-500/10"
  if (score >= 50) return "bg-amber-500/10"
  return "bg-destructive/10"
}

function progressColor(score: number) {
  if (score >= 85) return "[&>div]:bg-emerald-500"
  if (score >= 70) return "[&>div]:bg-blue-500"
  if (score >= 50) return "[&>div]:bg-amber-500"
  return "[&>div]:bg-destructive"
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepartmentHeadGradesPage() {
  const [detailGrade, setDetailGrade] = useState<Grade | null>(null)
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | "project" | "internship">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "provisional" | "final">("all")

  // ── derived data ──────────────────────────────────────────────────────────

  const pendingGrades = mockGrades.filter((g) => g.status === "provisional")
  const approvedGrades = mockGrades.filter((g) => g.status === "final")
  const avgScore = mockGrades.length
    ? mockGrades.reduce((a, g) => a + g.finalScore, 0) / mockGrades.length
    : 0
  const passRate = mockGrades.length
    ? Math.round((mockGrades.filter((g) => g.finalScore >= 50).length / mockGrades.length) * 100)
    : 0

  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = {}
    mockGrades.forEach((g) => { dist[g.grade] = (dist[g.grade] ?? 0) + 1 })
    const order = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]
    return order
      .filter((g) => dist[g])
      .map((grade) => ({
        grade,
        count: dist[grade],
        pct: Math.round((dist[grade] / mockGrades.length) * 100),
      }))
  }, [])

  const filteredGrades = pendingGrades.filter((g) => {
    if (filterType !== "all" && g.type !== filterType) return false
    return true
  })

  const filteredGroups = mockStudentGroups

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleApproveGrade = (gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.success("Grade approved", {
      description: grade ? `${grade.studentName}'s grade has been approved.` : "Grade approved.",
    })
    setConfirmApproveId(null)
    setDetailGrade(null)
  }

  const handleRejectGrade = (gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.error("Grade rejected", {
      description: grade ? `${grade.studentName}'s grade has been rejected.` : "Grade rejected.",
    })
    setConfirmRejectId(null)
    setDetailGrade(null)
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Grades &amp; Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review provisional grades, monitor project groups, and track academic performance
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 sm:mt-0 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/dashboard/coordinator/grade-management">
              <UserPlus className="h-3.5 w-3.5" />
              Leader Applications
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Groups",
            value: mockStudentGroups.length,
            sub: "Active project groups",
            icon: Users,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Pending Review",
            value: pendingGrades.length,
            sub: pendingGrades.length > 0 ? "Require your attention" : "All caught up",
            icon: Clock,
            color: pendingGrades.length > 0 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600",
          },
          {
            label: "Average Score",
            value: `${avgScore.toFixed(1)}%`,
            sub: `${approvedGrades.length} grades finalised`,
            icon: TrendingUp,
            color: "bg-blue-500/10 text-blue-600",
          },
          {
            label: "Pass Rate",
            value: `${passRate}%`,
            sub: `${mockGrades.filter((g) => g.finalScore >= 50).length} of ${mockGrades.length} students`,
            icon: Award,
            color: "bg-emerald-500/10 text-emerald-600",
          },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", k.color)}>
                <k.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs + Filters (same row) ────────────────────────────────── */}
      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="rounded-xl border border-border bg-muted/40 p-1.5 gap-1 h-auto">
            <TabsTrigger
              value="overview"
              className="gap-1.5 text-sm rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="grades"
              className="gap-1.5 text-sm rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              Grades
              {pendingGrades.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px]">
                  {pendingGrades.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="distribution"
              className="gap-1.5 text-sm rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Distribution
            </TabsTrigger>
          </TabsList>

          {/* Filters — inline right of tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="h-9 w-36 text-xs gap-1.5 border-border/70 bg-background">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="project" className="text-xs capitalize">Project</SelectItem>
                <SelectItem value="internship" className="text-xs capitalize">Internship</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="h-9 w-36 text-xs gap-1.5 border-border/70 bg-background">
                <ListFilter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Status</SelectItem>
                <SelectItem value="provisional" className="text-xs capitalize">Provisional</SelectItem>
                <SelectItem value="final" className="text-xs capitalize">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ══ Overview Tab ══ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Quick-stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "A grades", value: mockGrades.filter((g) => g.grade.startsWith("A")).length, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { label: "B grades", value: mockGrades.filter((g) => g.grade.startsWith("B")).length, color: "text-blue-600", bg: "bg-blue-500/10" },
              { label: "Below C", value: mockGrades.filter((g) => ["D", "F"].includes(g.grade)).length, color: "text-destructive", bg: "bg-destructive/10" },
            ].map((s) => (
              <Card key={s.label} className="border-border/60">
                <CardContent className="pt-4 pb-3 text-center">
                  <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </CardContent>
        </Card>
            ))}
        </div>

          {/* Project Groups */}
              <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                  <div>
                  <CardTitle className="text-base">Project Groups</CardTitle>
                  <CardDescription>All active groups and their current status</CardDescription>
                </div>
                <Badge variant="secondary">{filteredGroups.length} groups</Badge>
                  </div>
                </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {filteredGroups.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No groups match your search</p>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{group.name}</p>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                                    {group.members.length} members
                                  </Badge>
                          <StatusBadge status={group.status} />
                                </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {group.projectTitle}
                                </p>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <UserCheck className="h-3 w-3 shrink-0" />
                                    <span>{group.managerName}</span>
                                  </div>
                                </div>
                              </div>
                    <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs shrink-0" asChild>
                      <Link href={`/dashboard/department-head/review/group-${group.id}`}>
                        Details <ChevronRight className="h-3 w-3" />
                                </Link>
                              </Button>
                  </div>
                ))
              )}
                </CardContent>
              </Card>
        </TabsContent>

        {/* ══ Grades Tab ══ */}
        <TabsContent value="grades" className="mt-4">
            <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base">Grade Review Queue</CardTitle>
                  <CardDescription>
                    {pendingGrades.length > 0
                      ? `${pendingGrades.length} provisional grade${pendingGrades.length !== 1 ? "s" : ""} awaiting your approval`
                      : "All grades have been reviewed"}
                  </CardDescription>
                </div>
                {pendingGrades.length > 0 && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      pendingGrades.forEach((g) => handleApproveGrade(g.id))
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve All ({pendingGrades.length})
                  </Button>
                )}
              </div>
              </CardHeader>

            <CardContent className="pt-3">
                {pendingGrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold">All grades reviewed</p>
                  <p className="text-xs text-muted-foreground mt-1">No pending grades require attention</p>
                  </div>
                ) : (
                <div className="space-y-2">
                  {filteredGrades.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow"
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        gradeBg(g.finalScore), gradeColor(g.finalScore)
                      )}>
                        {initials(g.studentName)}
                      </div>

                      {/* Name + ID */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{g.studentName}</p>
                        <p className="text-xs text-muted-foreground">ID: {g.id.slice(0, 8)}</p>
                      </div>

                      {/* Score bar */}
                      <div className="hidden sm:block w-32 shrink-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn("text-sm font-bold", gradeColor(g.finalScore))}>
                            {g.finalScore.toFixed(1)}%
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5", gradeColor(g.finalScore))}
                          >
                            {g.grade}
                          </Badge>
                        </div>
                        <Progress
                          value={g.finalScore}
                          className={cn("h-1.5", progressColor(g.finalScore))}
                        />
                      </div>

                      {/* Score (mobile) */}
                      <div className="sm:hidden shrink-0">
                        <span className={cn("text-sm font-bold", gradeColor(g.finalScore))}>
                          {g.finalScore.toFixed(1)}%
                        </span>
                      </div>

                      {/* Type badge */}
                      <Badge variant="secondary" className="text-[10px] hidden md:flex capitalize shrink-0">
                        {g.type}
                      </Badge>

                      {/* Status */}
                      <div className="hidden lg:block shrink-0">
                        <StatusBadge status={g.status} />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0 border-l pl-2 ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View detail"
                          onClick={() => setDetailGrade(g)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          title="Approve"
                          onClick={() => setConfirmApproveId(g.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Reject"
                          onClick={() => setConfirmRejectId(g.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        {/* ══ Distribution Tab ══ */}
        <TabsContent value="distribution" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribution bars */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grade Distribution</CardTitle>
                <CardDescription>Breakdown of letter grades across all students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {gradeDistribution.map(({ grade, count, pct }) => {
                  const score = grade.startsWith("A") ? 88 : grade.startsWith("B") ? 75 : grade.startsWith("C") ? 62 : 30
                  return (
                    <div key={grade} className="flex items-center gap-3">
                      <span className={cn("text-xs font-bold w-8 shrink-0", gradeColor(score))}>
                        {grade}
                      </span>
                      <div className="flex-1">
                        <Progress
                          value={pct}
                          className={cn("h-2", progressColor(score))}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                        {count} student{count !== 1 ? "s" : ""} ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Score Statistics</CardTitle>
                <CardDescription>Key performance indicators for this cohort</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    label: "Highest Score",
                    value: `${Math.max(...mockGrades.map((g) => g.finalScore)).toFixed(1)}%`,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Lowest Score",
                    value: `${Math.min(...mockGrades.map((g) => g.finalScore)).toFixed(1)}%`,
                    color: "text-destructive",
                  },
                  {
                    label: "Average Score",
                    value: `${avgScore.toFixed(1)}%`,
                    color: "text-blue-600",
                  },
                  {
                    label: "Median Score",
                    value: (() => {
                      const sorted = [...mockGrades].sort((a, b) => a.finalScore - b.finalScore)
                      const mid = Math.floor(sorted.length / 2)
                      return `${(sorted.length % 2 === 0
                        ? (sorted[mid - 1].finalScore + sorted[mid].finalScore) / 2
                        : sorted[mid].finalScore
                      ).toFixed(1)}%`
                    })(),
                    color: "text-primary",
                  },
                  { label: "Pass Rate (≥50%)", value: `${passRate}%`, color: "text-emerald-600" },
                  {
                    label: "A-Grade Rate (≥85%)",
                    value: `${Math.round((mockGrades.filter((g) => g.finalScore >= 85).length / mockGrades.length) * 100)}%`,
                    color: "text-emerald-600",
                  },
                  { label: "Provisional", value: `${pendingGrades.length}`, color: "text-amber-600" },
                  { label: "Finalised", value: `${approvedGrades.length}`, color: "text-primary" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5"
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className={cn("text-sm font-bold", color)}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ════════════════════════════════════════════════════════════════════
           GRADE DETAIL DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!detailGrade} onOpenChange={(open) => { if (!open) setDetailGrade(null) }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          {detailGrade && (() => {
            const evalAvg = detailGrade.evaluatorScores && detailGrade.evaluatorScores.length > 0
              ? detailGrade.evaluatorScores.reduce((a, b) => a + b, 0) / detailGrade.evaluatorScores.length
              : null
            const components = [
              evalAvg !== null && {
                label: "Evaluator Score",
                sublabel: `${detailGrade.evaluatorScores!.length} evaluator${detailGrade.evaluatorScores!.length > 1 ? "s" : ""} · 40% weight`,
                score: evalAvg,
                max: 40,
                pct: (evalAvg / 40) * 100,
              },
              detailGrade.advisorScore !== undefined && {
                label: "Advisor Score",
                sublabel: "Assigned by project advisor · 30% weight",
                score: detailGrade.advisorScore,
                max: 30,
                pct: (detailGrade.advisorScore / 30) * 100,
              },
              detailGrade.documentationScore !== undefined && {
                label: "Documentation",
                sublabel: "Report quality & completeness · 30% weight",
                score: detailGrade.documentationScore,
                max: 30,
                pct: (detailGrade.documentationScore / 30) * 100,
              },
            ].filter(Boolean) as { label: string; sublabel: string; score: number; max: number; pct: number }[]

            return (
              <>
                {/* Gradient header — primary CSS variable, responds to theme */}
                <div className="px-5 pt-4 pb-3 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold border-2 border-background shadow-sm shrink-0">
                      {initials(detailGrade.studentName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{detailGrade.studentName}</p>
                      <p className="text-[11px] text-muted-foreground">Record ID: {detailGrade.id}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className="capitalize text-[10px] h-4 px-1.5">{detailGrade.type}</Badge>
                        <StatusBadge status={detailGrade.status} />
                        <span className="text-[10px] text-muted-foreground">Updated {detailGrade.updatedAt}</span>
                      </div>
                    </div>
                    {/* Grade letter — semantic color kept as performance indicator */}
                    <div className="text-right shrink-0">
                      <p className={cn("text-3xl font-extrabold leading-none", gradeColor(detailGrade.finalScore))}>
                        {detailGrade.grade}
                      </p>
                      <p className="text-xs font-semibold mt-0.5 text-primary">
                        {detailGrade.finalScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Overall bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="text-muted-foreground font-medium">Overall Score</span>
                      <span className="font-bold text-primary">{detailGrade.finalScore.toFixed(1)} / 100</span>
                    </div>
                    <Progress value={detailGrade.finalScore} className="h-1.5 [&>div]:bg-primary" />
                  </div>
                </div>

                <div className="px-5 py-3 space-y-3">

                  {/* Score components */}
                  {components.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Score Breakdown
                      </p>
                      {components.map((c) => (
                        <div key={c.label} className="rounded-lg border bg-muted/30 px-3 py-2 space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold">{c.label}</p>
                              <p className="text-[10px] text-muted-foreground">{c.sublabel}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold text-primary">
                                {c.score % 1 === 0 ? c.score : c.score.toFixed(1)}
                              </span>
                              <span className="text-[11px] text-muted-foreground"> / {c.max}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={c.pct} className="h-1 flex-1 [&>div]:bg-primary" />
                            <span className="text-[10px] font-semibold w-9 text-right shrink-0 text-primary">
                              {c.pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Individual evaluator scores */}
                      {detailGrade.evaluatorScores && detailGrade.evaluatorScores.length > 1 && (
                        <div className="rounded-lg border bg-muted/20 px-3 py-2">
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                            Individual Evaluator Scores
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            {detailGrade.evaluatorScores.map((s, i) => (
                              <div key={i} className="flex flex-col items-center rounded-lg px-2.5 py-1 border bg-primary/10 text-[10px]">
                                <span className="font-bold text-xs text-primary">{s}</span>
                                <span className="text-muted-foreground">E{i + 1}</span>
                              </div>
                            ))}
                            <div className="flex flex-col items-center rounded-lg px-2.5 py-1 border bg-muted/50 text-[10px]">
                              <span className="font-bold text-xs text-primary">
                                {(detailGrade.evaluatorScores.reduce((a, b) => a + b, 0) / detailGrade.evaluatorScores.length).toFixed(1)}
                              </span>
                              <span className="text-muted-foreground">Avg</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formula note */}
                  <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <FileText className="h-3 w-3 shrink-0 text-primary" />
                    Final = Evaluator (40%) + Advisor (30%) + Documentation (30%)
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApproveGrade(detailGrade.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 gap-1.5 h-8 text-xs" onClick={() => handleRejectGrade(detailGrade.id)}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDetailGrade(null)}>
                      Close
                    </Button>
                  </div>

                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           CONFIRM APPROVE DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!confirmApproveId} onOpenChange={(open) => { if (!open) setConfirmApproveId(null) }}>
        <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background px-6 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold">Approve Grade</p>
                <p className="text-sm text-muted-foreground">
                  {confirmApproveId
                    ? mockGrades.find((g) => g.id === confirmApproveId)?.studentName
                    : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <CardContent className="px-4 py-3">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  This will mark the grade as final. The student will be notified.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="px-6 pb-5 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmApproveId(null)}>Cancel</Button>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleApproveGrade(confirmApproveId!)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Yes, Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           CONFIRM REJECT DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!confirmRejectId} onOpenChange={(open) => { if (!open) setConfirmRejectId(null) }}>
        <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background px-6 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-bold text-destructive">Reject Grade</p>
                <p className="text-sm text-muted-foreground">
                  {confirmRejectId
                    ? mockGrades.find((g) => g.id === confirmRejectId)?.studentName
                    : ""}
                </p>
              </div>
        </div>
      </div>
          <div className="px-6 py-4">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="px-4 py-3">
                <p className="text-sm text-destructive">
                  This grade will be sent back for revision. The student and their advisor will be notified.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="px-6 pb-5 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmRejectId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => handleRejectGrade(confirmRejectId!)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Yes, Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
