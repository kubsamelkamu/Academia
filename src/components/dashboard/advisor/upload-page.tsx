"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAdvisorProjects, useUploadDocumentMutation } from "@/lib/hooks/useAdvisor"
import type { AdvisorProjectItem, AdvisorProjectMilestone } from "@/lib/types/advisor"
import { ArrowLeft, Loader2, Upload } from "lucide-react"

export function AdvisorUploadPage() {
  const searchParams = useSearchParams()
  const initialProjectId = searchParams.get("project") ?? ""
  const projectsQuery = useAdvisorProjects()
  const uploadMutation = useUploadDocumentMutation()

  const [projectId, setProjectId] = React.useState(initialProjectId)
  const [milestoneId, setMilestoneId] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)

  const projects: AdvisorProjectItem[] = projectsQuery.data?.items ?? []

  React.useEffect(() => {
    if (!projectId && projects[0]?.id) {
      setProjectId(projects[0].id)
    }
  }, [projectId, projects])

  const selectedProject = React.useMemo(
    () => projects.find((project: AdvisorProjectItem) => project.id === projectId) ?? null,
    [projectId, projects],
  )

  async function handleSubmit() {
    if (!projectId) {
      toast.error("Choose a project first.")
      return
    }
    if (!file) {
      toast.error("Select a document to upload.")
      return
    }

    try {
      await uploadMutation.mutateAsync({
        dto: {
          projectId,
          milestoneId: milestoneId || undefined,
          description: description.trim() || undefined,
        },
        file,
      })
      toast.success("Document uploaded.")
      setDescription("")
      setMilestoneId("")
      setFile(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload document")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-sm text-muted-foreground">Attach a document to a project or milestone for advisor review.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: AdvisorProjectItem) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.groupName} - {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Milestone (optional)</Label>
            <Select value={milestoneId || "__none__"} onValueChange={(value) => setMilestoneId(value === "__none__" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Attach to milestone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">General project document</SelectItem>
                {(selectedProject?.milestones ?? []).map((milestone: AdvisorProjectMilestone) => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    {milestone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Document</Label>
            <Input
              id="file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.mp4,.webm,.zip"
            />
            {file ? <p className="text-xs text-muted-foreground">Selected: {file.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context for this upload..."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={uploadMutation.isPending || projectsQuery.isLoading}>
              {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorUploadPage