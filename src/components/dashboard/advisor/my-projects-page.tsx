"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  FolderOpen,
  ClipboardCheck,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Search,
  Download,
  AlertTriangle,
  ListChecks,
  Activity,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  ThumbsUp,
  CalendarDays,
  CheckCheck,
  MoreHorizontal,
  Mail,
  Upload,
  LucideIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ==================== Types ====================
type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'pending-review' | 'cleared' | 'in-progress'
type MilestoneStatus = 'completed' | 'in-progress' | 'pending' | 'overdue' | 'approved' | 'submitted'
type PriorityLevel = 'high' | 'medium' | 'low'

interface ProjectMilestone {
  id: string
  name: string
  description: string
  dueDate: string
  status: MilestoneStatus
  completedDate?: string
  priority: PriorityLevel
  deliverables: string[]
}

interface ProjectMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  joinedAt: string
  contributions?: number
  lastActive?: string
}

interface AdvisorProject {
  id: string
  title: string
  description: string
  groupName: string
  groupId: string
  advisorId: string
  startDate: string
  dueDate: string
  status: ProjectStatus
  progress: number
  members: ProjectMember[]
  milestones: ProjectMilestone[]
  documents: {
    id: string
    name: string
    type: string
    size: string
    uploadedAt: string
    uploadedBy: string
  }[]
  meetings: {
    id: string
    title: string
    date: string
    time: string
    attendees: string[]
  }[]
  messages: {
    id: string
    sender: string
    content: string
    timestamp: string
    read: boolean
  }[]
  evaluation?: {
    criteria: string
    score: number
    maxScore: number
    comments: string
  }[]
  category: string
  tags: string[]
  technologies: string[]
}

// ==================== Constants & Utilities ====================
const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: LucideIcon }> = {
  'active': { label: 'Active', color: 'blue', icon: Activity },
  'in-progress': { label: 'In Progress', color: 'indigo', icon: TrendingUp },
  'completed': { label: 'Completed', color: 'green', icon: CheckCircle },
  'on-hold': { label: 'On Hold', color: 'amber', icon: AlertCircle },
  'pending-review': { label: 'Pending Review', color: 'purple', icon: ClipboardCheck },
  'cleared': { label: 'Cleared', color: 'emerald', icon: CheckCheck }
}

