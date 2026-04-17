"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import StatusBadge from "@/components/shared/StatusBadge"
import { Download, FileText, ArrowLeft, Clock, Users, ExternalLink } from "lucide-react"

interface PendingReviewRow {
  projectId: string
  projectTitle: string
  groupName: string
  milestoneId: string
  milestoneName: string
  status: "submitted"
  submittedAt: string
}

const pending: PendingReviewRow[] = [
  {
    projectId: "p1",
    projectTitle: "AI‑Driven Academic Assistant",
    groupName: "AI Research Group",
    milestoneId: "m3",
    milestoneName: "Prototype",
    status: "submitted",
    submittedAt: "2024-07-08",
  },
  {
    projectId: "p2",
    projectTitle: "Real‑Time Campus Analytics",
    groupName: "Team Atlas",
    milestoneId: "m2",
    milestoneName: "Data pipeline",
    status: "submitted",
    submittedAt: "2024-06-24",
  },
]

export function AdvisorReviewsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Review Queue</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Milestones awaiting your feedback and approval.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-9 text-xs font-bold uppercase tracking-wider w-full sm:w-auto">
          <Link href="/dashboard/advisor">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">{pending.length}</p>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Pending Reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pending Milestones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Milestone</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Project</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Submitted</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((row) => (
                  <TableRow key={`${row.projectId}:${row.milestoneId}`} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm leading-tight">{row.milestoneName}</p>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{row.groupName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground max-w-[200px] truncate">
                      {row.projectTitle}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{row.submittedAt}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} className="text-[10px] h-5" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider">
                          <Link href="/dashboard/advisor/documents">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Docs
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider"
                          onClick={() => {}}
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Get
                        </Button>
                        <Button asChild variant="default" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider">
                          <Link href={`/dashboard/advisor/reviews/${row.projectId}`}>Review</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {pending.map((row) => (
              <div key={`${row.projectId}:${row.milestoneId}`} className="p-4 space-y-4 hover:bg-muted/5 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">{row.milestoneName}</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{row.groupName}</p>
                    </div>
                  </div>
                  <StatusBadge status={row.status} className="text-[10px] h-5" />
                </div>

                <div className="space-y-2 bg-muted/30 p-3 rounded-xl border border-primary/5">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary/70" />
                    <span className="truncate">{row.projectTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    <span>Submitted: {row.submittedAt}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider">
                    <Link href="/dashboard/advisor/documents">Docs</Link>
                  </Button>
                  <Button asChild variant="default" size="sm" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider">
                    <Link href={`/dashboard/advisor/reviews/${row.projectId}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {pending.length === 0 && (
            <div className="text-center py-16 bg-muted/5">
              <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No pending milestones to review.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorReviewsPage
