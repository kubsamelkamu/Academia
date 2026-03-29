"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Flag,
  MessageSquare,
  Paperclip,
  ChevronRight,
  ChevronDown,
  Plus,
  Filter,
  Edit3,
  Eye,
  GitBranch,
  GitMerge,
  AlertTriangle,
  Hourglass,
  CheckCheck,
  ListChecks,
  BarChart3,
  CalendarDays,
  Layers,
  FolderKanban,
  Milestone,
  Timer,
  Search
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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

type TimelineItemType = 'milestone' | 'task' | 'event' | 'deadline' | 'review'
type TimelineItemStatus = 'completed' | 'in-progress' | 'pending' | 'blocked' | 'overdue'
type TimelineItemPriority = 'high' | 'medium' | 'low'

interface TimelineItem {
  id: string
  title: string
  description: string
  type: TimelineItemType
  status: TimelineItemStatus
  priority: TimelineItemPriority
  startDate: string
  dueDate: string
  completedDate?: string
  assignees: {
    id: string
    name: string
    avatar?: string
  }[]
  dependencies?: string[]
  attachments?: {
    name: string
    size: string
    url: string
  }[]
  comments?: {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    content: string
    timestamp: string
  }[]
  progress: number
  tags: string[]
}

interface Milestone {
  id: string
  title: string
  description: string
  date: string
  status: 'completed' | 'upcoming' | 'in-progress'
  tasks: string[]
  deliverables: string[]
}

interface Phase {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: 'completed' | 'in-progress' | 'upcoming'
  progress: number
  milestones: Milestone[]
}

function normalizeMilestoneName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

