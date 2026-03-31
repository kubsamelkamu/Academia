"use client"

import React, { useState } from "react"
import {
  Archive,
  Award,
  BookOpen,
  CheckCircle2,
  Code,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Search,
  Star,
  Users,
} from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const mockPastProjects = [
  {
    id: "p1",
    title: "Automated Grading System",
    groupName: "Group Epsilon",
    advisorName: "Dr. Sarah Johnson",
    status: "completed" as const,
    progress: 100,
    startDate: "2023-09-01",
    dueDate: "2023-12-15",
    completionDate: "2023-12-10",
    academicYear: "2023-2024",
    grade: 92,
    feedback: "Excellent implementation with comprehensive testing.",
    departmentName: "Computer Science",
    groupMembers: ["John Doe", "Jane Smith"],
    students: ["John Doe", "Jane Smith"],
    evaluatorNames: ["Dr. Michael Chen", "Prof. Emily Rodriguez"],
    documents: {
      srs: "/docs/srs.pdf",
      sdd: "/docs/sdd.pdf",
      reports: ["/docs/final.pdf", "/docs/technical.pdf"],
      sourceCode: "/code/archive.zip",
      poster: "/docs/poster.pdf",
      presentation: "/docs/slides.pptx",
    },
    metadata: {
      technologies: ["Python", "Django", "React", "PostgreSQL"],
      keywords: ["Grading", "Automation", "Education"],
      awards: ["Best Project Award 2023"],
      publications: ["IEEE EDUCON 2024"],
    },
    category: "EdTech",
    tags: ["Education", "Automation", "Web App"],
    description: "An automated grading system that streamlines evaluation and provides consistent feedback to students.",
  },
  {
    id: "p2",
    title: "Healthcare Analytics Platform",
    groupName: "Group Zeta",
    advisorName: "Dr. Lisa Thompson",
    status: "completed" as const,
    progress: 100,
    startDate: "2023-09-15",
    dueDate: "2023-12-20",
    completionDate: "2023-12-18",
    academicYear: "2023-2024",
    grade: 88,
    feedback: "Good work on data visualization. Consider adding more security features.",
    departmentName: "Data Science",
    groupMembers: ["Alice Brown", "Charlie Davis", "Eva Green"],
    students: ["Alice Brown", "Charlie Davis", "Eva Green"],
    evaluatorNames: ["Dr. Michael Chen", "Prof. David Kim"],
    documents: {
      srs: "/docs/healthcare-srs.pdf",
      sdd: undefined,
      reports: ["/docs/healthcare-final.pdf"],
      sourceCode: "/code/healthcare.zip",
      poster: undefined,
      presentation: undefined,
    },
    metadata: {
      technologies: ["Python", "TensorFlow", "React", "MongoDB"],
      keywords: ["Healthcare", "Analytics", "Machine Learning"],
      awards: undefined as string[] | undefined,
      publications: ["HealthTech Journal 2024"],
    },
    category: "Healthcare",
    tags: ["Healthcare", "Analytics", "ML"],
    description: "A comprehensive healthcare analytics platform for predicting patient outcomes and optimizing hospital resources.",
  },
]

function gradeColor(g: number) {
  if (g >= 90) return "text-emerald-600 bg-emerald-500/10"
  if (g >= 75) return "text-blue-600 bg-blue-500/10"
  if (g >= 60) return "text-amber-600 bg-amber-500/10"
  return "text-destructive bg-destructive/10"
}

