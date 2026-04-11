"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Users,
  FolderKanban,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  TrendingUp,
  User,
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

type GroupStudent = {
  id: string
  name: string
  studentId: string
  capstone1Status: EvaluationStatus
  capstone2Status: EvaluationStatus
  progress: number
  capstone1Score?: number
  capstone2Score?: number
  submittedDate: string
}

type Milestone = {
  id: string
  title: string
  status: "completed" | "in_progress" | "pending"
  progress: number
}

type GroupEvaluationDetail = {
  id: string
  groupName: string
  projectTitle: string
  capstoneStage: "Capstone I" | "Capstone II"
  submittedDate: string
  dueDate: string
  advisorStatus: EvaluationStatus
  students: GroupStudent[]
  milestones: Milestone[]
}

const MOCK_GROUP_DETAILS: GroupEvaluationDetail[] = [
  {
    id: "grp-1",
    groupName: "AI Research Group",
    projectTitle: "Machine Learning applied to Smart Grids",
    capstoneStage: "Capstone I",
    submittedDate: "2024-05-10",
    dueDate: "2024-05-17",
    advisorStatus: "Pending Review",
    students: [
      { id: "stu-1", name: "Alex Mercer", studentId: "STU-2024-001", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 72, submittedDate: "2024-05-10" },
      { id: "stu-2", name: "Maria Garcia", studentId: "STU-2024-002", capstone1Status: "Evaluated", capstone2Status: "Pending Review", progress: 88, capstone1Score: 36, submittedDate: "2024-05-09" },
      { id: "stu-3", name: "Liam Johnson", studentId: "STU-2024-003", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 67, submittedDate: "2024-05-10" },
    ],
    milestones: [
      { id: "m1", title: "Proposal and problem definition", status: "completed", progress: 100 },
      { id: "m2", title: "SDD and architecture review", status: "in_progress", progress: 74 },
      { id: "m3", title: "Advisor final evaluation", status: "pending", progress: 20 },
    ],
  },
  {
    id: "grp-2",
    groupName: "Blockchain Team",
    projectTitle: "Blockchain for Supply Chain Transparency",
    capstoneStage: "Capstone II",
    submittedDate: "2024-05-08",
    dueDate: "2024-05-16",
    advisorStatus: "Evaluated",
    students: [
      { id: "stu-4", name: "Sophia Chen", studentId: "STU-2024-004", capstone1Status: "Evaluated", capstone2Status: "Evaluated", progress: 95, capstone1Score: 37, capstone2Score: 38, submittedDate: "2024-05-08" },
      { id: "stu-5", name: "James Wilson", studentId: "STU-2024-005", capstone1Status: "Evaluated", capstone2Status: "Evaluated", progress: 92, capstone1Score: 34, capstone2Score: 35, submittedDate: "2024-05-08" },
      { id: "stu-6", name: "Noah Davis", studentId: "STU-2024-006", capstone1Status: "Evaluated", capstone2Status: "Evaluated", progress: 90, capstone1Score: 33, capstone2Score: 34, submittedDate: "2024-05-08" },
    ],
    milestones: [
      { id: "m1", title: "Implementation checkpoint", status: "completed", progress: 100 },
      { id: "m2", title: "Testing and validation", status: "completed", progress: 100 },
      { id: "m3", title: "Advisor final evaluation", status: "completed", progress: 100 },
    ],
  },
  {
    id: "grp-3",
    groupName: "IoT Builders",
    projectTitle: "IoT Home Automation Prototype",
    capstoneStage: "Capstone I",
    submittedDate: "2024-05-12",
    dueDate: "2024-05-19",
    advisorStatus: "Needs Revision",
    students: [
      { id: "stu-7", name: "Olivia White", studentId: "STU-2024-007", capstone1Status: "Needs Revision", capstone2Status: "Pending Review", progress: 55, submittedDate: "2024-05-12" },
      { id: "stu-8", name: "Ethan Brown", studentId: "STU-2024-008", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 60, submittedDate: "2024-05-12" },
      { id: "stu-9", name: "Ava Clark", studentId: "STU-2024-009", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 58, submittedDate: "2024-05-12" },
      { id: "stu-10", name: "Mason Hall", studentId: "STU-2024-010", capstone1Status: "Evaluated", capstone2Status: "Pending Review", progress: 82, capstone1Score: 30, submittedDate: "2024-05-11" },
    ],
    milestones: [
      { id: "m1", title: "Proposal and scope alignment", status: "completed", progress: 100 },
      { id: "m2", title: "Technical architecture", status: "in_progress", progress: 62 },
      { id: "m3", title: "Advisor final evaluation", status: "pending", progress: 35 },
    ],
  },
  {
    id: "grp-4",
    groupName: "Cloud Scale Team",
    projectTitle: "Cloud-native Microservices Architecture",
    capstoneStage: "Capstone II",
    submittedDate: "2024-05-15",
    dueDate: "2024-05-22",
    advisorStatus: "Pending Review",
    students: [
      { id: "stu-11", name: "Emma Walker", studentId: "STU-2024-011", capstone1Status: "Evaluated", capstone2Status: "Pending Review", progress: 65, capstone1Score: 32, submittedDate: "2024-05-15" },
      { id: "stu-12", name: "Logan Young", studentId: "STU-2024-012", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 63, submittedDate: "2024-05-15" },
    ],
    milestones: [
      { id: "m1", title: "Implementation planning", status: "completed", progress: 100 },
      { id: "m2", title: "System implementation", status: "in_progress", progress: 68 },
      { id: "m3", title: "Advisor final evaluation", status: "pending", progress: 25 },
    ],
  },
]

