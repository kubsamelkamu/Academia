"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAdvisorProject,
  useAdvisorProjects,
  useClearProjectMutation,
  useRequestRevisionMutation,
} from "@/lib/hooks/useAdvisor"
import type { AdvisorProjectDetail, AdvisorProjectItem } from "@/lib/types/advisor"
import { Eye, FileText, FolderOpen, Search } from "lucide-react"

function formatDate(value?: string | null) {
  if (!value) return "Not available"
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function EmptyState(props: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <FolderOpen className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">{props.title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{props.description}</p>
      </CardContent>
    </Card>
  )
}

function ProjectCard(props: {
  project: AdvisorProjectItem
  onView: (projectId: string) => void
  onRevision: (project: AdvisorProjectItem) => void
  onClear: (project: AdvisorProjectItem) => void
  isBusy: boolean
}) {
  const { project, onView, onRevision, onClear, isBusy } = props

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription>{project.groupName}</CardDescription>
          </div>
          <Badge variant="outline">{project.progress}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={project.progress} className="h-2" />
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>Members: {project.members.length}</p>
          <p>Milestones: {project.milestones.length}</p>
          <p>Documents: {project.documents.length}</p>
          <p>Due: {formatDate(project.dueDate)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(project.id)}>
            <Eye className="h-4 w-4" />
            View details
          </Button>
          <Button variant="outline" size="sm" onClick={() => onRevision(project)} disabled={isBusy}>
            Request revision
          </Button>
          <Button size="sm" onClick={() => onClear(project)} disabled={isBusy}>
            Clear for evaluation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdvisorMyProjectsPage() {
  const [search, setSearch] = React.useState("")
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)

  const projectsQuery = useAdvisorProjects()
  const projectDetailQuery = useAdvisorProject(selectedProjectId ?? undefined)
  const requestRevisionMutation = useRequestRevisionMutation()
  const clearProjectMutation = useClearProjectMutation()

  const projects = projectsQuery.data?.items ?? []
  const selectedProject = projectDetailQuery.data as AdvisorProjectDetail | undefined

  const filteredProjects = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return projects

    return projects.filter((project: AdvisorProjectItem) => {
      return (
        project.title.toLowerCase().includes(term) ||
        project.groupName.toLowerCase().includes(term) ||
        project.category.toLowerCase().includes(term)
      )
    })
  }, [projects, search])

  async function handleRevision(project: AdvisorProjectItem) {
    const feedback = window.prompt(`Revision feedback for ${project.title}`, "")
    if (feedback === null) return
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }

    try {
      await requestRevisionMutation.mutateAsync({
        projectId: project.id,
        dto: {
          feedback: feedback.trim(),
          subject: `Revision required for ${project.title}`,
        },
      })
      toast.success(`Revision requested for ${project.title}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision")
    }
  }

  async function handleClear(project: AdvisorProjectItem) {
    try {
      await clearProjectMutation.mutateAsync({ projectId: project.id })
      toast.success(`${project.title} cleared for evaluation.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear project")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">
            Review project progress, inspect details, and send revision or clearance actions.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="cleared">Cleared</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {projectsQuery.isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">Loading projects...</CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title="No projects found"
              description="Try a different search term or wait for project assignments to appear."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProjects.map((project: AdvisorProjectItem) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={setSelectedProjectId}
                  onRevision={handleRevision}
                  onClear={handleClear}
                  isBusy={requestRevisionMutation.isPending || clearProjectMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filteredProjects.filter((project: AdvisorProjectItem) => project.status !== "cleared").length === 0 ? (
            <EmptyState title="No active projects" description="Active projects will appear here." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProjects
                .filter((project: AdvisorProjectItem) => project.status !== "cleared")
                .map((project: AdvisorProjectItem) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={setSelectedProjectId}
                    onRevision={handleRevision}
                    onClear={handleClear}
                    isBusy={requestRevisionMutation.isPending || clearProjectMutation.isPending}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cleared" className="space-y-4">
          {filteredProjects.filter((project: AdvisorProjectItem) => project.status === "cleared").length === 0 ? (
            <EmptyState title="No cleared projects" description="Cleared projects will appear here." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProjects
                .filter((project: AdvisorProjectItem) => project.status === "cleared")
                .map((project: AdvisorProjectItem) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={setSelectedProjectId}
                    onRevision={handleRevision}
                    onClear={handleClear}
                    isBusy={requestRevisionMutation.isPending || clearProjectMutation.isPending}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedProjectId)} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title ?? "Project details"}</DialogTitle>
            <DialogDescription>{selectedProject?.groupName ?? "Project detail view"}</DialogDescription>
          </DialogHeader>

          {projectDetailQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading project details...</div>
          ) : selectedProject ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedProject.progress}%</p>
                      <p className="text-sm text-muted-foreground">Progress</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{selectedProject.members.length}</p>
                      <p className="text-sm text-muted-foreground">Members</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{selectedProject.documents.length}</p>
                      <p className="text-sm text-muted-foreground">Documents</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <p>Category: {selectedProject.category}</p>
                      <p>Due date: {formatDate(selectedProject.dueDate)}</p>
                      <p>Start date: {formatDate(selectedProject.startDate)}</p>
                      <p>Status: {selectedProject.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Milestones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.milestones.map((milestone) => (
                      <div key={milestone.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{milestone.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Due {formatDate(milestone.dueDate)}
                            </p>
                          </div>
                          <Badge variant="outline">{milestone.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Members</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    ) : (
                      selectedProject.documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{document.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {document.type} · {document.size}
                              </p>
                            </div>
                          </div>
                          <Link
                            href="/dashboard/advisor/documents"
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            Open documents
                          </Link>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revision Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProject.revisionRequests?.length ? (
                      selectedProject.revisionRequests.map((request) => (
                        <div key={request.id} className="rounded-lg border p-4">
                          <p className="font-medium">{request.subject}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{request.feedback}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {request.status} · {formatDate(request.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No revision requests recorded for this project.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Select a project to inspect its details.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvisorMyProjectsPage
