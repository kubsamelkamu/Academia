"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  FileSearch, 
  Calendar,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  SlidersHorizontal
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

interface EvaluationRow {
  id: string
  studentName: string
  studentId?: string
  projectTitle: string
  projectType?: string
  status: EvaluationStatus
  submittedDate: string
  dueDate?: string
  score?: number
  maxScore?: number
  priority?: "High" | "Medium" | "Low"
  feedbackCount?: number
}

// Extended mock data with more fields
const evaluationData: EvaluationRow[] = [
  {
    id: "eval-1",
    studentName: "Alex Mercer",
    studentId: "STU-2024-001",
    projectTitle: "Machine Learning applied to Smart Grids",
    projectType: "Research",
    status: "Pending Review",
    submittedDate: "2024-05-10",
    dueDate: "2024-05-17",
    priority: "High",
    feedbackCount: 0,
  },
  {
    id: "eval-2",
    studentName: "Maria Garcia",
    studentId: "STU-2024-002",
    projectTitle: "Blockchain for Supply Chain Transparency",
    projectType: "Implementation",
    status: "Evaluated",
    submittedDate: "2024-05-08",
    score: 34,
    maxScore: 40,
    priority: "Medium",
    feedbackCount: 3,
  },
  {
    id: "eval-3",
    studentName: "Liam Johnson",
    studentId: "STU-2024-003",
    projectTitle: "IoT Home Automation Prototype",
    projectType: "Prototype",
    status: "Needs Revision",
    submittedDate: "2024-05-12",
    dueDate: "2024-05-19",
    priority: "High",
    feedbackCount: 2,
  },
  {
    id: "eval-4",
    studentName: "Sophia Chen",
    studentId: "STU-2024-004",
    projectTitle: "Natural Language Processing for Healthcare",
    projectType: "Research",
    status: "Pending Review",
    submittedDate: "2024-05-14",
    dueDate: "2024-05-21",
    priority: "Low",
    feedbackCount: 0,
  },
  {
    id: "eval-5",
    studentName: "James Wilson",
    studentId: "STU-2024-005",
    projectTitle: "Cloud-native Microservices Architecture",
    projectType: "Implementation",
    status: "Pending Review",
    submittedDate: "2024-05-15",
    dueDate: "2024-05-22",
    priority: "Medium",
    feedbackCount: 1,
  },
]

// Status configuration for consistent styling
const STATUS_CONFIG: Record<EvaluationStatus, { 
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  icon: React.ElementType
  className: string
}> = {
  "Pending Review": {
    label: "Pending Review",
    variant: "secondary",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-500/20"
  },
  "Evaluated": {
    label: "Evaluated",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20"
  },
  "Needs Revision": {
    label: "Needs Revision",
    variant: "destructive",
    icon: AlertCircle,
    className: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800 hover:bg-rose-500/20"
  }
}

const PRIORITY_CONFIG = {
  High: { className: "bg-rose-500/10 text-rose-600", icon: AlertCircle },
  Medium: { className: "bg-amber-500/10 text-amber-600", icon: Clock },
  Low: { className: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2 },
}

// Status Badge Component
const StatusBadge = ({ status }: { status: EvaluationStatus }) => {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  
  return (
    <Badge variant="outline" className={`${config.className} border-0`}>
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {config.label}
    </Badge>
  )
}

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority?: "High" | "Medium" | "Low" }) => {
  if (!priority) return null
  const config = PRIORITY_CONFIG[priority]
  const Icon = config.icon
  
  return (
    <Badge variant="outline" className={`${config.className} border-0 text-xs`}>
      <Icon className="h-3 w-3 mr-1" />
      {priority}
    </Badge>
  )
}

// Loading Skeleton
const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    ))}
  </div>
)

// Filters Component
interface Filters {
  status: string
  projectType: string
  priority: string
  dateRange: string
}

