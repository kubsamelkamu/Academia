"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Download,
  RefreshCw,
  FolderKanban,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardPageHeader
          title="Evaluations Hub"
          description="Centralized evaluation management. Track student progress and review capstone submissions."
          badge={`${evaluationData.length} Active Groups`}
        />

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="rounded-full">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExport} className="rounded-full">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{evaluationData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active projects assigned</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Students</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{completionRate}%</div>
            <Progress value={completionRate} className="h-1.5 mt-2 bg-emerald-100" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-rose-500/10 to-transparent">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">{groupsNeedingAttention}</div>
            <p className="text-xs text-muted-foreground mt-1">Groups with pending tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="group relative overflow-hidden border-primary/20 bg-card hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <FolderKanban className="h-24 w-24 text-primary" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Phase 1</Badge>
            </div>
            <CardTitle className="text-2xl">Capstone I</CardTitle>
            <CardDescription className="text-base">
              Focus on proposal validation, problem statement clarity, and SDD readiness.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Review research methodology
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Approve project scope & feasibility
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Evaluate individual contributions
              </li>
            </ul>
            <Button asChild className="w-full group/btn py-6 text-lg shadow-lg shadow-primary/20">
              <Link href="/dashboard/advisor/evaluations/capstone-i">
                Enter Capstone I <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-primary/20 bg-card hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-24 w-24 text-primary" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Phase 2</Badge>
            </div>
            <CardTitle className="text-2xl">Capstone II</CardTitle>
            <CardDescription className="text-base">
              Evaluate implementation quality, system testing, and final defense performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Verify technical implementation
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Review testing results & documentation
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Grade final oral defense
              </li>
            </ul>
            <Button asChild variant="outline" className="w-full group/btn py-6 text-lg border-primary/50 hover:bg-primary/5 text-primary">
              <Link href="/dashboard/advisor/evaluations/capstone-ii">
                Enter Capstone II <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Upcoming Deadlines</span>
          </div>
          <CardTitle className="text-xl">Evaluation Schedule</CardTitle>
          <CardDescription>
            Keep track of group submission deadlines and evaluation windows.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <div className="divide-y border-t">
            {evaluationData.filter(g => g.dueDate).map((group) => (
              <div key={group.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    group.priority === "High" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{group.groupName}</p>
                    <p className="text-xs text-muted-foreground">{group.projectTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${group.priority === "High" ? "text-rose-600" : "text-blue-600"}`}>
                    {group.dueDate}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Due Date</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
