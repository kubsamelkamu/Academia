"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAdvisorProjects, useCreateMessageGroupMutation } from "@/lib/hooks/useAdvisor"
import { ArrowLeft, Loader2, Search, Users } from "lucide-react"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AdvisorCreateGroupPage() {
  const router = useRouter()
  const projectsQuery = useAdvisorProjects()
  const createMessageGroupMutation = useCreateMessageGroupMutation()

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    projectId: "",
    privacy: "PROJECT" as "PRIVATE" | "PROJECT",
  })
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])

  const projects = projectsQuery.data?.items ?? []

  React.useEffect(() => {
    if (!formData.projectId && projects[0]?.id) {
      setFormData((current) => ({ ...current, projectId: projects[0].id }))
    }
  }, [formData.projectId, projects])

  const selectedProject = React.useMemo(
    () => projects.find((project) => project.id === formData.projectId) ?? null,
    [formData.projectId, projects],
  )

  const availableMembers = React.useMemo(() => {
    const members = selectedProject?.members ?? []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return members
    return members.filter((member) =>
      [member.name, member.email, member.role].some((value) => value.toLowerCase().includes(term)),
    )
  }, [searchTerm, selectedProject])

  React.useEffect(() => {
    if (!selectedProject) {
      setSelectedMembers([])
      return
    }
    setSelectedMembers(selectedProject.members.map((member) => member.id))
  }, [selectedProject?.id])

  function toggleMember(memberId: string) {
    setSelectedMembers((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Group name is required.")
      return
    }
    if (!formData.projectId) {
      toast.error("Choose a project first.")
      return
    }
    if (selectedMembers.length === 0) {
      toast.error("Select at least one student.")
      return
    }

    try {
      const created = await createMessageGroupMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        projectId: formData.projectId,
        privacy: formData.privacy,
        memberUserIds: selectedMembers,
      })
      toast.success("Group created.")
      router.push(`/dashboard/advisor/messages?group=${encodeURIComponent(created.id)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create group")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Group</h1>
          <p className="text-sm text-muted-foreground">Create a real advisor message group backed by the API.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/advisor/messages")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Messages
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={formData.name}
                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                    placeholder="e.g. Team Atlas Review Room"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData((current) => ({ ...current, projectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.groupName} - {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe the purpose of this group..."
                />
              </div>

              <div className="space-y-2">
                <Label>Privacy</Label>
                <Select
                  value={formData.privacy}
                  onValueChange={(value: "PRIVATE" | "PROJECT") =>
                    setFormData((current) => ({ ...current, privacy: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/advisor/messages")}>Cancel</Button>
                <Button type="submit" disabled={createMessageGroupMutation.isPending || projectsQuery.isLoading}>
                  {createMessageGroupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Group
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search members..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <ScrollArea className="h-[420px] px-4 pb-4">
              <div className="space-y-2">
                {projectsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading project members...</p>
                ) : !selectedProject ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="font-medium">Choose a project</p>
                    <p className="mt-1 text-sm text-muted-foreground">Project students will appear here.</p>
                  </div>
                ) : availableMembers.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="font-medium">No matching students</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
                  </div>
                ) : (
                  availableMembers.map((member) => (
                    <label
                      key={member.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                        selectedMembers.includes(member.id) ? "border-primary/40 bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox checked={selectedMembers.includes(member.id)} onCheckedChange={() => toggleMember(member.id)} />
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline">{member.role}</Badge>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              {selectedMembers.length} member{selectedMembers.length === 1 ? "" : "s"} selected
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvisorCreateGroupPage