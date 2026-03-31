 "use client"

import React, { useState } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Download,
  Users,
  BarChart3,
  Clock,
  CheckCircle2 as CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Plus,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { mockProjects, mockGrades, formatDate } from '@/data/mockData'

interface ReportRequest {
  id: string
  type: 'grades' | 'projects' | 'evaluations' | 'attendance'
  title: string
  description: string
  requestedBy: string
  requestedAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  downloadUrl?: string
}

const mockReportRequests: ReportRequest[] = [
  {
    id: 'r1',
    type: 'grades',
    title: 'Final Grade Report - Semester 1',
    description: 'Complete grade breakdown for all students',
    requestedBy: 'Dr. Michael Brown',
    requestedAt: '2024-01-15T10:30:00Z',
    status: 'completed',
    downloadUrl: '/reports/grades-semester1.pdf',
  },
  {
    id: 'r2',
    type: 'projects',
    title: 'Project Completion Status',
    description: 'Overview of all active projects and their progress',
    requestedBy: 'Dr. Michael Brown',
    requestedAt: '2024-01-14T14:20:00Z',
    status: 'processing',
    progress: 75,
  },
  {
    id: 'r3',
    type: 'evaluations',
    title: 'Evaluator Performance Report',
    description: 'Analysis of evaluation quality and timeliness',
    requestedBy: 'Dr. Michael Brown',
    requestedAt: '2024-01-13T09:15:00Z',
    status: 'pending',
  },
]

export default function ReportsPage() {
  const { toast } = useToast()
  const [selectedReportType, setSelectedReportType] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredReports = mockReportRequests.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleGenerateReport = () => {
    if (!selectedReportType || !customTitle.trim()) {
      toast.error("Please select a report type and provide a title.")
      return
    }

    toast.success(`${customTitle} has been queued for generation.`)

    setGenerateDialogOpen(false)
    setSelectedReportType('')
    setCustomTitle('')
    setCustomDescription('')
  }

  const handleDownloadReport = (report: ReportRequest) => {
    if (report.downloadUrl) {
      toast(`Downloading ${report.title}...`)
    }
  }

  const getStatusIcon = (status: ReportRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ReportRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Reports & Analytics"
        description="Generate and manage department reports and analytics"
      />

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockReportRequests.filter(r => r.status === 'completed').length}</p>
                <p className="text-sm text-gray-600">Completed Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockReportRequests.filter(r => r.status === 'processing').length}</p>
                <p className="text-sm text-gray-600">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockProjects.length}</p>
                <p className="text-sm text-gray-600">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockGrades.length}</p>
                <p className="text-sm text-gray-600">Student Grades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-xl">Generate New Report</CardTitle>
          <CardDescription>Create custom reports for department analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary/50" onClick={() => {
              setSelectedReportType('grades')
              setCustomTitle('Grade Summary Report')
              setCustomDescription('Comprehensive overview of all student grades')
              setGenerateDialogOpen(true)
            }}>
              <CardContent className="pt-6 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Grade Report</h3>
                <p className="text-sm text-muted-foreground">Student performance analysis</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary/50" onClick={() => {
              setSelectedReportType('projects')
              setCustomTitle('Project Status Report')
              setCustomDescription('Current status of all active projects')
              setGenerateDialogOpen(true)
            }}>
              <CardContent className="pt-6 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Project Report</h3>
                <p className="text-sm text-muted-foreground">Project progress overview</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary/50" onClick={() => {
              setSelectedReportType('evaluations')
              setCustomTitle('Evaluation Analytics')
              setCustomDescription('Evaluator performance analysis')
              setGenerateDialogOpen(true)
            }}>
              <CardContent className="pt-6 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Evaluation Report</h3>
                <p className="text-sm text-muted-foreground">Assessment metrics</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-muted hover:border-purple-300" onClick={() => setGenerateDialogOpen(true)}>
              <CardContent className="pt-6 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Custom Report</h3>
                <p className="text-sm text-muted-foreground">Build your own report</p>
              </CardContent>
            </Card>

            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Custom Report</DialogTitle>
                  <DialogDescription>Configure your report parameters</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Report Type</Label>
                    <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grades">Grade Analysis</SelectItem>
                        <SelectItem value="projects">Project Status</SelectItem>
                        <SelectItem value="evaluations">Evaluation Metrics</SelectItem>
                        <SelectItem value="attendance">Attendance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Report Title</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Enter report title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Describe what this report should include"
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button onClick={handleGenerateReport} className="w-full" disabled={!selectedReportType || !customTitle.trim()}>
                    Generate Report
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <CardTitle className='font-semibold text-xl'>Report History</CardTitle>
              <CardDescription>View and download previously generated reports</CardDescription>
            </div>
            <div className='flex gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search reports...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-9 w-64'
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='w-32'>
                  <Filter className='h-4 w-4 mr-2' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='processing'>Processing</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredReports.map((report) => (
              <div key={report.id} className={`p-4 border rounded-lg ${getStatusColor(report.status)}`}>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-3'>
                    {getStatusIcon(report.status)}
                    <div className='flex-1'>
                      <h3 className='font-semibold'>{report.title}</h3>
                      <p className='text-sm text-muted-foreground mb-2'>{report.description}</p>
                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <span>Requested by {report.requestedBy}</span>
                        <span>{formatDate(report.requestedAt)}</span>
                        <Badge variant='outline' className='capitalize'>{report.type}</Badge>
                      </div>
                      {report.status === 'processing' && report.progress && (
                        <div className='mt-2'>
                          <Progress value={report.progress} className='h-2' />
                          <p className='text-xs text-muted-foreground mt-1'>{report.progress}% complete</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    {report.status === 'completed' && report.downloadUrl && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleDownloadReport(report)}
                      >
                        <Download className='h-4 w-4 mr-2' />
                        Download
                      </Button>
                    )}
                    <Badge variant='secondary' className='capitalize'>
                      {report.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

