"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, AlertCircle, Send, Clock } from "lucide-react"

type MilestoneStatus = "approved" | "submitted" | "revision"

interface ProjectMilestone {
  id: string
  name: string
  status: MilestoneStatus
  submittedAt: string
}

interface ClearanceProjectLite {
  id: string
  title: string
  groupName: string
  submittedAt: string
  milestones: ProjectMilestone[]
}

const mockProjects: ClearanceProjectLite[] = [
  {
    id: "1",
    title: "Smart Campus System",
    groupName: "Team Alpha",
    submittedAt: "2024-01-15T10:00:00Z",
    milestones: [
      { id: "1", name: "Requirements Analysis", status: "approved", submittedAt: "2024-01-10T09:00:00Z" },
      { id: "2", name: "System Design", status: "approved", submittedAt: "2024-01-12T14:00:00Z" },
      { id: "3", name: "Implementation", status: "approved", submittedAt: "2024-01-14T16:00:00Z" },
      { id: "4", name: "Testing & Deployment", status: "submitted", submittedAt: "2024-01-15T10:00:00Z" },
    ],
  },
  {
    id: "2",
    title: "AI Chatbot Development",
    groupName: "Team Beta",
    submittedAt: "2024-01-12T08:00:00Z",
    milestones: [
      { id: "5", name: "Research Phase", status: "approved", submittedAt: "2024-01-08T10:00:00Z" },
      { id: "6", name: "Prototype Development", status: "approved", submittedAt: "2024-01-10T15:00:00Z" },
      { id: "7", name: "Final Implementation", status: "approved", submittedAt: "2024-01-12T08:00:00Z" },
    ],
  },
]

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function getMilestoneStatusBadge(status: MilestoneStatus) {
  switch (status) {
    case "approved":
      return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>
    case "submitted":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Submitted</Badge>
    case "revision":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Revision</Badge>
  }
}

export function AdvisorStudentsRevisionPage({ projectId }: { projectId: string }) {
  const project = React.useMemo(() => mockProjects.find((p) => p.id === projectId) ?? null, [projectId])

  const [subject, setSubject] = React.useState("Revision required")
  const [feedback, setFeedback] = React.useState("")
  const [milestoneId, setMilestoneId] = React.useState<string>("")

  React.useEffect(() => {
    if (project && project.milestones.length > 0) {
      setMilestoneId(project.milestones[project.milestones.length - 1]?.id ?? "")
    }
  }, [project])

  function submit() {
    if (!feedback.trim()) {
      toast.error("Feedback required", { description: "Please add revision feedback before sending." })
      return
    }

    toast.success("Revision request sent", {
      description: project ? `Sent to ${project.groupName} (${project.title}).` : "Sent.",
    })
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Request Revision</h1>
            <p className="text-sm text-muted-foreground">Project not found (ID: {projectId}).</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/advisor/students">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Request Revision</h1>
          <p className="text-sm text-muted-foreground">
            {project.title} • {project.groupName}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/students">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Revision Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone">Milestone (optional)</Label>
                <Input
                  id="milestone"
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  placeholder="Milestone ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe what needs to be fixed, and what ‘done’ looks like..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Tip: be specific (files, sections, acceptance criteria) so students can respond quickly.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/advisor/students">Cancel</Link>
              </Button>
              <Button onClick={submit}>
                <Send className="h-4 w-4 mr-2" />
                Send Revision
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Submitted {formatDate(project.submittedAt)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Milestones</h3>
              </div>

              <div className="space-y-2">
                {project.milestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">Submitted: {formatDate(m.submittedAt)}</p>
                    </div>
                    <div className="shrink-0">{getMilestoneStatusBadge(m.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

