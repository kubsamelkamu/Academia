"use client"

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardPageHeader } from "@/components/dashboard/page-primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  PieChart,
  TrendingUp,
  Calendar,
  Users,
  ClipboardCheck,
  Filter,
  Search,
  Clock,
  ChevronDown,
  Eye,
  Star,
  Award,
  GraduationCap,
  FileSpreadsheet,
  FileBarChart,
  RefreshCw,
  Printer,
  Share2,
  Zap,
  Activity,
  Target,
  Globe,
  Briefcase,
} from 'lucide-react';

// Enhanced reports data with categories and metrics
const reportCategories = {
  academic: [
    {
      id: 'grade-distribution',
      title: 'Grade Distribution Analysis',
      description: 'Comprehensive statistical analysis of grades across all projects and internships',
      icon: PieChart,
      type: 'PDF',
      format: 'Document',
      lastGenerated: '2024-01-15',
      frequency: 'Weekly',
      metrics: ['Average GPA', 'Pass Rate', 'Grade Variance'],
      trend: 'up',
      tags: ['grades', 'statistics', 'performance']
    },
    {
      id: 'student-performance',
      title: 'Student Performance Trends',
      description: 'Long-term performance analysis, improvement tracking, and predictive insights',
      icon: TrendingUp,
      type: 'PDF',
      format: 'Document',
      lastGenerated: '2024-01-14',
      frequency: 'Monthly',
      metrics: ['Progress Rate', 'Completion Rate', 'Improvement Score'],
      trend: 'up',
      tags: ['students', 'performance', 'analytics']
    },
    {
      id: 'project-completion',
      title: 'Project Completion Timeline',
      description: 'Detailed analysis of project completion rates, deadlines, and milestone achievements',
      icon: Clock,
      type: 'Excel',
      format: 'Spreadsheet',
      lastGenerated: '2024-01-13',
      frequency: 'Weekly',
      metrics: ['On-time Rate', 'Avg Completion Time', 'Delayed Projects'],
      trend: 'stable',
      tags: ['projects', 'timeline', 'deadlines']
    }
  ],
  administrative: [
    {
      id: 'advisor-workload',
      title: 'Advisor Workload & Efficiency',
      description: 'Comprehensive advisor workload distribution, student ratios, and performance metrics',
      icon: Users,
      type: 'Excel',
      format: 'Spreadsheet',
      lastGenerated: '2024-01-12',
      frequency: 'Bi-weekly',
      metrics: ['Students/Advisor', 'Avg Response Time', 'Workload Balance'],
      trend: 'stable',
      tags: ['advisors', 'workload', 'efficiency']
    },
    {
      id: 'resource-utilization',
      title: 'Resource Utilization & Allocation',
      description: 'Analysis of department resources, budget allocation, and usage efficiency',
      icon: Target,
      type: 'PDF',
      format: 'Document',
      lastGenerated: '2024-01-10',
      frequency: 'Monthly',
      metrics: ['Utilization Rate', 'Resource Efficiency', 'Cost per Student'],
      trend: 'up',
      tags: ['resources', 'budget', 'efficiency']
    },
    {
      id: 'grade-approval-workflow',
      title: 'Grade Approval Workflow Analysis',
      description: 'Grade approval processing times, bottlenecks, and workflow efficiency metrics',
      icon: ClipboardCheck,
      type: 'Excel',
      format: 'Spreadsheet',
      lastGenerated: '2024-01-11',
      frequency: 'Weekly',
      metrics: ['Approval Time', 'Pending Requests', 'Bottleneck Areas'],
      trend: 'down',
      tags: ['grades', 'workflow', 'approvals']
    }
  ],
  strategic: [
    {
      id: 'kpi-dashboard',
      title: 'Department KPIs & Performance',
      description: 'Key performance indicators tracking strategic goals and departmental objectives',
      icon: Activity,
      type: 'PDF',
      format: 'Dashboard',
      lastGenerated: '2024-01-01',
      frequency: 'Monthly',
      metrics: ['Goal Achievement', 'KPI Status', 'Performance Score'],
      trend: 'up',
      tags: ['kpis', 'strategy', 'performance']
    },
    {
      id: 'accreditation-compliance',
      title: 'Accreditation & Compliance Report',
      description: 'Compliance status with academic standards and accreditation requirements',
      icon: Award,
      type: 'PDF',
      format: 'Document',
      lastGenerated: '2023-12-28',
      frequency: 'Quarterly',
      metrics: ['Compliance Rate', 'Standards Met', 'Action Items'],
      trend: 'up',
      tags: ['accreditation', 'compliance', 'standards']
    },
    {
      id: 'student-retention',
      title: 'Student Retention & Success',
      description: 'Retention rates, dropout analysis, and student success predictors',
      icon: GraduationCap,
      type: 'PDF',
      format: 'Document',
      lastGenerated: '2024-01-05',
      frequency: 'Monthly',
      metrics: ['Retention Rate', 'Dropout Rate', 'Success Rate'],
      trend: 'up',
      tags: ['retention', 'students', 'success']
    }
  ],
  analytics: [
    {
      id: 'predictive-analytics',
      title: 'Predictive Analytics Dashboard',
      description: 'AI-powered predictions for student performance, project completion, and resource needs',
      icon: Zap,
      type: 'Interactive',
      format: 'Dashboard',
      lastGenerated: '2024-01-15',
      frequency: 'Real-time',
      metrics: ['Risk Scores', 'Predictions', 'Recommendations'],
      trend: 'up',
      tags: ['predictive', 'ai', 'analytics']
    },
    {
      id: 'trend-analysis',
      title: 'Multi-year Trend Analysis',
      description: 'Long-term trends in enrollment, performance, and departmental growth',
      icon: TrendingUp,
      type: 'PDF',
      format: 'Document',
      lastGenerated: '2024-01-01',
      frequency: 'Yearly',
      metrics: ['Growth Rate', 'Year-over-Year', 'Projections'],
      trend: 'up',
      tags: ['trends', 'historical', 'growth']
    },
    {
      id: 'comparative-benchmark',
      title: 'Comparative Benchmark Report',
      description: 'Department performance compared to peers and industry standards',
      icon: Globe,
      type: 'Excel',
      format: 'Spreadsheet',
      lastGenerated: '2023-12-20',
      frequency: 'Quarterly',
      metrics: ['Benchmark Score', 'Peer Comparison', 'Percentile Rank'],
      trend: 'up',
      tags: ['benchmark', 'comparison', 'standards']
    }
  ]
};

