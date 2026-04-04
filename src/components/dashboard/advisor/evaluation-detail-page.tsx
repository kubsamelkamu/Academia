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
import { 
  ArrowLeft, 
  CheckCircle, 
  FileSearch, 
  Send,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Save,
  RefreshCw
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

interface RubricItem {
  id: string
  label: string
  description?: string
  max: number
  score: number
}

interface EvaluationDetail {
  id: string
  studentName: string
  studentId?: string
  projectTitle: string
  submittedDate: string
  dueDate?: string
  status: EvaluationStatus
  summary: string
  rubric: RubricItem[]
  attachments?: { name: string; url: string }[]
  feedback?: string
}

const mockEvaluations: EvaluationDetail[] = [
  {
    id: "eval-1",
    studentName: "Alex Mercer",
    studentId: "STU-2024-001",
    projectTitle: "Machine Learning applied to Smart Grids",
    submittedDate: "2024-05-10",
    dueDate: "2024-05-17",
    status: "Pending Review",
    summary: "Initial submission looks promising. Please verify methodology and results sections.",
    rubric: [
      { 
        id: "r1", 
        label: "Problem definition", 
        description: "Clear articulation of the problem and its significance",
        max: 10, 
        score: 7 
      },
      { 
        id: "r2", 
        label: "Implementation quality", 
        description: "Code quality, architecture, and best practices",
        max: 10, 
        score: 6 
      },
      { 
        id: "r3", 
        label: "Evaluation & results", 
        description: "Testing methodology and result analysis",
        max: 10, 
        score: 5 
      },
      { 
        id: "r4", 
        label: "Report clarity", 
        description: "Structure, writing quality, and visual aids",
        max: 10, 
        score: 6 
      },
    ],
    attachments: [
      { name: "project_report.pdf", url: "#" },
      { name: "code_repository.zip", url: "#" }
    ]
  },
  {
    id: "eval-2",
    studentName: "Maria Garcia",
    studentId: "STU-2024-002",
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
    feedback: "Excellent work! Consider adding more performance metrics in future iterations."
  },
  {
    id: "eval-3",
    studentName: "Liam Johnson",
    studentId: "STU-2024-003",
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
]

const getStatusConfig = (status: EvaluationStatus) => {
  const configs = {
    "Pending Review": {
      badge: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
      icon: AlertCircle,
      label: "Pending Review"
    },
    "Evaluated": {
      badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
      icon: CheckCircle,
      label: "Evaluated"
    },
    "Needs Revision": {
      badge: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
      icon: RefreshCw,
      label: "Needs Revision"
    }
  }
  return configs[status]
}

const StatusBadge = ({ status }: { status: EvaluationStatus }) => {
  const config = getStatusConfig(status)
  const Icon = config.icon
  
  return (
    <Badge className={`${config.badge} border`} variant="outline">
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {config.label}
    </Badge>
  )
}

/** Maps mockData evaluation ids (e1…) to this page's demo detail rows (eval-1…). */
const MOCK_EVALUATION_ID_ALIASES: Record<string, string> = {
  e1: "eval-1",
  e2: "eval-2",
  e3: "eval-3",
}

const RubricItem = ({ item }: { item: RubricItem }) => {
  const percentage = (item.score / item.max) * 100
  
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{item.description || "No description available"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground">Maximum score: {item.max}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {item.score}/{item.max}
        </Badge>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Progress</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    </div>
  )
}

export function AdvisorEvaluationDetailPage({
  evaluationId,
  evaluationsListHref = "/dashboard/advisor/evaluations",
  evaluationsListLabel = "Back to Evaluations",
}: {
  evaluationId: string
  /** Where the primary “back” action should go (e.g. evaluator completed vs advisor evaluations list). */
  evaluationsListHref?: string
  evaluationsListLabel?: string
}) {
  const [evaluation, setEvaluation] = React.useState<EvaluationDetail | null>(null)
  const [overallComment, setOverallComment] = React.useState("")
  const [grade, setGrade] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRequestingRevision, setIsRequestingRevision] = React.useState(false)

  React.useEffect(() => {
    const resolvedId = MOCK_EVALUATION_ID_ALIASES[evaluationId] ?? evaluationId
    const found = mockEvaluations.find((e) => e.id === resolvedId) ?? null
    setEvaluation(found)
    if (found?.feedback) {
      setOverallComment(found.feedback)
    }
  }, [evaluationId])

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Evaluation saved successfully", { 
      description: "Your changes have been recorded."
    })
    setIsSaving(false)
  }

  const handleRequestRevision = async () => {
    setIsRequestingRevision(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Revision requested", { 
      description: "The student has been notified."
    })
    setIsRequestingRevision(false)
  }

  if (!evaluation) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileSearch className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Evaluation Not Found</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            No evaluation exists with ID: {evaluationId}. The evaluation may have been removed or you may have followed an invalid link.
          </p>
          <Button asChild>
            <Link href={evaluationsListHref}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {evaluationsListLabel}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const totalScore = evaluation.rubric.reduce((acc, r) => acc + r.score, 0)
  const totalMax = evaluation.rubric.reduce((acc, r) => acc + r.max, 0)
  const overallPercentage = (totalScore / totalMax) * 100

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardPageHeader
          title="Evaluation Details"
          description={`Review and provide feedback for ${evaluation.studentName}'s submission`}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={evaluationsListHref}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 px-6 py-4 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <StatusBadge status={evaluation.status} />
            <Badge variant="outline" className="text-sm">
              Score: {totalScore}/{totalMax} ({Math.round(overallPercentage)}%)
            </Badge>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">{evaluation.studentName}</p>
                  {evaluation.studentId && (
                    <p className="text-sm text-muted-foreground">{evaluation.studentId}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{evaluation.projectTitle}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {new Date(evaluation.submittedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {evaluation.dueDate && (
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(evaluation.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {evaluation.attachments && evaluation.attachments.length > 0 && (
                <div className="flex items-start gap-3">
                  <FileSearch className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.attachments.map((file, index) => (
                        <Button key={index} variant="outline" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3.5 w-3.5 mr-2" />
                            {file.name}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {evaluation.summary && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Summary</p>
                <p className="text-sm">{evaluation.summary}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rubric Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              Rubric Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluation.rubric.map((item) => (
                <RubricItem key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advisor Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="overall" className="text-base">
                Overall Comment
              </Label>
              <Textarea
                id="overall"
                rows={6}
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                placeholder="Provide comprehensive feedback, highlight strengths, and suggest improvements..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {overallComment.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade (optional)</Label>
              <Input
                id="grade"
                placeholder="e.g., A-, 85/100, Pass with Distinction"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Button
                className="w-full btn-gradient"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Feedback
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRequestRevision}
                disabled={isRequestingRevision}
              >
                {isRequestingRevision ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Request Revision
                  </>
                )}
              </Button>

              {evaluation.status === "Evaluated" && evaluation.feedback && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Previous Feedback
                  </p>
                  <p className="text-sm">{evaluation.feedback}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}