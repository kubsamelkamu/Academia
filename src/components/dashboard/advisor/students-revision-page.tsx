"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAdvisorProject, useRequestRevisionMutation } from "@/lib/hooks/useAdvisor"
import { ArrowLeft, Loader2, Send } from "lucide-react"

interface AdvisorStudentsRevisionPageProps {
  projectId: string
}

export function AdvisorStudentsRevisionPage({ projectId }: AdvisorStudentsRevisionPageProps) {
  const projectQuery = useAdvisorProject(projectId)
  const requestRevisionMutation = useRequestRevisionMutation()
  const [feedback, setFeedback] = React.useState("")

  async function handleSubmit() {
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }

    try {
      await requestRevisionMutation.mutateAsync({
        projectId,
        dto: {
          subject: `Revision required for ${projectQuery.data?.title ?? "project"}`,
          feedback: feedback.trim(),
        },
      })
      toast.success("Revision request sent.")
      setFeedback("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit revision request")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Revision Request</h1>
          <p className="text-sm text-muted-foreground">Send targeted revision feedback to the selected project team.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard/advisor/students"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{projectQuery.data?.title ?? "Loading project..."}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectQuery.data ? (
            <>
              <div className="text-sm text-muted-foreground">{projectQuery.data.groupName}</div>
              <Textarea rows={10} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Explain what the students should revise before resubmission..." />
              <div className="flex justify-end">
                <Button onClick={() => void handleSubmit()} disabled={requestRevisionMutation.isPending}>
                  {requestRevisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Revision Request
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading project...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorStudentsRevisionPage