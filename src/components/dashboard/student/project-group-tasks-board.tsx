"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import Checkbox from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api/errors"
import { useAuthStore } from "@/store/auth-store"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import {
  useCreateMyProjectGroupTask,
  useDeleteMyProjectGroupTask,
  useMyProjectGroupTask,
  useMyProjectGroupTasks,
  useUpdateMyProjectGroupTask,
  useUpdateMyProjectGroupTaskAssignee,
  useUpdateMyProjectGroupTaskStatus,
} from "@/lib/hooks/use-project-group-tasks"
import type {
  ProjectGroupTaskListItem,
  ProjectGroupTaskStatus,
} from "@/types/project-group-tasks"
import {
  createMyProjectGroupTask,
  getMyProjectGroupTask,
  updateMyProjectGroupTaskAssignee,
  updateMyProjectGroupTaskStatus,
} from "@/lib/api/project-group-tasks"
import { projectGroupTaskKeys } from "@/lib/hooks/use-project-group-tasks"
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import {
  MoreHorizontal,
  Plus,
  Trash2,
  Pencil,
  UserRound,
  CalendarDays,
  Loader2,
  Search,
} from "lucide-react"

const STATUSES: ProjectGroupTaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
}

function toDateOnly(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function dateOnlyToIso(dateOnly: string): string | null {
  const trimmed = dateOnly.trim()
  if (!trimmed) return null
  const date = new Date(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function formatStatus(status: ProjectGroupTaskStatus): string {
  return status.replace("_", " ")
}

function statusBadgeVariant(status: ProjectGroupTaskStatus): { className: string } {
  if (status === "DONE") return { className: "bg-green-100 text-green-800 border-green-200" }
  if (status === "IN_PROGRESS") return { className: "bg-blue-100 text-blue-800 border-blue-200" }
  return { className: "bg-gray-100 text-gray-800 border-gray-200" }
}

function isApprovedGroupStatus(status?: string | null): boolean {
  if (!status) return false
  return status.toUpperCase() === "APPROVED"
}

export function ProjectGroupTasksBoard({
  enabled,
  focusedStatus,
}: {
  enabled: boolean
  focusedStatus?: ProjectGroupTaskStatus | null
}) {
  const user = useAuthStore((state) => state.user)
  const myUserId = user?.id ?? null

  const queryClient = useQueryClient()

  const {
    data: group,
    isLoading: isGroupLoading,
    isError: isGroupError,
    error: groupError,
  } = useMyProjectGroup(enabled)

  const isGroupApproved = isApprovedGroupStatus(group?.status)
  const isLeader = Boolean(myUserId && group?.leaderUserId && myUserId === group.leaderUserId)

  const [searchQuery, setSearchQuery] = useState("")
  const [onlyMyTasks, setOnlyMyTasks] = useState(false)

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<ProjectGroupTaskStatus | null>(null)

   
  const memberOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; avatarUrl: string | null }> = []

    if (group?.leader?.id) {
      const leaderName = `${group.leader.firstName} ${group.leader.lastName}`.trim()
      options.push({ id: group.leader.id, label: leaderName || group.leader.email, avatarUrl: group.leader.avatarUrl ?? null })
    }

    for (const member of group?.members ?? []) {
      const name = `${member.user.firstName} ${member.user.lastName}`.trim()
      options.push({ id: member.user.id, label: name || member.user.email, avatarUrl: member.user.avatarUrl ?? null })
    }

    const unique = new Map<string, { id: string; label: string; avatarUrl: string | null }>()
    for (const option of options) {
      if (!option.id) continue
      unique.set(option.id, option)
    }

    return Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [group])

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
  } = useMyProjectGroupTasks(enabled && Boolean(group?.id) && isGroupApproved)

  const createMutation = useCreateMyProjectGroupTask()
  const deleteMutation = useDeleteMyProjectGroupTask()

  const [showCreate, setShowCreate] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createDueDate, setCreateDueDate] = useState("")
  const [createAssignee, setCreateAssignee] = useState<string>("")

  const tasks = useMemo(() => tasksData?.items ?? [], [tasksData?.items])

  const trimmedSearch = searchQuery.trim()

  // When searching, fetch task details for description search.
  const descriptionQueries = useQueries({
    queries: tasks.map((t) => ({
      queryKey: projectGroupTaskKeys().detail(t.id),
      queryFn: () => getMyProjectGroupTask(t.id),
      enabled: Boolean(trimmedSearch) && enabled && isGroupApproved,
      staleTime: 10_000,
      retry: false,
    })),
  })

  const descriptionById = useMemo(() => {
    const map = new Map<string, string>()
    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i]
      const description = (descriptionQueries[i]?.data as { task?: { description?: string | null } } | undefined)?.task?.description
      if (typeof description === "string") {
        map.set(task.id, description)
      }
    }
    return map
  }, [tasks, descriptionQueries])

  const filteredTasks = useMemo(() => {
    const q = trimmedSearch.toLowerCase()

    return tasks.filter((task) => {
      if (onlyMyTasks && myUserId) {
        if (task.assignedToUserId !== myUserId) return false
      }

      if (!q) return true

      const title = task.title.toLowerCase()
      const description = (descriptionById.get(task.id) ?? "").toLowerCase()
      return title.includes(q) || description.includes(q)
    })
  }, [tasks, trimmedSearch, onlyMyTasks, myUserId, descriptionById])

  const tasksByStatus = useMemo(() => {
    const buckets: Record<ProjectGroupTaskStatus, ProjectGroupTaskListItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    }

    for (const item of filteredTasks) {
      buckets[item.status]?.push(item)
    }

    for (const status of STATUSES) {
      buckets[status].sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY
        return aDue - bDue
      })
    }

    return buckets
  }, [filteredTasks])

  const statusMutation = useMutation({
    mutationFn: async (params: { taskId: string; status: ProjectGroupTaskStatus }) =>
      updateMyProjectGroupTaskStatus(params.taskId, params.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
    },
  })

  const assigneeMutation = useMutation({
    mutationFn: async (params: { taskId: string; assignedToUserId?: string | null }) =>
      updateMyProjectGroupTaskAssignee(params.taskId, params.assignedToUserId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
    },
  })

  const handleDropToStatus = async (nextStatus: ProjectGroupTaskStatus) => {
    if (!draggingTaskId) return
    const task = tasks.find((t) => t.id === draggingTaskId)
    setDraggingTaskId(null)
    setDragOverStatus(null)
    if (!task) return
    if (task.status === nextStatus) return

    const isAssignee = Boolean(myUserId && task.assignedToUserId && myUserId === task.assignedToUserId)
    const canChangeStatus = isLeader || isAssignee

    if (!canChangeStatus) {
      toast.error("You don't have permission to change this task status.")
      return
    }

    try {
      // Auto-assign behavior: ONLY possible for leader due to backend permission.
      if (
        isLeader &&
        nextStatus === "IN_PROGRESS" &&
        !task.assignedToUserId &&
        myUserId
      ) {
        await assigneeMutation.mutateAsync({ taskId: task.id, assignedToUserId: myUserId })
      }

      await statusMutation.mutateAsync({ taskId: task.id, status: nextStatus })
      toast.success("Status updated")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleQuickAdd = async (status: ProjectGroupTaskStatus, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return

    // Jira-like quick add: create then (optionally) move into target status.
    const defaultAssignee = (() => {
      if ((status === "IN_PROGRESS" || status === "DONE") && myUserId && !isLeader) return myUserId
      return null
    })()

    try {
      const result = await createMyProjectGroupTask({
        title: trimmed,
        description: null,
        dueDate: null,
        assignedToUserId: defaultAssignee,
      })

      // If we want it in a non-default column, attempt to update status.
      if (status !== "TODO") {
        const canChange = isLeader || (myUserId && result.task.assignedToUserId === myUserId)
        if (canChange) {
          await statusMutation.mutateAsync({ taskId: result.task.id, status })
        }
      }

      await queryClient.invalidateQueries({ queryKey: projectGroupTaskKeys().root })
      toast.success("Task created")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleCreate = async () => {
    if (!createTitle.trim()) return

    const assignedToUserId = (() => {
      const trimmed = createAssignee.trim()
      if (!trimmed) return null
      return trimmed
    })()

    // Non-leader members can only assign to themselves.
    if (assignedToUserId && !isLeader && myUserId && assignedToUserId !== myUserId) {
      toast.error("Only the group leader can assign tasks to other members.")
      return
    }

    try {
      await createMutation.mutateAsync({
        title: createTitle.trim(),
        description: createDescription.trim() ? createDescription.trim() : null,
        dueDate: dateOnlyToIso(createDueDate),
        assignedToUserId,
      })

      toast.success("Task created")
      setShowCreate(false)
      setCreateTitle("")
      setCreateDescription("")
      setCreateDueDate("")
      setCreateAssignee("")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const approvedOrLoading = isGroupLoading || isGroupApproved

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Group Tasks</CardTitle>
          <CardDescription>Sign in to view your group tasks.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isGroupError) {
    const message = getErrorMessage(groupError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load your project group</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  if (!approvedOrLoading) {
    return (
      <Alert>
        <AlertTitle>Group not approved</AlertTitle>
        <AlertDescription>
          Your project group must be approved before you can manage tasks.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Group Tasks (Kanban)</h2>
          <p className="text-sm text-muted-foreground">
            Manage tasks for your approved project group.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks…"
              className="pl-9"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
            <Checkbox
              checked={onlyMyTasks}
              onCheckedChange={(checked) => setOnlyMyTasks(Boolean(checked))}
              disabled={!Boolean(myUserId)}
            />
            Only my tasks
          </label>

          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2"
            disabled={!isGroupApproved || createMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {(isTasksError || isTasksLoading) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isTasksLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading tasks…
                </>
              ) : (
                <>Failed to load tasks: {getErrorMessage(tasksError)}</>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isTasksLoading && !isTasksError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              memberOptions={memberOptions}
              myUserId={myUserId}
              leaderUserId={group?.leaderUserId ?? null}
              isDragOver={dragOverStatus === status}
              isHighlighted={focusedStatus === status}
              onDragOver={() => setDragOverStatus(status)}
              onDragLeave={() => setDragOverStatus((current) => (current === status ? null : current))}
              onDrop={() => handleDropToStatus(status)}
              onQuickAdd={handleQuickAdd}
              onDelete={async (taskId) => {
                try {
                  await deleteMutation.mutateAsync({ taskId })
                  toast.success("Task deleted")
                } catch (error) {
                  toast.error(getErrorMessage(error))
                }
              }}
              draggingTaskId={draggingTaskId}
              setDraggingTaskId={setDraggingTaskId}
            />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Add a task to your approved project group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Implement login UI"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Optional…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-dueDate">Due date</Label>
                <Input
                  id="task-dueDate"
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={createAssignee}
                  onValueChange={(value) => setCreateAssignee(value)}
                  disabled={!Boolean(myUserId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={myUserId ? "Assign to me" : "Unassigned"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {memberOptions.map((member) => (
                      <SelectItem
                        key={member.id}
                        value={member.id}
                        disabled={!isLeader && Boolean(myUserId) && member.id !== myUserId}
                      >
                        {member.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isLeader && myUserId && (
              <p className="text-xs text-muted-foreground">
                Only the group leader can assign tasks to other members.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !createTitle.trim()}>
              {createMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KanbanColumn({
  status,
  tasks,
  memberOptions,
  myUserId,
  leaderUserId,
  isDragOver,
  isHighlighted,
  onDragOver,
  onDragLeave,
  onDrop,
  onQuickAdd,
  onDelete,
  draggingTaskId,
  setDraggingTaskId,
}: {
  status: ProjectGroupTaskStatus
  tasks: ProjectGroupTaskListItem[]
  memberOptions: Array<{ id: string; label: string; avatarUrl: string | null }>
  myUserId: string | null
  leaderUserId: string | null
  isDragOver: boolean
  isHighlighted: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: () => void
  onQuickAdd: (status: ProjectGroupTaskStatus, title: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  draggingTaskId: string | null
  setDraggingTaskId: (id: string | null) => void
}) {
  const title = formatStatus(status)
  const [quickTitle, setQuickTitle] = useState("")

  return (
    <Card
      className={
        isDragOver || isHighlighted
          ? "h-full ring-2 ring-ring"
          : "h-full"
      }
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDragLeave={() => onDragLeave()}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{title}</span>
          <Badge variant="outline" className={statusBadgeVariant(status).className}>
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 mb-3">
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add…"
            onKeyDown={async (e) => {
              if (e.key !== "Enter") return
              if (e.shiftKey) return
              e.preventDefault()
              const title = quickTitle
              setQuickTitle("")
              await onQuickAdd(status, title)
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const title = quickTitle
              setQuickTitle("")
              await onQuickAdd(status, title)
            }}
            disabled={!quickTitle.trim()}
          >
            Add
          </Button>
        </div>

        <ScrollArea className="h-[520px] pr-3">
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                memberOptions={memberOptions}
                myUserId={myUserId}
                leaderUserId={leaderUserId}
                onDelete={onDelete}
                draggingTaskId={draggingTaskId}
                setDraggingTaskId={setDraggingTaskId}
              />
            ))}

            {!tasks.length && (
              <div className="text-sm text-muted-foreground">No tasks</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function TaskCard({
  task,
  memberOptions,
  myUserId,
  leaderUserId,
  onDelete,
  draggingTaskId,
  setDraggingTaskId,
}: {
  task: ProjectGroupTaskListItem
  memberOptions: Array<{ id: string; label: string; avatarUrl: string | null }>
  myUserId: string | null
  leaderUserId: string | null
  onDelete: (taskId: string) => Promise<void>
  draggingTaskId: string | null
  setDraggingTaskId: (id: string | null) => void
}) {
  const isLeader = Boolean(myUserId && leaderUserId && myUserId === leaderUserId)
  const isCreator = Boolean(myUserId && myUserId === task.createdByUserId)
  const isAssignee = Boolean(myUserId && task.assignedToUserId && myUserId === task.assignedToUserId)

  const canEditDetails = isLeader || isCreator
  const canChangeStatus = isLeader || isAssignee
  const canReassign = isLeader
  const canDelete = isLeader || isCreator

  const updateDetails = useUpdateMyProjectGroupTask(task.id)
  const updateStatus = useUpdateMyProjectGroupTaskStatus(task.id)
  const updateAssignee = useUpdateMyProjectGroupTaskAssignee(task.id)

  const [showEdit, setShowEdit] = useState(false)
  const [descriptionTouched, setDescriptionTouched] = useState(false)

  const { data: taskDetailData } = useMyProjectGroupTask(task.id, showEdit)

  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState("")
  const [editDueDate, setEditDueDate] = useState(task.dueDate ? toDateOnly(task.dueDate) : "")

  const displayDescription = descriptionTouched ? editDescription : (taskDetailData?.task?.description ?? "")

  useEffect(() => {
    if (showEdit) {
      Promise.resolve().then(() => {
        setEditDescription(taskDetailData?.task?.description ?? "");
        setDescriptionTouched(false);
      });
    }
  }, [showEdit]);

  const assigneeLabel = useMemo(() => {
    if (!task.assignedToUserId) return "Unassigned"
    return memberOptions.find((m) => m.id === task.assignedToUserId)?.label ?? "Assigned"
  }, [task.assignedToUserId, memberOptions])

  const assigneeAvatar = useMemo(() => {
    if (!task.assignedToUserId) return null
    return memberOptions.find((m) => m.id === task.assignedToUserId) ?? null
  }, [task.assignedToUserId, memberOptions])

  const handleStatusChange = async (status: ProjectGroupTaskStatus) => {
    try {
      await updateStatus.mutateAsync({ status })
      toast.success("Status updated")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleAssigneeChange = async (assignedToUserId: string) => {
    try {
      await updateAssignee.mutateAsync({
        assignedToUserId: assignedToUserId ? assignedToUserId : null,
      })
      toast.success("Assignee updated")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleEditSave = async () => {
    try {
      const dto: {
        title?: string
        description?: string | null
        dueDate?: string | null
      } = {
        title: editTitle.trim(),
        dueDate: dateOnlyToIso(editDueDate),
      }

      if (descriptionTouched) {
        dto.description = editDescription.trim() ? editDescription.trim() : null
      }

      await updateDetails.mutateAsync(dto)
      toast.success("Task updated")
      setShowEdit(false)
      setDescriptionTouched(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const dueLabel = task.dueDate ? toDateOnly(task.dueDate) : null

  return (
    <Card
      className={
        draggingTaskId === task.id
          ? "border-muted/60 opacity-60"
          : "border-muted/60"
      }
      draggable={canChangeStatus}
      onDragStart={() => setDraggingTaskId(task.id)}
      onDragEnd={() => setDraggingTaskId(null)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="font-medium leading-tight">{task.title}</div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {assigneeAvatar ? (
                  <Avatar size="sm">
                    {assigneeAvatar.avatarUrl ? (
                      <AvatarImage src={assigneeAvatar.avatarUrl} />
                    ) : null}
                    <AvatarFallback>{getInitials(assigneeAvatar.label)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <UserRound className="h-3.5 w-3.5" />
                )}
                <span>{assigneeLabel}</span>
              </span>
              {dueLabel && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dueLabel}
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canEditDetails} onClick={() => setShowEdit(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canDelete} onClick={() => onDelete(task.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Status</div>
            <Select value={task.status} onValueChange={handleStatusChange} disabled={!canChangeStatus || updateStatus.isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Assignee</div>
            <Select
              value={task.assignedToUserId ?? ""}
              onValueChange={handleAssigneeChange}
              disabled={!canReassign || updateAssignee.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {memberOptions.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!canChangeStatus && (
          <div className="text-xs text-muted-foreground">
            Only the assignee or group leader can change status.
          </div>
        )}
      </CardContent>

      <Dialog
        open={showEdit}
        onOpenChange={(open) => {
          setShowEdit(open)
          if (!open) {
            setDescriptionTouched(false)
            setEditTitle(task.title)
            setEditDueDate(task.dueDate ? toDateOnly(task.dueDate) : "")
            setEditDescription(taskDetailData?.task?.description ?? "")
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update title, description, or due date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-title-${task.id}`}>Title</Label>
              <Input
                id={`edit-title-${task.id}`}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-desc-${task.id}`}>Description</Label>
              <Textarea
                id={`edit-desc-${task.id}`}
                value={displayDescription}
                onChange={(e) => {
                  setEditDescription(e.target.value)
                  setDescriptionTouched(true)
                }}
                placeholder="Optional…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-due-${task.id}`}>Due date</Label>
              <Input
                id={`edit-due-${task.id}`}
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={updateDetails.isPending}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={updateDetails.isPending || !editTitle.trim()}>
              {updateDetails.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
