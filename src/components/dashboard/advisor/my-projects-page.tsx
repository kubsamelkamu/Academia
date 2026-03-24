"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Plus,
  Star,
  Flag,
  AlertTriangle,
  ListChecks,
  Activity,
  type LucideIcon,
  XCircle,
  HelpCircle,
  ChevronDown,
  Send,
  Paperclip,
  Settings,
  Menu,
  Filter,
  LayoutGrid,
  List,
  UserCheck,
  Award,
  BookOpen,
  Video,
  Link2,
  Github,
  ExternalLink,
  ThumbsUp,
  CalendarDays,
  CheckCheck,
  MoreHorizontal,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Sparkles,
  Shield,
  Zap,
  Target,
  Compass,
  BarChart3,
  PieChart,
  Layers,
  Users2,
  ArrowUpRight,
  CircleDot,
  Upload,
  Pin,
  Bookmark,
  Share2,
} from 'lucide-react'
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; icon: LucideIcon }> = {
  'high': { label: 'High', color: 'red', icon: Flag },
  'medium': { label: 'Medium', color: 'amber', icon: AlertCircle },
  'low': { label: 'Low', color: 'green', icon: CheckCircle }
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

interface MilestoneItemProps {
  milestone: ProjectMilestone
}

const MilestoneItem = ({ milestone }: MilestoneItemProps) => {
  const config = MILESTONE_STATUS_CONFIG[milestone.status]
  const StatusIcon = config?.icon || Clock
  const PriorityIcon = PRIORITY_CONFIG[milestone.priority]?.icon || Flag

  return (
    <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          milestone.status === 'approved' || milestone.status === 'completed' ? 'bg-green-500' :
          milestone.status === 'in-progress' ? 'bg-blue-500' :
          milestone.status === 'submitted' ? 'bg-purple-500' :
          milestone.status === 'pending' ? 'bg-gray-300' :
          'bg-red-500'
        )} />
        <span className="text-sm font-medium truncate">{milestone.name}</span>
      </div>
      <Badge variant="outline" className={cn("text-xs whitespace-nowrap", getStatusColor(config?.color || 'gray'))}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config?.label || milestone.status}
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
  const daysRemaining = getDaysRemaining(project.dueDate)
  const completedMilestones = project.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length
  const statusConfig = STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig?.icon || FolderOpen
  const isDueSoon = daysRemaining <= 14 && daysRemaining > 0
  const isOverdue = daysRemaining < 0

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle 
                className="text-xl font-semibold hover:text-primary transition-colors cursor-pointer line-clamp-1"
                onClick={() => onViewDetails(project)}
              >
                {project.title}
              </CardTitle>
              <Badge className={cn(getStatusColor(statusConfig?.color || 'gray'), "text-xs")}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig?.label || project.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{project.groupName}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Due {formatDate(project.dueDate)}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(project)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMessage(project)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onClearance(project)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Clear for Evaluation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{project.members.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Members</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{completedMilestones}/{project.milestones.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Milestones</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={cn(
                isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : ""
              )}>
                {isOverdue ? 'Overdue' : `${daysRemaining}d`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Remaining</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(project)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onMessage(project)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1",
              project.status === 'cleared' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30"
            )}
            onClick={() => onClearance(project)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {project.status === 'cleared' ? 'Cleared' : 'Clear'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Main Component ====================
export function AdvisorMyProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<AdvisorProject | null>(null)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showClearanceDialog, setShowClearanceDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const advisorProjects = MOCK_PROJECTS

  const filteredProjects = useMemo(() => {
    return advisorProjects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.groupName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [advisorProjects, searchQuery, filterStatus])

  const stats = useMemo(() => ({
    total: advisorProjects.length,
    active: advisorProjects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
    pendingReview: advisorProjects.filter(p => p.status === 'pending-review').length,
    completed: advisorProjects.filter(p => p.status === 'completed' || p.status === 'cleared').length,
  }), [advisorProjects])

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
  }

  const handleScheduleMeeting = () => {
    setShowMeetingDialog(true)
  }

  const handleConfirmClearance = () => {
    setShowClearanceDialog(false)
    toast.success("Project cleared for evaluation", {
      description: "The team has been notified.",
    })
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-6 animate-in fade-in duration-500 px-4 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                My Projects
              </h1>
              <p className="text-muted-foreground mt-2">
                Supervise and track your assigned student projects
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleScheduleMeeting}
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                Schedule Meeting
              </Button>
              
              <Button className="gap-2 relative">
                <ClipboardCheck className="h-4 w-4" />
                Review Requests
                {stats.pendingReview > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {stats.pendingReview}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <StatCard title="Total Projects" value={stats.total} icon={FolderOpen} color="blue" />
            <StatCard title="Active" value={stats.active} icon={Activity} color="indigo" trend={12} />
            <StatCard title="Pending Review" value={stats.pendingReview} icon={ClipboardCheck} color="purple" />
            <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="emerald" trend={8} />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {filterStatus === 'all' ? 'All Status' : STATUS_CONFIG[filterStatus as ProjectStatus]?.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => setFilterStatus(key)}>
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none h-9 w-9"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none h-9 w-9"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
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
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No projects assigned to you yet.'}
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
                      <Badge className={getStatusColor(STATUS_CONFIG[selectedProject.status]?.color || 'gray')}>
                        {STATUS_CONFIG[selectedProject.status]?.label}
                      </Badge>
                    </div>
                  </DialogHeader>

                  <ScrollArea className="max-h-[calc(85vh-8rem)] px-6 pb-6">
                    <div className="space-y-6 py-4">
                      {/* Stats */}
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold text-primary">{selectedProject.progress}%</p>
                            <p className="text-sm text-muted-foreground">Progress</p>
                            <Progress value={selectedProject.progress} className="mt-2 h-1.5" />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <p className={cn(
                              "text-2xl font-bold",
                              getDaysRemaining(selectedProject.dueDate) < 0 ? "text-red-600" : ""
                            )}>
                              {getDaysRemaining(selectedProject.dueDate)}d
                            </p>
                            <p className="text-sm text-muted-foreground">Days Left</p>
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
                            <p className="text-2xl font-bold">
                              {selectedProject.milestones.filter(m => m.status === 'approved' || m.status === 'completed').length}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              / {selectedProject.milestones.length} Milestones
                            </p>
                          </CardContent>
                        </Card>
                      </div>

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
                              <CardTitle>Description</CardTitle>
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
                            <CardContent className="space-y-3">
                              {selectedProject.messages.map((msg) => (
                                <div key={msg.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                                  <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
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
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="milestones" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Milestones</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {selectedProject.milestones.map((milestone) => {
                                const config = MILESTONE_STATUS_CONFIG[milestone.status]
                                const StatusIcon = config?.icon || Clock
                                return (
                                  <div key={milestone.id} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="font-semibold">{milestone.name}</h4>
                                          <Badge className={getStatusColor(config?.color || 'gray')}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {config?.label}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="team" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Team Members</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {selectedProject.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{member.name}</p>
                                      <p className="text-sm text-muted-foreground">{member.role}</p>
                                      <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <Mail className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Send email</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MessageSquare className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Send message</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
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
            <DialogContent>
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
                        <input type="checkbox" id={`check-${index}`} className="rounded border-muted-foreground/20" />
                        <Label htmlFor={`check-${index}`} className="text-sm font-normal">{item}</Label>
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
            <DialogContent>
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
      </div>
    </TooltipProvider>
  )
}