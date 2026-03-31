"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdvisorEvaluation,
  useRequestEvaluationRevisionMutation,
  useUpdateEvaluationMutation,
} from "@/lib/hooks/useAdvisor"
import { ArrowLeft, Loader2, Save, Send } from "lucide-react"

function formatDate(value?: string) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-"
}

interface AdvisorEvaluationDetailPageProps {
  evaluationId: string
}

export function AdvisorEvaluationDetailPage({ evaluationId }: AdvisorEvaluationDetailPageProps) {
  const evaluationQuery = useAdvisorEvaluation(evaluationId)
  const updateEvaluationMutation = useUpdateEvaluationMutation()
  const requestEvaluationRevisionMutation = useRequestEvaluationRevisionMutation()

  const [summary, setSummary] = React.useState("")
  const [feedback, setFeedback] = React.useState("")
  const [grade, setGrade] = React.useState("")
  const [status, setStatus] = React.useState<"PENDING_REVIEW" | "EVALUATED" | "NEEDS_REVISION">("PENDING_REVIEW")

  React.useEffect(() => {
    if (!evaluationQuery.data) return
    setSummary(evaluationQuery.data.summary)
    setFeedback(evaluationQuery.data.feedback ?? "")
    setGrade(evaluationQuery.data.grade ?? "")
    setStatus(
      evaluationQuery.data.status === "Evaluated"
        ? "EVALUATED"
        : evaluationQuery.data.status === "Needs Revision"
          ? "NEEDS_REVISION"
          : "PENDING_REVIEW",
    )
  }, [evaluationQuery.data])

  async function handleSave() {
    try {
      await updateEvaluationMutation.mutateAsync({
        evaluationId,
        dto: {
          summary: summary.trim() || undefined,
          feedback: feedback.trim() || undefined,
          grade: grade.trim() || undefined,
          status,
        },
      })
      toast.success("Evaluation saved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save evaluation")
    }
  }

  async function handleRevision() {
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }
    try {
      await requestEvaluationRevisionMutation.mutateAsync({
        evaluationId,
        dto: {
          subject: `Revision required for evaluation ${evaluationId}`,
          feedback: feedback.trim(),
        },
      })
      toast.success("Revision requested.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision")
    }
  }

  if (evaluationQuery.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading evaluation...</div>
  }

  if (!evaluationQuery.data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <p className="text-sm text-muted-foreground">Evaluation not found.</p>
        <Button asChild variant="outline"><Link href="/dashboard/advisor/evaluations">Back to Evaluations</Link></Button>
      </div>
    )
  }

  const evaluation = evaluationQuery.data
  const totalScore = evaluation.rubric.reduce((sum, item) => sum + item.score, 0)
  const totalMax = evaluation.rubric.reduce((sum, item) => sum + item.max, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluation Detail</h1>
          <p className="text-sm text-muted-foreground">{evaluation.studentName} - {evaluation.projectTitle}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/evaluations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Rubric and Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
              <p>Submitted: {formatDate(evaluation.submittedDate)}</p>
              <p>Due: {formatDate(evaluation.dueDate)}</p>
              <p>Status: {evaluation.status}</p>
              <p>Priority: {evaluation.priority ?? "-"}</p>
              <p>Score: {totalScore}/{totalMax || 0}</p>
            </div>
            <div className="space-y-3">
              {evaluation.rubric.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
                    </div>
                    <p className="text-sm font-medium">{item.score}/{item.max}</p>
                  </div>
                </div>
              ))}
            </div>
            {evaluation.attachments.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attachments</p>
                {evaluation.attachments.map((attachment) => (
                  <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="block text-sm text-primary underline">
                    {attachment.name}
                  </a>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advisor Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Overall summary..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea id="feedback" rows={6} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Detailed advisor feedback..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="e.g. A-, 36/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" value={status} onChange={(event) => setStatus(event.target.value as "PENDING_REVIEW" | "EVALUATED" | "NEEDS_REVISION")} placeholder="PENDING_REVIEW" />
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => void handleSave()} disabled={updateEvaluationMutation.isPending}>
                {updateEvaluationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Evaluation
              </Button>
              <Button variant="outline" onClick={() => void handleRevision()} disabled={requestEvaluationRevisionMutation.isPending}>
                {requestEvaluationRevisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Request Revision
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvisorEvaluationDetailPage