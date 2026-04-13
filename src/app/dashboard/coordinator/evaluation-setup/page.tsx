"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  Filter,
  History,
  Scale,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type EvaluationPhase = "documentation" | "demonstration"
type EvaluatorType = "advisor" | "examiner"

interface RubricCriterion {
  id: string
  label: string
  weight: number
  evaluator: EvaluatorType
  phase: EvaluationPhase
  category: string
}

interface EvaluationHistoryItem {
  id: string
  projectTitle: string
  groupName: string
  phase: EvaluationPhase
  evaluator: string
  role: EvaluatorType
  action: "draft_saved" | "submitted" | "reviewed" | "adjusted"
  timestamp: string
  score: number
}

const DEFAULT_CRITERIA: RubricCriterion[] = [
  { id: "c1", label: "Problem definition and scope", weight: 15, evaluator: "advisor", phase: "documentation", category: "Proposal Quality" },
  { id: "c2", label: "Literature review and references", weight: 10, evaluator: "advisor", phase: "documentation", category: "Proposal Quality" },
  { id: "c3", label: "Methodology and feasibility", weight: 15, evaluator: "advisor", phase: "documentation", category: "Proposal Quality" },
  { id: "c4", label: "Implementation quality", weight: 20, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
  { id: "c5", label: "UI and user workflow", weight: 10, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
  { id: "c6", label: "Exception handling and resilience", weight: 10, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
  { id: "c7", label: "Defense presentation and Q&A", weight: 20, evaluator: "examiner", phase: "demonstration", category: "Defense Performance" },
]

const INITIAL_HISTORY: EvaluationHistoryItem[] = [
  { id: "h1", projectTitle: "AI-Driven Academic Assistant", groupName: "AI Research Group", phase: "documentation", evaluator: "Prof. Lisa Anderson", role: "advisor", action: "submitted", timestamp: "2026-03-28 09:30", score: 36 },
  { id: "h2", projectTitle: "AI-Driven Academic Assistant", groupName: "AI Research Group", phase: "documentation", evaluator: "Dr. David Martinez", role: "examiner", action: "reviewed", timestamp: "2026-03-29 13:10", score: 41 },
  { id: "h3", projectTitle: "Campus Energy Monitoring Dashboard", groupName: "Data Analytics Team", phase: "demonstration", evaluator: "Dr. Robert Taylor", role: "advisor", action: "adjusted", timestamp: "2026-03-31 16:45", score: 28 },
  { id: "h4", projectTitle: "Smart Campus Navigation System", groupName: "Mobile Dev Team", phase: "demonstration", evaluator: "Dr. Michael Brown", role: "examiner", action: "draft_saved", timestamp: "2026-04-01 08:05", score: 34 },
]

const ACTION_LABELS: Record<EvaluationHistoryItem["action"], string> = {
  draft_saved: "Draft Saved",
  submitted: "Submitted",
  reviewed: "Reviewed",
  adjusted: "Adjusted",
}

export default function EvaluationSetupPage() {
  const [criteria, setCriteria] = useState<RubricCriterion[]>(DEFAULT_CRITERIA)
  const [advisorWeight, setAdvisorWeight] = useState(40)
  const [examinerWeight, setExaminerWeight] = useState(60)
  const [historySearch, setHistorySearch] = useState("")
  const [historyRoleFilter, setHistoryRoleFilter] = useState<EvaluatorType | "all">("all")
  const [policyNote, setPolicyNote] = useState(
    "One instructor can be advisor or examiner, but not both for the same project. Keep documentation and demonstration rubrics balanced by phase."
  )

  const totalWeight = advisorWeight + examinerWeight
  const advisorCriteria = criteria.filter((item) => item.evaluator === "advisor")
  const examinerCriteria = criteria.filter((item) => item.evaluator === "examiner")
  const advisorCriteriaTotal = advisorCriteria.reduce((sum, item) => sum + item.weight, 0)
  const examinerCriteriaTotal = examinerCriteria.reduce((sum, item) => sum + item.weight, 0)

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase()
    return INITIAL_HISTORY.filter((item) => {
      const matchesQuery =
        !q ||
        item.projectTitle.toLowerCase().includes(q) ||
        item.groupName.toLowerCase().includes(q) ||
        item.evaluator.toLowerCase().includes(q)
      const matchesRole = historyRoleFilter === "all" || item.role === historyRoleFilter
      return matchesQuery && matchesRole
    })
  }, [historyRoleFilter, historySearch])

  const handleWeightChange = (role: EvaluatorType, value: number) => {
    if (role === "advisor") {
      setAdvisorWeight(value)
      setExaminerWeight(100 - value)
    } else {
      setExaminerWeight(value)
      setAdvisorWeight(100 - value)
    }
  }

  const updateCriterionWeight = (id: string, nextWeight: number) => {
    setCriteria((current) => current.map((item) => (item.id === id ? { ...item, weight: nextWeight } : item)))
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Evaluation Setup
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure rubrics, advisor and examiner weights, and review evaluation activity
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-11 sm:pl-0">
          <Badge variant="outline" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> {criteria.length} rubric criteria
          </Badge>
          <Badge className="gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <Scale className="h-3.5 w-3.5" /> {advisorWeight}:{examinerWeight} split
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Advisor Weight", value: `${advisorWeight}%`, icon: Users },
          { label: "Examiner Weight", value: `${examinerWeight}%`, icon: ClipboardCheck },
          { label: "History Events", value: filteredHistory.length, icon: History },
          { label: "Policy Health", value: totalWeight === 100 ? "Balanced" : "Review", icon: totalWeight === 100 ? CheckCircle2 : AlertTriangle },
        ].map((item) => (
          <Card key={item.label} className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tracking-tight">{item.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="weights" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="weights" className="gap-1.5 text-xs"><Scale className="h-3.5 w-3.5" /> Weights</TabsTrigger>
          <TabsTrigger value="rubric" className="gap-1.5 text-xs"><Target className="h-3.5 w-3.5" /> Rubric Setup</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs"><History className="h-3.5 w-3.5" /> History</TabsTrigger>
          <TabsTrigger value="policy" className="gap-1.5 text-xs"><ShieldAlert className="h-3.5 w-3.5" /> Policy Guard</TabsTrigger>
        </TabsList>

        <TabsContent value="weights">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Role Weight Configuration</CardTitle>
                <CardDescription>UI-only controls for the final score contribution of advisor and examiner roles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Advisor weight</span>
                    <span className="font-semibold text-primary">{advisorWeight}%</span>
                  </div>
                  <Slider value={[advisorWeight]} min={10} max={90} step={5} onValueChange={([value]) => handleWeightChange("advisor", value)} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Examiner weight</span>
                    <span className="font-semibold text-primary">{examinerWeight}%</span>
                  </div>
                  <Slider value={[examinerWeight]} min={10} max={90} step={5} onValueChange={([value]) => handleWeightChange("examiner", value)} />
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total weight</span>
                    <span className={`font-semibold ${totalWeight === 100 ? "text-primary" : "text-destructive"}`}>{totalWeight}%</span>
                  </div>
                  <Progress value={totalWeight} className="mt-3 h-2" />
                </div>
                <Button
                  className="gap-2"
                  onClick={() => toast.success("Weight profile saved", { description: `Advisor ${advisorWeight}% and examiner ${examinerWeight}% were stored in the UI preset.` })}
                >
                  <BadgeCheck className="h-4 w-4" /> Save weight profile
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-base">Recommended Split</CardTitle>
                <CardDescription>Suggested CCI-style balance between mentorship and defense scoring.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border bg-primary/5 px-3 py-2">
                  <p className="font-medium">Capstone I</p>
                  <p className="text-muted-foreground mt-1">Favor advisor input more heavily for proposal and documentation quality.</p>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                  <p className="font-medium">Capstone II</p>
                  <p className="text-muted-foreground mt-1">Increase examiner share for live defense and implementation evidence.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rubric">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Rubric Criteria by Role</CardTitle>
                <CardDescription>Define category labels, phase targeting, and criterion weights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="rounded-xl border bg-background p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{criterion.label}</p>
                        <p className="text-xs text-muted-foreground">{criterion.category} · {criterion.phase} · {criterion.evaluator}</p>
                      </div>
                      <Badge variant="outline">{criterion.weight}%</Badge>
                    </div>
                    <Slider value={[criterion.weight]} min={5} max={30} step={5} onValueChange={([value]) => updateCriterionWeight(criterion.id, value)} />
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toast.success("Rubric preset updated", { description: "Criterion weights were updated in the coordinator UI." })}
                >
                  <Sparkles className="h-4 w-4" /> Save rubric setup
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-base">Role Totals</CardTitle>
                <CardDescription>Quick check for rubric balance before publishing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Advisor criteria total", value: advisorCriteriaTotal, target: advisorWeight },
                  { label: "Examiner criteria total", value: examinerCriteriaTotal, target: examinerWeight },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span className={`font-semibold ${item.value === item.target ? "text-primary" : "text-amber-700"}`}>
                        {item.value}% / {item.target}%
                      </span>
                    </div>
                    <Progress value={(item.value / Math.max(item.target, 1)) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search evaluation history..." className="pl-9" />
                  </div>
                  <Select value={historyRoleFilter} onValueChange={(value) => setHistoryRoleFilter(value as EvaluatorType | "all")}>
                    <SelectTrigger className="w-full md:w-44">
                      <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                      <SelectItem value="examiner">Examiner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Evaluation History</CardTitle>
                <CardDescription>Timeline of UI-visible evaluator and advisor actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredHistory.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Separator className="mb-3" />}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{item.projectTitle}</p>
                        <p className="text-sm text-muted-foreground">{item.groupName} · {item.evaluator}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{item.phase}</Badge>
                          <Badge variant="outline">{item.role}</Badge>
                          <Badge variant="outline">{ACTION_LABELS[item.action]}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-primary">{item.score}%</p>
                        <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policy">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Advisor vs Examiner Guardrail</CardTitle>
                <CardDescription>UI-only policy note to avoid assigning the same instructor twice on one project.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Conflict policy</p>
                      <p className="mt-1">One instructor can be advisor or examiner, but not both for the same project. Use this note to guide assignment and review decisions until backend enforcement is added.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-note">Coordinator policy note</Label>
                  <Textarea id="policy-note" value={policyNote} onChange={(event) => setPolicyNote(event.target.value)} className="min-h-[120px] resize-none" />
                </div>
                <Button className="gap-2" onClick={() => toast.success("Policy guidance saved", { description: "The coordinator-side UI note was updated." })}>
                  <CheckCircle2 className="h-4 w-4" /> Save policy note
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-base">Visibility Checklist</CardTitle>
                <CardDescription>Recommended places to surface this rule in the UI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "Project assignment dialog for coordinators",
                  "Evaluator detail forms during submission",
                  "Grade management breakdown and review sheets",
                  "Coordinator audit and history views",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-lg bg-muted/20 px-3 py-2">
                    <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
