"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calculator,
  FileCheck,
  Download,
  Upload,
  Award,
  Target,
  Clock,
  Users,
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Star,
  BookOpen,
  GraduationCap,
  SlidersHorizontal,
  RefreshCw,
  FileText,
  Eye,
  XCircle,
  MessageSquare,
  Calendar,
  ClipboardCheck,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockGrades, mockProjects, Grade, mockComplaints, type Complaint } from '@/data/mockData'

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function scoreToGrade(s: number): string {
  if (s >= 90) return 'A+'
  if (s >= 85) return 'A'
  if (s >= 80) return 'A-'
  if (s >= 75) return 'B+'
  if (s >= 70) return 'B'
  if (s >= 65) return 'B-'
  if (s >= 60) return 'C+'
  if (s >= 55) return 'C'
  if (s >= 50) return 'C-'
  return 'F'
}

function gradeColor(g: string) {
  if (['A+', 'A', 'A-'].includes(g)) return 'bg-primary/10 text-primary border-primary/20'
  if (['B+', 'B', 'B-'].includes(g)) return 'bg-muted text-foreground border-border'
  if (['C+', 'C', 'C-'].includes(g)) return 'bg-primary/[0.05] text-primary/70 border-primary/10'
  return 'bg-destructive/10 text-destructive border-destructive/20'
}

function statusConfig(status: Grade['status']) {
  switch (status) {
    case 'provisional': return { label: 'Provisional', cls: 'bg-primary/10 text-primary border-primary/20' }
    case 'final':       return { label: 'Final',       cls: 'bg-muted text-foreground border-border' }
    case 'rejected':    return { label: 'Rejected',    cls: 'bg-destructive/10 text-destructive border-destructive/20' }
  }
}