const quickStats = [
  {
    title: 'Available Reports',
    value: '24',
    change: '+3 this month',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    title: 'Auto-generated',
    value: '8',
    change: 'Scheduled weekly',
    icon: RefreshCw,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    title: 'Downloads (30d)',
    value: '156',
    change: '+23% vs last month',
    icon: Download,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    title: 'Custom Reports',
    value: '12',
    change: 'Saved templates',
    icon: Star,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  }
];

const DeptReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current-semester")
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDownload = (reportTitle: string, reportType: string) => {
    toast("Report Generated", {
      description: `${reportTitle} (${reportType}) has been prepared for download.`,
      duration: 3000,
    })
  };

  const handleGenerateAll = () => {
    toast("Bulk Generation Started", {
      description: "All scheduled reports are being generated. You will be notified when ready.",
      duration: 5000,
    })
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast("Data Refreshed", {
        description: "Report data has been updated with the latest information.",
        duration: 3000,
      })
    }, 1500);
  };

  return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader
          title="Reports & Analytics"
          description="Generate, analyze, and download comprehensive department reports"
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button size="sm" onClick={handleGenerateAll}>
                <Zap className="mr-2 h-4 w-4" />
                Generate All
              </Button>
            </div>
          }
        />

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports by title, description, or tags..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative w-[200px]">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    className="w-full appearance-none rounded-md border border-input bg-background pl-9 pr-8 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    <option value="current-semester">Current Semester</option>
                    <option value="last-semester">Last Semester</option>
                    <option value="current-year">Current Year</option>
                    <option value="last-year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Categories Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="administrative">Administrative</TabsTrigger>
            <TabsTrigger value="strategic">Strategic</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* All Reports Tab */}
          <TabsContent value="all" className="space-y-6">
            {Object.entries(reportCategories).map(([category, reports]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold capitalize">{category} Reports</h3>
                  <Button variant="ghost" size="sm">
                    View All <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reports.map((report) => (
                    <Card key={report.id} className="hover:shadow-lg transition-all hover:border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <report.icon className="h-5 w-5 text-primary" />
                          </div>
                          <Badge variant="outline" className="bg-background">
                            {report.type}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-3">{report.title}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {report.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Last generated</span>
                            <span className="font-medium">{report.lastGenerated}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Frequency</span>
                            <span className="font-medium">{report.frequency}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {report.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {report.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{report.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex w-full gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleDownload(report.title, report.type)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                            title="View report"
                          >
                            <Link href={`/dashboard/department-head/reports/${report.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Individual Category Tabs */}
          {Object.entries(reportCategories).map(([category, reports]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-all">
                    {/* Same card structure as above */}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <report.icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="outline">{report.type}</Badge>
                      </div>
                      <CardTitle className="text-base mt-3">{report.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Format</span>
                          <span className="font-medium">{report.format}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Last generated</span>
                          <span className="font-medium">{report.lastGenerated}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {report.metrics.map((metric) => (
                            <Badge key={metric} variant="secondary" className="text-xs">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex w-full gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownload(report.title, report.type)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" asChild title="View report">
                          <Link href={`/dashboard/department-head/reports/${report.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Grade Distribution Report</p>
                      <p className="text-xs text-muted-foreground">Downloaded by Admin • 2 hours ago</p>
                    </div>
                    <span className="text-xs text-muted-foreground">PDF</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-3 flex-col items-start">
                  <FileSpreadsheet className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Export to Excel</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col items-start">
                  <FileBarChart className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Schedule Report</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col items-start">
                  <Briefcase className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Custom Template</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col items-start">
                  <Target className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Set KPIs</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default DeptReportsPage;