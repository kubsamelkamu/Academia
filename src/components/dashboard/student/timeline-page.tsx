"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  CheckCircle2,
  Circle,
  Flag,
  Plus,
  Filter,
  Hourglass,
  CheckCheck,
  ListChecks,
  BarChart3,
  CalendarDays,
  FolderKanban,
  Search
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStudentProjects, useProjectMilestones } from "@/lib/hooks/use-student-milestones"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { getTemplateDueDate } from "@/lib/milestone-template-dates"
import { useAuthStore } from "@/store/auth-store"
import { ProjectGroupTasksBoard } from "@/components/dashboard/student/project-group-tasks-board"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useMyProjectGroupTasks } from "@/lib/hooks/use-project-group-tasks"
import type { ProjectGroupTaskStatus } from "@/types/project-group-tasks"

type TaskListStatus = "completed" | "in-progress" | "pending"

function normalizeMilestoneName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

export function StudentTimelinePage() {
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<"calendar" | "list" | "tasks">("list")
  const [focusedTaskStatus, setFocusedTaskStatus] = useState<ProjectGroupTaskStatus | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | ProjectGroupTaskStatus>("all")
  const [searchQuery, setSearchQuery] = useState('')

  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null

  const { data: projectsData } = useStudentProjects({
    departmentId,
    studentId,
  })

  const { data: templatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 100,
  })

  const { data: myGroup } = useMyProjectGroup(Boolean(user?.id))
  const isGroupApproved = Boolean(myGroup?.status && myGroup.status.toUpperCase() === "APPROVED")
  const { data: myTasksData } = useMyProjectGroupTasks(Boolean(myGroup?.id) && isGroupApproved)

  const activeProject = useMemo(() => {
    const items = projectsData?.items ?? []
    if (!items.length) return null

    return (
      items.find((project) => project.status.toLowerCase() === "in-progress") ??
      items.find((project) => project.status.toLowerCase() === "active") ??
      items[0]
    )
  }, [projectsData?.items])

  const { data: milestonesData } = useProjectMilestones({
    projectId: activeProject?.id,
    enabled: Boolean(activeProject?.id),
  })

  const mergedMilestones = useMemo(() => {
    const templateMilestones = (templatesData?.templates ?? [])
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((template) => ({
        id: template.templateId,
        title: template.name,
        dueDate: getTemplateDueDate(template),
        status: "pending",
      }))

    const projectMilestonesByName = new Map(
      (milestonesData?.items ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title),
        milestone,
      ])
    )

    if (templateMilestones.length) {
      return templateMilestones.map((templateMilestone) => {
        const matchedProjectMilestone = projectMilestonesByName.get(
          normalizeMilestoneName(templateMilestone.title)
        )

        if (!matchedProjectMilestone) return templateMilestone

        return {
          id: matchedProjectMilestone.id,
          title: templateMilestone.title,
          dueDate: matchedProjectMilestone.dueDate,
          status: matchedProjectMilestone.status,
          submittedAt: matchedProjectMilestone.submittedAt,
        }
      })
    }

    return (milestonesData?.items ?? []).map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      dueDate: milestone.dueDate,
      status: milestone.status,
      submittedAt: milestone.submittedAt,
    }))
  }, [milestonesData?.items, templatesData?.templates])

  // Mock data - would come from API in production
  const defaultProjectInfo = {
    name: "AI Research Project",
    startDate: "2024-01-15",
    endDate: "2024-05-30",
    progress: 65,
    daysRemaining: 45,
    totalTasks: 24,
    completedTasks: 16,
    milestones: 8,
    completedMilestones: 5
  }

  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const projectInfo = useMemo(() => {
    if (!activeProject) {
      return defaultProjectInfo
    }

    const milestones = mergedMilestones
    const totalMilestones = milestones.length
    const completedMilestones = milestones.filter((milestone) => {
      const status = milestone.status.toLowerCase()
      return (
        status === "approved" ||
        status === "submitted" ||
        status === "completed"
      )
    }).length

    const progress =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0

    const milestoneDates = milestones
      .map((milestone) => new Date(milestone.dueDate))
      .filter((date) => !Number.isNaN(date.getTime()))

    const earliestMilestoneDate = milestoneDates.length
      ? new Date(Math.min(...milestoneDates.map((date) => date.getTime())))
      : null

    const latestDueDate = milestoneDates.length
      ? new Date(Math.max(...milestoneDates.map((date) => date.getTime())))
      : null

    const endDate = latestDueDate
      ? latestDueDate.toISOString()
      : defaultProjectInfo.endDate

    const daysRemaining = latestDueDate
      ? Math.max(0, Math.ceil((latestDueDate.getTime() - currentTime) / (1000 * 60 * 60 * 24)))
      : defaultProjectInfo.daysRemaining

    return {
      name: activeProject.title || defaultProjectInfo.name,
      startDate: earliestMilestoneDate
        ? earliestMilestoneDate.toISOString()
        : defaultProjectInfo.startDate,
      endDate,
      progress,
      daysRemaining,
      totalTasks: defaultProjectInfo.totalTasks,
      completedTasks: defaultProjectInfo.completedTasks,
      milestones: totalMilestones,
      completedMilestones,
    }
  }, [activeProject, mergedMilestones, currentTime, defaultProjectInfo])

  const milestonesProgress =
    projectInfo.milestones > 0
      ? (projectInfo.completedMilestones / projectInfo.milestones) * 100
      : 0

  const taskMetrics = useMemo(() => {
    const tasks = myTasksData?.items ?? []

    const counts: Record<ProjectGroupTaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    }

    for (const task of tasks) {
      counts[task.status] += 1
    }

    const total = tasks.length
    const done = counts.DONE
    const percent = total > 0 ? Math.round((done / total) * 100) : 0

    return {
      total,
      todo: counts.TODO,
      inProgress: counts.IN_PROGRESS,
      done,
      percent,
    }
  }, [myTasksData?.items])

  useEffect(() => {
    if (activeTab !== "tasks" && focusedTaskStatus) {
      setFocusedTaskStatus(null)
    }
  }, [activeTab, focusedTaskStatus])

  const getStatusIcon = (status: TaskListStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in-progress': return <Hourglass className="h-4 w-4 text-blue-500" />
      case 'pending': return <Circle className="h-4 w-4 text-gray-400" />
      default: return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TaskListStatus) => {
    const styles = {
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending': 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return styles[status] || styles.pending
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const mapTaskStatusToListStatus = (status: ProjectGroupTaskStatus): TaskListStatus => {
    if (status === "DONE") return "completed"
    if (status === "IN_PROGRESS") return "in-progress"
    return "pending"
  }

  const filteredTasks = useMemo(() => {
    const tasks = myTasksData?.items ?? []
    const q = searchQuery.trim().toLowerCase()

    return tasks.filter((task) => {
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        (task.id && task.id.toLowerCase().includes(q))

      const matchesStatus = filterStatus === "all" || task.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [filterStatus, myTasksData?.items, searchQuery])

  const getMemberNameById = (userId: string | null) => {
    if (!userId) return "Unassigned"

    if (myGroup?.leader?.id === userId) {
      const leaderName = `${myGroup.leader.firstName} ${myGroup.leader.lastName}`.trim()
      return leaderName || "Leader"
    }

    const member = myGroup?.members?.find((m) => m.user.id === userId)
    if (member) {
      const name = `${member.user.firstName} ${member.user.lastName}`.trim()
      return name || member.user.email || "Member"
    }

    return "Unknown"
  }

  const calendarCells = useMemo(() => {
    const now = new Date(currentTime)
    const year = now.getFullYear()
    const month = now.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const leadingEmptyCells = firstDayOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const tasksByDay = new Map<number, typeof filteredTasks>()

    for (const task of myTasksData?.items ?? []) {
      if (!task.dueDate) continue
      const due = new Date(task.dueDate)
      if (Number.isNaN(due.getTime())) continue
      if (due.getFullYear() !== year || due.getMonth() !== month) continue

      const day = due.getDate()
      const existing = tasksByDay.get(day)
      if (existing) {
        existing.push(task)
      } else {
        tasksByDay.set(day, [task])
      }
    }

    return Array.from({ length: 35 }).map((_, idx) => {
      const dayNumber = idx - leadingEmptyCells + 1

      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { dayNumber: null as number | null, tasks: [] as typeof filteredTasks }
      }

      return {
        dayNumber,
        tasks: (tasksByDay.get(dayNumber) ?? []).slice(),
      }
    })
  }, [currentTime, myTasksData?.items])

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Project Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track milestones, tasks, and progress throughout your project
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setFocusedTaskStatus(null)
              setActiveTab("tasks")
            }}
            className="gap-2"
            disabled={!isGroupApproved}
            title={!isGroupApproved ? "Your project group must be approved" : "Add a task"}
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("TODO")}>TODO</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("IN_PROGRESS")}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("DONE")}>Done</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{taskMetrics.percent}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={taskMetrics.percent} className="mt-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {taskMetrics.done}/{taskMetrics.total} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
                <p className="text-2xl font-bold">{projectInfo.daysRemaining}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Hourglass className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: {formatDate(projectInfo.endDate)}
            </p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:bg-muted/30"
          onClick={() => {
            setFocusedTaskStatus(null)
            setActiveTab("tasks")
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setFocusedTaskStatus(null)
              setActiveTab("tasks")
            }
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">{taskMetrics.done}/{taskMetrics.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>

            <Progress value={taskMetrics.percent} className="mt-4" />

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                className="rounded-md border bg-background px-2 py-1 text-left hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  setFocusedTaskStatus("TODO")
                  setActiveTab("tasks")
                }}
                disabled={!isGroupApproved}
                title={!isGroupApproved ? "Your group must be approved" : "View TODO tasks"}
              >
                <div className="text-muted-foreground">TODO</div>
                <div className="font-semibold">{taskMetrics.todo}</div>
              </button>

              <button
                type="button"
                className="rounded-md border bg-background px-2 py-1 text-left hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  setFocusedTaskStatus("IN_PROGRESS")
                  setActiveTab("tasks")
                }}
                disabled={!isGroupApproved}
                title={!isGroupApproved ? "Your group must be approved" : "View in-progress tasks"}
              >
                <div className="text-muted-foreground">In Progress</div>
                <div className="font-semibold">{taskMetrics.inProgress}</div>
              </button>

              <button
                type="button"
                className="rounded-md border bg-background px-2 py-1 text-left hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  setFocusedTaskStatus("DONE")
                  setActiveTab("tasks")
                }}
                disabled={!isGroupApproved}
                title={!isGroupApproved ? "Your group must be approved" : "View completed tasks"}
              >
                <div className="text-muted-foreground">Completed</div>
                <div className="font-semibold">{taskMetrics.done}</div>
              </button>
            </div>

            {!isGroupApproved ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Your project group must be approved to manage tasks.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Milestones</p>
                <p className="text-2xl font-bold">{projectInfo.completedMilestones}/{projectInfo.milestones}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Flag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Progress value={milestonesProgress} className="mt-4" />
          </CardContent>
        </Card>
      </div>

      {/* View Mode Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const next = value as typeof activeTab
          setActiveTab(next)

          if (next !== "tasks") setFocusedTaskStatus(null)
        }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Calendar View
              </CardTitle>
              <CardDescription>
                View your tasks by due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarCells.map((cell, i) => {
                  return (
                    <div key={i} className="bg-background p-2 min-h-[100px] border-t">
                      <span className="text-sm text-muted-foreground">{cell.dayNumber ?? ""}</span>
                      {cell.dayNumber && cell.tasks.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {cell.tasks.slice(0, 3).map((task) => {
                            const styles =
                              task.status === "DONE"
                                ? "bg-green-100 text-green-800"
                                : task.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"

                            return (
                              <button
                                key={task.id}
                                type="button"
                                className={`${styles} w-full text-left text-xs p-1 rounded truncate hover:opacity-90`}
                                onClick={() => {
                                  setFocusedTaskStatus(task.status)
                                  setActiveTab("tasks")
                                }}
                                title={task.title}
                              >
                                {task.title}
                              </button>
                            )
                          })}
                          {cell.tasks.length > 3 ? (
                            <div className="text-[10px] text-muted-foreground">
                              +{cell.tasks.length - 3} more
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                All Tasks
              </CardTitle>
              <CardDescription>
                Complete list of all project group tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setFocusedTaskStatus(task.status)
                      setActiveTab("tasks")
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(mapTaskStatusToListStatus(task.status))}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          <Badge variant="outline" className="text-xs">
                            task
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Due: {task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                          <span>Assignee: {getMemberNameById(task.assignedToUserId)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusBadge(mapTaskStatusToListStatus(task.status))}>
                      {task.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ProjectGroupTasksBoard
            enabled={Boolean(user?.id) && activeTab === "tasks"}
            focusedStatus={focusedTaskStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}