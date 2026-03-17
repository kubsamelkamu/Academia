"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import DataTable, { type Column } from "@/components/shared/DataTable"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  Eye,
  Download,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Code,
  Archive,
  Award,
  GitBranch,
  Star,
  BookOpen,
  UserCheck,
  DollarSign,
  PieChart,
  Activity,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  Info,
} from "lucide-react"

// Helper Components for better reusability and styling
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
}) => (
  <Button
    variant="outline"
    className="w-full justify-start gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all group"
    onClick={onClick}
  >
    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    <span>{label}</span>
  </Button>
);

const DocumentButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
}) => (
  <Button 
    variant="outline" 
    className="justify-start gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all group w-full"
    onClick={onClick}
  >
    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    <span className="truncate">{label}</span>
  </Button>
);

// Mock data interfaces
interface Project {
  id: string;
  title: string;
  groupName: string;
  advisorName: string;
  status: 'active' | 'completed' | 'on-hold' | 'pending' | 'submitted' | 'approved';
  progress: number;
  startDate: string;
  dueDate: string;
  departmentId: string;
  departmentName: string;
  groupMembers: string[];
  evaluators?: string[];
  budget?: number;
  category: string;
  tags: string[];
  lastActivity: string;
  description?: string;
  technologies?: string[];
  milestones?: { name: string; status: "pending" | "in-progress" | "completed"; dueDate: string }[];
}

interface PastProject extends Project {
  completionDate: string;
  academicYear: string;
  grade: number;
  feedback: string;
  description?: string;
  documents: {
    srs?: string;
    sdd?: string;
    reports: string[];
    sourceCode?: string;
    poster?: string;
    presentation?: string;
  };
  metadata: {
    technologies: string[];
    keywords: string[];
    awards?: string[];
    publications?: string[];
  };
  students: string[];
  evaluatorNames: string[];
}