export function ProjectsArchivedPage() {
  const [search, setSearch]       = useState("")
  const [yearFilter, setYear]     = useState("all")
  const [expanded, setExpanded]   = useState<string | null>(null)

  const years = ["all", ...Array.from(new Set(mockPastProjects.map((p) => p.academicYear)))]

  const filtered = mockPastProjects.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.groupName.toLowerCase().includes(q) ||
      p.advisorName.toLowerCase().includes(q)
    const matchesYear = yearFilter === "all" || p.academicYear === yearFilter
    return matchesSearch && matchesYear
  })

  const avgGrade = Math.round(
    mockPastProjects.reduce((a, p) => a + p.grade, 0) / mockPastProjects.length
  )

  const handleDownload = (path: string, name: string) => {
    try {
      const a = document.createElement("a")
      a.href = path
      a.download = name
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {}
    toast.success("Download started", { description: `Downloading ${name}…` })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Archived Projects"
        description="Completed projects with documentation and evaluation records"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Archive exported")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <DashboardBackLink href="/dashboard/department-head/projects" variant="outline" />
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Archived", value: mockPastProjects.length,          icon: Archive,      color: "bg-primary/10",         iconColor: "text-primary" },
          { label: "Avg Grade",      value: `${avgGrade}%`,                   icon: Award,        color: "bg-emerald-500/10",     iconColor: "text-emerald-600" },
          { label: "Publications",   value: mockPastProjects.reduce((a, p) => a + (p.metadata.publications?.length ?? 0), 0), icon: BookOpen, color: "bg-blue-500/10", iconColor: "text-blue-600" },
          { label: "Awards Given",   value: mockPastProjects.reduce((a, p) => a + (p.metadata.awards?.length ?? 0), 0),       icon: Star,     color: "bg-amber-500/10", iconColor: "text-amber-600" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", k.color)}>
                <k.icon className={cn("h-4 w-4", k.iconColor)} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title, group or advisor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={yearFilter} onValueChange={setYear}>
          <SelectTrigger className="h-9 w-44 text-xs">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Years</SelectItem>
            {years.filter((y) => y !== "all").map((y) => (
              <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project list */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Completed Projects</CardTitle>
              <CardDescription>{filtered.length} project{filtered.length !== 1 ? "s" : ""} archived</CardDescription>
            </div>
            <Badge variant="secondary">{filtered.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Archive className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No archived projects found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or year filter</p>
            </div>
          ) : (
            filtered.map((p) => {
              const isOpen = expanded === p.id
              return (
                <div key={p.id} className="rounded-xl border bg-card overflow-hidden">
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Archive className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{p.title}</p>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] shrink-0", gradeColor(p.grade))}
                        >
                          {p.grade}%
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{p.academicYear}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {p.groupName}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Completed {new Date(p.completionDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Progress value={100} className="h-1.5 mt-1.5 [&>div]:bg-emerald-500" />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1 shrink-0"
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{isOpen ? "Less" : "Details"}</span>
                    </Button>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t bg-muted/20 px-4 py-4 space-y-4">
                      {/* Meta grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { label: "Advisor",    value: p.advisorName },
                          { label: "Department", value: p.departmentName },
                          { label: "Category",   value: p.category },
                          { label: "Members",    value: p.students.length },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                            <p className="font-medium mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>

                      {p.description && (
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      )}

                      <Separator />

                      {/* Feedback */}
                      <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground mb-1">Evaluator Feedback</p>
                        <p className="text-xs text-foreground">{p.feedback}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Evaluated by: {p.evaluatorNames.join(", ")}
                        </p>
                      </div>

                      {/* Technologies */}
                      <div className="flex flex-wrap gap-1.5">
                        {p.metadata.technologies.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            <Code className="h-2.5 w-2.5 mr-1" />{t}
                          </Badge>
                        ))}
                      </div>

                      {/* Awards & Publications */}
                      {(p.metadata.awards?.length || p.metadata.publications?.length) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {p.metadata.awards && p.metadata.awards.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Awards</p>
                              {p.metadata.awards.map((a, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                  <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                                  <span>{a}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {p.metadata.publications && p.metadata.publications.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Publications</p>
                              {p.metadata.publications.map((pub, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span>{pub}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Documents */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {p.documents.srs && (
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => handleDownload(p.documents.srs!, "SRS.pdf")}>
                              <FileText className="h-3 w-3" /> SRS
                            </Button>
                          )}
                          {p.documents.sdd && (
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => handleDownload(p.documents.sdd!, "SDD.pdf")}>
                              <FileText className="h-3 w-3" /> SDD
                            </Button>
                          )}
                          {p.documents.reports.map((r, i) => (
                            <Button key={i} variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => handleDownload(r, `Report_${i + 1}.pdf`)}>
                              <FileText className="h-3 w-3" /> {i === 0 ? "Final Report" : `Report ${i + 1}`}
                            </Button>
                          ))}
                          {p.documents.sourceCode && (
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => handleDownload(p.documents.sourceCode!, "source.zip")}>
                              <Code className="h-3 w-3" /> Source Code
                            </Button>
                          )}
                          {p.documents.poster && (
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => handleDownload(p.documents.poster!, "poster.pdf")}>
                              <FileText className="h-3 w-3" /> Poster
                            </Button>
                          )}
                          {p.documents.presentation && (
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => handleDownload(p.documents.presentation!, "slides.pptx")}>
                              <FileText className="h-3 w-3" /> Slides
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
