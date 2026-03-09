"use client"

import React from "react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import DataTable, { type Column } from "@/components/shared/DataTable"
import StatusBadge from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockGrades, type Grade } from "@/data/mockData"
import { toast } from "sonner"
import Link from "next/link"
import { ClipboardCheck, Eye } from "lucide-react"

const pendingGrades = mockGrades.filter((g) => g.status === "provisional")

export function DepartmentHeadGradesPage() {
  const handleApproveAll = () => {
    toast.success("Grades approved for publication", {
      description:
        "All provisional grades have been marked as approved and queued for final publication.",
    })
  }

  const handleApproveGrade = (gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.success("Grade approved", {
      description: grade
        ? `${grade.studentName}'s grade has been approved.`
        : "The selected grade has been approved.",
    })
  }

  const handleRejectGrade = (gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.warning("Grade rejected", {
      description: grade
        ? `${grade.studentName}'s grade has been rejected and sent back to the coordinator.`
        : "The selected grade has been rejected and sent back to the coordinator.",
    })
  }

  const gradeColumns: Column<Grade>[] = [
    {
      key: "studentName",
      header: "Student",
      render: (g) => <span className="text-sm font-medium">{g.studentName}</span>,
    },
    {
      key: "finalScore",
      header: "Final Score",
      render: (g) => <span className="text-sm">{g.finalScore.toFixed(1)}%</span>,
    },
    {
      key: "grade",
      header: "Grade",
      render: (g) => <span className="text-sm font-semibold">{g.grade}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (g) => <StatusBadge status={g.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (g) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" title="View detail" asChild>
            <Link href={`/dashboard/department-head/grades/${g.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            onClick={() => handleApproveGrade(g.id)}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => handleRejectGrade(g.id)}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Grade Approval"
        description="Review and approve or reject final project grades submitted by coordinators."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">
              Pending project grades
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingGrades.length === 0
                ? "No provisional grades awaiting approval."
                : `${pendingGrades.length} grade(s) awaiting your approval.`}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            disabled={pendingGrades.length === 0}
            onClick={handleApproveAll}
          >
            <ClipboardCheck className="h-4 w-4" />
            Approve all provisional
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {pendingGrades.length === 0 ? (
            <div className="border-t px-6 py-12 text-center text-sm text-muted-foreground">
              No pending grades to display. When coordinators submit grades for
              approval, they will appear here.
            </div>
          ) : (
            <DataTable data={pendingGrades} columns={gradeColumns} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
