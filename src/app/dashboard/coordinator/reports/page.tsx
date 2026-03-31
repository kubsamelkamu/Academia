"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  FileText,
  Download,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Plus,
  ArrowLeft,
  TrendingUp,
  GraduationCap,
  ClipboardList,
  RefreshCw,
  Star,
  FolderKanban,
  ChevronRight,
  Activity,
  Calendar,
  Printer,
  Share2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { mockProjects, mockGrades, mockEvaluations, mockUsers } from "@/data/mockData"

/* ─── Types ───────────────────────────────────────────────────────────── */
type ReportStatus = "pending" | "processing" | "completed" | "failed"
type ReportType   = "grades" | "projects" | "evaluations" | "advisors" | "custom"

interface ReportRecord {
  id: string
  type: ReportType
  title: string
  description: string
  requestedBy: string
  requestedAt: string
  status: ReportStatus
  progress?: number
  format: "PDF" | "CSV" | "XLSX"
  size?: string
}

/* ─── Mock history ────────────────────────────────────────────────────── */
const SEED_REPORTS: ReportRecord[] = [
  { id: "r1", type: "grades",      title: "Final Grade Report — Semester 1",          description: "Complete grade breakdown for all students",                     requestedBy: "Dr. Michael Brown", requestedAt: "2024-01-15T10:30:00Z", status: "completed", format: "PDF",  size: "1.2 MB" },
  { id: "r2", type: "projects",    title: "Project Completion Status Q1",             description: "Overview of all active projects and their progress",             requestedBy: "Dr. Michael Brown", requestedAt: "2024-01-14T14:20:00Z", status: "processing", progress: 75, format: "XLSX" },
  { id: "r3", type: "evaluations", title: "Evaluator Performance Analytics",          description: "Analysis of evaluation quality and submission timeliness",       requestedBy: "Dr. Michael Brown", requestedAt: "2024-01-13T09:15:00Z", status: "pending",  format: "PDF" },
  { id: "r4", type: "advisors",    title: "Advisor Workload Summary",                 description: "Per-advisor project count, progress, and pending evaluation stats", requestedBy: "Dr. Michael Brown", requestedAt: "2024-01-12T11:45:00Z", status: "completed", format: "CSV",  size: "84 KB" },
  { id: "r5", type: "grades",      title: "Provisional vs Final Grade Comparison",    description: "Tracking grade changes from provisional to final across cohorts", requestedBy: "Dr. Michael Brown", requestedAt: "2024-01-10T16:00:00Z", status: "completed", format: "PDF",  size: "2.1 MB" },
  { id: "r6", type: "custom",      title: "End-of-Semester Coordinator Summary",      description: "Aggregated view of projects, grades, complaints, and advisors",   requestedBy: "Dr. Michael Brown", requestedAt: "2024-01-08T08:30:00Z", status: "failed",   format: "PDF" },
]

