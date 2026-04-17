"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookmarkCheck,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Scale,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api/errors"
import {
  getCoordinatorEvaluationWeights,
  updateCoordinatorEvaluationWeights,
  type CoordinatorEvaluationStage,
} from "@/lib/api/coordinator-evaluations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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

interface WeightDraft {
  advisorWeight: number
  examinerWeight: number
}

const DEFAULT_CRITERIA_BY_STAGE: Record<CoordinatorEvaluationStage, RubricCriterion[]> = {
  CAPSTONE_I: [
    { id: "c1", label: "Problem definition and scope", weight: 15, evaluator: "advisor", phase: "documentation", category: "Proposal Quality" },
    { id: "c2", label: "Literature review and references", weight: 10, evaluator: "advisor", phase: "documentation", category: "Proposal Quality" },
    { id: "c3", label: "Methodology and feasibility", weight: 15, evaluator: "advisor", phase: "documentation", category: "Proposal Quality" },
    { id: "c4", label: "Implementation quality", weight: 20, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
    { id: "c5", label: "UI and user workflow", weight: 10, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
    { id: "c6", label: "Exception handling and resilience", weight: 10, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
    { id: "c7", label: "Defense presentation and Q&A", weight: 20, evaluator: "examiner", phase: "demonstration", category: "Defense Performance" },
  ],
  CAPSTONE_II: [
    { id: "c1", label: "Implementation completeness", weight: 15, evaluator: "advisor", phase: "documentation", category: "Delivery Quality" },
    { id: "c2", label: "Testing and validation evidence", weight: 10, evaluator: "advisor", phase: "documentation", category: "Delivery Quality" },
    { id: "c3", label: "Final report and deployment readiness", weight: 10, evaluator: "advisor", phase: "documentation", category: "Delivery Quality" },
    { id: "c4", label: "Defense execution and live demo", weight: 20, evaluator: "examiner", phase: "demonstration", category: "Defense Performance" },
    { id: "c5", label: "Technical depth during Q&A", weight: 15, evaluator: "examiner", phase: "demonstration", category: "Defense Performance" },
    { id: "c6", label: "System robustness and usability", weight: 15, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
    { id: "c7", label: "Project impact and completion quality", weight: 15, evaluator: "examiner", phase: "demonstration", category: "Technical Execution" },
  ],
}

const DEFAULT_POLICY_NOTES: Record<CoordinatorEvaluationStage, string> = {
  CAPSTONE_I:
    "One instructor can be advisor or evaluator, but not both for the same project. Keep documentation and demonstration rubrics balanced by phase.",
  CAPSTONE_II:
    "One instructor can be advisor or evaluator, but not both for the same project. For Capstone II, keep the submit path final and ensure evaluator weighting reflects defense evidence.",
}

function normalizeStageQuery(value: string | null): CoordinatorEvaluationStage {
  const normalized = value?.trim().toLowerCase()

  if (normalized === "capstone-ii" || normalized === "capstone_ii") {
    return "CAPSTONE_II"
  }

  return "CAPSTONE_I"
}

function formatStageLabel(stage: CoordinatorEvaluationStage) {
  return stage === "CAPSTONE_II" ? "Capstone II" : "Capstone I"
}

function stageQueryValue(stage: CoordinatorEvaluationStage) {
  return stage === "CAPSTONE_II" ? "capstone-ii" : "capstone-i"
}

function evaluatorRoleLabel(role: EvaluatorType) {
  return role === "examiner" ? "evaluator" : role
}

export default function EvaluationSetupPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const selectedStage = useMemo(
    () => normalizeStageQuery(searchParams.get("stage")),
    [searchParams],
  )
  const [criteriaByStage, setCriteriaByStage] = useState<Record<CoordinatorEvaluationStage, RubricCriterion[]>>(
    DEFAULT_CRITERIA_BY_STAGE,
  )
  const [weightDrafts, setWeightDrafts] = useState<Partial<Record<CoordinatorEvaluationStage, WeightDraft>>>({})
  const [policyNotes, setPolicyNotes] = useState<Record<CoordinatorEvaluationStage, string>>(DEFAULT_POLICY_NOTES)

  const criteria = criteriaByStage[selectedStage]
  const policyNote = policyNotes[selectedStage]

  const setSelectedStage = (stage: CoordinatorEvaluationStage) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("stage", stageQueryValue(stage))
    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  const weightsQuery = useQuery({
    queryKey: ["coordinator", "evaluation-weights", selectedStage],
    queryFn: () => getCoordinatorEvaluationWeights(selectedStage),
    staleTime: 30_000,
    retry: 1,
  })

  const saveWeightsMutation = useMutation({
    mutationFn: updateCoordinatorEvaluationWeights,
    onSuccess: (data) => {
      queryClient.setQueryData(["coordinator", "evaluation-weights", data.stage], data)
      setWeightDrafts((current) => ({
        ...current,
        [data.stage]: {
          advisorWeight: data.advisorPercentage,
          examinerWeight: data.evaluatorPercentage,
        },
      }))
      toast.success("Weight profile saved", {
        description: `${formatStageLabel(data.stage)} weights updated to advisor ${data.advisorPercentage}% and evaluator ${data.evaluatorPercentage}%.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to save weight profile", {
        description: getErrorMessage(error, "Please try again."),
      })
    },
  })

  const advisorWeight = weightDrafts[selectedStage]?.advisorWeight ?? weightsQuery.data?.advisorPercentage ?? 40
  const examinerWeight = weightDrafts[selectedStage]?.examinerWeight ?? weightsQuery.data?.evaluatorPercentage ?? 60

  const totalWeight = advisorWeight + examinerWeight
  const advisorCriteria = criteria.filter((item) => item.evaluator === "advisor")
  const examinerCriteria = criteria.filter((item) => item.evaluator === "examiner")
  const advisorCriteriaTotal = advisorCriteria.reduce((sum, item) => sum + item.weight, 0)
  const examinerCriteriaTotal = examinerCriteria.reduce((sum, item) => sum + item.weight, 0)

  const handleWeightChange = (role: EvaluatorType, value: number) => {
    if (role === "advisor") {
      setWeightDrafts((current) => ({
        ...current,
        [selectedStage]: {
          advisorWeight: value,
          examinerWeight: 100 - value,
        },
      }))
    } else {
      setWeightDrafts((current) => ({
        ...current,
        [selectedStage]: {
          advisorWeight: 100 - value,
          examinerWeight: value,
        },
      }))
    }
  }

  const updateCriterionWeight = (id: string, nextWeight: number) => {
    setCriteriaByStage((current) => ({
      ...current,
      [selectedStage]: current[selectedStage].map((item) => (item.id === id ? { ...item, weight: nextWeight } : item)),
    }))
  }

  const handleSaveWeightProfile = () => {
    if (totalWeight !== 100) {
      toast.error("Weight total must equal 100%")
      return
    }

    saveWeightsMutation.mutate({
      stage: selectedStage,
      advisorPercentage: advisorWeight,
      evaluatorPercentage: examinerWeight,
    })
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
              Configure rubrics, advisor and evaluator weights, and review evaluation activity for {formatStageLabel(selectedStage)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-11 sm:pl-0">
          <Badge variant="outline" className="gap-1.5">
            <BookmarkCheck className="h-3.5 w-3.5" /> {formatStageLabel(selectedStage)}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> {criteria.length} rubric criteria
          </Badge>
          <Badge className="gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <Scale className="h-3.5 w-3.5" /> {advisorWeight}:{examinerWeight} split
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {[
          { label: "Advisor Weight", value: `${advisorWeight}%`, icon: Users },
          { label: "Evaluator Weight", value: `${examinerWeight}%`, icon: ClipboardCheck },
          { label: "Policy Health", value: totalWeight === 100 ? "Balanced" : "Review", icon: totalWeight === 100 ? CheckCircle2 : AlertTriangle },
        ].map((item) => (
          <Card key={item.label} className="border-none shadow-sm">
            <CardContent className="flex min-h-28 items-start gap-4 p-4 sm:min-h-32 sm:items-center sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Evaluation Stage</CardTitle>
          <CardDescription>Switch between Capstone I and Capstone II weight profiles without leaving the coordinator setup workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStage} onValueChange={(value) => setSelectedStage(value as CoordinatorEvaluationStage)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="CAPSTONE_I">Capstone I</TabsTrigger>
              <TabsTrigger value="CAPSTONE_II">Capstone II</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Tabs defaultValue="weights" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
          <TabsTrigger
            value="weights"
            className="h-11 gap-1.5 rounded-lg border border-border/60 bg-background px-4 text-xs shadow-sm transition-all data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Scale className="h-3.5 w-3.5" /> Weights
          </TabsTrigger>
          <TabsTrigger
            value="rubric"
            className="h-11 gap-1.5 rounded-lg border border-border/60 bg-background px-4 text-xs shadow-sm transition-all data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Target className="h-3.5 w-3.5" /> Rubric Setup
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="h-11 gap-1.5 rounded-lg border border-border/60 bg-background px-4 text-xs shadow-sm transition-all data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Policy Guard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weights">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Role Weight Configuration</CardTitle>
                <CardDescription>{formatStageLabel(selectedStage)} role weights are loaded from and saved to the backend configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Advisor weight</span>
                    <span className="font-semibold text-primary">{advisorWeight}%</span>
                  </div>
                  <Slider value={[advisorWeight]} min={10} max={90} step={5} onValueChange={([value]) => handleWeightChange("advisor", value)} disabled={saveWeightsMutation.isPending || weightsQuery.isLoading} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Evaluator weight</span>
                    <span className="font-semibold text-primary">{examinerWeight}%</span>
                  </div>
                  <Slider value={[examinerWeight]} min={10} max={90} step={5} onValueChange={([value]) => handleWeightChange("examiner", value)} disabled={saveWeightsMutation.isPending || weightsQuery.isLoading} />
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
                  onClick={handleSaveWeightProfile}
                  disabled={saveWeightsMutation.isPending || weightsQuery.isLoading}
                >
                  <BadgeCheck className="h-4 w-4" /> {saveWeightsMutation.isPending ? "Saving weight profile..." : "Save weight profile"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-base">Recommended Split</CardTitle>
                <CardDescription>Suggested balance between mentorship scoring and evaluator defense scoring for {formatStageLabel(selectedStage)}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border bg-primary/5 px-3 py-2">
                  <p className="font-medium">Capstone I</p>
                  <p className="text-muted-foreground mt-1">Favor advisor input more heavily for proposal and documentation quality.</p>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                  <p className="font-medium">Capstone II</p>
                  <p className="text-muted-foreground mt-1">Increase evaluator share for live defense evidence and final system delivery.</p>
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
                        <p className="text-xs text-muted-foreground">{criterion.category} · {criterion.phase} · {evaluatorRoleLabel(criterion.evaluator)}</p>
                      </div>
                      <Badge variant="outline">{criterion.weight}%</Badge>
                    </div>
                    <Slider value={[criterion.weight]} min={5} max={30} step={5} onValueChange={([value]) => updateCriterionWeight(criterion.id, value)} />
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toast.success("Rubric preset updated", { description: `${formatStageLabel(selectedStage)} criterion weights were updated in the coordinator UI.` })}
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
                  { label: "Evaluator criteria total", value: examinerCriteriaTotal, target: examinerWeight },
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

        <TabsContent value="policy">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Advisor vs Evaluator Guardrail</CardTitle>
                <CardDescription>UI-only policy note to avoid assigning the same instructor twice on one project.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Conflict policy</p>
                      <p className="mt-1">One instructor can be advisor or evaluator, but not both for the same project. Use this note to guide assignment and review decisions until backend enforcement is added.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-note">Coordinator policy note</Label>
                  <Textarea
                    id="policy-note"
                    value={policyNote}
                    onChange={(event) =>
                      setPolicyNotes((current) => ({
                        ...current,
                        [selectedStage]: event.target.value,
                      }))
                    }
                    className="min-h-[120px] resize-none"
                  />
                </div>
                <Button className="gap-2" onClick={() => toast.success("Policy guidance saved", { description: `The coordinator-side ${formatStageLabel(selectedStage)} policy note was updated.` })}>
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
