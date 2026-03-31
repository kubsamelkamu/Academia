"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdvisorEvaluations } from "@/lib/hooks/useAdvisor"
import { Search } from "lucide-react"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function AdvisorEvaluationsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [priority, setPriority] = React.useState("all")
  const [projectType, setProjectType] = React.useState("all")

  const evaluationsQuery = useAdvisorEvaluations({
    status: status === "all" ? undefined : status,
    priority: priority === "all" ? undefined : priority,
    projectType: projectType === "all" ? undefined : projectType,
  })

  const evaluations = React.useMemo(() => {
    const items = evaluationsQuery.data?.items ?? []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((evaluation) =>
      [evaluation.studentName, evaluation.studentId ?? "", evaluation.projectTitle].some((value) =>
        value.toLowerCase().includes(term),
      ),
    )
  }, [evaluationsQuery.data?.items, searchTerm])

  const stats = evaluationsQuery.data?.stats ?? {
    totalEvaluations: 0,
    pendingReview: 0,
    evaluatedCount: 0,
    needsRevision: 0,
    overdueCount: 0,
    completionRate: 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Evaluations</h1>
          <p className="text-sm text-muted-foreground">
            Review, score, and request revisions from the real advisor evaluation queue.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor">Back</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.totalEvaluations}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{stats.pendingReview}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Evaluated</p><p className="text-2xl font-bold">{stats.evaluatedCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Revision</p><p className="text-2xl font-bold">{stats.needsRevision}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold">{stats.overdueCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Completion</p><p className="text-2xl font-bold">{stats.completionRate}%</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student or project..."
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending review">Pending Review</SelectItem>
                <SelectItem value="evaluated">Evaluated</SelectItem>
                <SelectItem value="needs revision">Needs Revision</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All project types</SelectItem>
                {[...new Set(
                  (evaluationsQuery.data?.items ?? [])
                    .map((item) => item.projectType)
                    .filter(Boolean),
                )].map((type) => (
                  <SelectItem key={type} value={String(type).toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading evaluations…
                  </TableCell>
                </TableRow>
              ) : evaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No evaluations found.
                  </TableCell>
                </TableRow>
              ) : (
                evaluations.map((evaluation) => (
                  <TableRow
                    key={evaluation.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/advisor/evaluations/${evaluation.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium">{evaluation.studentName}</p>
                      {evaluation.studentId && (
                        <p className="text-xs text-muted-foreground">{evaluation.studentId}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{evaluation.projectTitle}</p>
                      {evaluation.projectType && (
                        <p className="text-xs text-muted-foreground">{evaluation.projectType}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{evaluation.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{evaluation.priority ?? "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(evaluation.submittedDate)}</TableCell>
                    <TableCell className="text-right">
                      {evaluation.score !== undefined && evaluation.maxScore !== undefined
                        ? `${evaluation.score}/${evaluation.maxScore}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorEvaluationsPage
