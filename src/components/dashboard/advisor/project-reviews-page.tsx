"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ArrowLeft, CheckCircle, AlertCircle, FileText, MessageSquare, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import StatusBadge from "@/components/shared/StatusBadge"

// Mock data - in real app, fetch based on projectId
interface Milestone {
  id: string
  name: string
  status: "submitted" | "approved" | "revision"
  submittedAt: string
  description?: string
}

interface Project {
  id: string
  title: string
  groupName: string
  milestones: Milestone[]
}

const mockProject: Project = {
  id: "p1",
  title: "AI-Driven Academic Assistant",
  groupName: "AI Research Group",
  milestones: [
    {
      id: "m1",
      name: "Proposal Submission",
      status: "approved",
      submittedAt: "2024-05-01",
      description: "Initial project proposal with requirements and scope."
    },
    {
      id: "m2",
      name: "Architecture Design",
      status: "approved",
      submittedAt: "2024-05-31",
      description: "System architecture and design documents."
    },
    {
      id: "m3",
      name: "Working Prototype",
      status: "submitted",
      submittedAt: "2024-07-08",
      description: "Functional prototype with basic AI features."
    }
  ]
}

interface AdvisorProjectReviewsPageProps {
  projectId: string
}

export function AdvisorProjectReviewsPage({ projectId }: AdvisorProjectReviewsPageProps) {
  const router = useRouter()
  const [feedback, setFeedback] = React.useState("")
  const [selectedMilestone, setSelectedMilestone] = React.useState<Milestone | null>(null)

  // In real app, fetch project data based on projectId
  const project = mockProject // Mock for now

  const pendingMilestones = project.milestones.filter(m => m.status === "submitted")

  const handleApprove = (milestone: Milestone) => {
    toast.success("Milestone Approved", {
      description: `${milestone.name} has been approved.`
    })
    // In real app, update backend
  }

  const handleRequestRevision = (milestone: Milestone) => {
    if (!feedback.trim()) {
      toast.error("Feedback Required", {
        description: "Please provide feedback before requesting revision."
      })
      return
    }

    toast.success("Revision Requested", {
      description: `Feedback sent for ${milestone.name}.`
    })
    setFeedback("")
    setSelectedMilestone(null)
    // In real app, update backend
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Review: {project.title}</h1>
          <p className="text-sm text-muted-foreground">Review submitted milestones for {project.groupName}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reviews
        </Button>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Overview</CardTitle>
          <CardDescription>{project.groupName} • {project.milestones.length} milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {project.milestones.filter(m => m.status === "approved").length}
              </div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {pendingMilestones.length}
              </div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {project.milestones.filter(m => m.status === "revision").length}
              </div>
              <p className="text-sm text-muted-foreground">Needs Revision</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Milestones</h2>

        {pendingMilestones.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-success/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending milestones to review.</p>
            </CardContent>
          </Card>
        ) : (
          pendingMilestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      {milestone.name}
                    </CardTitle>
                    <CardDescription>
                      Submitted on {new Date(milestone.submittedAt).toLocaleDateString()}
                    </CardDescription>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    )}
                  </div>
                  <StatusBadge status={milestone.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Feedback Section */}
                {selectedMilestone?.id === milestone.id ? (
                  <div className="space-y-3">
                    <Label htmlFor="feedback">Provide Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Enter your feedback for this milestone..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRequestRevision(milestone)}
                        variant="outline"
                        disabled={!feedback.trim()}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Request Revision
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedMilestone(null)
                          setFeedback("")
                        }}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(milestone)}
                      variant="default"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Milestone
                    </Button>
                    <Button
                      onClick={() => setSelectedMilestone(milestone)}
                      variant="outline"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Request Revision
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}