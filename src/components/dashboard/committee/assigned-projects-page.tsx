"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  RotateCcw,
  Search,
  XCircle,
  CheckCheck,
  X,
  Eye,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  BookOpen,
  TrendingUp,
  Download,
  Mail,
  MessageSquare,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ProjectFilter = "All" | "Pending" | "Approved" | "Rejected" | "Resubmitted"

interface CommitteeProjectTitle {
  id: string
  student: string
  title: string
  track: string
  status: Exclude<ProjectFilter, "All">
  submissionDate?: string
  comments?: string
  reviewer?: string
}

const initialProjects: CommitteeProjectTitle[] = [
  {
    id: "cp1",
    student: "Amina Niyonsaba",
    title: "Campus Smart Parking Prediction",
    track: "Software Systems",
    status: "Pending",
    submissionDate: "2024-03-15",
    reviewer: "Dr. Smith",
  },
  {
    id: "cp2",
    student: "Jean Claude",
    title: "Automated Defense Q&A Preparation Assistant",
    track: "Artificial Intelligence",
    status: "Resubmitted",
    submissionDate: "2024-03-14",
    reviewer: "Dr. Johnson",
    comments: "Please revise the methodology section",
  },
  {
    id: "cp3",
    student: "Grace Uwase",
    title: "Student Internship Matching Platform",
    track: "Information Systems",
    status: "Approved",
    submissionDate: "2024-03-13",
    reviewer: "Dr. Smith",
  },
  {
    id: "cp4",
    student: "Marie Claire",
    title: "Blockchain-based Academic Credential Verification",
    track: "Software Systems",
    status: "Pending",
    submissionDate: "2024-03-16",
  },
  {
    id: "cp5",
    student: "Peter Nsengiyumva",
    title: "NLP-based Research Paper Recommendation System",
    track: "Artificial Intelligence",
    status: "Rejected",
    submissionDate: "2024-03-12",
    reviewer: "Dr. Johnson",
    comments: "Topic too broad, please narrow down scope",
  },
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export function CommitteeAssignedProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilter>("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [rows, setRows] = useState(initialProjects)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  // Filter and search logic
  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesFilter = filter === "All" ? true : row.status === filter
      const matchesSearch = 
        row.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.track.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [rows, filter, searchTerm])

  // Calculate stats
  const stats = useMemo(() => {
    const total = rows.length
    const pending = rows.filter(r => r.status === "Pending").length
    const approved = rows.filter(r => r.status === "Approved").length
    const resubmitted = rows.filter(r => r.status === "Resubmitted").length
    const rejected = rows.filter(r => r.status === "Rejected").length
    
    return {
      total,
      pending,
      approved,
      resubmitted,
      rejected,
      completionRate: total > 0 ? Math.round((approved / total) * 100) : 0
    }
  }, [rows])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Projects refreshed", {
      description: "Latest project data has been loaded."
    })
    setIsRefreshing(false)
  }

  const approve = (id: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, status: "Approved" } : row
      )
    )
    const project = rows.find(r => r.id === id)
    toast.success("Project approved", {
      description: `The project title for ${project?.student} has been approved.`
    })
  }

  const reject = (id: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, status: "Rejected" } : row
      )
    )
    const project = rows.find(r => r.id === id)
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-background border shadow-lg p-4"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Project rejected</p>
            <p className="text-xs text-muted-foreground mt-1">
              The project title for {project?.student} has been rejected.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            undoReject(id)
            toast.dismiss(t)
          }}>
            Undo
          </Button>
        </div>
      </motion.div>
    ))
  }

  const undoReject = (id: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, status: "Pending" } : row
      )
    )
  }

  const requestResubmit = (id: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, status: "Resubmitted" } : row
      )
    )
    const project = rows.find(r => r.id === id)
    toast.info("Resubmission requested", {
      description: `${project?.student} has been asked to resubmit with revisions.`
    })
  }

  const approveMultiple = () => {
    if (selectedProjects.length === 0) {
      toast.warning("No projects selected")
      return
    }
    setRows((current) =>
      current.map((row) =>
        selectedProjects.includes(row.id) ? { ...row, status: "Approved" } : row
      )
    )
    toast.success(`${selectedProjects.length} projects approved`)
    setSelectedProjects([])
  }

  const rejectMultiple = () => {
    if (selectedProjects.length === 0) {
      toast.warning("No projects selected")
      return
    }
    setRows((current) =>
      current.map((row) =>
        selectedProjects.includes(row.id) ? { ...row, status: "Rejected" } : row
      )
    )
    toast.warning(`${selectedProjects.length} projects rejected`)
    setSelectedProjects([])
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800"
      case "Rejected":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "Resubmitted":
        return "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800"
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Approved":
        return <CheckCircle2 className="h-3 w-3" />
      case "Rejected":
        return <XCircle className="h-3 w-3" />
      case "Resubmitted":
        return <RotateCcw className="h-3 w-3" />
      default:
        return <Clock3 className="h-3 w-3" />
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6 lg:p-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <DashboardPageHeader
          title="Assigned Projects"
          description="Review student title submissions and decide approval or revision requests."
          badge="Committee"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh project data"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="/api/projects/export" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </a>
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* Enhanced KPI Grid */}
      <motion.div variants={itemVariants}>
        <DashboardKpiGrid
          items={[
            { 
              title: "Titles in Queue", 
              value: stats.total.toString(), 
              note: "Total submissions", 
              icon: FolderKanban,
            },
            { 
              title: "Pending", 
              value: stats.pending.toString(), 
              note: "Awaiting your decision", 
              icon: Clock3,
            },
            { 
              title: "Approved", 
              value: stats.approved.toString(), 
              note: `${stats.completionRate}% completion rate`, 
              icon: CheckCircle2,
            },
            { 
              title: "Resubmitted", 
              value: stats.resubmitted.toString(), 
              note: "Back for review", 
              icon: RotateCcw 
            },
          ]}
        />
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <DashboardSectionCard
          title="Title Submission Review"
          description="Filter title submissions and apply committee decisions directly."
        >
          {/* Filter and Search Bar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["All", "Pending", "Approved", "Rejected", "Resubmitted"] as ProjectFilter[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={filter === item ? "default" : "outline"}
                  onClick={() => setFilter(item)}
                  className={cn(
                    "relative",
                    filter === item && "shadow-md"
                  )}
                >
                  {item}
                  {item !== "All" && stats[item.toLowerCase() as keyof typeof stats] > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 h-5 px-1.5"
                    >
                      {stats[item.toLowerCase() as keyof typeof stats]}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Bulk Actions */}
              {selectedProjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary" className="px-2 py-1">
                    {selectedProjects.length} selected
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600"
                          onClick={approveMultiple}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Approve selected</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={rejectMultiple}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reject selected</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )}
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleRows.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <FolderKanban className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No projects found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {searchTerm || filter !== "All" 
                      ? "Try adjusting your filters or search term."
                      : "When projects are assigned to you, they will appear here."}
                  </p>
                  {(searchTerm || filter !== "All") && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("")
                        setFilter("All")
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </motion.div>
              ) : (
                visibleRows.map((row, index) => (
                  <motion.div
                    key={row.id}
                    variants={itemVariants}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "group rounded-lg border transition-all hover:shadow-md",
                      expandedId === row.id && "ring-2 ring-primary/20"
                    )}
                  >
                    <CardContent className="p-4">
                      {/* Main Row Content */}
                      <div className="flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Checkbox for bulk selection */}
                            <input
                              type="checkbox"
                              className="mt-1 rounded border-gray-300"
                              checked={selectedProjects.includes(row.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProjects([...selectedProjects, row.id])
                                } else {
                                  setSelectedProjects(selectedProjects.filter(id => id !== row.id))
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            {/* Student Avatar */}
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarFallback className="bg-primary/10 text-sm">
                                {row.student.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>

                            {/* Student Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold">{row.student}</h4>
                                {row.submissionDate && (
                                  <span className="text-xs text-muted-foreground">
                                    Submitted {new Date(row.submissionDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-1">{row.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {row.track}
                                </Badge>
                                {row.reviewer && (
                                  <span className="text-xs text-muted-foreground">
                                    Assigned to {row.reviewer}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={cn(
                                "gap-1 px-2 py-1",
                                getStatusColor(row.status)
                              )}
                            >
                              {getStatusIcon(row.status)}
                              {row.status}
                            </Badge>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                            >
                              {expandedId === row.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast.info(`Viewing ${row.student}'s details`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(`Contacting ${row.student}`)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Contact student
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(`Adding comment for ${row.student}`)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Add comment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pl-12">
                          <div className="flex items-center gap-2">
                            {row.status !== "Approved" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                      onClick={() => approve(row.id)}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Approve this project title</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {row.status !== "Rejected" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-destructive text-destructive hover:bg-destructive/10"
                                      onClick={() => reject(row.id)}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Reject this project title</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {row.status === "Rejected" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                      onClick={() => requestResubmit(row.id)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Request Resubmission
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ask student to resubmit with revisions</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedId === row.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden pl-12"
                            >
                              <div className="pt-3 border-t mt-2">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Submission Details
                                    </p>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>Project ID: {row.id}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                        <span>Track: {row.track}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>Reviewer: {row.reviewer || "Not assigned"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {row.comments && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Review Comments
                                      </p>
                                      <div className="rounded-lg bg-muted/50 p-3">
                                        <p className="text-sm">{row.comments}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Summary Footer */}
          {visibleRows.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-4">
                <span>Showing {visibleRows.length} of {rows.length} projects</span>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <span>Completion rate:</span>
                  <Progress value={stats.completionRate} className="h-2 w-20" />
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.pending} pending
              </Badge>
            </motion.div>
          )}
        </DashboardSectionCard>
      </motion.div>

      {/* Quick Stats Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Review Time</p>
                <p className="text-2xl font-bold mt-2">2.4 days</p>
                <p className="text-xs text-muted-foreground mt-1">-0.3 from last week</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold mt-2">{stats.completionRate}%</p>
                <Progress value={stats.completionRate} className="h-2 mt-2" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Reviews</p>
                <p className="text-2xl font-bold mt-2">{stats.pending}</p>
                <p className="text-xs text-muted-foreground mt-1">Across {stats.resubmitted} resubmissions</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Committee Performance</p>
                <p className="text-2xl font-bold mt-2">94%</p>
                <p className="text-xs text-muted-foreground mt-1">On-time reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}