const STATUS_CONFIG: Record<EvaluationStatus, { icon: React.ElementType; className: string }> = {
  "Pending Review": {
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
  },
  "Evaluated": {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
  },
  "Needs Revision": {
    icon: AlertCircle,
    className: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
  },
}

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon

  return (
    <Badge variant="outline" className={`${cfg.className} border`}>
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {status}
    </Badge>
  )
}

export function AdvisorEvaluationDetailPage({
  evaluationId,
  evaluationsListHref = "/dashboard/advisor/evaluations",
  evaluationsListLabel = "Back to Evaluations",
}: {
  evaluationId: string
  evaluationsListHref?: string
  evaluationsListLabel?: string
}) {
  const [group, setGroup] = React.useState<GroupEvaluationDetail | null>(null)

  React.useEffect(() => {
    const found = MOCK_GROUP_DETAILS.find((item) => item.id === evaluationId) ?? null
    setGroup(found)
  }, [evaluationId])

  const handleEvaluateNow = (studentId: string, capstone: "capstone1" | "capstone2") => {
    setGroup((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        students: prev.students.map((student) => {
          if (student.id !== studentId) return student

          if (capstone === "capstone2" && student.capstone1Status !== "Evaluated") {
            return student
          }

          const nextStatusKey = capstone === "capstone1" ? "capstone1Status" : "capstone2Status"
          const nextScoreKey = capstone === "capstone1" ? "capstone1Score" : "capstone2Score"

          if (student[nextStatusKey] !== "Pending Review") return student

          return {
            ...student,
            [nextStatusKey]: "Evaluated",
            [nextScoreKey]: 32,
            progress: Math.max(student.progress, 85),
          }
        }),
      }
    })

    const current = group?.students.find((student) => student.id === studentId)
    if (capstone === "capstone2" && current && current.capstone1Status !== "Evaluated") {
      toast.error("Capstone II is locked", {
        description: "Complete Capstone I evaluation for this student first.",
      })
      return
    }

    toast.success("Student evaluated", {
      description: `${capstone === "capstone1" ? "Capstone I" : "Capstone II"} evaluation recorded for this student.`,
    })
  }

  if (!group) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center min-h-[360px] text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Group Not Found</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            No group evaluation exists with ID: {evaluationId}
          </p>
          <Button asChild>
            <Link href={evaluationsListHref}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {evaluationsListLabel}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const pendingCount = group.students.filter((s) => s.capstone1Status === "Pending Review" || s.capstone2Status === "Pending Review").length
  const evaluatedCount = group.students.filter((s) => s.capstone1Status === "Evaluated" && s.capstone2Status === "Evaluated").length
  const avgProgress = Math.round(group.students.reduce((sum, s) => sum + s.progress, 0) / group.students.length)
  const completionRate = Math.round((evaluatedCount / group.students.length) * 100)

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardPageHeader
          title="Group Evaluation Details"
          description={`Track ${group.groupName} progress. Capstone II evaluation unlocks only after Capstone I is completed.`}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={evaluationsListHref}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={group.advisorStatus} />
            <Badge variant="outline">{group.capstoneStage}</Badge>
            <Badge variant="secondary">{group.students.length} students</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Group Name</p>
                  <p className="font-medium">{group.groupName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FolderKanban className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{group.projectTitle}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Submission Date</p>
                  <p className="font-medium">{new Date(group.submittedDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(group.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pending Students</p>
                <p className="text-2xl font-semibold text-amber-600">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Evaluated Students</p>
                <p className="text-2xl font-semibold text-emerald-600">{evaluatedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Average Progress</p>
                <p className="text-2xl font-semibold text-primary">{avgProgress}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-semibold text-primary">{completionRate}%</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Group Progress
          </CardTitle>
          <CardDescription>Milestone completion for this group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {group.milestones.map((milestone) => (
            <div key={milestone.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{milestone.title}</p>
                <Badge variant="outline" className="capitalize">{milestone.status.replace("_", " ")}</Badge>
              </div>
              <Progress value={milestone.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{milestone.progress}% complete</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Students In Group</CardTitle>
          <CardDescription>
            Evaluate students separately for Capstone I and Capstone II.
          </CardDescription>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.studentId}</TableCell>
                  <TableCell>
                    <div className="w-40 space-y-1">
                      <div className="text-xs text-muted-foreground">{student.progress}%</div>
                      <Progress value={student.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge status={student.capstone1Status} />
                      <p className="text-xs text-muted-foreground">
                        {student.capstone1Score != null ? `${student.capstone1Score}/40` : "No score yet"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge status={student.capstone2Status} />
                      <p className="text-xs text-muted-foreground">
                        {student.capstone2Score != null ? `${student.capstone2Score}/40` : "No score yet"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant={student.capstone1Status === "Pending Review" ? "default" : "outline"}
                        className="gap-1.5"
                        disabled={student.capstone1Status !== "Pending Review"}
                        onClick={() => handleEvaluateNow(student.id, "capstone1")}
                      >
                        <PlayCircle className="h-4 w-4" />
                        {student.capstone1Status === "Pending Review" ? "Evaluate C-I" : "C-I Done"}
                      </Button>
                      <Button
                        size="sm"
                        variant={student.capstone2Status === "Pending Review" && student.capstone1Status === "Evaluated" ? "default" : "outline"}
                        className="gap-1.5"
                        disabled={student.capstone2Status !== "Pending Review" || student.capstone1Status !== "Evaluated"}
                        onClick={() => handleEvaluateNow(student.id, "capstone2")}
                      >
                        <PlayCircle className="h-4 w-4" />
                        {student.capstone2Status === "Pending Review"
                          ? student.capstone1Status === "Evaluated" ? "Evaluate C-II" : "C-II Locked"
                          : "C-II Done"}
                      </Button>
                    </div>
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
