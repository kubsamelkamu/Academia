"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import StatusBadge from "@/components/shared/StatusBadge"
import { Download, FileText } from "lucide-react"

interface PendingReviewRow {
  projectId: string
  projectTitle: string
  groupName: string
  milestoneId: string
  milestoneName: string
  status: "submitted"
  submittedAt: string
}

const pending: PendingReviewRow[] = [
  {
    projectId: "p1",
    projectTitle: "AI‑Driven Academic Assistant",
    groupName: "AI Research Group",
    milestoneId: "m3",
    milestoneName: "Prototype",
    status: "submitted",
    submittedAt: "2024-07-08",
  },
  {
    projectId: "p2",
    projectTitle: "Real‑Time Campus Analytics",
    groupName: "Team Atlas",
    milestoneId: "m2",
    milestoneName: "Data pipeline",
    status: "submitted",
    submittedAt: "2024-06-24",
  },
]

export function AdvisorReviewsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground">Milestones that need your review and approval.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor">
            Back
          </Link>
        </Button>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((row) => (
                <TableRow key={`${row.projectId}:${row.milestoneId}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{row.milestoneName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{row.groupName}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.projectTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.submittedAt}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/advisor/documents">Open Docs</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // mock download
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/advisor/students/revision/${row.projectId}`}>Request Revision</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pending.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                    No pending reviews.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorReviewsPage

