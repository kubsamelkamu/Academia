"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2,
  Circle,
  Plus,
  Filter,
  Hourglass,
  CheckCheck,
  ListChecks,
  CalendarDays,
  FolderKanban,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"
import { ProjectGroupTasksBoard } from "@/components/dashboard/student/project-group-tasks-board"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useMyProjectGroupTasks } from "@/lib/hooks/use-project-group-tasks"
import type { ProjectGroupTaskStatus } from "@/types/project-group-tasks"

type TaskListStatus = "completed" | "in-progress" | "pending"

export function StudentTimelinePage() {
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<"calendar" | "list" | "tasks">("list")
  const [focusedTaskStatus, setFocusedTaskStatus] = useState<ProjectGroupTaskStatus | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | ProjectGroupTaskStatus>("all")
  const [searchQuery, setSearchQuery] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [expandedCalendarDay, setExpandedCalendarDay] = useState<number | null>(null)

  const { data: myGroup } = useMyProjectGroup(Boolean(user?.id))
  const isGroupApproved = Boolean(myGroup?.status && myGroup.status.toUpperCase() === "APPROVED")
  const myTasksQuery = useMyProjectGroupTasks(Boolean(myGroup?.id) && isGroupApproved)
  const myTasksData = myTasksQuery.data

  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedCalendarDay(null)
  }, [calendarMonth])

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const totalTasksCount = myTasksData?.items?.length ?? 0
  const hasActiveFilters = filterStatus !== "all" || Boolean(searchQuery.trim())

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
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()

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
  }, [calendarMonth, myTasksData?.items])

  const calendarMonthLabel = useMemo(() => {
    return calendarMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  }, [calendarMonth])

  const isCurrentMonth = useMemo(() => {
    const now = new Date(currentTime)
    return (
      now.getFullYear() === calendarMonth.getFullYear() &&
      now.getMonth() === calendarMonth.getMonth()
    )
  }, [calendarMonth, currentTime])

  const todayStart = useMemo(() => {
    const now = new Date(currentTime)
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [currentTime])

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Project Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track tasks and progress throughout your project
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

      {/* Task Status Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card
          role={isGroupApproved ? "button" : undefined}
          tabIndex={isGroupApproved ? 0 : -1}
          aria-disabled={!isGroupApproved}
          title={!isGroupApproved ? "Your project group must be approved" : "View TODO tasks"}
          className={
            isGroupApproved
              ? "cursor-pointer hover:bg-muted/30"
              : "opacity-60 cursor-not-allowed"
          }
          onClick={() => {
            if (!isGroupApproved) return
            setFocusedTaskStatus("TODO")
            setActiveTab("tasks")
          }}
          onKeyDown={(e) => {
            if (!isGroupApproved) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setFocusedTaskStatus("TODO")
              setActiveTab("tasks")
            }
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">TODO</p>
                <p className="text-2xl font-bold">{taskMetrics.todo}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Circle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {taskMetrics.total > 0
                ? `${taskMetrics.todo} of ${taskMetrics.total} • ${Math.round((taskMetrics.todo / taskMetrics.total) * 100)}%`
                : "No tasks yet"}
            </p>
          </CardContent>
        </Card>

        <Card
          role={isGroupApproved ? "button" : undefined}
          tabIndex={isGroupApproved ? 0 : -1}
          aria-disabled={!isGroupApproved}
          title={!isGroupApproved ? "Your project group must be approved" : "View in-progress tasks"}
          className={
            isGroupApproved
              ? "cursor-pointer hover:bg-muted/30"
              : "opacity-60 cursor-not-allowed"
          }
          onClick={() => {
            if (!isGroupApproved) return
            setFocusedTaskStatus("IN_PROGRESS")
            setActiveTab("tasks")
          }}
          onKeyDown={(e) => {
            if (!isGroupApproved) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setFocusedTaskStatus("IN_PROGRESS")
              setActiveTab("tasks")
            }
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{taskMetrics.inProgress}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Hourglass className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {taskMetrics.total > 0
                ? `${taskMetrics.inProgress} of ${taskMetrics.total} • ${Math.round((taskMetrics.inProgress / taskMetrics.total) * 100)}%`
                : "No tasks yet"}
            </p>
          </CardContent>
        </Card>

        <Card
          role={isGroupApproved ? "button" : undefined}
          tabIndex={isGroupApproved ? 0 : -1}
          aria-disabled={!isGroupApproved}
          title={!isGroupApproved ? "Your project group must be approved" : "View completed tasks"}
          className={
            isGroupApproved
              ? "cursor-pointer hover:bg-muted/30"
              : "opacity-60 cursor-not-allowed"
          }
          onClick={() => {
            if (!isGroupApproved) return
            setFocusedTaskStatus("DONE")
            setActiveTab("tasks")
          }}
          onKeyDown={(e) => {
            if (!isGroupApproved) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setFocusedTaskStatus("DONE")
              setActiveTab("tasks")
            }
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{taskMetrics.done}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <CheckCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {taskMetrics.total > 0
                ? `${taskMetrics.done} of ${taskMetrics.total} • ${taskMetrics.percent}% overall complete`
                : "No tasks yet"}
            </p>
          </CardContent>
        </Card>
      </div>

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
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchQuery) {
                  e.preventDefault()
                  setSearchQuery("")
                }
              }}
            />
          </div>
        </div>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Calendar View
                </CardTitle>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="min-w-[140px] text-center text-sm font-medium">
                    {calendarMonthLabel}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date()
                      setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1))
                    }}
                    disabled={isCurrentMonth}
                    aria-label="Go to current month"
                    title={isCurrentMonth ? "Already viewing current month" : "Go to current month"}
                  >
                    Today
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }}
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                View your tasks by due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[42rem] grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {calendarCells.map((cell, i) => {
                  const dayNumber = cell.dayNumber
                  const isToday =
                    Boolean(dayNumber) &&
                    isCurrentMonth &&
                    dayNumber === todayStart.getDate()

                  const showAll = Boolean(dayNumber) && expandedCalendarDay === dayNumber
                  const visibleTasks = showAll ? cell.tasks : cell.tasks.slice(0, 3)
                  const hiddenCount = cell.tasks.length - visibleTasks.length

                  return (
                    <div
                      key={i}
                      className={
                        "bg-background p-2 min-h-[100px] border-t " +
                        (isToday ? "ring-1 ring-primary/40 bg-primary/5" : "")
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={
                            "text-sm " +
                            (dayNumber
                              ? isToday
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                              : "text-muted-foreground")
                          }
                        >
                          {dayNumber ?? ""}
                        </span>
                      </div>

                      {dayNumber && cell.tasks.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {visibleTasks.map((task) => {
                            const due = task.dueDate ? new Date(task.dueDate) : null
                            const dueStart =
                              due && !Number.isNaN(due.getTime())
                                ? new Date(due.getFullYear(), due.getMonth(), due.getDate())
                                : null
                            const isOverdue =
                              Boolean(dueStart) &&
                              task.status !== "DONE" &&
                              (dueStart as Date).getTime() < todayStart.getTime()

                            const styles = isOverdue
                              ? "bg-destructive/10 text-destructive"
                              : task.status === "DONE"
                                ? "bg-green-100 text-green-800"
                                : task.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"

                            const titleParts = [task.title]
                            if (isOverdue) titleParts.push("Overdue")
                            if (task.description) titleParts.push(task.description)

                            return (
                              <button
                                key={task.id}
                                type="button"
                                className={`${styles} w-full text-left text-xs p-1 rounded truncate hover:opacity-90`}
                                onClick={() => {
                                  setFocusedTaskStatus(task.status)
                                  setActiveTab("tasks")
                                }}
                                title={titleParts.join(" • ")}
                              >
                                {task.title}
                              </button>
                            )
                          })}

                          {hiddenCount > 0 ? (
                            <button
                              type="button"
                              className="text-[10px] text-muted-foreground hover:underline"
                              onClick={() => {
                                setExpandedCalendarDay(dayNumber)
                              }}
                            >
                              +{hiddenCount} more
                            </button>
                          ) : null}

                          {showAll && cell.tasks.length > 3 ? (
                            <button
                              type="button"
                              className="text-[10px] text-muted-foreground hover:underline"
                              onClick={() => setExpandedCalendarDay(null)}
                            >
                              Show less
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                  })}
                </div>
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
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  {isGroupApproved ? (
                    myTasksQuery.isLoading ? (
                      "Loading tasks…"
                    ) : myTasksQuery.isError ? (
                      "Couldn’t load tasks"
                    ) : (
                      <span>
                        Showing <span className="font-medium text-foreground">{filteredTasks.length}</span> of{" "}
                        <span className="font-medium text-foreground">{totalTasksCount}</span>
                      </span>
                    )
                  ) : (
                    ""
                  )}
                </div>

                {isGroupApproved && !myTasksQuery.isLoading && !myTasksQuery.isError ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {filterStatus !== "all" ? (
                      <Badge variant="secondary" className="text-xs">
                        Status: {filterStatus.replaceAll("_", " ")}
                      </Badge>
                    ) : null}
                    {searchQuery.trim() ? (
                      <Badge variant="secondary" className="text-xs">
                        Search: “{searchQuery.trim()}”
                      </Badge>
                    ) : null}
                    {hasActiveFilters ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setFilterStatus("all")
                        }}
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                {!isGroupApproved ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Tasks unavailable</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Your project group must be approved to view tasks.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : myTasksQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`task-skeleton-${idx}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      aria-busy="true"
                      aria-label="Loading tasks"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                        <div>
                          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                          <div className="mt-2 h-3 w-64 rounded bg-muted animate-pulse" />
                        </div>
                      </div>
                      <div className="h-6 w-20 rounded bg-muted animate-pulse" />
                    </div>
                  ))
                ) : myTasksQuery.isError ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Couldn’t load tasks</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {myTasksQuery.error?.message ?? "Please try again."}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => myTasksQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  (myTasksData?.items ?? []).length === 0 ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                      <div className="flex items-center gap-3">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">No tasks yet</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Create your first task from the Tasks tab.
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFocusedTaskStatus(null)
                          setActiveTab("tasks")
                        }}
                      >
                        Go to Tasks
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                      <div className="flex items-center gap-3">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">No matching tasks</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Try clearing the search or status filter.
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setFilterStatus("all")
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  )
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setFocusedTaskStatus(task.status)
                        setActiveTab("tasks")
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setFocusedTaskStatus(task.status)
                          setActiveTab("tasks")
                        }
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
                          {task.description ? (
                            <div
                              className="text-xs text-muted-foreground mt-1 line-clamp-1"
                              title={task.description}
                            >
                              {task.description}
                            </div>
                          ) : null}
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
                  ))
                )}
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