"use client"

import React, { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Star,
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  Send,
  Save,
  Target,
  GraduationCap,
  Clock,
  Shield,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const RUBRIC = [
  {
    key: "technical",
    label: "Technical Implementation",
    maxScore: 40,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    description: "Quality of code, architecture decisions, functionality, performance, and technical problem-solving.",
    criteria: ["Code quality & maintainability", "System architecture", "Functionality & correctness", "Performance & scalability"],
  },
  {
    key: "presentation",
    label: "Presentation Quality",
    maxScore: 20,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    description: "Clarity of presentation, demo effectiveness, ability to answer questions, and communication skills.",
    criteria: ["Clarity & organization", "Demo effectiveness", "Q&A responses", "Communication skills"],
  },
  {
    key: "documentation",
    label: "Documentation",
    maxScore: 20,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description: "Completeness and quality of technical docs, user guides, API references, and project reports.",
    criteria: ["Technical documentation", "User guide", "Code comments", "Final report"],
  },
  {
    key: "innovation",
    label: "Innovation & Impact",
    maxScore: 20,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    description: "Novelty of approach, real-world applicability, potential for broader impact, and creative problem-solving.",
    criteria: ["Novelty of approach", "Real-world applicability", "Problem-solving creativity", "Potential impact"],
  },
]

const MOCK_EVALUATIONS: Record<string, {
  projectTitle: string
  groupName: string
  advisor: string
  defenseDate: string
  defenseRoom: string
  members: { name: string; role: string }[]
  description: string
  existingScores: Record<string, number>
  existingComments: string
  status: string
}> = {
  er1: {
    projectTitle: "AI-Driven Academic Assistant",
    groupName: "AI Research Group",
    advisor: "Prof. Lisa Anderson",
    defenseDate: "2024-02-10T09:00:00Z",
    defenseRoom: "Room A-201",
    members: [
      { name: "Alex Johnson", role: "Group Manager" },
      { name: "Maria Garcia", role: "Developer" },
      { name: "David Kim", role: "Researcher" },
    ],
    description: "An AI-powered system for academic queries and learning path recommendations using NLP.",
    existingScores: { technical: 0, presentation: 0, documentation: 0, innovation: 0 },
    existingComments: "",
    status: "pending",
  },
  er2: {
    projectTitle: "Real-Time Campus Analytics",
    groupName: "Data Analytics Team",
    advisor: "Dr. Michael Brown",
    defenseDate: "2024-01-28T14:00:00Z",
    defenseRoom: "Room B-105",
    members: [
      { name: "Samuel Lee", role: "Group Manager" },
      { name: "Emma Wilson", role: "Data Engineer" },
    ],
    description: "Real-time dashboard for tracking campus resource utilization with IoT sensors.",
    existingScores: { technical: 34, presentation: 17, documentation: 16, innovation: 18 },
    existingComments: "Good technical implementation with room for improvement in documentation.",
    status: "submitted",
  },
  er3: {
    projectTitle: "Secure Research Data Platform",
    groupName: "Security Systems",
    advisor: "Prof. Emily Davis",
    defenseDate: "2024-02-18T10:00:00Z",
    defenseRoom: "Room C-310",
    members: [
      { name: "Alice Brown", role: "Group Manager" },
      { name: "Charlie Davis", role: "Security Engineer" },
    ],
    description: "Secure collaborative platform with end-to-end encryption and fine-grained access controls.",
    existingScores: { technical: 30, presentation: 0, documentation: 0, innovation: 0 },
    existingComments: "",
    status: "in_progress",
  },
  er4: {
    projectTitle: "Smart Campus Navigation",
    groupName: "Mobile Dev Team",
    advisor: "Dr. Robert Taylor",
    defenseDate: "2024-01-18T11:00:00Z",
    defenseRoom: "Room A-101",
    members: [
      { name: "Rachel Kim", role: "Group Manager" },
      { name: "James Park", role: "Mobile Dev" },
    ],
    description: "Indoor navigation mobile app using Bluetooth beacons for campus guidance.",
    existingScores: { technical: 37, presentation: 18, documentation: 19, innovation: 15 },
    existingComments: "Excellent mobile app with strong UX design. Navigation algorithm is impressive.",
    status: "reviewed",
  },
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const evalData = MOCK_EVALUATIONS[id]

  const isReadOnly = evalData?.status === "reviewed"
  const [scores, setScores] = useState<Record<string, number>>(evalData?.existingScores ?? {})
  const [comments, setComments] = useState(evalData?.existingComments ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0)
  const maxTotal = RUBRIC.reduce((s, r) => s + r.maxScore, 0)
  const completion = RUBRIC.filter(r => (scores[r.key] ?? 0) > 0).length
  const completionPct = Math.round((completion / RUBRIC.length) * 100)

  const getScoreGrade = (score: number) => {
    const pct = (score / maxTotal) * 100
    if (pct >= 90) return { label: "Excellent", color: "text-emerald-600" }
    if (pct >= 80) return { label: "Very Good", color: "text-blue-600" }
    if (pct >= 70) return { label: "Good", color: "text-violet-600" }
    if (pct >= 60) return { label: "Satisfactory", color: "text-amber-600" }
    return { label: "Needs Improvement", color: "text-rose-600" }
  }

  const handleSaveDraft = async () => {
    setSaved(true)
    toast.success("Draft saved", { description: "Your scores have been saved as a draft." })
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSubmit = async () => {
    if (completion < RUBRIC.length) {
      toast.error("Incomplete evaluation", { description: "Please score all rubric categories before submitting." })
      return
    }
    if (!comments.trim()) {
      toast.error("Comments required", { description: "Please add overall comments before submitting." })
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false)
    toast.success("Evaluation submitted!", { description: `Score ${totalScore}/${maxTotal} submitted successfully.` })
    router.push("/dashboard/evaluator/evaluations")
  }

  if (!evalData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="font-semibold">Evaluation not found</p>
        <Link href="/dashboard/evaluator/evaluations">
          <Button className="mt-4" variant="outline">Back to Evaluations</Button>
        </Link>
      </div>
    )
  }

  const gradeInfo = getScoreGrade(totalScore)

  return (
    <div className="space-y-6 pb-8 animate-fade-in max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/evaluator/evaluations">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display tracking-tight truncate">{evalData.projectTitle}</h1>
            {isReadOnly && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 shrink-0">Finalized</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{evalData.groupName} · Evaluation Form</p>
        </div>
      </div>

      {/* Project Info Bar */}
      <Card className="border-violet-200 dark:border-violet-800 bg-violet-500/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Group</p>
                <p className="text-sm font-semibold">{evalData.groupName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{evalData.advisor.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Supervisor</p>
                <p className="text-sm font-semibold">{evalData.advisor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Defense</p>
                <p className="text-sm font-semibold">
                  {new Date(evalData.defenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {new Date(evalData.defenseDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Venue</p>
                <p className="text-sm font-semibold">{evalData.defenseRoom}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="text-sm font-semibold">{evalData.members.length} members</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Summary Banner */}
      {!isReadOnly && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Evaluation Progress</span>
                  <span className="font-medium">{completion}/{RUBRIC.length} categories scored</span>
                </div>
                <Progress value={completionPct} className="h-2" />
              </div>
              <Separator className="sm:hidden" />
              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-3xl font-bold font-display text-violet-600">{totalScore}</p>
                  <p className="text-xs text-muted-foreground">of {maxTotal} pts</p>
                </div>
                {totalScore > 0 && (
                  <div className="text-center">
                    <p className={`text-sm font-bold ${gradeInfo.color}`}>{gradeInfo.label}</p>
                    <p className="text-xs text-muted-foreground">{Math.round((totalScore / maxTotal) * 100)}%</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rubric Scoring */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-display font-semibold">Evaluation Rubric</h2>
          {isReadOnly && <Badge variant="outline" className="text-xs">Read Only</Badge>}
        </div>

        {RUBRIC.map(cat => {
          const score = scores[cat.key] ?? 0
          const pct = Math.round((score / cat.maxScore) * 100)
          return (
            <Card key={cat.key} className={`border ${cat.border}`}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
                        <Target className={`h-5 w-5 ${cat.color}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${cat.color}`}>{cat.label}</h3>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold font-display ${cat.color}`}>{score}</p>
                      <p className="text-xs text-muted-foreground">/{cat.maxScore}</p>
                    </div>
                  </div>

                  {/* Criteria List */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {cat.criteria.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className={`h-1.5 w-1.5 rounded-full ${cat.bg.replace('/10', '')} ${cat.color.replace('text-', 'bg-')}`} />
                        {c}
                      </div>
                    ))}
                  </div>

                  {/* Slider */}
                  {!isReadOnly ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Score (0–{cat.maxScore})</span>
                        <span className={`font-semibold ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : pct >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                          {pct}%
                        </span>
                      </div>
                      <Slider
                        value={[score]}
                        min={0}
                        max={cat.maxScore}
                        step={1}
                        onValueChange={([v]) => setScores(prev => ({ ...prev, [cat.key]: v }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>{Math.round(cat.maxScore * 0.5)}</span>
                        <span>{cat.maxScore}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Final score</span>
                        <span className={`font-semibold ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : "text-amber-600"}`}>{pct}%</span>
                      </div>
                      <Progress value={pct} className={`h-2`} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Overall Comments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Overall Evaluation Comments
          </CardTitle>
          <CardDescription>
            {isReadOnly ? "Submitted evaluation comments" : "Provide comprehensive feedback on the project and defense performance"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Summarize your overall assessment, key strengths, areas for improvement, and any notable observations from the defense..."
            rows={6}
            disabled={isReadOnly}
            className="resize-none"
          />
          {!isReadOnly && (
            <p className="text-xs text-muted-foreground mt-1.5 text-right">{comments.length} characters</p>
          )}
        </CardContent>
      </Card>

      {/* Team Members (Read view) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Project Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {evalData.members.map((m, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border bg-muted/30 px-3 py-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-violet-500/10 text-violet-600 font-semibold">{m.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <Badge variant="outline" className="text-xs mt-0.5">{m.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {completion < RUBRIC.length
              ? `${RUBRIC.length - completion} categories remaining`
              : comments.trim()
              ? "Ready to submit"
              : "Add comments to submit"}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={handleSaveDraft}>
              {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
              Save Draft
            </Button>
            <Button
              className="btn-gradient gap-2 min-w-[160px]"
              onClick={handleSubmit}
              disabled={submitting || completion < RUBRIC.length || !comments.trim()}
            >
              {submitting ? (
                <><div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Evaluation</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
