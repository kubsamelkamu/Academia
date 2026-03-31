"use client"

import React, { useState, useMemo } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Calculator,
  FileCheck,
  Download,
  Upload,
  Target,
  Clock,
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Search,
} from 'lucide-react'
import { mockGrades, mockProjects, Grade } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'
import {
  useApproveGroupLeaderRequest,
  usePendingGroupLeaderRequests,
  useRejectGroupLeaderRequest,
} from '@/lib/hooks/use-group-leader-requests'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeBreakdown {
  studentName: string
  projectTitle: string
  evaluatorScores: number[]
  advisorScore: number
  documentationScore: number
  finalScore: number
  grade: string
  status: 'provisional' | 'final' | 'rejected'
}

type PendingApplication = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  departmentName?: string
  status?: string
  createdAt?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GradeManagementPage() {
  const { toast } = useToast()

  // ── Grade management state ─────────────────────────────────────────────────
  const [localGrades, setLocalGrades] = useState<Grade[]>(mockGrades)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [complaintDays, setComplaintDays] = useState('7')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [newScore, setNewScore] = useState('')

  // ── Applications state ─────────────────────────────────────────────────────
  const [appSearch, setAppSearch] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)

  const {
    data: groupLeaderData,
    isLoading: isLoadingGroupLeaders,
    isError: isErrorGroupLeaders,
    error: groupLeaderError,
    refetch: refetchGroupLeaders,
  } = usePendingGroupLeaderRequests({ page: 1, search: appSearch })

  const approveMutation = useApproveGroupLeaderRequest()
  const rejectMutation = useRejectGroupLeaderRequest()

  const pendingApplications: PendingApplication[] =
    (groupLeaderData as { data?: { items?: PendingApplication[] } } | undefined)?.data?.items ?? []

  const filteredApplications = pendingApplications.filter((a) => {
    if (!appSearch.trim()) return true
    const q = appSearch.toLowerCase()
    return (
      (a.firstName?.toLowerCase().includes(q) ?? false) ||
      (a.lastName?.toLowerCase().includes(q) ?? false) ||
      (a.email?.toLowerCase().includes(q) ?? false) ||
      (a.departmentName?.toLowerCase().includes(q) ?? false)
    )
  })

  // ── Grade computed data ────────────────────────────────────────────────────

  const gradeBreakdowns: GradeBreakdown[] = useMemo(() => {
    return localGrades.map(grade => {
      const evaluatorScores = grade.evaluatorScores || [35, 38, 32]
      const advisorScore = grade.advisorScore || 28
      const documentationScore = grade.documentationScore || 25
      return {
        studentName: grade.studentName,
        projectTitle: mockProjects.find(p => p.id === grade.studentName.toLowerCase().replace(' ', ''))?.title || 'Unknown Project',
        evaluatorScores,
        advisorScore,
        documentationScore,
        finalScore: grade.finalScore,
        grade: grade.grade,
        status: grade.status,
      }
    })
  }, [localGrades])

  const gradeDistribution = useMemo(() => {
    const distribution = {
      'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0, 'F': 0,
    }
    localGrades.forEach(grade => {
      if (Object.prototype.hasOwnProperty.call(distribution, grade.grade)) {
        distribution[grade.grade as keyof typeof distribution]++
      }
    })
    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / localGrades.length) * 100),
    }))
  }, [localGrades])

  const statsCards = [
    {
      title: 'Total Grades',
      value: localGrades.length,
      subtitle: 'Students graded',
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Average Score',
      value: `${(localGrades.reduce((sum, g) => sum + g.finalScore, 0) / localGrades.length).toFixed(1)}%`,
      subtitle: 'Class average',
      icon: Target,
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Provisional',
      value: localGrades.filter(g => g.status === 'provisional').length,
      subtitle: 'Awaiting finalization',
      icon: Clock,
      color: 'bg-warning/10 text-warning',
    },
    {
      title: 'Applications',
      value: pendingApplications.length,
      subtitle: 'Group leader requests',
      icon: UserPlus,
      color: 'bg-accent/10 text-accent',
    },
  ]

  // ── Grade handlers ─────────────────────────────────────────────────────────

  const handleCalculateAll = () => {
    setLocalGrades(prevGrades =>
      prevGrades.map(grade => {
        const evaluatorScores = grade.evaluatorScores || [35, 38, 32]
        const evaluatorAvg = evaluatorScores.reduce((a, b) => a + b, 0) / evaluatorScores.length
        const advisorScore = grade.advisorScore || 28
        const documentationScore = grade.documentationScore || 25
        const newFinalScore = (evaluatorAvg * 0.4) + (advisorScore * 0.3) + (documentationScore * 0.3)
        let newGrade = 'F'
        if (newFinalScore >= 90) newGrade = 'A+'
        else if (newFinalScore >= 85) newGrade = 'A'
        else if (newFinalScore >= 80) newGrade = 'A-'
        else if (newFinalScore >= 75) newGrade = 'B+'
        else if (newFinalScore >= 70) newGrade = 'B'
        else if (newFinalScore >= 65) newGrade = 'B-'
        else if (newFinalScore >= 60) newGrade = 'C+'
        else if (newFinalScore >= 55) newGrade = 'C'
        else if (newFinalScore >= 50) newGrade = 'C-'
        return {
          ...grade,
          finalScore: Math.round(newFinalScore * 10) / 10,
          grade: newGrade,
          evaluatorScores,
          advisorScore,
          documentationScore,
        }
      })
    )
    toast.success('All final scores have been recalculated and grades assigned.')
  }

  const handlePublishGrades = () => {
    setLocalGrades(prevGrades =>
      prevGrades.map(grade =>
        grade.status === 'provisional' ? { ...grade, status: 'final' as const } : grade
      )
    )
    toast.success(`Provisional grades published. Complaint window open for ${complaintDays} days.`)
    setPublishDialogOpen(false)
  }

  const handleGradeAdjustment = () => {
    if (!selectedGrade || !newScore || !adjustmentReason) return
    const score = parseFloat(newScore)
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Please enter a valid score between 0 and 100.')
      return
    }
    setLocalGrades(prevGrades =>
      prevGrades.map(grade =>
        grade.id === selectedGrade.id
          ? { ...grade, finalScore: score, status: 'provisional' as const }
          : grade
      )
    )
    toast.success(`Grade for ${selectedGrade.studentName} adjusted to ${score}%.`)
    setAdjustmentDialogOpen(false)
    setSelectedGrade(null)
    setNewScore('')
    setAdjustmentReason('')
  }

  const handleExportGrades = () => {
    toast('Grade report export in PDF, Word, and CSV formats has been started.')
  }

  const handleBulkImport = () => {
    toast('Bulk grade import functionality would be implemented here.')
  }

  // ── Application handlers ───────────────────────────────────────────────────

  const handleApprove = (id: string) => setConfirmApproveId(id)

  const confirmApprove = (id: string) => {
    setApprovingId(id)
    approveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success('Group leader request approved.')
          setApprovingId(null)
          setConfirmApproveId(null)
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to approve request.')
          setApprovingId(null)
          setConfirmApproveId(null)
        },
      }
    )
  }

  const handleReject = (id: string) => {
    setRejectingId(id)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const submitReject = () => {
    if (!rejectingId || !rejectReason.trim()) return
    rejectMutation.mutate(
      { id: rejectingId, reason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Group leader request rejected.')
          setRejectDialogOpen(false)
          setRejectingId(null)
          setRejectReason('')
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to reject request.')
          setRejectDialogOpen(false)
          setRejectingId(null)
          setRejectReason('')
        },
      }
    )
  }

  // ── Table columns ──────────────────────────────────────────────────────────

  const gradeColumns: Column<GradeBreakdown>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (g) => (
        <div>
          <p className="font-medium">{g.studentName}</p>
          <p className="text-sm text-muted-foreground">{g.projectTitle}</p>
        </div>
      ),
    },
    {
      key: 'breakdown',
      header: 'Score Breakdown',
      render: (g) => (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Evaluators (40%):</span>
            <span>{(g.evaluatorScores.reduce((a, b) => a + b, 0) / g.evaluatorScores.length).toFixed(1)}/40</span>
          </div>
          <div className="flex justify-between">
            <span>Advisor (30%):</span>
            <span>{g.advisorScore}/30</span>
          </div>
          <div className="flex justify-between">
            <span>Docs (30%):</span>
            <span>{g.documentationScore}/30</span>
          </div>
        </div>
      ),
    },
    {
      key: 'finalScore',
      header: 'Final Score',
      render: (g) => (
        <div className="text-center">
          <p className="text-lg font-bold text-primary">{g.finalScore}%</p>
          <Badge className="bg-primary text-primary-foreground">{g.grade}</Badge>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (g) => <StatusBadge status={g.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (g) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedGrade(localGrades.find(lg => lg.studentName === g.studentName) || null)
            setAdjustmentDialogOpen(true)
          }}
        >
          Adjust
        </Button>
      ),
    },
  ]

  const applicationColumns: Column<PendingApplication>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-semibold text-amber-600 shrink-0">
            {`${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{a.firstName} {a.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (a) => <span className="text-sm">{a.departmentName ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status ?? ''} />,
    },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (a) => (
        <span className="text-xs text-muted-foreground">
          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => {
        const isApproving = approvingId === a.id && approveMutation.status === 'pending'
        const isRejecting = rejectingId === a.id && rejectMutation.status === 'pending'
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title="Approve"
              disabled={isApproving || isRejecting}
              onClick={() => handleApprove(a.id)}
            >
              {isApproving
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                : <CheckCircle2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              title="Reject"
              disabled={isApproving || isRejecting}
              onClick={() => handleReject(a.id)}
            >
              {isRejecting
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                : <XCircle className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade Management System"
        description="Calculate, review, publish grades and manage group leader applications"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Grade Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="distribution">Grade Distribution</TabsTrigger>
          <TabsTrigger value="actions">Bulk Actions</TabsTrigger>
          <TabsTrigger value="applications" className="gap-1.5">
            Applications
            {pendingApplications.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px]">
                {pendingApplications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Grade Overview ── */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Grade Management Overview</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCalculateAll}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Recalculate All
                </Button>
                <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-gradient" size="sm">
                      <FileCheck className="mr-2 h-4 w-4" />
                      Publish Grades
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Publish Provisional Grades</DialogTitle>
                      <DialogDescription>
                        Set the complaint window period before publishing grades.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Complaint Window (Days)</Label>
                        <Input
                          type="number"
                          value={complaintDays}
                          onChange={(e) => setComplaintDays(e.target.value)}
                          className="mt-1.5"
                          min="1"
                          max="30"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Students can file complaints during this period.
                        </p>
                      </div>
                      <Button className="w-full btn-gradient" onClick={handlePublishGrades}>
                        Publish Grades
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-info/10 rounded-lg border border-info/20">
                <div className="flex items-start gap-3">
                  <Calculator className="h-5 w-5 text-info mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Grade Calculation Formula</p>
                    <p className="text-sm text-muted-foreground">
                      Final Score = (Evaluator Average &times; 40%) + (Advisor Score &times; 30%) + (Documentation &times; 30%)
                    </p>
                  </div>
                </div>
              </div>
              <DataTable data={gradeBreakdowns} columns={gradeColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Score Breakdown ── */}
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Detailed Score Breakdown</CardTitle>
              <CardDescription>Component-wise breakdown of all grade calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradeBreakdowns.map((grade, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{grade.studentName}</h4>
                        <p className="text-sm text-muted-foreground">{grade.projectTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{grade.finalScore}%</p>
                        <Badge className="bg-primary text-primary-foreground">{grade.grade}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Evaluator Scores (40%)</p>
                        <div className="flex gap-1 flex-wrap">
                          {grade.evaluatorScores.map((score, i) => (
                            <Badge key={i} variant="outline">{score}/40</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Avg: {(grade.evaluatorScores.reduce((a, b) => a + b, 0) / grade.evaluatorScores.length).toFixed(1)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Advisor Score (30%)</p>
                        <Badge variant="outline">{grade.advisorScore}/30</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Documentation (30%)</p>
                        <Badge variant="outline">{grade.documentationScore}/30</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Grade Distribution ── */}
        <TabsContent value="distribution">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Grade Distribution</CardTitle>
                <CardDescription>Visual breakdown of grade distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gradeDistribution.map(({ grade, count, percentage }) => (
                    <div key={grade} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-12 justify-center">{grade}</Badge>
                        <span className="text-sm">{count} students</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <Progress value={percentage} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Grade Statistics</CardTitle>
                <CardDescription>Key statistical insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Highest Score', value: `${Math.max(...localGrades.map(g => g.finalScore))}%` },
                    { label: 'Lowest Score', value: `${Math.min(...localGrades.map(g => g.finalScore))}%` },
                    {
                      label: 'Median Score', value: (() => {
                        const sorted = [...localGrades].sort((a, b) => a.finalScore - b.finalScore)
                        const mid = Math.floor(sorted.length / 2)
                        return `${sorted.length % 2 === 0
                          ? ((sorted[mid - 1].finalScore + sorted[mid].finalScore) / 2).toFixed(1)
                          : sorted[mid].finalScore.toFixed(1)}%`
                      })()
                    },
                    {
                      label: 'Pass Rate',
                      value: `${Math.round((localGrades.filter(g => g.finalScore >= 50).length / localGrades.length) * 100)}%`
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Bulk Actions ── */}
        <TabsContent value="actions">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCalculateAll}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Recalculate All</h3>
                    <p className="text-sm text-muted-foreground">Refresh all grade calculations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleExportGrades}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Download className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Export Grades</h3>
                    <p className="text-sm text-muted-foreground">Download in multiple formats</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleBulkImport}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Bulk Import</h3>
                    <p className="text-sm text-muted-foreground">Import grades from CSV</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Applications ── */}
        <TabsContent value="applications" className="space-y-4">
          {/* Sub-header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Group Leader Applications</h2>
              <p className="text-sm text-muted-foreground">
                Review and approve student requests to become group leaders
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => refetchGroupLeaders()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          {/* Summary KPIs */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <UserPlus className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{pendingApplications.length}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">—</p>
                    <p className="text-xs text-muted-foreground">Approved this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">—</p>
                    <p className="text-xs text-muted-foreground">Rejected this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search applicants…"
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Applications table */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Pending Applications</CardTitle>
              <CardDescription>
                {isLoadingGroupLeaders
                  ? 'Loading…'
                  : `${filteredApplications.length} application${filteredApplications.length !== 1 ? 's' : ''} found`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingGroupLeaders ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading applications…</p>
              ) : isErrorGroupLeaders ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-destructive mb-3">
                    {groupLeaderError?.message ?? 'Failed to load applications'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetchGroupLeaders()}>
                    Retry
                  </Button>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <UserPlus className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No pending applications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    New group leader requests will appear here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    <DataTable data={filteredApplications} columns={applicationColumns} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Grade Adjustment Dialog ── */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Grade</DialogTitle>
            <DialogDescription>
              Make manual adjustments to {selectedGrade?.studentName}&apos;s grade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newScore">New Score (%)</Label>
              <Input
                id="newScore"
                type="number"
                placeholder="Enter new score"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="mt-1.5"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Textarea
                id="reason"
                placeholder="Explain the reason for this grade adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <Button
              className="w-full btn-gradient"
              onClick={handleGradeAdjustment}
              disabled={!newScore || !adjustmentReason.trim()}
            >
              Apply Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reject Application Dialog ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this group leader request. This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Enter rejection reason…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={rejectMutation.status === 'pending'}
            onKeyDown={(e) => { if (e.key === 'Enter' && rejectReason.trim()) submitReject() }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={!rejectReason.trim() || rejectMutation.status === 'pending'}
            >
              {rejectMutation.status === 'pending' ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Approve Dialog ── */}
      <Dialog open={!!confirmApproveId} onOpenChange={(open) => { if (!open) setConfirmApproveId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this group leader request? The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApproveId(null)}>Cancel</Button>
            <Button
              onClick={() => confirmApprove(confirmApproveId!)}
              disabled={approveMutation.status === 'pending'}
            >
              {approveMutation.status === 'pending' ? 'Approving…' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
