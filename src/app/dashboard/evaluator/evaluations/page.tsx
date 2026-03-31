"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Search,
  ClipboardCheck,
  Clock,
  Activity,
  Award,
  ChevronRight,
  Star,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

const MOCK_RUBRIC_CATEGORIES = [
  { key: "technical", label: "Technical Implementation", weight: 40, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "presentation", label: "Presentation Quality", weight: 20, color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "documentation", label: "Documentation", weight: 20, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "innovation", label: "Innovation & Impact", weight: 20, color: "text-amber-500", bg: "bg-amber-500/10" },
]

const mockEvaluations = [
  {
    id: "er1",
    projectTitle: "AI-Driven Academic Assistant",
    groupName: "AI Research Group",
    advisor: "Prof. Lisa Anderson",
    status: "pending" as const,
    dueDate: "2024-02-15",
    defenseDate: "2024-02-10T09:00:00Z",
    defenseRoom: "Room A-201",
    scores: { technical: 0, presentation: 0, documentation: 0, innovation: 0 },
    finalScore: 0,
    comments: "",
  },
  {
    id: "er2",
    projectTitle: "Real-Time Campus Analytics",
    groupName: "Data Analytics Team",
    advisor: "Dr. Michael Brown",
    status: "submitted" as const,
    dueDate: "2024-01-30",
    defenseDate: "2024-01-28T14:00:00Z",
    defenseRoom: "Room B-105",
    scores: { technical: 34, presentation: 17, documentation: 16, innovation: 18 },
    finalScore: 85,
    comments: "Good technical implementation with room for improvement in documentation.",
  },
  {
    id: "er3",
    projectTitle: "Secure Research Data Platform",
    groupName: "Security Systems",
    advisor: "Prof. Emily Davis",
    status: "in_progress" as const,
    dueDate: "2024-02-20",
    defenseDate: "2024-02-18T10:00:00Z",
    defenseRoom: "Room C-310",
    scores: { technical: 30, presentation: 0, documentation: 0, innovation: 0 },
    finalScore: 0,
    comments: "",
  },
  {
    id: "er4",
    projectTitle: "Smart Campus Navigation",
    groupName: "Mobile Dev Team",
    advisor: "Dr. Robert Taylor",
    status: "reviewed" as const,
    dueDate: "2024-01-20",
    defenseDate: "2024-01-18T11:00:00Z",
    defenseRoom: "Room A-101",
    scores: { technical: 37, presentation: 18, documentation: 19, innovation: 15 },
    finalScore: 89,
    comments: "Excellent mobile app with strong UX design. Navigation algorithm is impressive.",
  },
]

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-300", icon: Activity },
  submitted: { label: "Submitted", color: "bg-violet-500/10 text-violet-600 border-violet-300", icon: ClipboardCheck },
  reviewed: { label: "Reviewed", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300", icon: Award },
}

function EvaluationCard({ ev }: { ev: typeof mockEvaluations[0] }) {
  const sConfig = statusConfig[ev.status]
  const StatusIcon = sConfig.icon
  const scored = ev.finalScore > 0

  return (
    <Card className="group transition-all hover:shadow-md hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${sConfig.color.split(" ").slice(0, 2).join(" ")}`}>
            <StatusIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{ev.projectTitle}</h3>
                <p className="text-xs text-muted-foreground">{ev.groupName} · {ev.advisor}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {scored && (
                  <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1">
                    <Star className="h-3 w-3 text-violet-500" />
                    <span className="text-xs font-bold text-violet-600">{ev.finalScore}/100</span>
                  </div>
                )}
                <Badge className={`text-xs ${sConfig.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />{sConfig.label}
                </Badge>
              </div>
            </div>

            {scored && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {MOCK_RUBRIC_CATEGORIES.map(cat => (
                  <div key={cat.key} className={`rounded-lg ${cat.bg} px-2.5 py-2`}>
                    <p className={`text-sm font-bold ${cat.color}`}>{ev.scores[cat.key as keyof typeof ev.scores]}/{cat.weight}</p>
                    <p className="text-xs text-muted-foreground truncate">{cat.label.split(" ")[0]}</p>
                    <Progress value={(ev.scores[cat.key as keyof typeof ev.scores] / cat.weight) * 100} className="h-1 mt-1" />
                  </div>
                ))}
              </div>
            )}

            {ev.status === "in_progress" && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">
                    {Object.values(ev.scores).filter(v => v > 0).length}/{MOCK_RUBRIC_CATEGORIES.length} categories
                  </span>
                </div>
                <Progress value={(Object.values(ev.scores).filter(v => v > 0).length / MOCK_RUBRIC_CATEGORIES.length) * 100} className="h-1.5" />
              </div>
            )}

            {ev.comments && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-1 italic">&quot;{ev.comments}&quot;</p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Defense: {new Date(ev.defenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due: {new Date(ev.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <Link href={`/dashboard/evaluator/evaluations/${ev.id}`}>
                <Button size="sm" className={`h-8 gap-1.5 text-xs ${ev.status === "pending" || ev.status === "in_progress" ? "btn-gradient" : ""}`} variant={ev.status === "pending" || ev.status === "in_progress" ? "default" : "outline"}>
                  {ev.status === "pending" ? "Start Evaluation" : ev.status === "in_progress" ? "Continue" : "View Details"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EvaluationsListPage() {
  const [search, setSearch] = useState("")
  const [tabValue, setTabValue] = useState("all")

  const filtered = mockEvaluations.filter(e =>
    e.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
    e.groupName.toLowerCase().includes(search.toLowerCase())
  )

  const byStatus = (status: string) => filtered.filter(e => status === "all" || e.status === status)

  const stats = [
    { label: "Total Assigned", value: mockEvaluations.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending", value: mockEvaluations.filter(e => e.status === "pending").length, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "In Progress", value: mockEvaluations.filter(e => e.status === "in_progress").length, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Completed", value: mockEvaluations.filter(e => e.status === "submitted" || e.status === "reviewed").length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/evaluator">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">My Evaluations</h1>
          <p className="text-sm text-muted-foreground">Submit and manage your project evaluation scores</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rubric Reference Card */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Evaluation Rubric Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_RUBRIC_CATEGORIES.map(cat => (
              <div key={cat.key} className={`flex items-center gap-3 rounded-xl ${cat.bg} p-3`}>
                <div className={`h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0`}>
                  <span className={`text-lg font-bold ${cat.color}`}>{cat.weight}</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${cat.color}`}>{cat.weight}%</p>
                  <p className="text-xs text-muted-foreground">{cat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter + Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search evaluations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-4">
        <TabsList className="h-10">
          {[
            { value: "all", label: "All", count: mockEvaluations.length },
            { value: "pending", label: "Pending", count: mockEvaluations.filter(e => e.status === "pending").length },
            { value: "in_progress", label: "In Progress", count: mockEvaluations.filter(e => e.status === "in_progress").length },
            { value: "submitted", label: "Submitted", count: mockEvaluations.filter(e => e.status === "submitted").length },
            { value: "reviewed", label: "Reviewed", count: mockEvaluations.filter(e => e.status === "reviewed").length },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
              {tab.label}
              {tab.count > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{tab.count}</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", "pending", "in_progress", "submitted", "reviewed"].map(status => (
          <TabsContent key={status} value={status} className="space-y-3">
            {byStatus(status).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-muted-foreground">No evaluations found</p>
                </CardContent>
              </Card>
            ) : (
              byStatus(status).map(ev => <EvaluationCard key={ev.id} ev={ev} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
