"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdvisorProjects } from "@/lib/hooks/useAdvisor"
import type { AdvisorProjectItem, AdvisorProjectMilestone } from "@/lib/types/advisor"

export function AdvisorReviewsPage() {
  const projectsQuery = useAdvisorProjects()

  const pendingMilestones = React.useMemo(() => {
    return ((projectsQuery.data?.items ?? []) as AdvisorProjectItem[]).flatMap((project: AdvisorProjectItem) =>
      project.milestones
        .filter((milestone: AdvisorProjectMilestone) => milestone.status === "submitted")
        .map((milestone: AdvisorProjectMilestone) => ({
          projectId: project.id,
          projectTitle: project.title,
          groupName: project.groupName,
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          submittedAt: milestone.completedDate ?? milestone.dueDate,
        })),
    )
  }, [projectsQuery.data?.items])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground">Pending milestone reviews from your assigned projects.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard/advisor">Back</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsQuery.isLoading ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">Loading reviews...</TableCell></TableRow>
              ) : pendingMilestones.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No pending milestone reviews.</TableCell></TableRow>
              ) : (
                pendingMilestones.map((row: {
                  projectId: string
                  projectTitle: string
                  groupName: string
                  milestoneId: string
                  milestoneName: string
                  submittedAt: string
                }) => (
                  <TableRow key={`${row.projectId}:${row.milestoneId}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.milestoneName}</p>
                        <p className="text-sm text-muted-foreground">{row.groupName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{row.projectTitle}</TableCell>
                    <TableCell>{new Date(row.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/advisor/reviews/${row.projectId}`}>Open Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorReviewsPage