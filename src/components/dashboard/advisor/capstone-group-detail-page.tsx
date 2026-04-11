"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, FolderKanban, Users, TrendingUp } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { CAPSTONE_GROUPS, type CapstoneStage, type EvaluationStatus } from "./capstone-evaluation-data"

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const style =
    status === "Evaluated"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
      : status === "Needs Revision"
        ? "bg-rose-500/10 text-rose-600 border-rose-200"
        : "bg-amber-500/10 text-amber-600 border-amber-200"

  return <Badge variant="outline" className={`${style} border`}>{status}</Badge>
}

export function AdvisorCapstoneGroupDetailPage({ stage, groupId }: { stage: CapstoneStage; groupId: string }) {
  const group = React.useMemo(
    () => CAPSTONE_GROUPS.find((item) => item.id === groupId && item.stage === stage) ?? CAPSTONE_GROUPS.find((item) => item.stage === stage) ?? CAPSTONE_GROUPS[0],
    [groupId, stage],
  )

  const pendingStudents = group.students.filter((student) => student.capstone1Status === "Pending Review" || student.capstone2Status === "Pending Review").length
  const evaluatedStudents = group.students.filter((student) => student.capstone1Status === "Evaluated" && student.capstone2Status === "Evaluated").length
  const avgProgress = Math.round(group.students.reduce((sum, student) => sum + student.progress, 0) / group.students.length)

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardPageHeader
          title={`${stage} Group Detail`}
          description="Review all project information, milestones, and student members for this group."
          badge={group.groupName}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={stage === "Capstone I" ? "/dashboard/advisor/evaluations/capstone-i" : "/dashboard/advisor/evaluations/capstone-ii"}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{stage}</Badge>
            <Badge variant="secondary">{group.students.length} members</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Group Name</p>
                  <p className="font-medium">{group.groupName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FolderKanban className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{group.projectTitle}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due</p>
                  <p className="font-medium">{group.dueLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Stage Progress</p>
                  <p className="font-medium">{group.progress}%</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pending Students</p>
                <p className="text-2xl font-semibold text-amber-600">{pendingStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Evaluated Students</p>
                <p className="text-2xl font-semibold text-emerald-600">{evaluatedStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Average Progress</p>
                <p className="text-2xl font-semibold text-primary">{avgProgress}%</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestones</CardTitle>
          <CardDescription>Stage-specific milestones for this group.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {group.milestones.map((milestone) => (
            <div key={milestone.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">{milestone.title}</p>
                <Badge variant="outline" className="capitalize">{milestone.status.replace("_", " ")}</Badge>
              </div>
              <Progress value={milestone.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>All students in the selected group.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Capstone I</TableHead>
                <TableHead>Capstone II</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">{student.studentId}</TableCell>
                  <TableCell>
                    <div className="w-40 space-y-1">
                      <p className="text-xs text-muted-foreground">{student.progress}%</p>
                      <Progress value={student.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={student.capstone1Status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={student.capstone2Status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