/* ─── Status config ───────────────────────────────────────────────────── */
const STATUS_CFG = {
  completed:  { label: "Completed",  cls: "bg-primary/10 text-primary border-primary/20",             icon: CheckCircle2 },
  processing: { label: "Processing", cls: "bg-muted text-foreground border-border",                   icon: Clock },
  pending:    { label: "Pending",    cls: "bg-muted text-muted-foreground border-border",              icon: Clock },
  failed:     { label: "Failed",     cls: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
}

const TYPE_CFG: Record<ReportType, { label: string; icon: React.ElementType }> = {
  grades:      { label: "Grades",      icon: GraduationCap },
  projects:    { label: "Projects",    icon: FolderKanban },
  evaluations: { label: "Evaluations", icon: ClipboardList },
  advisors:    { label: "Advisors",    icon: Users },
  custom:      { label: "Custom",      icon: FileText },
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

/* ─── Generate Dialog ─────────────────────────────────────────────────── */
function GenerateDialog({
  open,
  onClose,
  defaultType,
  defaultTitle,
  defaultDesc,
  onGenerate,
}: {
  open: boolean
  onClose: () => void
  defaultType?: string
  defaultTitle?: string
  defaultDesc?: string
  onGenerate: (r: ReportRecord) => void
}) {
  const [type, setType]     = useState(defaultType ?? "")
  const [title, setTitle]   = useState(defaultTitle ?? "")
  const [desc, setDesc]     = useState(defaultDesc ?? "")
  const [fmt, setFmt]       = useState<"PDF" | "CSV" | "XLSX">("PDF")
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (open) { setType(defaultType ?? ""); setTitle(defaultTitle ?? ""); setDesc(defaultDesc ?? "") }
  }, [open, defaultType, defaultTitle, defaultDesc])

  const handle = async () => {
    if (!type || !title.trim()) { toast.error("Select a type and enter a title"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    onGenerate({
      id: `r-${Date.now()}`,
      type: type as ReportType,
      title: title.trim(),
      description: desc.trim() || `${title.trim()} generated on ${new Date().toLocaleDateString()}`,
      requestedBy: "Coordinator",
      requestedAt: new Date().toISOString(),
      status: "pending",
      format: fmt,
    })
    toast.success("Report Queued", { description: `"${title}" is queued for generation.` })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Generate Report
          </DialogTitle>
          <DialogDescription>Configure your report parameters and output format</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Report Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grades">Grade Analysis</SelectItem>
                  <SelectItem value="projects">Project Status</SelectItem>
                  <SelectItem value="evaluations">Evaluation Metrics</SelectItem>
                  <SelectItem value="advisors">Advisor Performance</SelectItem>
                  <SelectItem value="custom">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Format</Label>
              <Select value={fmt} onValueChange={v => setFmt(v as "PDF" | "CSV" | "XLSX")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Report title…" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Description (optional)</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe what to include…" className="resize-none text-sm min-h-[70px]" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={handle} disabled={saving || !type || !title.trim()}>
              {saving
                ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : <RefreshCw className="h-4 w-4" />
              }
              Generate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Report Card ─────────────────────────────────────────────────────── */
function ReportCard({ report, onDownload }: { report: ReportRecord; onDownload: (r: ReportRecord) => void }) {
  const sc = STATUS_CFG[report.status]
  const tc = TYPE_CFG[report.type]
  const StatusIcon = sc.icon
  const TypeIcon   = tc.icon

  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <TypeIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm truncate">{report.title}</p>
            <Badge variant="outline" className={`shrink-0 text-xs ${sc.cls}`}>
              <StatusIcon className={`h-3 w-3 mr-1 ${report.status === "processing" ? "animate-pulse" : ""}`} />
              {sc.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{report.description}</p>

          {/* Processing bar */}
          {report.status === "processing" && report.progress !== undefined && (
            <div className="mt-2 space-y-1">
              <Progress value={report.progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">{report.progress}% complete</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {fmtDate(report.requestedAt)} · {fmtTime(report.requestedAt)}
            </span>
            <Badge variant="outline" className="text-xs capitalize">{tc.label}</Badge>
            <Badge variant="outline" className="text-xs font-mono">{report.format}</Badge>
            {report.size && <span className="text-xs text-muted-foreground">{report.size}</span>}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      {report.status === "completed" && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            variant="outline" size="sm"
            className="flex-1 gap-1.5 text-xs hover:border-primary hover:text-primary"
            onClick={() => onDownload(report)}
          >
            <Download className="h-3.5 w-3.5" /> Download {report.format}
          </Button>
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 text-xs"
            onClick={() => toast.info("Print initiated")}
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 text-xs"
            onClick={() => toast.info("Share link copied")}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

/* ─── Analytics Panel ─────────────────────────────────────────────────── */
function AnalyticsPanel() {
  const advisors    = mockUsers.filter(u => u.role === "advisor")
  const evaluators  = mockUsers.filter(u => u.role === "evaluator")
  const avgGrade    = mockGrades.length > 0
    ? (mockGrades.reduce((s, g) => s + g.finalScore, 0) / mockGrades.length).toFixed(1)
    : "—"
  const passRate    = mockGrades.length > 0
    ? Math.round((mockGrades.filter(g => g.finalScore >= 50).length / mockGrades.length) * 100)
    : 0
  const aGrades     = mockGrades.filter(g => ["A+","A","A-"].includes(g.grade)).length
  const provisional = mockGrades.filter(g => g.status === "provisional").length
  const inProgress  = mockProjects.filter(p => p.status === "in_progress").length
  const completed   = mockProjects.filter(p => p.status === "completed").length
  const pendingEvals = mockEvaluations.filter(e => e.status === "pending").length

  const gradeGroups = [
    { label: "A (≥85)",  count: mockGrades.filter(g => g.finalScore >= 85).length },
    { label: "B (70–84)", count: mockGrades.filter(g => g.finalScore >= 70 && g.finalScore < 85).length },
    { label: "C (55–69)", count: mockGrades.filter(g => g.finalScore >= 55 && g.finalScore < 70).length },
    { label: "F (<55)",   count: mockGrades.filter(g => g.finalScore < 55).length },
  ]

  const projectStatus = [
    { label: "In Progress", count: inProgress,             pct: mockProjects.length > 0 ? Math.round((inProgress / mockProjects.length) * 100) : 0 },
    { label: "Completed",   count: completed,              pct: mockProjects.length > 0 ? Math.round((completed  / mockProjects.length) * 100) : 0 },
    { label: "Pending",     count: mockProjects.length - inProgress - completed, pct: 0 },
  ]
  projectStatus[2].pct = 100 - projectStatus[0].pct - projectStatus[1].pct

  return (
    <div className="grid gap-5 lg:grid-cols-3">

      {/* Grade Summary */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Grade Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: "Avg Score",    value: `${avgGrade}%` },
              { label: "Pass Rate",    value: `${passRate}%` },
              { label: "A Grades",     value: aGrades },
              { label: "Provisional",  value: provisional },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-muted/40 py-2">
                <p className="text-base font-bold text-primary">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Distribution</p>
            {gradeGroups.map(g => {
              const pct = mockGrades.length > 0 ? Math.round((g.count / mockGrades.length) * 100) : 0
              return (
                <div key={g.label} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground shrink-0">{g.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-semibold text-primary w-6 text-right">{g.count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project Summary */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" /> Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: "Total",       value: mockProjects.length },
              { label: "In Progress", value: inProgress },
              { label: "Completed",   value: completed },
              { label: "Advisors",    value: advisors.length },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-muted/40 py-2">
                <p className="text-base font-bold text-primary">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Status Breakdown</p>
            {projectStatus.map(s => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-muted-foreground shrink-0">{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="font-semibold text-primary w-5 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Summary */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Evaluation Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: "Total Evals",   value: mockEvaluations.length },
              { label: "Pending",       value: pendingEvals,          warn: pendingEvals > 0 },
              { label: "Submitted",     value: mockEvaluations.filter(e => e.status === "submitted").length },
              { label: "Evaluators",    value: evaluators.length },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-muted/40 py-2">
                <p className={`text-base font-bold ${"warn" in m && m.warn ? "text-destructive" : "text-primary"}`}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">By Status</p>
            {(["pending","submitted","reviewed"] as const).map(s => {
              const count = mockEvaluations.filter(e => e.status === s).length
              const pct   = mockEvaluations.length > 0 ? Math.round((count / mockEvaluations.length) * 100) : 0
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground shrink-0 capitalize">{s}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${s === "pending" ? "bg-destructive/60" : "bg-primary/60"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-semibold text-primary w-5 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const [reports, setReports]       = useState<ReportRecord[]>(SEED_REPORTS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDefaults, setDialogDefaults] = useState<{ type?: string; title?: string; desc?: string }>({})
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const completed   = reports.filter(r => r.status === "completed").length
  const processing  = reports.filter(r => r.status === "processing").length
  const pending     = reports.filter(r => r.status === "pending").length
  const failed      = reports.filter(r => r.status === "failed").length

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const q = search.toLowerCase()
      const matchSearch = !search || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || r.status === statusFilter
      const matchType   = typeFilter   === "all" || r.type   === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [reports, search, statusFilter, typeFilter])

  const openGenerate = (type?: string, title?: string, desc?: string) => {
    setDialogDefaults({ type, title, desc })
    setDialogOpen(true)
  }

  const handleGenerate = (r: ReportRecord) => setReports(prev => [r, ...prev])

  const handleDownload = (r: ReportRecord) => {
    const content = [
      `REPORT: ${r.title}`,
      `Type: ${r.type}  |  Format: ${r.format}  |  Date: ${fmtDate(r.requestedAt)}`,
      `Description: ${r.description}`,
      ``,
      `[Report content would be generated server-side in production]`,
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `${r.title.replace(/\s+/g,"_")}.txt`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
    toast.success("Download Started", { description: `${r.title} (${r.format})` })
  }

  const QUICK_REPORTS = [
    { type: "grades",      title: "Grade Summary Report",        desc: "Comprehensive overview of all student grades and statistics",    icon: GraduationCap, label: "Grade Report" },
    { type: "projects",    title: "Project Status Report",       desc: "Current status and progress of all active and completed projects", icon: FolderKanban,  label: "Project Report" },
    { type: "evaluations", title: "Evaluation Analytics",        desc: "Evaluator performance metrics, submission rates, and scores",    icon: ClipboardList, label: "Evaluation Report" },
    { type: "advisors",    title: "Advisor Performance Summary", desc: "Per-advisor workload, progress stats, and pending evaluations",   icon: Users,         label: "Advisor Report" },
    { type: "custom",      title: "",                            desc: "",                                                               icon: Plus,          label: "Custom Report" },
  ]

  const kpi = [
    { label: "Completed",   value: completed,  icon: CheckCircle2, bg: "bg-primary/10",  color: "text-primary" },
    { label: "Processing",  value: processing, icon: Activity,     bg: "bg-muted",       color: "text-foreground" },
    { label: "Pending",     value: pending,    icon: Clock,        bg: "bg-muted",       color: "text-muted-foreground" },
    { label: "Failed",      value: failed,     icon: AlertCircle,  bg: failed > 0 ? "bg-destructive/10" : "bg-muted", color: failed > 0 ? "text-destructive" : "text-muted-foreground" },
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
              Reports & Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Generate, manage, and download department reports
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          <Button size="sm" className="gap-1.5" onClick={() => openGenerate()}>
            <Plus className="h-4 w-4" /> New Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Tabs */}
      <Tabs defaultValue="generate" className="space-y-5">
        <TabsList className="h-10">
          <TabsTrigger value="generate"   className="gap-2"><Plus className="h-4 w-4" /> Generate</TabsTrigger>
          <TabsTrigger value="history"    className="gap-2"><FileText className="h-4 w-4" /> History</TabsTrigger>
          <TabsTrigger value="analytics"  className="gap-2"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
        </TabsList>

        {/* ── Generate Tab ── */}
        <TabsContent value="generate">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {QUICK_REPORTS.map(qr => {
              const Icon = qr.icon
              const isCustom = qr.type === "custom"
              return (
                <button
                  key={qr.type}
                  onClick={() => openGenerate(qr.type, qr.title, qr.desc)}
                  className={`group rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.02] ${
                    isCustom ? "border-dashed" : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{qr.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {isCustom ? "Build a fully custom report with your own parameters" : qr.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary font-medium mt-auto">
                      Generate <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Recent completed — quick re-download */}
          {reports.filter(r => r.status === "completed").length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Star className="h-4 w-4" /> Ready to Download
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reports.filter(r => r.status === "completed").slice(0, 3).map(r => {
                  const tc = TYPE_CFG[r.type]
                  const Icon = tc.icon
                  return (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary/20 transition-all">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.format} · {r.size}</p>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                        onClick={() => handleDownload(r)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="space-y-4">
          {/* Search + filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports…"
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 w-44 shrink-0">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="grades">Grades</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="evaluations">Evaluations</SelectItem>
                <SelectItem value="advisors">Advisors</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== "all" || typeFilter !== "all") && (
              <Button variant="ghost" size="sm" className="h-10 text-xs shrink-0"
                onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all") }}>
                Clear
              </Button>
            )}
          </div>

          {(search || statusFilter !== "all" || typeFilter !== "all") && (
            <p className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No reports match your filters</p>
              <Button size="sm" className="mt-4 gap-1.5" onClick={() => openGenerate()}>
                <Plus className="h-4 w-4" /> Generate Report
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(r => (
                <ReportCard key={r.id} report={r} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics" className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Live data derived from current records</p>
            <Button
              variant="outline" size="sm" className="gap-1.5 text-xs"
              onClick={() => openGenerate("custom", "Full Analytics Report", "Export all analytics data as a detailed report")}
            >
              <Download className="h-3.5 w-3.5" /> Export All Analytics
            </Button>
          </div>
          <AnalyticsPanel />

          {/* Key metrics strip */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Key Metrics at a Glance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Students",     value: mockUsers.filter(u => u.role === "student" || u.role === "group_manager").length, icon: GraduationCap },
                  { label: "Active Advisors",    value: mockUsers.filter(u => u.role === "advisor").length,    icon: Users },
                  { label: "Active Evaluators",  value: mockUsers.filter(u => u.role === "evaluator").length,  icon: Star },
                  { label: "Avg Project Progress", value: mockProjects.length > 0
                    ? `${Math.round(mockProjects.reduce((s, p) => s + (p.progress ?? 0), 0) / mockProjects.length)}%`
                    : "—",
                    icon: Activity
                  },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <m.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tracking-tight">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate dialog */}
      <GenerateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultType={dialogDefaults.type}
        defaultTitle={dialogDefaults.title}
        defaultDesc={dialogDefaults.desc}
        onGenerate={handleGenerate}
      />
    </div>
  )
}