export function AdvisorEvaluationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [isLoading, setIsLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filters>({
    status: searchParams.get("status") || "all",
    projectType: searchParams.get("type") || "all",
    priority: searchParams.get("priority") || "all",
    dateRange: searchParams.get("date") || "all",
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const [showFilters, setShowFilters] = React.useState(false)
  
  const itemsPerPage = 5

  // Filter and search logic
  const filteredData = React.useMemo(() => {
    return evaluationData.filter((item) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentId?.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = filters.status === "all" || item.status === filters.status

      // Project type filter
      const matchesType = filters.projectType === "all" || item.projectType === filters.projectType

      // Priority filter
      const matchesPriority = filters.priority === "all" || item.priority === filters.priority

      // Date range filter (simplified for demo)
      const matchesDate = filters.dateRange === "all" || true

      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesDate
    })
  }, [searchQuery, filters])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Handlers
  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.success("Data refreshed successfully")
  }

  const handleExport = () => {
    toast.success("Export started", {
      description: "Your data will be downloaded shortly."
    })
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page on filter change
    
    // Update URL params
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      status: "all",
      projectType: "all",
      priority: "all",
      dateRange: "all",
    })
    setSearchQuery("")
    router.push("/dashboard/advisor/evaluations")
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== "all").length

  const totalEvaluations = evaluationData.length
  const pendingReviewCount = evaluationData.filter((e) => e.status === "Pending Review").length
  const evaluatedCount = evaluationData.filter((e) => e.status === "Evaluated").length
  const completionRate = totalEvaluations > 0 ? Math.round((evaluatedCount / totalEvaluations) * 100) : 0
  const deltaFromLastMonth = Math.max(0, totalEvaluations - 3)
  const overdueCount = Math.max(0, pendingReviewCount - 1)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardPageHeader
          title="Project Evaluations"
          description="Review student projects, provide feedback, and submit final evaluations."
          badge={`${filteredData.length} Total`}
        />
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, project, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="sm:w-auto"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(v) => handleFilterChange("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending Review">Pending Review</SelectItem>
                      <SelectItem value="Evaluated">Evaluated</SelectItem>
                      <SelectItem value="Needs Revision">Needs Revision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select 
                    value={filters.projectType} 
                    onValueChange={(v) => handleFilterChange("projectType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Implementation">Implementation</SelectItem>
                      <SelectItem value="Prototype">Prototype</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={filters.priority} 
                    onValueChange={(v) => handleFilterChange("priority", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select 
                    value={filters.dateRange} 
                    onValueChange={(v) => handleFilterChange("dateRange", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeFilterCount > 0 && (
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">+{deltaFromLastMonth} from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingReviewCount}
            </div>
            <p className="text-xs text-muted-foreground">{overdueCount} overdue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {evaluatedCount}
            </div>
            <p className="text-xs text-muted-foreground">{completionRate}% completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {evaluationData.filter(e => e.status === "Needs Revision").length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evaluation List</CardTitle>
              <CardDescription>
                Showing {paginatedData.length} of {filteredData.length} evaluations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden md:table-cell">Project</TableHead>
                      <TableHead className="hidden lg:table-cell">Type</TableHead>
                      <TableHead className="w-[130px]">Submitted</TableHead>
                      <TableHead className="w-[100px]">Priority</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((evaluation, index) => (
                      <TableRow 
                        key={evaluation.id} 
                        className="group hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/advisor/evaluations/${evaluation.id}`)}
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{evaluation.studentName}</div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {evaluation.projectTitle}
                            </div>
                            {evaluation.studentId && (
                              <div className="text-xs text-muted-foreground">{evaluation.studentId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate block">{evaluation.projectTitle}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{evaluation.projectTitle}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {evaluation.feedbackCount ? (
                            <span className="text-xs text-muted-foreground">
                              {evaluation.feedbackCount} feedback
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline">{evaluation.projectType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(evaluation.submittedDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {evaluation.dueDate && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Due: {new Date(evaluation.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={evaluation.priority} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={evaluation.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/advisor/evaluations/${evaluation.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Quick Feedback</DropdownMenuItem>
                              <DropdownMenuItem>Request Revision</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <FileSearch className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No evaluations found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                    Try adjusting your search or filter criteria to find what you&apos;re looking for.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {filteredData.length > 0 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1
                        // Show current page, first, last, and adjacent pages
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="icon"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </PaginationItem>
                          )
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        return null
                      })}

                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}