// Mock data
const mockActiveProjects: Project[] = [
  {
    id: '1',
    title: 'AI-Powered Student Assistant',
    groupName: 'Group Alpha',
    advisorName: 'Dr. Sarah Johnson',
    status: 'active',
    progress: 75,
    startDate: '2024-01-15',
    dueDate: '2024-05-30',
    departmentId: 'dept1',
    departmentName: 'Computer Science',
    groupMembers: ['John Doe', 'Jane Smith', 'Bob Wilson'],
    evaluators: ['Dr. Michael Chen', 'Prof. Emily Rodriguez'],
    budget: 5000,
    category: 'Artificial Intelligence',
    tags: ['AI', 'Machine Learning', 'Education'],
    lastActivity: '2024-03-15',
    description: "An AI-powered assistant to help students with coursework, reminders, and scheduling.",
    technologies: ["Python", "TensorFlow", "React", "Node.js"],
    milestones: [
      { name: "Requirements Analysis", status: "completed", dueDate: "2024-02-15" },
      { name: "System Design", status: "completed", dueDate: "2024-03-15" },
      { name: "Prototype Development", status: "in-progress", dueDate: "2024-04-15" },
      { name: "Testing & Deployment", status: "pending", dueDate: "2024-05-30" },
    ],
  },
  {
    id: '2',
    title: 'Blockchain-Based Voting System',
    groupName: 'Group Beta',
    advisorName: 'Prof. Michael Chen',
    status: 'submitted',
    progress: 90,
    startDate: '2024-02-01',
    dueDate: '2024-06-15',
    departmentId: 'dept1',
    departmentName: 'Computer Science',
    groupMembers: ['Alice Brown', 'Charlie Davis'],
    evaluators: ['Dr. Lisa Thompson', 'Prof. David Kim'],
    budget: 7500,
    category: 'Blockchain',
    tags: ['Blockchain', 'Security', 'E-voting'],
    lastActivity: '2024-03-14',
    description: "A secure blockchain-based voting system for academic institutions.",
    technologies: ["Ethereum", "Solidity", "Web3.js", "React"],
    milestones: [
      { name: "Requirements Analysis", status: "completed", dueDate: "2024-02-28" },
      { name: "System Design", status: "completed", dueDate: "2024-03-31" },
      { name: "Smart Contract Development", status: "completed", dueDate: "2024-04-30" },
      { name: "Testing & Deployment", status: "in-progress", dueDate: "2024-06-15" },
    ],
  },
  {
    id: '3',
    title: 'Smart Campus IoT Platform',
    groupName: 'Group Gamma',
    advisorName: 'Dr. Emily Rodriguez',
    status: 'active',
    progress: 45,
    startDate: '2024-03-01',
    dueDate: '2024-07-30',
    departmentId: 'dept1',
    departmentName: 'Computer Science',
    groupMembers: ['Eva Green', 'Frank White', 'Grace Lee'],
    evaluators: ['Dr. Sarah Johnson'],
    budget: 10000,
    category: 'IoT',
    tags: ['IoT', 'Smart Campus', 'Sensors'],
    lastActivity: '2024-03-16',
    description: "An IoT platform for monitoring and managing campus resources in real time.",
    technologies: ["Arduino", "Raspberry Pi", "MQTT", "React"],
    milestones: [
      { name: "Requirements Analysis", status: "completed", dueDate: "2024-03-15" },
      { name: "System Design", status: "completed", dueDate: "2024-04-15" },
      { name: "Hardware Development", status: "in-progress", dueDate: "2024-05-30" },
      { name: "Integration & Testing", status: "pending", dueDate: "2024-07-30" },
    ],
  },
  {
    id: '4',
    title: 'Virtual Reality Lab Simulator',
    groupName: 'Group Delta',
    advisorName: 'Prof. David Kim',
    status: 'on-hold',
    progress: 30,
    startDate: '2024-02-15',
    dueDate: '2024-08-15',
    departmentId: 'dept1',
    departmentName: 'Computer Science',
    groupMembers: ['Henry Ford', 'Ivy Chen'],
    evaluators: ['Dr. Michael Chen'],
    budget: 15000,
    category: 'VR/AR',
    tags: ['VR', 'Education', 'Simulation'],
    lastActivity: '2024-03-10',
    description: "A virtual reality laboratory simulator to support science education and experiments.",
    technologies: ["Unity", "C#", "Blender", "SteamVR"],
    milestones: [
      { name: "Requirements Analysis", status: "completed", dueDate: "2024-03-01" },
      { name: "System Design", status: "in-progress", dueDate: "2024-04-15" },
      { name: "3D Modeling", status: "in-progress", dueDate: "2024-05-30" },
      { name: "Testing", status: "pending", dueDate: "2024-08-15" },
    ],
  }
];

