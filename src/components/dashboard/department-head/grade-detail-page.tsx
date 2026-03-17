"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"
import { mockGrades } from "@/data/mockData"
import { formatDate } from "@/data/mockData"
import { toast } from "sonner"

interface GradeDetailPageProps {
  gradeId: string
}

export function GradeDetailPage({ gradeId }: GradeDetailPageProps) {
  const grade = mockGrades.find((g) => g.id === gradeId)

  if (!grade) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Grade not found"
          description="The requested grade could not be found."
        />
        <Button variant="outline" asChild>
          <Link href="/dashboard/department-head/grades">Back to Grade Approval</Link>
        </Button>
      </div>
    )
  }

  const handleApprove = () => {
    toast.success("Grade approved", {
      description: `${grade.studentName}'s grade has been approved.`,
    })
  }

  const handleReject = () => {
    toast.warning("Grade rejected", {
      description: `${grade.studentName}'s grade has been rejected and sent back to the coordinator.`,
    })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Grade details"
        description={`Project grade for ${grade.studentName}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/grades" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Grade Approval
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Grade information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Student</p>
              <p className="font-medium">{grade.studentName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Status</p>
              <StatusBadge status={grade.status} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Final score</p>
              <p className="text-2xl font-semibold">{grade.finalScore.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Grade</p>
              <p className="text-2xl font-semibold">{grade.grade}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last updated</p>
              <p className="font-medium">{formatDate(grade.updatedAt)}</p>
            </div>
          </div>
          {grade.status === "provisional" && (
            <div className="flex gap-2 border-t pt-4">
              <Button
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={handleApprove}
              >
                Approve grade
              </Button>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={handleReject}
              >
                Reject grade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