/* ─── Grade Detail Sheet ──────────────────────────────────────────────── */
function GradeSheet({
  grade,
  open,
  onClose,
  onAdjust,
}: {
  grade: Grade | null
  open: boolean
  onClose: () => void
  onAdjust: (id: string, score: number, reason: string) => void
}) {
  const [newScore, setNewScore]     = useState('')
  const [reason, setReason]         = useState('')
  const [saving, setSaving]         = useState(false)

  React.useEffect(() => { if (grade) { setNewScore(''); setReason('') } }, [grade?.id])

  if (!grade) return null

  const sc  = statusConfig(grade.status)
  const gc  = gradeColor(grade.grade)
  const eScores = grade.evaluatorScores ?? [35, 38, 32]
  const aScore  = grade.advisorScore      ?? 28
  const dScore  = grade.documentationScore ?? 25
  const eAvg    = eScores.reduce((a, b) => a + b, 0) / eScores.length

  const computed = Math.round(((eAvg * 0.4) + (aScore * 0.3) + (dScore * 0.3)) * 10) / 10
  const project  = mockProjects.find(p => p.id === grade.studentName.toLowerCase().replace(' ', ''))

  const handleApply = async () => {
    const s = parseFloat(newScore)
    if (isNaN(s) || s < 0 || s > 100) { toast.error('Enter a valid score 0–100'); return }
    if (!reason.trim()) { toast.error('Please provide an adjustment reason'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    onAdjust(grade.id, s, reason)
    toast.success('Grade Adjusted', { description: `${grade.studentName} updated to ${s}%` })
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 gap-0">

        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {grade.studentName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate">{grade.studentName}</SheetTitle>
              <SheetDescription className="text-xs capitalize">{grade.type} grade</SheetDescription>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge className={`text-xs ${gc}`}>{grade.grade}</Badge>
              <Badge variant="outline" className={`text-xs ${sc.cls}`}>{sc.label}</Badge>
            </div>
        </div>
        </SheetHeader>

        <div className="p-6 space-y-5">

          {/* Score hero */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
            <p className="text-4xl font-bold tracking-tight text-primary">{grade.finalScore}%</p>
            <p className="text-sm text-muted-foreground mt-0.5">Final Score</p>
            <p className="text-xs text-muted-foreground mt-1">Last updated: {grade.updatedAt}</p>
          </div>

          {/* Score breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Score Breakdown
            </p>
            {[
              { label: 'Evaluators (40%)', value: eAvg.toFixed(1), max: 40, pct: (eAvg / 40) * 100 },
              { label: 'Advisor (30%)',    value: aScore,           max: 30, pct: (aScore / 30) * 100 },
              { label: 'Documentation (30%)', value: dScore,        max: 30, pct: (dScore / 30) * 100 },
            ].map(row => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold">{row.value}/{row.max}</span>
                </div>
                <Progress value={row.pct} className="h-1.5" />
              </div>
            ))}
            <div className="flex justify-between text-xs pt-1 border-t">
              <span className="font-medium">Computed Total</span>
              <span className="font-bold text-primary">{computed}%</span>
            </div>
          </div>

          {/* Evaluator scores */}
          {eScores.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Individual Evaluator Scores
              </p>
              <div className="flex flex-wrap gap-2">
                {eScores.map((s, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 px-3 py-1.5 text-center">
                    <p className="text-xs text-muted-foreground">Eval {i + 1}</p>
                    <p className="text-sm font-bold">{s}/40</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Project
                </p>
                <div className="rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-sm font-medium">{project.title}</p>
                  {project.groupName && <p className="text-xs text-muted-foreground">{project.groupName}</p>}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Adjustment form */}
          {grade.status !== 'final' ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Manual Adjustment
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">New Score (0–100)</Label>
                <Input
                  type="number"
                  placeholder={`Current: ${grade.finalScore}`}
                  value={newScore}
                  onChange={e => setNewScore(e.target.value)}
                  min={0} max={100} step={0.1}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason for Adjustment</Label>
                <Textarea
                  placeholder="Explain the reason…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="resize-none text-sm min-h-[80px]"
                />
              </div>
              <Button
                className="w-full gap-2 text-sm"
                disabled={saving || !newScore || !reason.trim()}
                onClick={handleApply}
              >
                {saving
                  ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  : <SlidersHorizontal className="h-4 w-4" />
                }
                Apply Adjustment
              </Button>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 text-sm text-muted-foreground text-center">
              This grade is <span className="font-semibold text-foreground">finalised</span> and cannot be adjusted.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Grade Card ──────────────────────────────────────────────────────── */
function GradeCard({
  grade,
  onAdjust,
}: {
  grade: Grade
  onAdjust: (g: Grade) => void
}) {
  const gc = gradeColor(grade.grade)
  const sc = statusConfig(grade.status)
  const eScores = grade.evaluatorScores ?? [35, 38, 32]
  const eAvg    = eScores.reduce((a, b) => a + b, 0) / eScores.length
  const aScore  = grade.advisorScore      ?? 28
  const dScore  = grade.documentationScore ?? 25

  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20 space-y-4">

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-bold transition-transform group-hover:scale-110">
              {grade.studentName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{grade.studentName}</p>
            <p className="text-xs text-muted-foreground capitalize">{grade.type} — {grade.updatedAt}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className={`rounded-xl px-3 py-1 border text-center min-w-[3rem] ${gc}`}>
            <p className="text-base font-bold leading-none">{grade.grade}</p>
          </div>
          <Badge variant="outline" className={`text-xs ${sc.cls}`}>{sc.label}</Badge>
        </div>
      </div>

      {/* Score + bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Final score</span>
          <span className="font-bold text-primary">{grade.finalScore}%</span>
        </div>
        <Progress value={grade.finalScore} className="h-1.5" />
      </div>

      {/* Mini breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-muted/40 py-1.5">
          <p className="text-muted-foreground">Evaluators</p>
          <p className="font-semibold">{eAvg.toFixed(0)}/40</p>
        </div>
        <div className="rounded-lg bg-muted/40 py-1.5">
          <p className="text-muted-foreground">Advisor</p>
          <p className="font-semibold">{aScore}/30</p>
        </div>
        <div className="rounded-lg bg-muted/40 py-1.5">
          <p className="text-muted-foreground">Docs</p>
          <p className="font-semibold">{dScore}/30</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
          className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
          onClick={() => onAdjust(grade)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Details & Adjust
        </Button>
      </div>
    </div>
  )
}

/* ─── Publish Dialog ──────────────────────────────────────────────────── */
function PublishDialog({
  open,
  provisionalCount,
  onClose,
  onPublish,
}: {
  open: boolean
  provisionalCount: number
  onClose: () => void
  onPublish: (days: string) => void
}) {
  const [days, setDays]     = useState('7')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    onPublish(days)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" /> Publish Provisional Grades
          </DialogTitle>
          <DialogDescription>
            {provisionalCount} provisional grade{provisionalCount !== 1 ? 's' : ''} will be published as final.
            Students will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Complaint Window (Days)</Label>
            <Input
              type="number"
              value={days}
              onChange={e => setDays(e.target.value)}
              min={1} max={30}
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Students can file grade complaints during this period after publishing.
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 border px-4 py-3 space-y-1 text-sm">
            <p className="font-medium">Before publishing, ensure:</p>
            <ul className="space-y-1 text-muted-foreground text-xs list-disc list-inside">
              <li>All evaluator scores have been submitted</li>
              <li>Advisor scores are complete</li>
              <li>Documentation scores are recorded</li>
              <li>No pending complaint reviews remain</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={handle} disabled={saving || !days}>
              {saving
                ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : <FileCheck className="h-4 w-4" />
              }
              Publish Grades
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function GradeManagementPage() {
  const [localGrades, setLocalGrades]         = useState<Grade[]>(mockGrades)
  const [sheetGrade, setSheetGrade]           = useState<Grade | null>(null)
  const [sheetOpen, setSheetOpen]             = useState(false)
  const [publishOpen, setPublishOpen]         = useState(false)
  const [search, setSearch]                   = useState('')
  const [statusFilter, setStatusFilter]       = useState('all')
  const [typeFilter, setTypeFilter]           = useState('all')
  const [recalcLoading, setRecalcLoading]     = useState(false)

  /* ── Derived ── */
  const provisional  = localGrades.filter(g => g.status === 'provisional')
  const finalised    = localGrades.filter(g => g.status === 'final')
  const avgScore     = localGrades.length > 0
    ? (localGrades.reduce((s, g) => s + g.finalScore, 0) / localGrades.length).toFixed(1)
    : '0.0'
  const aGrades      = localGrades.filter(g => ['A+', 'A', 'A-'].includes(g.grade)).length
  const passRate     = localGrades.length > 0
    ? Math.round((localGrades.filter(g => g.finalScore >= 50).length / localGrades.length) * 100)
    : 0

  const filtered = useMemo(() => {
    return localGrades.filter(g => {
      const q = search.toLowerCase()
      const matchSearch = !search || g.studentName.toLowerCase().includes(q) || g.grade.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || g.status === statusFilter
      const matchType   = typeFilter   === 'all' || g.type   === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [localGrades, search, statusFilter, typeFilter])

  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = {
      'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'C-': 0, 'F': 0,
    }
    localGrades.forEach(g => { if (g.grade in dist) dist[g.grade]++ })
    return Object.entries(dist).map(([grade, count]) => ({
      grade,
      count,
      pct: localGrades.length > 0 ? Math.round((count / localGrades.length) * 100) : 0,
    }))
  }, [localGrades])

  /* ── Actions ── */
  const handleRecalculate = async () => {
    setRecalcLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLocalGrades(prev => prev.map(g => {
      const eScores = g.evaluatorScores ?? [35, 38, 32]
      const eAvg    = eScores.reduce((a, b) => a + b, 0) / eScores.length
      const aScore  = g.advisorScore      ?? 28
      const dScore  = g.documentationScore ?? 25
      const score   = Math.round(((eAvg * 0.4) + (aScore * 0.3) + (dScore * 0.3)) * 10) / 10
      return { ...g, finalScore: score, grade: scoreToGrade(score) }
    }))
    setRecalcLoading(false)
    toast.success('Grades Recalculated', { description: 'All final scores have been updated.' })
  }

  const handlePublish = (days: string) => {
    setLocalGrades(prev => prev.map(g => g.status === 'provisional' ? { ...g, status: 'final' as const } : g))
    toast.success('Grades Published', {
      description: `Complaint window open for ${days} day${days !== '1' ? 's' : ''}.`,
    })
    setPublishOpen(false)
  }

  const handleAdjust = (id: string, score: number, _reason: string) => {
    setLocalGrades(prev => prev.map(g =>
      g.id === id ? { ...g, finalScore: score, grade: scoreToGrade(score), status: 'provisional' } : g
    ))
  }

  const kpi = [
    { label: 'Total Grades',    value: localGrades.length, icon: Users,        bg: 'bg-primary/10',     color: 'text-primary' },
    { label: 'Class Average',   value: `${avgScore}%`,     icon: Target,       bg: 'bg-primary/[0.06]', color: 'text-primary/80' },
    { label: 'Provisional',     value: provisional.length, icon: Clock,        bg: provisional.length > 0 ? 'bg-destructive/10' : 'bg-muted', color: provisional.length > 0 ? 'text-destructive' : 'text-muted-foreground' },
    { label: 'A Grades',        value: aGrades,            icon: Award,        bg: 'bg-muted',          color: 'text-foreground' },
  ]

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Grade Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Calculate, review, adjust, and publish student grades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleRecalculate}
            disabled={recalcLoading}
          >
            {recalcLoading
              ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <RefreshCw className="h-4 w-4" />
            }
            Recalculate
          </Button>
          {provisional.length > 0 && (
            <Button size="sm" className="gap-1.5" onClick={() => setPublishOpen(true)}>
              <FileCheck className="h-4 w-4" />
              Publish {provisional.length} Grade{provisional.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map(s => (
          <Card key={s.label} className="group border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-11 w-11 rounded-full ${s.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formula banner */}
      <div className="rounded-xl border bg-primary/5 border-primary/10 px-4 py-3 flex items-start gap-3">
        <Calculator className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary">Grade Calculation Formula</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Final Score = (Evaluator Average × 40%) + (Advisor Score × 30%) + (Documentation Score × 30%)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-10">
          <TabsTrigger value="overview"     className="gap-2"><GraduationCap className="h-4 w-4" /> Grades</TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2"><BarChart3 className="h-4 w-4" /> Distribution</TabsTrigger>
          <TabsTrigger value="actions"      className="gap-2"><SlidersHorizontal className="h-4 w-4" /> Bulk Actions</TabsTrigger>
          <TabsTrigger value="complaints"   className="gap-2 relative">
            <AlertTriangle className="h-4 w-4" /> Complaints
            {mockComplaints.filter(c => c.status === 'open').length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] text-destructive-foreground flex items-center justify-center font-bold">
                {mockComplaints.filter(c => c.status === 'open').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Grades Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Search + filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                placeholder="Search by student name or grade…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
                      </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-44 shrink-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="provisional">Provisional</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 w-40 shrink-0">
                <BookOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" className="h-10 text-xs shrink-0"
                onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all') }}>
                Clear
                      </Button>
            )}
                    </div>

          {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
            <p className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed">
              <GraduationCap className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No grades match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting the search or filters</p>
                      </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(g => (
                <GradeCard
                  key={g.id}
                  grade={g}
                  onAdjust={grade => { setSheetGrade(grade); setSheetOpen(true) }}
                />
                          ))}
                        </div>
          )}
        </TabsContent>

        {/* ── Distribution Tab ── */}
        <TabsContent value="distribution">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

            {/* Bar chart */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Grade Distribution
                </CardTitle>
                <CardDescription>Visual breakdown of all letter grades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {gradeDistribution.map(({ grade, count, pct }) => (
                  <div key={grade} className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`w-10 shrink-0 justify-center text-xs font-bold ${gradeColor(grade)}`}
                    >
                      {grade}
                    </Badge>
                    <div className="flex-1">
                      <Progress value={pct} className="h-2" />
                      </div>
                    <div className="flex items-center gap-1.5 shrink-0 w-24 justify-end">
                      <span className="text-xs text-muted-foreground">{count} student{count !== 1 ? 's' : ''}</span>
                      <span className="text-xs font-bold text-primary w-9 text-right">{pct}%</span>
                    </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Statistics
                </CardTitle>
                <CardDescription>Key grade insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Highest Score', value: `${Math.max(...localGrades.map(g => g.finalScore))}%` },
                  { label: 'Lowest Score',  value: `${Math.min(...localGrades.map(g => g.finalScore))}%` },
                  {
                    label: 'Median Score',
                    value: (() => {
                      const s = [...localGrades].sort((a, b) => a.finalScore - b.finalScore)
                      const m = Math.floor(s.length / 2)
                      return s.length % 2 === 0
                        ? `${((s[m - 1].finalScore + s[m].finalScore) / 2).toFixed(1)}%`
                        : `${s[m].finalScore.toFixed(1)}%`
                    })(),
                  },
                  { label: 'Class Average', value: `${avgScore}%` },
                  { label: 'Pass Rate (≥50%)', value: `${passRate}%` },
                  { label: 'A Grades',      value: `${aGrades} / ${localGrades.length}` },
                  { label: 'Provisional',   value: provisional.length },
                  { label: 'Finalised',     value: finalised.length },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center rounded-lg bg-muted/40 px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="font-bold text-sm">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Bulk Actions Tab ── */}
        <TabsContent value="actions">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: RefreshCw,
                title: 'Recalculate All Grades',
                desc: 'Re-run the grade formula for all students using current component scores.',
                cta: 'Recalculate',
                action: handleRecalculate,
                loading: recalcLoading,
                disabled: recalcLoading,
              },
              {
                icon: FileCheck,
                title: 'Publish Provisional Grades',
                desc: `Finalise ${provisional.length} provisional grade${provisional.length !== 1 ? 's' : ''} and open the student complaint window.`,
                cta: 'Publish Grades',
                action: () => setPublishOpen(true),
                loading: false,
                disabled: provisional.length === 0,
              },
              {
                icon: Download,
                title: 'Export Grade Report',
                desc: 'Download grades in PDF, Word, or CSV format for external use.',
                cta: 'Export',
                action: () => toast.info('Export Started', { description: 'Grade report export initiated.' }),
                loading: false,
                disabled: false,
              },
              {
                icon: Upload,
                title: 'Bulk Import Grades',
                desc: 'Import component scores from a CSV file to populate grade calculations.',
                cta: 'Import CSV',
                action: () => toast.info('Import', { description: 'Bulk import dialog would open here.' }),
                loading: false,
                disabled: false,
              },
              {
                icon: Star,
                title: 'Generate Transcripts',
                desc: 'Generate official grade transcripts for students with finalised grades.',
                cta: 'Generate',
                action: () => toast.info('Transcripts', { description: 'Transcript generation initiated.' }),
                loading: false,
                disabled: finalised.length === 0,
              },
              {
                icon: FileText,
                title: 'Grade Appeal Summary',
                desc: 'View all pending grade complaints linked to current grade records.',
                cta: 'View Complaints',
                href: '/dashboard/coordinator/complaints',
                loading: false,
                disabled: false,
              },
            ].map(item => (
              <Card key={item.title} className="group border-none shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <CardContent className="p-5 flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                      <item.icon className="h-5 w-5 text-primary" />
                  </div>
                    <p className="font-semibold text-sm">{item.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{item.desc}</p>
                  {'href' in item && item.href ? (
                    <Link href={item.href}>
                      <Button variant="outline" size="sm" className="w-full gap-1.5 hover:border-primary hover:text-primary">
                        {item.cta} <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 hover:border-primary hover:text-primary"
                      onClick={item.action}
                      disabled={item.disabled}
                    >
                      {item.loading
                        ? <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        : <item.icon className="h-3.5 w-3.5" />
                      }
                      {item.cta}
                    </Button>
                  )}
              </CardContent>
            </Card>
            ))}
                </div>

          {/* Quick summary */}
          <Card className="border-none shadow-sm mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Grade Readiness Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Evaluator scores submitted', ok: true },
                  { label: 'Advisor scores recorded',    ok: true },
                  { label: 'Documentation scored',       ok: true },
                  { label: 'No unresolved complaints',   ok: false },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm border ${
                    item.ok
                      ? 'bg-primary/5 border-primary/10 text-foreground'
                      : 'bg-destructive/5 border-destructive/10 text-destructive'
                  }`}>
                    {item.ok
                      ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      : <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    }
                    {item.label}
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* ── Complaints Tab ── */}
        <TabsContent value="complaints" className="space-y-4">
          {/* KPI row */}
          {(() => {
            const total      = mockComplaints.length
            const openC      = mockComplaints.filter(c => c.status === 'open').length
            const reviewing  = mockComplaints.filter(c => c.status === 'under_review').length
            const resolved   = mockComplaints.filter(c => c.status === 'resolved').length
            const rejected   = mockComplaints.filter(c => c.status === 'rejected').length
            const kpis = [
              { label: 'Total',        value: total,     bg: 'bg-muted/60',           text: 'text-foreground',   icon: MessageSquare },
              { label: 'Open',         value: openC,     bg: 'bg-destructive/10',     text: 'text-destructive',  icon: AlertTriangle },
              { label: 'Under Review', value: reviewing, bg: 'bg-primary/10',         text: 'text-primary',      icon: Eye           },
              { label: 'Resolved',     value: resolved,  bg: 'bg-primary/[0.06]',     text: 'text-primary/70',   icon: CheckCircle2  },
            ]
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kpis.map(k => (
                  <div key={k.label} className={`rounded-xl border p-4 flex items-center gap-3 ${k.bg}`}>
                    <k.icon className={`h-5 w-5 shrink-0 ${k.text}`} />
                    <div>
                      <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Compact complaints list */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Recent Complaints
              </CardTitle>
              <Link href="/dashboard/coordinator/complaints">
                <Button size="sm" variant="outline" className="gap-1.5 hover:border-primary hover:text-primary text-xs h-8">
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {mockComplaints.slice(0, 8).map(c => {
                  const statusCfg = {
                    open:         { label: 'Open',         cls: 'bg-destructive/10 text-destructive border-destructive/30',   icon: AlertTriangle },
                    under_review: { label: 'Under Review', cls: 'bg-primary/10 text-primary border-primary/30',               icon: Eye           },
                    resolved:     { label: 'Resolved',     cls: 'bg-muted text-foreground border-border',                     icon: CheckCircle2  },
                    rejected:     { label: 'Rejected',     cls: 'bg-muted text-muted-foreground border-border',               icon: XCircle       },
                  }[c.status]
                  const typeCfg = {
                    grade:      { label: 'Grade Dispute',      cls: 'bg-primary/10 text-primary' },
                    evaluation: { label: 'Evaluation Dispute', cls: 'bg-primary/[0.06] text-primary/80' },
                    assignment: { label: 'Assignment',         cls: 'bg-muted text-foreground' },
                    defense:    { label: 'Defense Dispute',    cls: 'bg-muted text-muted-foreground' },
                  }[c.targetType]
                  const StatusIcon = statusCfg.icon
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                        {c.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.targetName}</p>
                      </div>
                      <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeCfg.cls}`}>
                        {typeCfg.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusCfg.cls}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusCfg.label}
                      </span>
                      <Link href="/dashboard/coordinator/complaints">
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary">
                          Review
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
              {mockComplaints.length > 8 && (
                <div className="px-5 py-3 border-t border-border/40 text-center">
                  <Link href="/dashboard/coordinator/complaints">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary gap-1">
                      See {mockComplaints.length - 8} more complaints <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border bg-destructive/5 border-destructive/20 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Unresolved Complaints</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mockComplaints.filter(c => c.status === 'open' || c.status === 'under_review').length} complaint(s) still require attention before grades can be finalised.
                </p>
              </div>
            </div>
            <div className="rounded-xl border bg-primary/5 border-primary/10 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Resolution Rate</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mockComplaints.length > 0
                    ? Math.round(mockComplaints.filter(c => c.status === 'resolved').length / mockComplaints.length * 100)
                    : 0}% of all complaints have been resolved.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-1">
            <Link href="/dashboard/coordinator/complaints">
              <Button className="gap-2 px-8">
                <AlertTriangle className="h-4 w-4" />
                Open Full Complaints Manager
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      {/* Grade detail + adjustment sheet */}
      <GradeSheet
        grade={sheetGrade}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdjust={handleAdjust}
      />

      {/* Publish dialog */}
      <PublishDialog
        open={publishOpen}
        provisionalCount={provisional.length}
        onClose={() => setPublishOpen(false)}
        onPublish={handlePublish}
      />
    </div>
  )
}
