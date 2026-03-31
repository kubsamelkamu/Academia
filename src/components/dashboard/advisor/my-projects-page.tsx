"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  useAdvisorProject,
  useAdvisorProjects,
  useClearProjectMutation,
  useRequestRevisionMutation,
} from "@/lib/hooks/useAdvisor"
import { FolderOpen, Search } from "lucide-react"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function AdvisorMyProjectsPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [selectedProjectId, setSelectedProjectId] = React.useState("")

  const projectsQuery = useAdvisorProjects()
  const projectDetailQuery = useAdvisorProject(selectedProjectId || undefined)
  const clearProjectMutation = useClearProjectMutation()
  const requestRevisionMutation = useRequestRevisionMutation()

  const projects = React.useMemo(() => {
    const items = projectsQuery.data?.items ?? []
    const term = searchTerm.trim().toLowerCase()
    return items.filter((project) => {
      const matchesSearch =
        !term ||
        [project.title, project.groupName, project.description].some((value) =>
          value.toLowerCase().includes(term),
        )
      const matchesStatus = status === "all" || project.status === status
      return matchesSearch && matchesStatus
    })
  }, [projectsQuery.data?.items, searchTerm, status])

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

  const stats = projectsQuery.data?.stats ?? {
    totalProjects: 0,
    activeProjects: 0,
    clearedProjects: 0,
    completedProjects: 0,
  }

  const selectedProject = projectDetailQuery.data

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
          <p className="text-sm text-muted-foreground">
            Backend-backed overview of every project currently assigned to this advisor.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor">Back</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.totalProjects}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{stats.activeProjects}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Cleared</p><p className="text-2xl font-bold">{stats.clearedProjects}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{stats.completedProjects}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search project title, group, or description..."
                className="pl-9"
              />
            </div>
            <Input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="all, active, in-progress..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Project cards */}
      {projectsQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading projects…
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No projects found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search or wait until projects are assigned.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.groupName}</p>
                  </div>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
                  <p>Members: {project.members.length}</p>
                  <p>Milestones: {project.milestones.length}</p>
                  <p>Documents: {project.documents.length}</p>
                  <p>Due: {formatDate(project.dueDate)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedProjectId(project.id)}>
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRevision(project.id, project.title)}
                    disabled={requestRevisionMutation.isPending}
                  >
                    Request Revision
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleClear(project.id, project.title)}
                    disabled={clearProjectMutation.isPending}
                  >
                    Clear for Evaluation
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/advisor/documents">Documents</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/advisor/schedule">Schedule</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog
        open={Boolean(selectedProjectId)}
        onOpenChange={(open) => { if (!open) setSelectedProjectId("") }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title ?? "Loading project…"}</DialogTitle>
          </DialogHeader>
          {projectDetailQuery.isLoading || !selectedProject ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading project details…
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedProject.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Milestones</p>
                  <div className="mt-2 space-y-2">
                    {selectedProject.milestones.map((milestone) => (
                      <div key={milestone.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span>{milestone.name}</span>
                          <span className="text-muted-foreground">{milestone.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(milestone.dueDate)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Recent Documents</p>
                  <div className="mt-2 space-y-2">
                    {selectedProject.documents.map((document) => (
                      <div key={document.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span>{document.name}</span>
                          <span className="text-muted-foreground">{document.size}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Uploaded by {document.uploadedBy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Team Members</p>
                  <div className="mt-2 space-y-2">
                    {selectedProject.members.map((member) => (
                      <div key={member.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedProject.revisionRequests?.length ? (
                  <div>
                    <p className="text-sm font-medium">Revision History</p>
                    <div className="mt-2 space-y-2">
                      {selectedProject.revisionRequests.map((request) => (
                        <div key={request.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                          <p className="font-medium">{request.subject}</p>
                          <p className="mt-1 text-muted-foreground">{request.feedback}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvisorMyProjectsPage
