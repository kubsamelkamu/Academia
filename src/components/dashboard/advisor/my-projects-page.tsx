"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Filter,
  Search,
  Download,
  Upload,
  Flag,
  GitBranch,
  AlertTriangle,
  ListChecks,
  Mail,
  XCircle,
  ChevronDown,
  MessageCircle,
  PauseCircle,
  CheckCircle2,
  ThumbsUp,
  Activity,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TooltipProvider } from "@/components/ui/tooltip"
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
const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string; icon: unknown }> = {
  'active': { label: 'Active', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: Activity },
  'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingUp },
  'completed': { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  'on-hold': { label: 'On Hold', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', icon: PauseCircle },
  'pending-review': { label: 'Pending Review', className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400', icon: ClipboardCheck },
  'cleared': { label: 'Cleared', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle }
}

const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; className: string; icon: unknown }> = {
  'completed': { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  'approved': { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200', icon: ThumbsUp },
  'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp },
  'pending': { label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
  'overdue': { label: 'Overdue', className: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  'submitted': { label: 'Submitted', className: 'bg-purple-100 text-purple-800 border-purple-200', icon: Upload }
}

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; className: string; icon: unknown }> = {
  'high': { label: 'High', className: 'bg-red-100 text-red-800 border-red-200', icon: Flag },
  'medium': { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
  'low': { label: 'Low', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle }
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

// ==================== Mock Data ====================
const MOCK_PROJECTS: AdvisorProject[] = [
  {
    id: 'p1',
    title: 'AI-Powered Healthcare Diagnostics',
    description: 'Developing an AI system for early disease detection using medical imaging',
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
      { id: 'm1', name: 'John Smith', email: 'john.s@university.edu', role: 'Team Lead', avatar: '/avatars/john.jpg', joinedAt: '2024-01-15', contributions: 45, lastActive: '2024-03-20' },
      { id: 'm2', name: 'Emily Brown', email: 'emily.b@university.edu', role: 'ML Engineer', avatar: '/avatars/emily.jpg', joinedAt: '2024-01-15', contributions: 38, lastActive: '2024-03-21' },
      { id: 'm3', name: 'Michael Lee', email: 'michael.l@university.edu', role: 'Backend Dev', avatar: '/avatars/michael.jpg', joinedAt: '2024-01-16', contributions: 42, lastActive: '2024-03-20' },
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
    title: 'AI-Powered Campus Navigation System',
    description: 'AR-based navigation application for university campus',
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
    description: 'Interactive learning platform for STEM education',
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
  icon: React.ElementType
  iconClassName?: string
  trend?: number
}

const StatCard = ({ title, value, icon: Icon, iconClassName = "bg-primary/10 text-primary", trend }: StatCardProps) => (
  <Card className="hover:shadow-lg transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{value}</p>
            {trend !== undefined && (
              <span className={cn(
                "text-xs font-medium",
                trend > 0 ? "text-green-600" : "text-red-600"
              )}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            )}
          </div>
        </div>
        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", iconClassName)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
)

interface MilestoneItemProps {
  milestone: ProjectMilestone
}

const MilestoneItem = ({ milestone }: MilestoneItemProps) => {
  const StatusIcon = (MILESTONE_STATUS_CONFIG[milestone.status]?.icon || Clock) as React.ElementType

  return (
    <div className="flex items-center justify-between py-2 hover:bg-muted/30 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          milestone.status === 'approved' ? 'bg-green-500' :
          milestone.status === 'in-progress' ? 'bg-blue-500' :
          milestone.status === 'submitted' ? 'bg-purple-500' :
          milestone.status === 'completed' ? 'bg-green-500' :
          milestone.status === 'pending' ? 'bg-gray-300' :
          'bg-yellow-500'
        )} />
        <span className="text-sm font-medium truncate">{milestone.name}</span>
      </div>
      <Badge variant="outline" className={cn(
        "text-xs whitespace-nowrap",
        MILESTONE_STATUS_CONFIG[milestone.status]?.className
      )}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {MILESTONE_STATUS_CONFIG[milestone.status]?.label || milestone.status}
      </Badge>
    </div>
  )
}

interface ProjectCardProps {
  project: AdvisorProject
  onViewDetails: (project: AdvisorProject) => void
  onClearance: (project: AdvisorProject) => void
  onMessage: (project: AdvisorProject) => void
}

const ProjectCard = ({ project, onViewDetails, onClearance, onMessage }: ProjectCardProps) => {
  const StatusIcon = (STATUS_CONFIG[project.status]?.icon || FolderOpen) as React.ElementType

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 border-t-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer line-clamp-1"
                       onClick={() => onViewDetails(project)}>
                {project.title}
              </CardTitle>
              <Badge className={STATUS_CONFIG[project.status]?.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {STATUS_CONFIG[project.status]?.label || project.status}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <span>{project.groupName}</span>
              <span className="text-muted-foreground">•</span>
              <Calendar className="h-3.5 w-3.5" />
              <span>Due: {formatDate(project.dueDate)}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{project.members.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Members</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span>{project.milestones.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Milestones</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(project.startDate).split(' ')[1]}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Started</p>
          </div>
        </div>

        {/* Recent Milestones */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            Recent Milestones
          </h4>
          <div className="space-y-1">
            {project.milestones.slice(0, 3).map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>

        {/* Action Buttons - Exactly as in the image */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => onViewDetails(project)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onMessage(project)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Team
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1",
              project.status === 'cleared' ? 'bg-green-50 text-green-700 border-green-200' : ''
            )}
            onClick={() => onClearance(project)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {project.status === 'cleared' ? 'Cleared' : 'Clear for Evaluation'}
          </Button>
        </div>

        {/* Status Indicator */}
        {project.status === 'in-progress' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>In Progress</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

const StatusFilter = ({ value, onChange, isOpen, onToggle, onClose }: StatusFilterProps) => {
  const options = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending-review', label: 'Pending Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'cleared', label: 'Cleared' },
  ]

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-[180px] justify-between"
        onClick={onToggle}
      >
        <Filter className="h-4 w-4 mr-2" />
        <span>Status: {options.find(opt => opt.value === value)?.label || 'All'}</span>
        <ChevronDown className={cn(
          "h-4 w-4 ml-2 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </Button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div className="absolute top-full left-0 mt-1 w-[180px] bg-background border rounded-md shadow-lg z-50 py-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                  value === option.value && "bg-muted font-medium"
                )}
                onClick={() => {
                  onChange(option.value)
                  onClose()
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ==================== Main Component ====================
export function AdvisorMyProjectsPage() {
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showClearanceDialog, setShowClearanceDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  // Use mock data (would come from API in production)
  const advisorProjects = MOCK_PROJECTS

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    return advisorProjects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [advisorProjects, searchQuery, filterStatus])

  // Memoized statistics
  const stats = useMemo(() => ({
    total: advisorProjects.length,
    active: advisorProjects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
    pendingReview: advisorProjects.filter(p => p.status === 'pending-review').length,
    completed: advisorProjects.filter(p => p.status === 'completed' || p.status === 'cleared').length,
  }), [advisorProjects])

  // Handlers
  const handleViewDetails = (project: AdvisorProject) => {
    setSelectedProject(project)
    setShowProjectDialog(true)
  }

  const handleClearance = (project: AdvisorProject) => {
    setSelectedProject(project)
    setShowClearanceDialog(true)
  }

  const handleMessage = (project: AdvisorProject) => {
    toast.info(`Opening chat with ${project.groupName}`)
    // Navigate to messages or open chat
  }

  const handleScheduleMeeting = () => {
    setShowMeetingDialog(true)
  }

  const handleConfirmClearance = () => {
    setShowClearanceDialog(false)
    toast.success("Project cleared for evaluation", {
      description: "The team has been notified.",
      duration: 5000,
    })
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
        {/* Header - Exactly as in the image */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Projects
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              All projects assigned to you for supervision
            </p>
          </div>
          
          {/* Keep these buttons exactly as requested */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2 hover:bg-muted transition-colors"
              onClick={handleScheduleMeeting}
            >
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </Button>
            
            <Button className="gap-2 relative bg-primary hover:bg-primary/90">
              <ClipboardCheck className="h-4 w-4" />
              Review Requests
              {stats.pendingReview > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-1 absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center animate-pulse"
                >
                  {stats.pendingReview}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatCard 
            title="Total Projects" 
            value={stats.total} 
            icon={FolderOpen}
            iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
          />
          <StatCard 
            title="Active" 
            value={stats.active} 
            icon={Activity}
            iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30"
            trend={12}
          />
          <StatCard 
            title="Pending Review" 
            value={stats.pendingReview} 
            icon={ClipboardCheck}
            iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30"
          />
          <StatCard 
            title="Completed" 
            value={stats.completed} 
            icon={CheckCircle}
            iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
            trend={8}
          />
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <StatusFilter
              value={filterStatus}
              onChange={setFilterStatus}
              isOpen={showStatusDropdown}
              onToggle={() => setShowStatusDropdown(!showStatusDropdown)}
              onClose={() => setShowStatusDropdown(false)}
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={handleViewDetails}
                onClearance={handleClearance}
                onMessage={handleMessage}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search filters'
                  : 'You have no assigned projects yet.'}
              </p>
              {(searchQuery || filterStatus !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Project Details Dialog */}
        <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
            {selectedProject && (
              <>
                <DialogHeader className="p-6 pb-0">
                  <div className="flex items-start justify-between pr-8">
                    <div>
                      <DialogTitle className="text-2xl">{selectedProject.title}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4" />
                        {selectedProject.groupName}
                      </DialogDescription>
                    </div>
                    <Badge className={STATUS_CONFIG[selectedProject.status]?.className}>
                      {STATUS_CONFIG[selectedProject.status]?.label}
                    </Badge>
                  </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(85vh-8rem)] px-6 pb-6">
                  <div className="space-y-6 py-4">
                    {/* Project Stats */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{selectedProject.progress}%</p>
                            <p className="text-sm text-muted-foreground">Progress</p>
                            <Progress value={selectedProject.progress} className="mt-2 h-1.5" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold">{getDaysRemaining(selectedProject.dueDate)}</p>
                            <p className="text-sm text-muted-foreground">Days Left</p>
                            <p className="text-xs text-muted-foreground mt-1">Due {formatDate(selectedProject.dueDate)}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold">{selectedProject.members.length}</p>
                            <p className="text-sm text-muted-foreground">Team Members</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold">
                              {selectedProject.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              of {selectedProject.milestones.length} Milestones
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="overview" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="milestones">Milestones</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Project Description</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">{selectedProject.description}</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Technologies</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {selectedProject.technologies?.map(tech => (
                                <Badge key={tech} variant="secondary">{tech}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Messages</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedProject.messages.map((msg) => (
                                <div key={msg.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                  <MessageCircle className="h-4 w-4 text-primary mt-0.5" />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium">{msg.sender}</p>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDateTime(msg.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{msg.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="milestones" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Project Milestones</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {selectedProject.milestones.map((milestone) => {
                                const StatusIcon = (MILESTONE_STATUS_CONFIG[milestone.status]?.icon || Clock) as React.ElementType
                                return (
                                  <div key={milestone.id} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold">{milestone.name}</h4>
                                          <Badge className={MILESTONE_STATUS_CONFIG[milestone.status]?.className}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {MILESTONE_STATUS_CONFIG[milestone.status]?.label}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                        <div className="flex items-center gap-4 text-xs">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Due: {formatDate(milestone.dueDate)}
                                          </span>
                                          {milestone.completedDate && (
                                            <span className="flex items-center gap-1 text-green-600">
                                              <CheckCircle className="h-3 w-3" />
                                              Completed: {formatDate(milestone.completedDate)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="team" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedProject.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{member.name}</p>
                                      <p className="text-sm text-muted-foreground">{member.role}</p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="documents" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Project Documents</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedProject.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{doc.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {doc.type} • {doc.size} • Uploaded by {doc.uploadedBy}
                                      </p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Clearance Dialog */}
        <Dialog open={showClearanceDialog} onOpenChange={setShowClearanceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Clear Project for Evaluation</DialogTitle>
              <DialogDescription>
                Review the project before marking it as ready for final evaluation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Once cleared, the project will be marked as ready for final evaluation.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Clearance Checklist</Label>
                <div className="space-y-2">
                  {[
                    "All milestones completed",
                    "Documentation submitted",
                    "Final presentation ready",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="checkbox" id={`check-${index}`} className="rounded" />
                      <Label htmlFor={`check-${index}`} className="text-sm">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea id="comments" placeholder="Add any final notes..." rows={3} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClearanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmClearance}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Clearance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Meeting Dialog */}
        <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
              <DialogDescription>
                Set up a new meeting with your project teams.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">Meeting Title</Label>
                <Input id="meeting-title" placeholder="e.g., Progress Review" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-select">Project</Label>
                <select 
                  id="project-select"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select a project</option>
                  {advisorProjects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meeting-date">Date</Label>
                  <Input id="meeting-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-time">Time</Label>
                  <Input id="meeting-time" type="time" />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowMeetingDialog(false)
                toast.success("Meeting scheduled successfully")
              }}>
                Schedule Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}