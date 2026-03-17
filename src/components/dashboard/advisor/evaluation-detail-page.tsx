"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, CheckCircle, FileSearch, Send } from "lucide-react"

type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

interface EvaluationDetail {
  id: string
  studentName: string
  projectTitle: string
  submittedDate: string
  status: EvaluationStatus
  summary: string
  rubric: { id: string; label: string; max: number; score: number }[]
}

const mockEvaluations: EvaluationDetail[] = [
  {
    id: "eval-1",
    studentName: "Alex Mercer",
    projectTitle: "Machine Learning applied to Smart Grids",
    submittedDate: "2024-05-10",
    status: "Pending Review",
    summary: "Initial submission looks promising. Please verify methodology and results sections.",
    rubric: [
      { id: "r1", label: "Problem definition", max: 10, score: 7 },
      { id: "r2", label: "Implementation quality", max: 10, score: 6 },
      { id: "r3", label: "Evaluation & results", max: 10, score: 5 },
      { id: "r4", label: "Report clarity", max: 10, score: 6 },
    ],
  },
  {
    id: "eval-2",
    studentName: "Maria Garcia",
    projectTitle: "Blockchain for Supply Chain Transparency",
    submittedDate: "2024-05-08",
    status: "Evaluated",
    summary: "Well-structured report with clear diagrams and strong justification of design choices.",
    rubric: [
      { id: "r1", label: "Problem definition", max: 10, score: 9 },
      { id: "r2", label: "Implementation quality", max: 10, score: 8 },
      { id: "r3", label: "Evaluation & results", max: 10, score: 8 },
      { id: "r4", label: "Report clarity", max: 10, score: 9 },
    ],
  },
  {
    id: "eval-3",
    studentName: "Liam Johnson",
    projectTitle: "IoT Home Automation Prototype",
    submittedDate: "2024-05-12",
    status: "Needs Revision",
    summary: "Requires revision: missing test coverage and unclear architecture section.",
    rubric: [
      { id: "r1", label: "Problem definition", max: 10, score: 6 },
      { id: "r2", label: "Implementation quality", max: 10, score: 5 },
      { id: "r3", label: "Evaluation & results", max: 10, score: 4 },
      { id: "r4", label: "Report clarity", max: 10, score: 5 },
    ],
  },
  {
    id: "eval-4",
    studentName: "Sophia Chen",
    projectTitle: "Natural Language Processing for Healthcare",
    submittedDate: "2024-05-14",
    status: "Pending Review",
    summary: "Please double-check dataset description and privacy considerations.",
    rubric: [
      { id: "r1", label: "Problem definition", max: 10, score: 7 },
      { id: "r2", label: "Implementation quality", max: 10, score: 7 },
      { id: "r3", label: "Evaluation & results", max: 10, score: 6 },
      { id: "r4", label: "Report clarity", max: 10, score: 7 },
    ],
  },
]

function statusBadge(status: EvaluationStatus) {
  if (status === "Pending Review") return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Review</Badge>
  if (status === "Evaluated") return <Badge className="bg-success/10 text-success border-success/20">Evaluated</Badge>
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Needs Revision</Badge>
}

function totalScore(rubric: EvaluationDetail["rubric"]) {
  return rubric.reduce((acc, r) => acc + r.score, 0)
}

function totalMax(rubric: EvaluationDetail["rubric"]) {
  return rubric.reduce((acc, r) => acc + r.max, 0)
}

export function AdvisorEvaluationDetailPage({ evaluationId }: { evaluationId: string }) {
  const evaluation = React.useMemo(
    () => mockEvaluations.find((e) => e.id === evaluationId) ?? null,
    [evaluationId],
  )

  const [overallComment, setOverallComment] = React.useState("")

  if (!evaluation) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Evaluation not found</h1>
            <p className="text-sm text-muted-foreground">No evaluation exists for ID: {evaluationId}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/advisor/evaluations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const score = totalScore(evaluation.rubric)
  const max = totalMax(evaluation.rubric)

  return (
    <div className="space-y-8 animate-fade-in">
      <DashboardPageHeader
        title="View Evaluation"
        description={`${evaluation.studentName} • ${evaluation.projectTitle}`}
        badge="Evaluation"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {statusBadge(evaluation.status)}
          <Badge variant="outline">
            Score: {score}/{max}
          </Badge>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/evaluations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Evaluations
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-muted-foreground" />
              Rubric
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evaluation.rubric.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">Max {r.max}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {r.score}/{r.max}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advisor Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-sm font-medium">
                {new Date(evaluation.submittedDate).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall">Overall comment</Label>
              <Textarea
                id="overall"
                rows={6}
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                placeholder="Write feedback, required fixes, and next steps..."
              />
            </div>

            <div className="grid gap-2">
              <Button
                className="btn-gradient"
                onClick={() => toast.success("Evaluation saved", { description: "Saved (mock)." })}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Evaluation
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.message("Revision requested", { description: "Request sent (mock)." })}
              >
                <Send className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade (optional)</Label>
                <Input id="grade" placeholder="e.g. A-, 85/100" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

