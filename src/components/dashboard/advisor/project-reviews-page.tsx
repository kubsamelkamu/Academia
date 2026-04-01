"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ArrowLeft, CheckCircle, AlertCircle, FileText, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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

export function AdvisorProjectReviewsPage(_props: AdvisorProjectReviewsPageProps) {
  void _props.projectId
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

  async function handleRevision(milestoneId: string, milestoneName: string) {
    const feedback = feedbackByMilestone[milestoneId]?.trim()
    if (!feedback) {
      toast.error("Revision feedback is required.")
      return
    }
    try {
      await requestRevisionMutation.mutateAsync({
        projectId,
        dto: {
          milestoneId,
          subject: `Revision required for ${milestoneName}`,
          feedback,
        },
      })
      toast.success(`${milestoneName}: revision requested.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision")
    }
  }

  const project = projectQuery.data as AdvisorProjectDetail | undefined
  const submittedMilestones =
    project?.milestones.filter((milestone: AdvisorProjectMilestone) => milestone.status === "submitted") ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Review</h1>
          <p className="text-sm text-muted-foreground">Review submitted milestones and send structured revision feedback.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard/advisor/reviews"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{project?.title ?? "Loading project..."}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading project review...</p>
          ) : submittedMilestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submitted milestones are waiting for review.</p>
          ) : (
            submittedMilestones.map((milestone: AdvisorProjectMilestone) => (
              <Card key={milestone.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{milestone.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Due {new Date(milestone.dueDate).toLocaleDateString()}</p>
                  <Textarea
                    rows={5}
                    value={feedbackByMilestone[milestone.id] ?? ""}
                    onChange={(event) => setFeedbackByMilestone((current) => ({ ...current, [milestone.id]: event.target.value }))}
                    placeholder="Write milestone-specific feedback..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => void handleApprove(milestone.id, milestone.name)} disabled={approveMilestoneMutation.isPending}>
                      {approveMilestoneMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => void handleRevision(milestone.id, milestone.name)} disabled={requestRevisionMutation.isPending}>
                      {requestRevisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Request Revision
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorProjectReviewsPage