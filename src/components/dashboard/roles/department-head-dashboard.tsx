 "use client"

import React from "react"
import Link from "next/link"
import StatCard from "@/components/shared/StatCard"
import DataTable, { type Column } from "@/components/shared/DataTable"
import StatusBadge from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  UserCheck,
  GraduationCap,
  Download,
  RefreshCw,
} from "lucide-react"
import {
  mockUsers,
  mockProjects,
  mockGrades,
  type User,
  type Grade,
} from "@/data/mockData"
import { toast } from "sonner"

export function DepartmentHeadDashboard() {
  const departmentUsers = mockUsers.filter((u) => u.departmentId === "dept1")
  const students = departmentUsers.filter(
    (u) => u.role === "student" || u.role === "group_manager",
  )
  const advisors = departmentUsers.filter((u) => u.role === "advisor")

  const pendingProjectGrades = mockGrades.filter((g) => g.status === "provisional")

  const handleApproveGrades = () => {
    toast.success("Grades approved for publication", {
      description:
        "All provisional grades have been marked as approved and queued for final publication.",
    })
  }

  const handleResetPassword = (userId: string) => {
    const user = departmentUsers.find((u) => u.id === userId)
    toast.message("Password reset link sent", {
      description: user
        ? `A reset link has been sent to ${user.email}.`
        : "A reset link has been sent to the selected user.",
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

  const userColumns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {u.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <span className="text-sm capitalize">
          {u.role.replace(/_/g, " ").replace(/dc committee/i, "DC Committee")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => handleResetPassword(u.id)}
          >
            <RefreshCw className="h-3 w-3" />
            <span className="text-xs">Reset</span>
          </Button>
        </div>
      ),
    },
  ]

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground shadow-sm">
        <div className="relative z-10 space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
            Department overview
          </p>
          <h2 className="text-xl font-semibold tracking-tight">
            Computer Science Department
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Academic year 2024–2025 • Stanford University
          </p>
        </div>
        <GraduationCap className="absolute right-6 top-1/2 h-20 w-20 -translate-y-1/2 text-primary-foreground/20" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={students.length * 40}
          subtitle="Active in department"
          icon={Users}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Advisors"
          value={advisors.length * 5}
          subtitle="Faculty members"
          icon={UserCheck}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
        />
        <StatCard
          title="Active Projects"
          value={mockProjects.length * 15}
          subtitle="In progress"
          icon={FolderOpen}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingProjectGrades.length}
          subtitle="Grades to review"
          icon={ClipboardCheck}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
        />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Department Users</TabsTrigger>
          <TabsTrigger value="grades">Review & Approval</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">
                  Department Users
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Faculty, coordinators, and students in your department.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/department-head/faculty" className="gap-2">
                    <Users className="h-4 w-4" />
                    View users
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/department-head/invitations" className="gap-2">
                    <Users className="h-4 w-4" />
                    Add user
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={departmentUsers.slice(0, 5)}
                columns={userColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Project grades pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {pendingProjectGrades.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Awaiting department approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">
                  Grade approval actions
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review and approve or reject project grades from coordinators.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-2"
                disabled={pendingProjectGrades.length === 0}
                onClick={handleApproveGrades}
              >
                <ClipboardCheck className="h-4 w-4" />
                Approve all provisional
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-medium">Review final project grades</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Approve or reject project grades from coordinators.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/department-head/grades" className="gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Review
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold">
                Recent pending grades
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/department-head/grades">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={pendingProjectGrades.slice(0, 5)}
                columns={gradeColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold">
                Department reports
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/department-head/reports" className="gap-2">
                  View reports
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Student progress report",
                    description: "Overview of all student project progress.",
                    icon: Users,
                  },
                  {
                    title: "Advisor workload report",
                    description: "Distribution of projects per advisor.",
                    icon: UserCheck,
                  },
                  {
                    title: "Grade distribution",
                    description: "Statistical analysis of project and internship grades.",
                    icon: ClipboardCheck,
                  },
                  {
                    title: "Completion timeline",
                    description: "Project completion trends across the department.",
                    icon: FolderOpen,
                  },
                ].map((report) => (
                  <div
                    key={report.title}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <report.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{report.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() =>
                        toast.message("Report download started", {
                          description: `${report.title} is being prepared for download.`,
                        })
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-dashed border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-50">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white dark:bg-emerald-400">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">DC committee member</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              As a department head, you are also a member of the Decision Committee. You
              can access the DC committee dashboard to review project titles and
              evaluations.
            </p>
            <Button variant="link" size="sm" className="mt-1 px-0 text-emerald-700" asChild>
              <Link href="/dashboard/department-committee/assigned-projects">
                Go to DC committee dashboard →
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

