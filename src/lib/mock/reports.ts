export interface ReportItem {
  id: string
  title: string
  description: string
  type: string
  format: string
  lastGenerated: string
  frequency: string
  metrics: string[]
  trend: string
  tags: string[]
}

const reportCategories: Record<string, ReportItem[]> = {
  academic: [
    { id: "grade-distribution", title: "Grade Distribution Analysis", description: "Comprehensive statistical analysis of grades across all projects and internships", type: "PDF", format: "Document", lastGenerated: "2024-01-15", frequency: "Weekly", metrics: ["Average GPA", "Pass Rate", "Grade Variance"], trend: "up", tags: ["grades", "statistics", "performance"] },
    { id: "student-performance", title: "Student Performance Trends", description: "Long-term performance analysis, improvement tracking, and predictive insights", type: "PDF", format: "Document", lastGenerated: "2024-01-14", frequency: "Monthly", metrics: ["Progress Rate", "Completion Rate", "Improvement Score"], trend: "up", tags: ["students", "performance", "analytics"] },
    { id: "project-completion", title: "Project Completion Timeline", description: "Detailed analysis of project completion rates, deadlines, and milestone achievements", type: "Excel", format: "Spreadsheet", lastGenerated: "2024-01-13", frequency: "Weekly", metrics: ["On-time Rate", "Avg Completion Time", "Delayed Projects"], trend: "stable", tags: ["projects", "timeline", "deadlines"] },
  ],
  administrative: [
    { id: "advisor-workload", title: "Advisor Workload & Efficiency", description: "Comprehensive advisor workload distribution, student ratios, and performance metrics", type: "Excel", format: "Spreadsheet", lastGenerated: "2024-01-12", frequency: "Bi-weekly", metrics: ["Students/Advisor", "Avg Response Time", "Workload Balance"], trend: "stable", tags: ["advisors", "workload", "efficiency"] },
    { id: "resource-utilization", title: "Resource Utilization & Allocation", description: "Analysis of department resources, budget allocation, and usage efficiency", type: "PDF", format: "Document", lastGenerated: "2024-01-10", frequency: "Monthly", metrics: ["Utilization Rate", "Resource Efficiency", "Cost per Student"], trend: "up", tags: ["resources", "budget", "efficiency"] },
    { id: "grade-approval-workflow", title: "Grade Approval Workflow Analysis", description: "Grade approval processing times, bottlenecks, and workflow efficiency metrics", type: "Excel", format: "Spreadsheet", lastGenerated: "2024-01-11", frequency: "Weekly", metrics: ["Approval Time", "Pending Requests", "Bottleneck Areas"], trend: "down", tags: ["grades", "workflow", "approvals"] },
  ],
  strategic: [
    { id: "kpi-dashboard", title: "Department KPIs & Performance", description: "Key performance indicators tracking strategic goals and departmental objectives", type: "PDF", format: "Dashboard", lastGenerated: "2024-01-01", frequency: "Monthly", metrics: ["Goal Achievement", "KPI Status", "Performance Score"], trend: "up", tags: ["kpis", "strategy", "performance"] },
    { id: "accreditation-compliance", title: "Accreditation & Compliance Report", description: "Compliance status with academic standards and accreditation requirements", type: "PDF", format: "Document", lastGenerated: "2023-12-28", frequency: "Quarterly", metrics: ["Compliance Rate", "Standards Met", "Action Items"], trend: "up", tags: ["accreditation", "compliance", "standards"] },
    { id: "student-retention", title: "Student Retention & Success", description: "Retention rates, dropout analysis, and student success predictors", type: "PDF", format: "Document", lastGenerated: "2024-01-05", frequency: "Monthly", metrics: ["Retention Rate", "Dropout Rate", "Success Rate"], trend: "up", tags: ["retention", "students", "success"] },
  ],
  analytics: [
    { id: "predictive-analytics", title: "Predictive Analytics Dashboard", description: "AI-powered predictions for student performance, project completion, and resource needs", type: "Interactive", format: "Dashboard", lastGenerated: "2024-01-15", frequency: "Real-time", metrics: ["Risk Scores", "Predictions", "Recommendations"], trend: "up", tags: ["predictive", "ai", "analytics"] },
    { id: "trend-analysis", title: "Multi-year Trend Analysis", description: "Long-term trends in enrollment, performance, and departmental growth", type: "PDF", format: "Document", lastGenerated: "2024-01-01", frequency: "Yearly", metrics: ["Growth Rate", "Year-over-Year", "Projections"], trend: "up", tags: ["trends", "historical", "growth"] },
    { id: "comparative-benchmark", title: "Comparative Benchmark Report", description: "Department performance compared to peers and industry standards", type: "Excel", format: "Spreadsheet", lastGenerated: "2023-12-20", frequency: "Quarterly", metrics: ["Benchmark Score", "Peer Comparison", "Percentile Rank"], trend: "up", tags: ["benchmark", "comparison", "standards"] },
  ],
}

export function getReportById(id: string): ReportItem | undefined {
  for (const reports of Object.values(reportCategories)) {
    const found = reports.find((r) => r.id === id)
    if (found) return found
  }
  return undefined
}