export function StudentTimelinePage() {
  const user = useAuthStore((state) => state.user)
  const [, setViewMode] = useState<'timeline' | 'calendar' | 'list' | 'gantt'>('timeline')
  const [activeTab, setActiveTab] = useState<'timeline' | 'phases' | 'calendar' | 'list' | 'tasks'>('timeline')
  const [focusedTaskStatus, setFocusedTaskStatus] = useState<ProjectGroupTaskStatus | null>(null)
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['phase1', 'phase2'])
  
  // Add Item Form State
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemType, setNewItemType] = useState<TimelineItemType>('task')
  const [newItemPriority, setNewItemPriority] = useState<TimelineItemPriority>('medium')
  const [newItemStartDate, setNewItemStartDate] = useState('')
  const [newItemDueDate, setNewItemDueDate] = useState('')
  const [newItemAssignee, setNewItemAssignee] = useState('')

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

  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const projectInfo = useMemo(() => {
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
  }, [activeProject, mergedMilestones, currentTime])

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

  const phases: Phase[] = [
    {
      id: 'phase1',
      name: 'Research & Planning',
      description: 'Initial research, literature review, and project planning',
      startDate: '2024-01-15',
      endDate: '2024-02-28',
      status: 'completed',
      progress: 100,
      milestones: [
        {
          id: 'm1',
          title: 'Research Proposal Approved',
          description: 'Project proposal reviewed and approved by advisor',
          date: '2024-01-30',
          status: 'completed',
          tasks: ['research-1', 'research-2'],
          deliverables: ['Research Proposal Document']
        },
        {
          id: 'm2',
          title: 'Literature Review Complete',
          description: 'Comprehensive literature review submitted',
          date: '2024-02-15',
          status: 'completed',
          tasks: ['research-3', 'research-4'],
          deliverables: ['Literature Review Paper']
        },
        {
          id: 'm3',
          title: 'Methodology Finalized',
          description: 'Research methodology and approach approved',
          date: '2024-02-28',
          status: 'completed',
          tasks: ['research-5'],
          deliverables: ['Methodology Document']
        }
      ]
    },
    {
      id: 'phase2',
      name: 'Development & Implementation',
      description: 'System development, coding, and implementation',
      startDate: '2024-03-01',
      endDate: '2024-04-15',
      status: 'in-progress',
      progress: 65,
      milestones: [
        {
          id: 'm4',
          title: 'MVP Complete',
          description: 'Minimum viable product ready for testing',
          date: '2024-03-20',
          status: 'completed',
          tasks: ['dev-1', 'dev-2', 'dev-3'],
          deliverables: ['Working Prototype']
        },
        {
          id: 'm5',
          title: 'Core Features Implemented',
          description: 'All core features implemented and tested',
          date: '2024-04-05',
          status: 'in-progress',
          tasks: ['dev-4', 'dev-5', 'dev-6'],
          deliverables: ['Feature Documentation']
        },
        {
          id: 'm6',
          title: 'Integration Complete',
          description: 'All system components integrated',
          date: '2024-04-15',
          status: 'upcoming',
          tasks: ['dev-7', 'dev-8'],
          deliverables: ['Integrated System']
        }
      ]
    },
    {
      id: 'phase3',
      name: 'Testing & Validation',
      description: 'Testing, validation, and quality assurance',
      startDate: '2024-04-16',
      endDate: '2024-05-15',
      status: 'upcoming',
      progress: 0,
      milestones: [
        {
          id: 'm7',
          title: 'Testing Phase Complete',
          description: 'All testing cycles completed',
          date: '2024-05-01',
          status: 'upcoming',
          tasks: ['test-1', 'test-2', 'test-3'],
          deliverables: ['Test Reports']
        },
        {
          id: 'm8',
          title: 'Validation Complete',
          description: 'System validated against requirements',
          date: '2024-05-15',
          status: 'upcoming',
          tasks: ['test-4', 'test-5'],
          deliverables: ['Validation Report']
        }
      ]
    }
  ]

  const timelineItems: TimelineItem[] = [
    {
      id: 'item1',
      title: 'Proposal Submission',
      description: 'Submit initial project proposal for review',
      type: 'milestone',
      status: 'completed',
      priority: 'high',
      startDate: '2024-01-15',
      dueDate: '2024-01-30',
      completedDate: '2024-01-28',
      assignees: [
        { id: 'u1', name: 'John Smith', avatar: '/avatars/john.jpg' },
        { id: 'u2', name: 'Emily Brown', avatar: '/avatars/emily.jpg' }
      ],
      progress: 100,
      tags: ['research', 'proposal'],
      comments: [
        {
          id: 'c1',
          userId: 'u3',
          userName: 'Dr. Sarah Chen',
          userAvatar: '/avatars/sarah.jpg',
          content: 'Great work on the proposal! A few minor revisions needed.',
          timestamp: '2024-01-25T14:30:00'
        }
      ]
    },
    {
      id: 'item2',
      title: 'SRS Document',
      description: 'Complete first draft of project SRS document',
      type: 'task',
      status: 'completed',
      priority: 'medium',
      startDate: '2024-02-01',
      dueDate: '2024-02-15',
      completedDate: '2024-02-14',
      assignees: [
        { id: 'u1', name: 'John Smith', avatar: '/avatars/john.jpg' }
      ],
      progress: 100,
      tags: ['research', 'writing'],
    },
    {
      id: 'item3',
      title: 'SDD Document',
      description: 'Complete first draft of project SDD document',
      type: 'task',
      status: 'in-progress',
      priority: 'high',
      startDate: '2024-03-01',
      dueDate: '2024-03-20',
      assignees: [
        { id: 'u2', name: 'Emily Brown', avatar: '/avatars/emily.jpg' },
        { id: 'u4', name: 'Michael Lee', avatar: '/avatars/michael.jpg' }
      ],
      progress: 75,
      tags: ['development', 'mvp'],
      dependencies: ['item1', 'item2']
    },
    {
      id: 'item4',
      title: 'Team Review Meeting',
      description: 'Weekly team sync and progress review',
      type: 'event',
      status: 'pending',
      priority: 'medium',
      startDate: '2024-03-15',
      dueDate: '2024-03-15',
      assignees: [
        { id: 'u1', name: 'John Smith' },
        { id: 'u2', name: 'Emily Brown' },
        { id: 'u3', name: 'Dr. Sarah Chen' }
      ],
      progress: 0,
      tags: ['meeting', 'review']
    },
    {
      id: 'item5',
      title: 'Implemetation Phase',
      description: 'Complete implementation phase',
      type: 'milestone',
      status: 'blocked',
      priority: 'high',
      startDate: '2024-04-01',
      dueDate: '2024-04-15',
      assignees: [
        { id: 'u4', name: 'Michael Lee' }
      ],
      progress: 30,
      tags: ['testing', 'integration'],
      dependencies: ['item3']
    },
    {
      id: 'item6',
      title: 'Final Documentation',
      description: 'Complete project documentation',
      type: 'task',
      status: 'overdue',
      priority: 'medium',
      startDate: '2024-03-10',
      dueDate: '2024-03-25',
      assignees: [
        { id: 'u1', name: 'John Smith' }
      ],
      progress: 40,
      tags: ['documentation'],
      comments: [
        {
          id: 'c2',
          userId: 'u3',
          userName: 'Dr. Sarah Chen',
          content: 'Please prioritize this task',
          timestamp: '2024-03-20T09:15:00'
        }
      ]
    }
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusIcon = (status: TimelineItemStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in-progress': return <Hourglass className="h-4 w-4 text-blue-500" />
      case 'pending': return <Circle className="h-4 w-4 text-gray-400" />
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TimelineItemStatus) => {
    const styles = {
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending': 'bg-gray-100 text-gray-800 border-gray-200',
      'blocked': 'bg-red-100 text-red-800 border-red-200',
      'overdue': 'bg-red-100 text-red-800 border-red-200 font-bold'
    }
    return styles[status] || styles.pending
  }

  const getPriorityBadge = (priority: TimelineItemPriority) => {
    const styles = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    }
    return styles[priority]
  }

  const getTypeIcon = (type: TimelineItemType) => {
    switch (type) {
      case 'milestone': return <Flag className="h-4 w-4 text-purple-500" />
      case 'task': return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case 'event': return <Calendar className="h-4 w-4 text-orange-500" />
      case 'deadline': return <Timer className="h-4 w-4 text-red-500" />
      case 'review': return <Eye className="h-4 w-4 text-green-500" />
      default: return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate).getTime()
    const now = new Date().getTime()
    const diff = due - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const filteredItems = timelineItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesType = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    )
  }

  const handleAddItem = () => {
    // In production, this would save the new item
    setShowAddDialog(false)
    // Reset form
    setNewItemTitle('')
    setNewItemDescription('')
    setNewItemType('task')
    setNewItemPriority('medium')
    setNewItemStartDate('')
    setNewItemDueDate('')
    setNewItemAssignee('')
  }

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
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('pending')}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('in-progress')}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('completed')}>Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('blocked')}>Blocked</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('overdue')}>Overdue</DropdownMenuItem>
              {/* Simple div separator */}
              <div className="h-px bg-border my-1" />
              <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('milestone')}>Milestones</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('task')}>Tasks</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('event')}>Events</DropdownMenuItem>
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

          if (next === "timeline") setViewMode('timeline')
          if (next === "phases") setViewMode('gantt')
          if (next === "calendar") setViewMode('calendar')
          if (next === "list") setViewMode('list')
        }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="timeline" className="gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="phases" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Phases</span>
            </TabsTrigger>
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
              placeholder="Search timeline..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Timeline Items */}
                <div className="space-y-8">
                  {filteredItems.map((item, index) => (
                    <div key={item.id} className="relative flex gap-4">
                      {/* Timeline Dot */}
                      <div className="relative z-10">
                        <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                          item.status === 'completed' ? 'bg-green-100' :
                          item.status === 'in-progress' ? 'bg-blue-100' :
                          item.status === 'blocked' ? 'bg-red-100' :
                          item.status === 'overdue' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {getTypeIcon(item.type)}
                        </div>
                        {index < filteredItems.length - 1 && (
                          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 h-8 w-0.5 bg-border" />
                        )}
                      </div>

                      {/* Timeline Content */}
                      <Card className="flex-1 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowItemDialog(true)
                            }}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{item.title}</h3>
                                <Badge variant="outline" className={getStatusBadge(item.status)}>
                                  {item.status.replace('-', ' ')}
                                </Badge>
                                <Badge variant="outline" className={getPriorityBadge(item.priority)}>
                                  {item.priority} priority
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {formatDate(item.dueDate)}</span>
                                </div>
                                {getDaysRemaining(item.dueDate) > 0 && item.status !== 'completed' && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{getDaysRemaining(item.dueDate)} days left</span>
                                  </div>
                                )}
                              </div>

                              {/* Assignees - using title attribute for hover instead of Tooltip */}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex -space-x-2">
                                  {item.assignees.map((assignee) => (
                                    <div key={assignee.id} className="relative group">
                                      <Avatar className="h-6 w-6 border-2 border-background cursor-help">
                                        {assignee.avatar ? (
                                          <AvatarImage src={assignee.avatar} />
                                        ) : (
                                          <AvatarFallback className="text-[10px]">
                                            {getInitials(assignee.name)}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      {/* Simple hover tooltip using title attribute */}
                                      <span className="sr-only">{assignee.name}</span>
                                    </div>
                                  ))}
                                </div>
                                {item.assignees.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{item.assignees.length - 3} more
                                  </span>
                                )}
                              </div>

                              {/* Progress Bar */}
                              {item.type === 'task' && item.progress < 100 && (
                                <div className="w-48 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Progress value={item.progress} className="h-1.5" />
                                    <span className="text-xs text-muted-foreground">{item.progress}%</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {item.comments && item.comments.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {item.comments.length}
                                </Badge>
                              )}
                              {item.attachments && item.attachments.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  {item.attachments.length}
                                </Badge>
                              )}
                              {item.dependencies && item.dependencies.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <GitMerge className="h-3 w-3" />
                                  {item.dependencies.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases/Gantt View */}
        <TabsContent value="phases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Project Phases
              </CardTitle>
              <CardDescription>
                Track progress across different project phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phases.map((phase) => (
                  <Card key={phase.id} className="overflow-hidden">
                    {/* Phase Header */}
                    <div 
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        phase.status === 'completed' ? 'bg-green-50/50' :
                        phase.status === 'in-progress' ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => togglePhase(phase.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedPhases.includes(phase.id) ? 
                            <ChevronDown className="h-5 w-5 text-muted-foreground" /> : 
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          }
                          <div>
                            <h3 className="font-semibold">{phase.name}</h3>
                            <p className="text-sm text-muted-foreground">{phase.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={
                            phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                            phase.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {phase.status.replace('-', ' ')}
                          </Badge>
                          <div className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                          </div>
                        </div>
                      </div>

                      {/* Phase Progress */}
                      <div className="mt-3 ml-8">
                        <div className="flex items-center gap-2">
                          <Progress value={phase.progress} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{phase.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Phase Milestones */}
                    {expandedPhases.includes(phase.id) && (
                      <div className="p-4 border-t bg-muted/20">
                        <div className="ml-8 space-y-3">
                          {phase.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                              <div className={`mt-1 h-4 w-4 rounded-full ${
                                milestone.status === 'completed' ? 'bg-green-500' :
                                milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{milestone.title}</h4>
                                  <Badge variant="outline" className={
                                    milestone.status === 'completed' ? 'border-green-500 text-green-700' :
                                    milestone.status === 'in-progress' ? 'border-blue-500 text-blue-700' :
                                    'border-gray-500 text-gray-700'
                                  }>
                                    {milestone.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Due: {formatDate(milestone.date)}</span>
                                  <span>{milestone.tasks.length} tasks</span>
                                  <span>{milestone.deliverables.length} deliverables</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Calendar View
              </CardTitle>
              <CardDescription>
                View your timeline items in calendar format
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
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i + 1
                  const hasItems = [5, 12, 15, 20, 25].includes(day)
                  return (
                    <div key={i} className="bg-background p-2 min-h-[100px] border-t">
                      <span className="text-sm text-muted-foreground">{day}</span>
                      {hasItems && (
                        <div className="mt-1 space-y-1">
                          {day === 15 && (
                            <div className="bg-purple-100 text-purple-800 text-xs p-1 rounded truncate">
                              MVP Complete
                            </div>
                          )}
                          {day === 20 && (
                            <div className="bg-blue-100 text-blue-800 text-xs p-1 rounded truncate">
                              Team Meeting
                            </div>
                          )}
                          {day === 25 && (
                            <div className="bg-red-100 text-red-800 text-xs p-1 rounded truncate">
                              Documentation Due
                            </div>
                          )}
                        </div>
                      )}
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
                All Items
              </CardTitle>
              <CardDescription>
                Complete list of all timeline items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedItem(item)
                      setShowItemDialog(true)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Due: {formatDate(item.dueDate)}</span>
                          <span>Assignee: {item.assignees[0]?.name}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusBadge(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks / Kanban View */}
        <TabsContent value="tasks" className="space-y-4">
          <ProjectGroupTasksBoard
            enabled={Boolean(user?.id) && activeTab === "tasks"}
            focusedStatus={focusedTaskStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Item Details Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedItem.type)}
                  <DialogTitle>{selectedItem.title}</DialogTitle>
                </div>
                <DialogDescription>
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status and Priority */}
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1">
                    <Label className="text-xs">Status</Label>
                    <Badge className={`mt-1 ${getStatusBadge(selectedItem.status)}`}>
                      {selectedItem.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Priority</Label>
                    <Badge className={`mt-1 ${getPriorityBadge(selectedItem.priority)}`}>
                      {selectedItem.priority}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Type</Label>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {selectedItem.type}
                    </Badge>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <Label className="text-xs">Timeline</Label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium">{formatDate(selectedItem.startDate)}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="font-medium">{formatDate(selectedItem.dueDate)}</p>
                    </div>
                  </div>
                  {selectedItem.completedDate && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600">Completed on {formatDate(selectedItem.completedDate)}</p>
                    </div>
                  )}
                </div>

                {/* Assignees */}
                <div>
                  <Label className="text-xs">Assignees</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedItem.assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                        <Avatar className="h-6 w-6">
                          {assignee.avatar ? (
                            <AvatarImage src={assignee.avatar} />
                          ) : (
                            <AvatarFallback className="text-[10px]">
                              {getInitials(assignee.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm">{assignee.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dependencies */}
                {selectedItem.dependencies && selectedItem.dependencies.length > 0 && (
                  <div>
                    <Label className="text-xs">Dependencies</Label>
                    <div className="space-y-2 mt-1">
                      {selectedItem.dependencies.map((depId) => {
                        const dep = timelineItems.find(i => i.id === depId)
                        return dep ? (
                          <div key={depId} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <GitMerge className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{dep.title}</span>
                            <Badge className={`ml-auto ${getStatusBadge(dep.status)}`}>
                              {dep.status}
                            </Badge>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div>
                    <Label className="text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-primary/10">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress */}
                {selectedItem.type === 'task' && (
                  <div>
                    <Label className="text-xs">Progress</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={selectedItem.progress} className="flex-1" />
                      <span className="text-sm font-medium">{selectedItem.progress}%</span>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedItem.comments && selectedItem.comments.length > 0 && (
                  <div>
                    <Label className="text-xs">Comments</Label>
                    <div className="space-y-2 mt-1">
                      {selectedItem.comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-5 w-5">
                              {comment.userAvatar ? (
                                <AvatarImage src={comment.userAvatar} />
                              ) : (
                                <AvatarFallback className="text-[8px]">
                                  {getInitials(comment.userName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-xs font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowItemDialog(false)}>
                  Close
                </Button>
                <Button>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Timeline Item</DialogTitle>
            <DialogDescription>
              Create a new milestone, task, or event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Enter title..." 
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter description..." 
                rows={3}
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newItemType === 'milestone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemType('milestone')}
                    className="flex-1"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Milestone
                  </Button>
                  <Button
                    type="button"
                    variant={newItemType === 'task' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemType('task')}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Task
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={newItemType === 'event' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemType('event')}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Event
                  </Button>
                  <Button
                    type="button"
                    variant={newItemType === 'deadline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemType('deadline')}
                    className="flex-1"
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Deadline
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant={newItemPriority === 'high' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemPriority('high')}
                    className="w-full"
                  >
                    High
                  </Button>
                  <Button
                    type="button"
                    variant={newItemPriority === 'medium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemPriority('medium')}
                    className="w-full"
                  >
                    Medium
                  </Button>
                  <Button
                    type="button"
                    variant={newItemPriority === 'low' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemPriority('low')}
                    className="w-full"
                  >
                    Low
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  value={newItemStartDate}
                  onChange={(e) => setNewItemStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  value={newItemDueDate}
                  onChange={(e) => setNewItemDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignees">Assignees</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newItemAssignee === 'john' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemAssignee('john')}
                  className="flex-1"
                >
                  John
                </Button>
                <Button
                  type="button"
                  variant={newItemAssignee === 'emily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemAssignee('emily')}
                  className="flex-1"
                >
                  Emily
                </Button>
                <Button
                  type="button"
                  variant={newItemAssignee === 'michael' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemAssignee('michael')}
                  className="flex-1"
                >
                  Michael
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Create Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}