const mockPastProjects: PastProject[] = [
  {
    id: 'p1',
    title: 'Automated Grading System',
    groupName: 'Group Epsilon',
    advisorName: 'Dr. Sarah Johnson',
    status: 'completed',
    progress: 100,
    startDate: '2023-09-01',
    dueDate: '2023-12-15',
    completionDate: '2023-12-10',
    academicYear: '2023-2024',
    grade: 92,
    feedback: 'Excellent implementation with comprehensive testing.',
    departmentId: 'dept1',
    departmentName: 'Computer Science',
    groupMembers: ['John Doe', 'Jane Smith'],
    students: ['John Doe', 'Jane Smith'],
    evaluatorNames: ['Dr. Michael Chen', 'Prof. Emily Rodriguez'],
    documents: {
      srs: '/docs/srs.pdf',
      sdd: '/docs/sdd.pdf',
      reports: ['/docs/final.pdf', '/docs/technical.pdf'],
      sourceCode: '/code/archive.zip',
      poster: '/docs/poster.pdf',
      presentation: '/docs/slides.pptx'
    },
    metadata: {
      technologies: ['Python', 'Django', 'React', 'PostgreSQL'],
      keywords: ['Grading', 'Automation', 'Education'],
      awards: ['Best Project Award 2023'],
      publications: ['IEEE EDUCON 2024']
    },
    budget: 8000,
    category: 'EdTech',
    tags: ['Education', 'Automation', 'Web App'],
    lastActivity: '2023-12-10',
    description:
      "An automated grading system that streamlines evaluation and provides consistent feedback to students.",
  },
  {
    id: 'p2',
    title: 'Healthcare Analytics Platform',
    groupName: 'Group Zeta',
    advisorName: 'Dr. Lisa Thompson',
    status: 'completed',
    progress: 100,
    startDate: '2023-09-15',
    dueDate: '2023-12-20',
    completionDate: '2023-12-18',
    academicYear: '2023-2024',
    grade: 88,
    feedback: 'Good work on data visualization. Consider adding more security features.',
    departmentId: 'dept2',
    departmentName: 'Data Science',
    groupMembers: ['Alice Brown', 'Charlie Davis', 'Eva Green'],
    students: ['Alice Brown', 'Charlie Davis', 'Eva Green'],
    evaluatorNames: ['Dr. Michael Chen', 'Prof. David Kim'],
    documents: {
      srs: '/docs/healthcare-srs.pdf',
      reports: ['/docs/healthcare-final.pdf'],
      sourceCode: '/code/healthcare.zip'
    },
    metadata: {
      technologies: ['Python', 'TensorFlow', 'React', 'MongoDB'],
      keywords: ['Healthcare', 'Analytics', 'Machine Learning'],
      publications: ['HealthTech Journal 2024']
    },
    budget: 12000,
    category: 'Healthcare',
    tags: ['Healthcare', 'Analytics', 'ML'],
    lastActivity: '2023-12-18',
    description:
      "A comprehensive healthcare analytics platform for predicting patient outcomes and optimizing hospital resources.",
  }
];

const getStatusBadgeVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
    case "active":
      return "default"
    case "submitted":
    case "in-progress":
    case "pending":
      return "secondary"
    case "rejected":
      return "destructive"
    case "on-hold":
    default:
      return "outline"
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const displayStatus = status.replace(/-/g, " ")
  return (
    <Badge variant={getStatusBadgeVariant(status)} className="capitalize whitespace-nowrap">
      {displayStatus}
    </Badge>
  )
}