const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; icon: LucideIcon }> = {
  'completed': { label: 'Completed', color: 'green', icon: CheckCircle },
  'approved': { label: 'Approved', color: 'green', icon: ThumbsUp },
  'in-progress': { label: 'In Progress', color: 'blue', icon: TrendingUp },
  'pending': { label: 'Pending', color: 'gray', icon: Clock },
  'overdue': { label: 'Overdue', color: 'red', icon: AlertTriangle },
  'submitted': { label: 'Submitted', color: 'purple', icon: Upload }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (dateTimeString: string) => {
  return new Date(dateTimeString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getDaysRemaining = (dueDate: string) => {
  const due = new Date(dueDate).getTime()
  const now = new Date().getTime()
  const diff = due - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getStatusColor = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
    green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
    gray: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700',
  }
  return colors[color] || colors.gray
}

// ==================== Mock Data ====================
const MOCK_PROJECTS: AdvisorProject[] = [
  {
    id: 'p1',
    title: 'AI-Powered Healthcare Diagnostics',
    description: 'Developing an AI system for early disease detection using medical imaging and deep learning algorithms.',
    groupName: 'HealthTech Innovators',
    groupId: 'g1',
    advisorId: 'adv1',
    startDate: '2024-01-15',
    dueDate: '2024-12-15',
    status: 'active',
    progress: 65,
    category: 'Healthcare AI',
    tags: ['AI', 'Healthcare', 'Medical Imaging'],
    technologies: ['Python', 'TensorFlow', 'PyTorch', 'React', 'Docker'],
    members: [
      { id: 'm1', name: 'John Smith', email: 'john.s@university.edu', role: 'Team Lead', joinedAt: '2024-01-15', contributions: 45, lastActive: '2024-03-20' },
      { id: 'm2', name: 'Emily Brown', email: 'emily.b@university.edu', role: 'ML Engineer', joinedAt: '2024-01-15', contributions: 38, lastActive: '2024-03-21' },
      { id: 'm3', name: 'Michael Lee', email: 'michael.l@university.edu', role: 'Backend Dev', joinedAt: '2024-01-16', contributions: 42, lastActive: '2024-03-20' },
    ],
    milestones: [
      { id: 'ms1', name: 'Requirements Analysis', description: 'Complete requirements gathering and analysis', dueDate: '2024-02-15', status: 'approved', completedDate: '2024-02-10', priority: 'high', deliverables: ['Requirements Document', 'User Stories'] },
      { id: 'ms2', name: 'System Design', description: 'Design system architecture and components', dueDate: '2024-03-15', status: 'approved', completedDate: '2024-03-10', priority: 'high', deliverables: ['Architecture Diagram', 'API Design', 'Database Schema'] },
      { id: 'ms3', name: 'Prototype Development', description: 'Develop working prototype', dueDate: '2024-04-15', status: 'in-progress', priority: 'high', deliverables: ['Working Prototype', 'Demo Video'] },
      { id: 'ms4', name: 'Testing & Deployment', description: 'Complete testing and prepare for deployment', dueDate: '2024-05-30', status: 'pending', priority: 'medium', deliverables: ['Test Reports', 'Deployment Guide'] },
    ],
    documents: [
      { id: 'd1', name: 'Requirements Analysis.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: '2024-02-10', uploadedBy: 'John Smith' },
      { id: 'd2', name: 'System Design Document.docx', type: 'DOCX', size: '3.1 MB', uploadedAt: '2024-03-10', uploadedBy: 'Emily Brown' },
      { id: 'd3', name: 'Prototype Demo.mp4', type: 'MP4', size: '15.2 MB', uploadedAt: '2024-03-20', uploadedBy: 'Michael Lee' },
    ],
    meetings: [
      { id: 'mt1', title: 'Project Kickoff', date: '2024-01-20', time: '10:00 AM', attendees: ['John Smith', 'Emily Brown', 'Michael Lee'] },
      { id: 'mt2', title: 'Progress Review', date: '2024-02-15', time: '2:00 PM', attendees: ['John Smith', 'Emily Brown'] },
      { id: 'mt3', title: 'Technical Discussion', date: '2024-03-10', time: '11:00 AM', attendees: ['Michael Lee', 'Emily Brown'] },
    ],
    messages: [
      { id: 'msg1', sender: 'John Smith', content: 'We need feedback on the model architecture', timestamp: '2024-03-20T09:30:00', read: true },
      { id: 'msg2', sender: 'Emily Brown', content: 'The dataset preprocessing is complete', timestamp: '2024-03-19T14:15:00', read: true },
      { id: 'msg3', sender: 'Michael Lee', content: 'Ready for the technical review meeting', timestamp: '2024-03-18T16:45:00', read: false },
    ],
  },
  {
    id: 'p2',
    title: 'AI-Powered Campus Navigation',
    description: 'AR-based navigation application for university campus with real-time location tracking.',
    groupName: 'Team Alpha',
    groupId: 'g2',
    advisorId: 'adv1',
    startDate: '2024-05-10',
    dueDate: '2024-12-15',
    status: 'in-progress',
    progress: 40,
    category: 'Mobile App',
    tags: ['AR', 'Navigation', 'Mobile'],
    technologies: ['React Native', 'AR Kit', 'Node.js', 'MongoDB', 'AWS'],
    members: [
      { id: 'm4', name: 'Sarah Wilson', email: 'sarah.w@university.edu', role: 'Team Lead', joinedAt: '2024-05-10' },
      { id: 'm5', name: 'David Kim', email: 'david.k@university.edu', role: 'Mobile Developer', joinedAt: '2024-05-10' },
      { id: 'm6', name: 'Lisa Wang', email: 'lisa.w@university.edu', role: 'UI/UX Designer', joinedAt: '2024-05-10' },
    ],
    milestones: [
      { id: 'ms5', name: 'Requirements Analysis', description: 'Gather and analyze requirements', dueDate: '2024-06-15', status: 'approved', completedDate: '2024-06-10', priority: 'high', deliverables: ['Requirements Document'] },
      { id: 'ms6', name: 'System Design', description: 'Create system architecture and design', dueDate: '2024-07-20', status: 'approved', completedDate: '2024-07-15', priority: 'high', deliverables: ['Design Document', 'Wireframes'] },
      { id: 'ms7', name: 'Prototype Development', description: 'Develop working prototype', dueDate: '2024-08-30', status: 'submitted', priority: 'high', deliverables: ['Working Prototype'] },
      { id: 'ms8', name: 'Testing & Validation', description: 'Complete testing and validation', dueDate: '2024-09-30', status: 'pending', priority: 'medium', deliverables: ['Test Reports'] },
    ],
    documents: [
      { id: 'd4', name: 'Requirements Spec.pdf', type: 'PDF', size: '1.8 MB', uploadedAt: '2024-06-10', uploadedBy: 'Sarah Wilson' },
      { id: 'd5', name: 'System Design.docx', type: 'DOCX', size: '4.2 MB', uploadedAt: '2024-07-15', uploadedBy: 'David Kim' },
      { id: 'd6', name: 'UI Prototypes.fig', type: 'FIG', size: '5.1 MB', uploadedAt: '2024-07-20', uploadedBy: 'Lisa Wang' },
    ],
    meetings: [
      { id: 'mt4', title: 'Requirements Review', date: '2024-06-12', time: '11:00 AM', attendees: ['Sarah Wilson', 'David Kim', 'Lisa Wang'] },
      { id: 'mt5', title: 'Design Review', date: '2024-07-18', time: '2:00 PM', attendees: ['Sarah Wilson', 'Lisa Wang'] },
    ],
    messages: [
      { id: 'msg4', sender: 'Sarah Wilson', content: 'The prototype is ready for review', timestamp: '2024-08-25T14:30:00', read: false },
    ],
  },
  {
    id: 'p3',
    title: 'E-Learning Platform for STEM',
    description: 'Interactive learning platform for STEM education with gamification features.',
    groupName: 'EduTech Solutions',
    groupId: 'g3',
    advisorId: 'adv1',
    startDate: '2024-01-10',
    dueDate: '2024-04-30',
    status: 'pending-review',
    progress: 90,
    category: 'EdTech',
    tags: ['Education', 'Web Platform', 'Interactive'],
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    members: [
      { id: 'm7', name: 'James Chen', email: 'james.c@university.edu', role: 'Team Lead', joinedAt: '2024-01-10' },
      { id: 'm8', name: 'Anna Garcia', email: 'anna.g@university.edu', role: 'Frontend Dev', joinedAt: '2024-01-10' },
      { id: 'm9', name: 'Robert Taylor', email: 'robert.t@university.edu', role: 'Backend Dev', joinedAt: '2024-01-11' },
    ],
    milestones: [
      { id: 'ms9', name: 'Platform Architecture', description: 'Design system architecture', dueDate: '2024-02-01', status: 'completed', completedDate: '2024-01-28', priority: 'high', deliverables: ['Architecture Document'] },
      { id: 'ms10', name: 'Core Features', description: 'Implement core learning features', dueDate: '2024-03-15', status: 'completed', completedDate: '2024-03-10', priority: 'high', deliverables: ['Feature Implementation'] },
      { id: 'ms11', name: 'Testing & Deployment', description: 'Complete testing and prepare for deployment', dueDate: '2024-04-20', status: 'in-progress', priority: 'high', deliverables: ['Test Reports', 'Deployment Guide'] },
    ],
    documents: [
      { id: 'd7', name: 'Architecture Design.pdf', type: 'PDF', size: '3.1 MB', uploadedAt: '2024-01-28', uploadedBy: 'James Chen' },
      { id: 'd8', name: 'API Documentation.md', type: 'MD', size: '0.5 MB', uploadedAt: '2024-03-10', uploadedBy: 'Robert Taylor' },
      { id: 'd9', name: 'User Guide.pdf', type: 'PDF', size: '2.2 MB', uploadedAt: '2024-03-15', uploadedBy: 'Anna Garcia' },
    ],
    meetings: [
      { id: 'mt6', title: 'Final Review', date: '2024-04-25', time: '2:00 PM', attendees: ['James Chen', 'Anna Garcia', 'Robert Taylor'] },
    ],
    messages: [
      { id: 'msg5', sender: 'James Chen', content: 'Ready for final review and clearance', timestamp: '2024-03-20T09:00:00', read: false },
    ],
  },
]

// ==================== Sub-components ====================

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: number
  color?: string
}

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }: StatCardProps) => (
  <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend !== undefined && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : 
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
          `bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
)

interface ProjectCardProps {
  project: AdvisorProject
  onViewDetails: (project: AdvisorProject) => void
  onClearance: (project: AdvisorProject) => void
  onMessage: (project: AdvisorProject) => void
}

const ProjectCard = ({ project, onViewDetails, onClearance, onMessage }: ProjectCardProps) => {
  const daysRemaining = getDaysRemaining(project.dueDate)
  const completedMilestones = project.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length
  const statusConfig = STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig?.icon || FolderOpen
  const isDueSoon = daysRemaining <= 14 && daysRemaining > 0
  const isOverdue = daysRemaining < 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription>{project.groupName}</CardDescription>
          </div>
          <Badge variant="outline">{project.progress}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={project.progress} className="h-2" />
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>Members: {project.members.length}</p>
          <p>Milestones: {project.milestones.length}</p>
          <p>Documents: {project.documents.length}</p>
          <p>Due: {formatDate(project.dueDate)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(project.id)}>
            <Eye className="h-4 w-4" />
            View details
          </Button>
          <Button variant="outline" size="sm" onClick={() => onRevision(project)} disabled={isBusy}>
            Request revision
          </Button>
          <Button size="sm" onClick={() => onClear(project)} disabled={isBusy}>
            Clear for evaluation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdvisorMyProjectsPage() {
  const [search, setSearch] = React.useState("")
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)

  const projectsQuery = useAdvisorProjects()
  const projectDetailQuery = useAdvisorProject(selectedProjectId ?? undefined)
  const requestRevisionMutation = useRequestRevisionMutation()
  const clearProjectMutation = useClearProjectMutation()

  const projects = projectsQuery.data?.items ?? []
  const selectedProject = projectDetailQuery.data as AdvisorProjectDetail | undefined

  const filteredProjects = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return projects

    return projects.filter((project: AdvisorProjectItem) => {
      return (
        project.title.toLowerCase().includes(term) ||
        project.groupName.toLowerCase().includes(term) ||
        project.category.toLowerCase().includes(term)
      )
    })
  }, [projects, search])

  async function handleRevision(project: AdvisorProjectItem) {
    const feedback = window.prompt(`Revision feedback for ${project.title}`, "")
    if (feedback === null) return
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }

    try {
      await requestRevisionMutation.mutateAsync({
        projectId: project.id,
        dto: {
          feedback: feedback.trim(),
          subject: `Revision required for ${project.title}`,
        },
      })
      toast.success(`Revision requested for ${project.title}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision")
    }
  }

  async function handleClear(project: AdvisorProjectItem) {
    try {
      await clearProjectMutation.mutateAsync({ projectId: project.id })
      toast.success(`${project.title} cleared for evaluation.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear project")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">
            Review project progress, inspect details, and send revision or clearance actions.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="cleared">Cleared</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {projectsQuery.isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">Loading projects...</CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title="No projects found"
              description="Try a different search term or wait for project assignments to appear."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProjects.map((project: AdvisorProjectItem) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={setSelectedProjectId}
                  onRevision={handleRevision}
                  onClear={handleClear}
                  isBusy={requestRevisionMutation.isPending || clearProjectMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filteredProjects.filter((project: AdvisorProjectItem) => project.status !== "cleared").length === 0 ? (
            <EmptyState title="No active projects" description="Active projects will appear here." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProjects
                .filter((project: AdvisorProjectItem) => project.status !== "cleared")
                .map((project: AdvisorProjectItem) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={setSelectedProjectId}
                    onRevision={handleRevision}
                    onClear={handleClear}
                    isBusy={requestRevisionMutation.isPending || clearProjectMutation.isPending}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cleared" className="space-y-4">
          {filteredProjects.filter((project: AdvisorProjectItem) => project.status === "cleared").length === 0 ? (
            <EmptyState title="No cleared projects" description="Cleared projects will appear here." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProjects
                .filter((project: AdvisorProjectItem) => project.status === "cleared")
                .map((project: AdvisorProjectItem) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={setSelectedProjectId}
                    onRevision={handleRevision}
                    onClear={handleClear}
                    isBusy={requestRevisionMutation.isPending || clearProjectMutation.isPending}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedProjectId)} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title ?? "Project details"}</DialogTitle>
            <DialogDescription>{selectedProject?.groupName ?? "Project detail view"}</DialogDescription>
          </DialogHeader>

          {projectDetailQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading project details...</div>
          ) : selectedProject ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedProject.progress}%</p>
                      <p className="text-sm text-muted-foreground">Progress</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{selectedProject.members.length}</p>
                      <p className="text-sm text-muted-foreground">Members</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{selectedProject.documents.length}</p>
                      <p className="text-sm text-muted-foreground">Documents</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <p>Category: {selectedProject.category}</p>
                      <p>Due date: {formatDate(selectedProject.dueDate)}</p>
                      <p>Start date: {formatDate(selectedProject.startDate)}</p>
                      <p>Status: {selectedProject.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Milestones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.milestones.map((milestone) => (
                      <div key={milestone.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{milestone.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Due {formatDate(milestone.dueDate)}
                            </p>
                          </div>
                          <Badge variant="outline">{milestone.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Members</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    ) : (
                      selectedProject.documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{document.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {document.type} · {document.size}
                              </p>
                            </div>
                          </div>
                          <Link
                            href="/dashboard/advisor/documents"
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            Open documents
                          </Link>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revision Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.revisionRequests?.length ? (
                      selectedProject.revisionRequests.map((request) => (
                        <div key={request.id} className="rounded-lg border p-4">
                          <p className="font-medium">{request.subject}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{request.feedback}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {request.status} · {formatDate(request.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No revision requests recorded for this project.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Select a project to inspect its details.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvisorMyProjectsPage
