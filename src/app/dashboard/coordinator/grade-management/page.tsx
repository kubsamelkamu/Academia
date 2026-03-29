"use client"

import React, { useState, useMemo } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Award,
  Target,
  Clock,
  Users
} from 'lucide-react'
import { mockGrades, mockProjects, Grade } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'

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

export default function GradeManagementPage() {
  const { toast } = useToast()
  const [localGrades, setLocalGrades] = useState<Grade[]>(mockGrades)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [complaintDays, setComplaintDays] = useState('7')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [newScore, setNewScore] = useState('')

  const gradeBreakdowns: GradeBreakdown[] = useMemo(() => {
    return localGrades.map(grade => {
      // Mock breakdown data - in real app this would come from the database
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
        status: grade.status
      }
    })
  }, [localGrades])

  const handleCalculateAll = () => {
    setLocalGrades(prevGrades =>
      prevGrades.map(grade => {
        // Mock calculation logic
        const evaluatorScores = grade.evaluatorScores || [35, 38, 32]
        const evaluatorAvg = evaluatorScores.reduce((a, b) => a + b, 0) / evaluatorScores.length
        const advisorScore = grade.advisorScore || 28
        const documentationScore = grade.documentationScore || 25

        const newFinalScore = (evaluatorAvg * 0.4) + (advisorScore * 0.3) + (documentationScore * 0.3)

        // Convert to letter grade
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
          documentationScore
        }
      })
    )

    toast.success('All final scores have been recalculated and grades assigned.')
  }

  const handlePublishGrades = () => {
    setLocalGrades(prevGrades =>
      prevGrades.map(grade =>
        grade.status === 'provisional'
          ? { ...grade, status: 'final' as const }
          : grade
      )
    )

    toast.success(`Provisional grades have been published as final. Complaint window open for ${complaintDays} days.`)

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

    toast.success(`Grade for ${selectedGrade.studentName} has been adjusted to ${score}%.`)

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
        <div className="flex gap-2">
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
        </div>
      ),
    },
  ]

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
      title: 'Grade Distribution',
      value: `${localGrades.filter(g => ['A', 'A-', 'A+'].includes(g.grade)).length}`,
      subtitle: 'A grades',
      icon: Award,
      color: 'bg-accent/10 text-accent',
    },
  ]

  const gradeDistribution = useMemo(() => {
    const distribution = {
      'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0, 'F': 0
    }

    localGrades.forEach(grade => {
      if (distribution.hasOwnProperty(grade.grade)) {
        distribution[grade.grade as keyof typeof distribution]++
      }
    })

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / localGrades.length) * 100)
    }))
  }, [localGrades])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade Management System"
        description="Calculate, review, and publish student grades with detailed breakdowns"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Grade Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="distribution">Grade Distribution</TabsTrigger>
          <TabsTrigger value="actions">Bulk Actions</TabsTrigger>
        </TabsList>

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
                  <Calculator className="h-5 w-5 text-info mt-0.5" />
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

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Detailed Score Breakdown</CardTitle>
              <CardDescription>
                Component-wise breakdown of all grade calculations
              </CardDescription>
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
                        <div className="flex gap-1">
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
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Highest Score</span>
                    <span className="text-sm font-bold">
                      {Math.max(...localGrades.map(g => g.finalScore))}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Lowest Score</span>
                    <span className="text-sm font-bold">
                      {Math.min(...localGrades.map(g => g.finalScore))}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Median Score</span>
                    <span className="text-sm font-bold">
                      {(() => {
                        const sorted = [...localGrades].sort((a, b) => a.finalScore - b.finalScore)
                        const mid = Math.floor(sorted.length / 2)
                        return sorted.length % 2 === 0
                          ? ((sorted[mid - 1].finalScore + sorted[mid].finalScore) / 2).toFixed(1)
                          : sorted[mid].finalScore.toFixed(1)
                      })()}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Pass Rate</span>
                    <span className="text-sm font-bold">
                      {Math.round((localGrades.filter(g => g.finalScore >= 50).length / localGrades.length) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
      </Tabs>

      {/* Grade Adjustment Dialog */}
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
    </div>
  )
}