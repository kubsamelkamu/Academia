"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Download,
  RefreshCw,
  FolderKanban,
  ArrowRight,
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"

type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

type StudentEval = {
  id: string
  name: string
  studentId: string
  status: EvaluationStatus
}

type GroupEvaluationRow = {
  id: string
  groupName: string
  projectTitle: string
  capstoneStage: "Capstone I" | "Capstone II"
  status: EvaluationStatus
  submittedDate: string
  dueDate?: string
  priority: "High" | "Medium" | "Low"
  members: StudentEval[]
}

const evaluationData: GroupEvaluationRow[] = [
  {
    id: "grp-1",
    groupName: "AI Research Group",
    projectTitle: "Machine Learning applied to Smart Grids",
    capstoneStage: "Capstone I",
    status: "Pending Review",
    submittedDate: "2024-05-10",
    dueDate: "2024-05-17",
    priority: "High",
    members: [
      { id: "stu-1", name: "Alex Mercer", studentId: "STU-2024-001", status: "Pending Review" },
      { id: "stu-2", name: "Maria Garcia", studentId: "STU-2024-002", status: "Evaluated" },
      { id: "stu-3", name: "Liam Johnson", studentId: "STU-2024-003", status: "Pending Review" },
    ],
  },
  {
    id: "grp-2",
    groupName: "Blockchain Team",
    projectTitle: "Blockchain for Supply Chain Transparency",
    capstoneStage: "Capstone II",
    status: "Evaluated",
    submittedDate: "2024-05-08",
    priority: "Medium",
    members: [
      { id: "stu-4", name: "Sophia Chen", studentId: "STU-2024-004", status: "Evaluated" },
      { id: "stu-5", name: "James Wilson", studentId: "STU-2024-005", status: "Evaluated" },
      { id: "stu-6", name: "Noah Davis", studentId: "STU-2024-006", status: "Evaluated" },
    ],
  },
  {
    id: "grp-3",
    groupName: "IoT Builders",
    projectTitle: "IoT Home Automation Prototype",
    capstoneStage: "Capstone I",
    status: "Needs Revision",
    submittedDate: "2024-05-12",
    dueDate: "2024-05-19",
    priority: "High",
    members: [
      { id: "stu-7", name: "Olivia White", studentId: "STU-2024-007", status: "Needs Revision" },
      { id: "stu-8", name: "Ethan Brown", studentId: "STU-2024-008", status: "Pending Review" },
      { id: "stu-9", name: "Ava Clark", studentId: "STU-2024-009", status: "Pending Review" },
      { id: "stu-10", name: "Mason Hall", studentId: "STU-2024-010", status: "Evaluated" },
    ],
  },
  {
    id: "grp-4",
    groupName: "Cloud Scale Team",
    projectTitle: "Cloud-native Microservices Architecture",
    capstoneStage: "Capstone II",
    status: "Pending Review",
    submittedDate: "2024-05-15",
    dueDate: "2024-05-22",
    priority: "Low",
    members: [
      { id: "stu-11", name: "Emma Walker", studentId: "STU-2024-011", status: "Pending Review" },
      { id: "stu-12", name: "Logan Young", studentId: "STU-2024-012", status: "Pending Review" },
    ],
  },
]

export function AdvisorEvaluationsPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = React.useState(false)
  const allStudents = evaluationData.flatMap((group) => group.members)
  const pendingStudents = allStudents.filter((student) => student.status === "Pending Review").length
  const evaluatedStudents = allStudents.filter((student) => student.status === "Evaluated").length
  const groupsNeedingAttention = evaluationData.filter((group) => group.status !== "Evaluated").length
  const completionRate = allStudents.length > 0 ? Math.round((evaluatedStudents / allStudents.length) * 100) : 0

  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.success("Group evaluations refreshed")
  }

  const handleExport = () => {
    toast.success("Export started", {
      description: "Group evaluation summary will be downloaded shortly.",
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardPageHeader
          title="Group Evaluations"
          description="Review evaluations by group, track progress, and evaluate pending students."
          badge={`${evaluationData.length} Groups`}
        />

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluationData.length}</div>
            <p className="text-xs text-muted-foreground">Assigned to advisor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingStudents}</div>
            <p className="text-xs text-muted-foreground">Need evaluation now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evaluated Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{evaluatedStudents}</div>
            <p className="text-xs text-muted-foreground">{completionRate}% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Groups Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{groupsNeedingAttention}</div>
            <p className="text-xs text-muted-foreground">Pending or revision groups</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-5 w-5 text-primary" /> Capstone I
            </CardTitle>
            <CardDescription>
              Proposal, SDD, and early architecture evaluation for first-semester groups.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Start with proposal review and move to detailed student evaluation.
            </div>
            <Button asChild className="gap-1.5">
              <Link href="/dashboard/advisor/evaluations/capstone-i">
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-5 w-5 text-emerald-600" /> Capstone II
            </CardTitle>
            <CardDescription>
              Implementation, testing, and final defense evaluation for second-semester groups.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Use this page when Capstone I is complete and Capstone II reviews are ready.
            </div>
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/dashboard/advisor/evaluations/capstone-ii">
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
