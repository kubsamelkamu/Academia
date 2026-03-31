"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  BarChart3,
  Download,
  Star,
  Target,
  Award,
  TrendingUp,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Activity,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const RUBRIC = [
  { key: "technical", label: "Technical Implementation", weight: 40, color: "text-blue-500", bg: "bg-blue-500" },
  { key: "presentation", label: "Presentation Quality", weight: 20, color: "text-violet-500", bg: "bg-violet-500" },
  { key: "documentation", label: "Documentation", weight: 20, color: "text-emerald-500", bg: "bg-emerald-500" },
  { key: "innovation", label: "Innovation & Impact", weight: 20, color: "text-amber-500", bg: "bg-amber-500" },
]

const EVALUATIONS = [
  { projectTitle: "Real-Time Campus Analytics", groupName: "Data Analytics Team", scores: { technical: 34, presentation: 17, documentation: 16, innovation: 18 }, finalScore: 85, status: "submitted" },
  { projectTitle: "Smart Campus Navigation", groupName: "Mobile Dev Team", scores: { technical: 37, presentation: 18, documentation: 19, innovation: 15 }, finalScore: 89, status: "reviewed" },
]

export default function EvaluatorReportsPage() {
  const avgScore = useMemo(() => {
    if (EVALUATIONS.length === 0) return 0
    return Math.round(EVALUATIONS.reduce((s, e) => s + e.finalScore, 0) / EVALUATIONS.length)
  }, [])

  const rubricAverages = useMemo(() => {
    return RUBRIC.map(cat => {
      const avg = EVALUATIONS.length > 0
        ? Math.round(EVALUATIONS.reduce((s, e) => s + e.scores[cat.key as keyof typeof e.scores], 0) / EVALUATIONS.length)
        : 0
      return { ...cat, avg, pct: Math.round((avg / cat.weight) * 100) }
    })
  }, [])

  const scoreDistribution = useMemo(() => {
    const bands = [
      { label: "90–100 (Excellent)", min: 90, max: 100, color: "bg-emerald-500" },
      { label: "80–89 (Very Good)", min: 80, max: 89, color: "bg-blue-500" },
      { label: "70–79 (Good)", min: 70, max: 79, color: "bg-violet-500" },
      { label: "60–69 (Satisfactory)", min: 60, max: 69, color: "bg-amber-500" },
      { label: "< 60 (Needs Work)", min: 0, max: 59, color: "bg-rose-500" },
    ]
    return bands.map(b => ({
      ...b,
      count: EVALUATIONS.filter(e => e.finalScore >= b.min && e.finalScore <= b.max).length,
      pct: EVALUATIONS.length > 0
        ? Math.round((EVALUATIONS.filter(e => e.finalScore >= b.min && e.finalScore <= b.max).length / EVALUATIONS.length) * 100)
        : 0,
    }))
  }, [])

  const handleExport = (format: string) => {
    toast.success(`Exporting report`, { description: `Your evaluation report is being exported as ${format}.` })
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/evaluator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Evaluation Reports</h1>
            <p className="text-sm text-muted-foreground">Summary of your evaluation activity and scoring analytics</p>
          </div>
        </div>
        <div className="flex gap-2 pl-11 sm:pl-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("PDF")}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("CSV")}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Evaluations Submitted", value: EVALUATIONS.length, icon: ClipboardCheck, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Average Score", value: `${avgScore}%`, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Highest Score", value: `${Math.max(...EVALUATIONS.map(e => e.finalScore))}%`, icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Pass Rate", value: `${Math.round((EVALUATIONS.filter(e => e.finalScore >= 60).length / EVALUATIONS.length) * 100)}%`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map(s => (
          <div key={s.label} className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} opacity-20`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{s.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Rubric Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Rubric Category Averages
            </CardTitle>
            <CardDescription>Your average scores per evaluation criterion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rubricAverages.map(cat => (
              <div key={cat.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${cat.color}`}>{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{cat.avg}/{cat.weight}</span>
                    <Badge variant="outline" className={`text-xs ${cat.color}`}>{cat.pct}%</Badge>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${cat.bg} opacity-70 transition-all`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Overall Average</span>
              <span className="text-lg font-bold text-violet-600">{avgScore}/100</span>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Score Distribution
            </CardTitle>
            <CardDescription>Breakdown of scores across grading bands</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scoreDistribution.map(band => (
              <div key={band.label} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${band.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground truncate">{band.label}</span>
                    <span className="font-medium shrink-0 ml-2">{band.count} project{band.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${band.color} opacity-70 rounded-full transition-all`} style={{ width: `${band.pct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-medium w-10 text-right text-muted-foreground">{band.pct}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Individual Evaluation Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Completed Evaluations
          </CardTitle>
          <CardDescription>Detailed breakdown of each submitted evaluation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EVALUATIONS.map((ev, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{ev.projectTitle}</h3>
                  <p className="text-sm text-muted-foreground">{ev.groupName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1">
                    <Star className="h-3 w-3 text-violet-500" />
                    <span className="text-sm font-bold text-violet-600">{ev.finalScore}/100</span>
                  </div>
                  <Badge className={`text-xs ${ev.status === "reviewed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-300" : "bg-violet-500/10 text-violet-600 border-violet-300"}`}>
                    {ev.status === "reviewed" ? "Reviewed" : "Submitted"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RUBRIC.map(cat => (
                  <div key={cat.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${cat.color}`}>{cat.label.split(" ")[0]}</span>
                      <span className="text-muted-foreground">{ev.scores[cat.key as keyof typeof ev.scores]}/{cat.weight}</span>
                    </div>
                    <Progress value={(ev.scores[cat.key as keyof typeof ev.scores] / cat.weight) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {EVALUATIONS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No evaluations submitted yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
