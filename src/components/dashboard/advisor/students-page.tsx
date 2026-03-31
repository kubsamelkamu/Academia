"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useAdvisorStudents, useClearProjectMutation, useRequestRevisionMutation } from "@/lib/hooks/useAdvisor"
import { Search } from "lucide-react"

export function AdvisorStudentsPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const studentsQuery = useAdvisorStudents()
  const clearProjectMutation = useClearProjectMutation()
  const requestRevisionMutation = useRequestRevisionMutation()

  const items = React.useMemo(() => {
    const projects = studentsQuery.data?.items ?? []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return projects
    return projects.filter((project) =>
      [project.title, project.groupName, ...project.members.map((member) => member.name)].some((value) =>
        value.toLowerCase().includes(term),
      ),
    )
  }, [searchTerm, studentsQuery.data?.items])

  async function handleClear(projectId: string, title: string) {
    const notes = window.prompt(`Optional clearance notes for ${title}`, "")
    if (notes === null) return
    try {
      await clearProjectMutation.mutateAsync({ projectId, notes: notes.trim() || undefined })
      toast.success(`${title} cleared for evaluation.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear project")
    }
  }

  async function handleRevision(projectId: string, title: string) {
    const feedback = window.prompt(`Revision feedback for ${title}`, "")
    if (feedback === null) return
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }
    try {
      await requestRevisionMutation.mutateAsync({
        projectId,
        dto: { subject: `Revision required for ${title}`, feedback: feedback.trim() },
      })
      toast.success(`${title}: revision requested.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision")
    }
  }

  const stats = studentsQuery.data?.stats ?? {
    readyForClearance: 0,
    clearedProjects: 0,
    revisionRequired: 0,
    totalStudents: 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Clearance Queue</h1>
          <p className="text-sm text-muted-foreground">Review clearance readiness for your supervised students.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard/advisor">Back</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Students</p><p className="text-2xl font-bold">{stats.totalStudents}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Ready</p><p className="text-2xl font-bold">{stats.readyForClearance}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Cleared</p><p className="text-2xl font-bold">{stats.clearedProjects}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Revision</p><p className="text-2xl font-bold">{stats.revisionRequired}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search projects or students..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {studentsQuery.isLoading ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading student projects...</CardContent></Card>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No projects found.</CardContent></Card>
        ) : (
          items.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.groupName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Status: {project.status}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Members</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.members.map((member) => (
                          <span key={member.id} className="rounded-full bg-muted px-3 py-1 text-xs">{member.name}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Milestones</p>
                      <div className="mt-2 space-y-2">
                        {project.milestones.map((milestone) => (
                          <div key={milestone.id} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span>{milestone.name}</span>
                              <span className="text-muted-foreground">{milestone.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="text-sm font-medium">Evaluation Criteria</p>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <p>Technical: {project.evaluationCriteria.technical}%</p>
                      <p>Presentation: {project.evaluationCriteria.presentation}%</p>
                      <p>Documentation: {project.evaluationCriteria.documentation}%</p>
                      <p>Innovation: {project.evaluationCriteria.innovation}%</p>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button onClick={() => void handleClear(project.id, project.title)} disabled={clearProjectMutation.isPending}>Clear Project</Button>
                      <Button asChild variant="outline"><Link href={`/dashboard/advisor/students/revision/${project.id}`}>Open Revision Form</Link></Button>
                      <Button variant="outline" onClick={() => void handleRevision(project.id, project.title)} disabled={requestRevisionMutation.isPending}>Request Revision</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default AdvisorStudentsPage