export default function ProjectsOverview() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<PastProject | null>(null)
  const [showPastDetails, setShowPastDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")
  const [selectedActiveProject, setSelectedActiveProject] = useState<Project | null>(null)
  const [showActiveDetails, setShowActiveDetails] = useState(false)

  // Get unique categories
  const allProjects = [...mockActiveProjects, ...mockPastProjects];
  const categories = ['all', ...new Set(allProjects.map(p => p.category))];

  // Filter projects based on search and category
  const filterProjects = <T extends Project | PastProject>(projects: T[]): T[] => {
    return projects.filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  };

  const filteredActiveProjects = filterProjects(mockActiveProjects)
  const filteredPastProjects = filterProjects(mockPastProjects)

  const handleViewPastProject = (project: PastProject) => {
    setSelectedProject(project)
    setShowPastDetails(true)
    setShowActiveDetails(false)
  }

  const handleViewActiveProject = (project: Project) => {
    setSelectedActiveProject(project)
    setShowActiveDetails(true)
    setShowPastDetails(false)
  }

  const triggerBrowserDownload = (filePath: string, fileName?: string) => {
    try {
      const link = document.createElement("a")
      link.href = filePath
      if (fileName) {
        link.download = fileName
      }
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Failed to start download", error)
    }
  }

  const handleDownloadDocument = (filePath: string, fileName: string) => {
    triggerBrowserDownload(filePath, fileName)
    toast("Download Started", {
      description: `Downloading ${fileName}...`,
    })
  }

  const handleDownloadActiveSummary = (project: Project) => {
    const safeTitle = project.title.replace(/\s+/g, "_")
    const fileName = `${safeTitle}_summary.pdf`
    // Placeholder path – wire to real report endpoint when available.
    triggerBrowserDownload("/docs/project-summary-placeholder.pdf", fileName)
    toast("Download Started", {
      description: `Downloading ${fileName}...`,
    })
  }

  const handleExportReport = () => {
    toast("Report Generated", {
      description: "Projects overview report has been generated and downloaded.",
    })
  };

  // Calculate statistics
  const totalProjects = allProjects.length;
  const activeCount = mockActiveProjects.length;
  const completedCount = mockPastProjects.length;
  const avgProgress = Math.round(mockActiveProjects.reduce((acc, p) => acc + p.progress, 0) / mockActiveProjects.length);
  const totalBudget = allProjects.reduce((acc, p) => acc + (p.budget || 0), 0);

  const activeColumns: Column<Project>[] = [
    { 
      key: 'title', 
      header: 'Project', 
      render: (p) => (
        <div className="min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-medium hover:text-primary cursor-pointer truncate"
                onClick={() => handleViewActiveProject(p)}
                title={p.title}
              >
                {p.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">{p.groupName}</p>
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'advisor', 
      header: 'Advisor', 
      render: (p) => (
        <div className="min-w-[150px]">
          <p className="font-medium truncate" title={p.advisorName}>{p.advisorName}</p>
          <p className="text-xs text-muted-foreground truncate" title={p.departmentName}>{p.departmentName}</p>
        </div>
      )
    },
    { 
      key: 'progress', 
      header: 'Progress', 
      render: (p) => (
        <div className="min-w-[140px]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{p.progress}%</span>
          </div>
          <Progress value={p.progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
            Due: {new Date(p.dueDate).toLocaleDateString()}
          </p>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (p) => <StatusBadge status={p.status} /> 
    },
    { 
      key: 'category', 
      header: 'Category', 
      render: (p) => (
        <Badge variant="outline" className="whitespace-nowrap">{p.category}</Badge>
      )
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (p) => (
        <div className="flex gap-2 whitespace-nowrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewActiveProject(p)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadActiveSummary(p)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  const pastColumns: Column<PastProject>[] = [
    { 
      key: 'title', 
      header: 'Project', 
      render: (p) => (
        <div className="min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Archive className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-medium hover:text-primary cursor-pointer truncate"
                onClick={() => handleViewPastProject(p)}
                title={p.title}
              >
                {p.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">{p.groupName}</p>
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'academicYear', 
      header: 'Academic Year', 
      render: (p) => (
        <div className="min-w-[120px]">
          <p className="font-medium whitespace-nowrap">{p.academicYear}</p>
          <p className="text-xs text-muted-foreground truncate" title={p.departmentName}>{p.departmentName}</p>
        </div>
      )
    },
    { 
      key: 'completionDate', 
      header: 'Completed', 
      render: (p) => (
        <div className="min-w-[120px]">
          <p className="font-medium whitespace-nowrap">{new Date(p.completionDate).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">Grade: {p.grade}%</p>
        </div>
      )
    },
    { 
      key: 'technologies', 
      header: 'Technologies', 
      render: (p) => (
        <div className="min-w-[150px]">
          <div className="flex flex-wrap gap-1">
            {p.metadata.technologies.slice(0, 2).map(tech => (
              <Badge key={tech} variant="secondary" className="text-xs whitespace-nowrap">{tech}</Badge>
            ))}
            {p.metadata.technologies.length > 2 && (
              <Badge variant="outline" className="text-xs whitespace-nowrap">+{p.metadata.technologies.length - 2}</Badge>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (p) => <StatusBadge status={p.status} /> 
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (p) => (
        <div className="flex gap-2 whitespace-nowrap">
          <Button variant="ghost" size="sm" onClick={() => handleViewPastProject(p)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadDocument(p.documents.reports[0] ?? "/docs/final.pdf", `${p.title.replace(/\s+/g, "_")}_final.pdf`)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  const renderPastProjectDetails = (project: PastProject) => {
    return (
      <div className="min-h-screen bg-background overflow-y-auto">
        {/* Header - matching system background, removed sticky positioning */}
        <div className="border-b bg-background">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPastDetails(false)}
                  className="gap-2 hover:bg-background/80 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Projects
                </Button>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold truncate max-w-2xl" title={project.title}>
                    {project.title}
                  </h1>
                  <p className="text-sm text-muted-foreground truncate">{project.groupName}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Badge variant="outline" className="px-3 py-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {project.academicYear}
                </Badge>
                <Badge className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Grade: {project.grade}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content - natural scrolling */}
        <div className="px-8 py-6 space-y-6">
          {/* Project Overview Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Project Overview
                </CardTitle>
                <CardDescription>{project.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Details</h4>
                    <DetailRow label="Advisor" value={project.advisorName} />
                    <DetailRow label="Department" value={project.departmentName} />
                    <DetailRow label="Category" value={project.category} />
                    <DetailRow label="Budget" value={`$${project.budget?.toLocaleString() ?? "—"}`} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Timeline</h4>
                    <DetailRow label="Start Date" value={new Date(project.startDate).toLocaleDateString()} />
                    <DetailRow label="Completion Date" value={new Date(project.completionDate).toLocaleDateString()} />
                    <DetailRow label="Academic Year" value={project.academicYear} />
                    <DetailRow label="Final Grade" value={`${project.grade}%`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Members ({project.students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.students.map((student, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {student
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium truncate" title={student}>
                        {student}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technologies & Awards */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Technologies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Technologies Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.metadata.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="px-3 py-1">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Awards */}
            {project.metadata.awards && project.metadata.awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Awards & Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.metadata.awards.map((awardText, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">{awardText}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Publications */}
          {project.metadata.publications && project.metadata.publications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Publications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.metadata.publications.map((pub, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <span>{pub}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Project Documents
              </CardTitle>
              <CardDescription>Download project documentation and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {project.documents.srs && (
                  <DocumentButton icon={FileText} label="SRS Document" onClick={() => handleDownloadDocument(project.documents.srs!, "SRS.pdf")} />
                )}
                {project.documents.sdd && (
                  <DocumentButton icon={FileText} label="SDD Document" onClick={() => handleDownloadDocument(project.documents.sdd!, "SDD.pdf")} />
                )}
                {project.documents.reports.map((report, index) => (
                  <DocumentButton
                    key={`${report}-${index}`}
                    icon={FileText}
                    label={index === 0 ? "Final Report" : `Appendix ${index}`}
                    onClick={() => handleDownloadDocument(report, `Report_${index + 1}.pdf`)}
                  />
                ))}
                {project.documents.sourceCode && (
                  <DocumentButton icon={Code} label="Source Code" onClick={() => handleDownloadDocument(project.documents.sourceCode!, "source_code.zip")} />
                )}
                {project.documents.poster && (
                  <DocumentButton icon={FileText} label="Project Poster" onClick={() => handleDownloadDocument(project.documents.poster!, "poster.pdf")} />
                )}
                {project.documents.presentation && (
                  <DocumentButton icon={FileText} label="Presentation" onClick={() => handleDownloadDocument(project.documents.presentation!, "presentation.pptx")} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="font-semibold">Evaluator Feedback</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Feedback: {project.feedback}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate" title={project.evaluatorNames.join(", ")}>
                      Evaluators: {project.evaluatorNames.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderActiveProjectDetails = (project: Project) => {
    return (
      <div className="min-h-screen bg-background overflow-y-auto">
        {/* Header - matching system background, removed sticky positioning */}
        <div className="border-b bg-background">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActiveDetails(false)}
                  className="gap-2 hover:bg-background/80 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Projects
                </Button>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold truncate max-w-2xl" title={project.title}>
                    {project.title}
                  </h1>
                  <p className="text-sm text-muted-foreground truncate">{project.groupName}</p>
                </div>
              </div>
              <Badge variant="outline" className="px-3 py-1 flex-shrink-0">
                Project ID: {project.id}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content - natural scrolling */}
        <div className="px-8 py-6 space-y-6">
          {/* Project Overview Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Project Overview
                </CardTitle>
                <CardDescription>{project.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Details</h4>
                    <DetailRow label="Advisor" value={project.advisorName} />
                    <DetailRow label="Department" value={project.departmentName} />
                    <DetailRow label="Category" value={project.category} />
                    <DetailRow label="Budget" value={`$${project.budget?.toLocaleString() ?? "—"}`} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Timeline</h4>
                    <DetailRow label="Start Date" value={new Date(project.startDate).toLocaleDateString()} />
                    <DetailRow label="Due Date" value={new Date(project.dueDate).toLocaleDateString()} />
                    <DetailRow label="Status" value={<StatusBadge status={project.status} />} />
                    <DetailRow label="Progress" value={`${project.progress}%`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Members ({project.groupMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.groupMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {member
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium truncate" title={member}>
                        {member}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="px-3 py-1">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  Project Milestones
                </CardTitle>
                <CardDescription>Track progress of key project phases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          milestone.status === "completed"
                            ? "bg-green-500"
                            : milestone.status === "in-progress"
                              ? "bg-yellow-500"
                              : "bg-gray-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-3">
                          <p className="text-sm font-medium truncate" title={milestone.name}>
                            {milestone.name}
                          </p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-xs capitalize text-muted-foreground mt-1">
                          Status: {milestone.status.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <ActionButton
                  icon={FileText}
                  label="Download Report"
                  onClick={() => handleDownloadActiveSummary(project)}
                />
                <ActionButton
                  icon={Calendar}
                  label="Schedule Meeting"
                  onClick={() => toast("Schedule meeting", { description: "Calendar integration coming soon" })}
                />
                <ActionButton
                  icon={Users}
                  label="Contact Team"
                  onClick={() => router.push("/dashboard/department-head/projects/teams")}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showActiveDetails && selectedActiveProject) {
    return renderActiveProjectDetails(selectedActiveProject)
  }

  if (showPastDetails && selectedProject) {
    return renderPastProjectDetails(selectedProject)
  }

  return (
    <div className="space-y-6 animate-fade-in px-6 max-w-[1920px] mx-auto">
      <DashboardPageHeader
        title="Projects Overview"
        description="Monitor and manage all department projects, both active and completed"
        actions={
          <div className="flex gap-2 whitespace-nowrap">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button className="btn-gradient" asChild>
              <Link href="/dashboard/department-head/projects/new">
                <FolderOpen className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
        }
      />

      {/* Statistics Cards - Full width grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold mt-2">{totalProjects}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 whitespace-nowrap">
                    Active: {activeCount}
                  </Badge>
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">Completed: {completedCount}</Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold mt-2">{activeCount}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Avg Progress: {avgProgress}%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{completedCount}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Award className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Avg Grade: 90%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-3xl font-bold mt-2">${(totalBudget / 1000).toFixed(1)}K</p>
                <div className="flex items-center gap-1 mt-2">
                  <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{allProjects.reduce((acc, p) => acc + p.groupMembers.length, 0)} Students</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter - Full width */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by title, group, advisor, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[180px]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                }}
                className="whitespace-nowrap"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "active" | "past")}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Active ({filteredActiveProjects.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Past ({filteredPastProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Current Projects</CardTitle>
                  <CardDescription>
                    {filteredActiveProjects.length} active projects in progress
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/department-head/projects/active" className="whitespace-nowrap">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[1200px]">
                <DataTable
                  data={filteredActiveProjects}
                  columns={activeColumns}
                  onRowClick={(row) => handleViewActiveProject(row as Project)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Completed Projects</CardTitle>
                  <CardDescription>
                    {filteredPastProjects.length} archived projects with documentation
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/department-head/projects/archived" className="whitespace-nowrap">
                    View Archive <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[1200px]">
                <DataTable
                  data={filteredPastProjects}
                  columns={pastColumns}
                  onRowClick={(row) => handleViewPastProject(row as PastProject)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats - Full width */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Upcoming Deadlines</p>
                <p className="text-2xl font-bold mt-2">5</p>
                <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">Next: May 30, 2024</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Projects Awaiting Review</p>
                <p className="text-2xl font-bold mt-2">3</p>
                <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">Pending evaluation</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Top Categories</p>
                <p className="text-2xl font-bold mt-2">6</p>
                <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">AI, IoT, Blockchain, etc.</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}