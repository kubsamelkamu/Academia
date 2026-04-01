"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { ArrowLeft, Loader2, Save, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdvisorProject,
  useApproveMilestoneMutation,
  useRequestRevisionMutation,
} from "@/lib/hooks/useAdvisor"
import type { AdvisorProjectMilestone } from "@/lib/types/advisor"

interface AdvisorProjectReviewsPageProps {
  projectId: string
}

export function AdvisorProjectReviewsPage({ projectId }: AdvisorProjectReviewsPageProps) {
  const [feedbackByMilestone, setFeedbackByMilestone] = React.useState<Record<string, string>>({})

  const projectQuery = useAdvisorProject(projectId)
  const approveMilestoneMutation = useApproveMilestoneMutation()
  const requestRevisionMutation = useRequestRevisionMutation()

  const project = projectQuery.data
  const submittedMilestones =
    project?.milestones.filter((milestone: AdvisorProjectMilestone) => milestone.status === "submitted") ?? []

  async function handleApprove(milestoneId: string, milestoneName: string) {
    try {
      await approveMilestoneMutation.mutateAsync({
        milestoneId,
        dto: { status: "APPROVED" },
      })
      toast.success(`${milestoneName} approved.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve milestone")
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Review</h1>
          <p className="text-sm text-muted-foreground">
            Review submitted milestones and send structured revision feedback.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/reviews">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
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
                  <p className="text-sm text-muted-foreground">
                    Due {new Date(milestone.dueDate).toLocaleDateString()}
                  </p>
                  <Textarea
                    rows={5}
                    value={feedbackByMilestone[milestone.id] ?? ""}
                    onChange={(event) =>
                      setFeedbackByMilestone((current) => ({
                        ...current,
                        [milestone.id]: event.target.value,
                      }))
                    }
                    placeholder="Write milestone-specific feedback..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => void handleApprove(milestone.id, milestone.name)}
                      disabled={approveMilestoneMutation.isPending}
                    >
                      {approveMilestoneMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleRevision(milestone.id, milestone.name)}
                      disabled={requestRevisionMutation.isPending}
                    >
                      {requestRevisionMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
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
