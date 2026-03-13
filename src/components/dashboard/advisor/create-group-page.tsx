 "use client"

import * as React from "react"
import { useRouter } from "next/navigation"

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
import { Search, Users, X, Plus } from "lucide-react"
import { toast } from "sonner"

interface ProjectOption {
  id: string
  name: string
  group: string
}

interface StudentOption {
  id: string
  name: string
  email: string
  project: string
  avatar: string
  role: string
}

interface StoredGroup {
  id: string
  name: string
  project: string
  members: { id: string; name: string; role: string; avatar: string; status: "online" | "offline" | "away" }[]
  lastMessage: { sender: string; content: string; timestamp: string; unread: boolean }
}

const STORAGE_KEY = "academia:advisor:groups:v1"

function loadStoredGroups(): StoredGroup[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as StoredGroup[]
  } catch {
    return []
  }
}

function saveStoredGroups(groups: StoredGroup[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  } catch {
    // ignore
  }
}

const mockProjects: ProjectOption[] = [
  { id: "1", name: "Smart Campus System", group: "Team Alpha" },
  { id: "2", name: "AI Chatbot", group: "Team Beta" },
  { id: "3", name: "E-Learning Platform", group: "Team Gamma" },
  { id: "4", name: "Inventory Management System", group: "Team Delta" },
]

const mockStudents: StudentOption[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@university.edu",
    project: "Smart Campus System",
    avatar: "",
    role: "Team Lead",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@university.edu",
    project: "Smart Campus System",
    avatar: "",
    role: "Developer",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@university.edu",
    project: "Smart Campus System",
    avatar: "",
    role: "Designer",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah.wilson@university.edu",
    project: "Smart Campus System",
    avatar: "",
    role: "Tester",
  },
  {
    id: "5",
    name: "Alex Brown",
    email: "alex.brown@university.edu",
    project: "AI Chatbot",
    avatar: "",
    role: "Team Lead",
  },
  {
    id: "6",
    name: "Emma Davis",
    email: "emma.davis@university.edu",
    project: "AI Chatbot",
    avatar: "",
    role: "AI Engineer",
  },
  {
    id: "7",
    name: "Chris Lee",
    email: "chris.lee@university.edu",
    project: "AI Chatbot",
    avatar: "",
    role: "Frontend Dev",
  },
  {
    id: "8",
    name: "Lisa Wang",
    email: "lisa.wang@university.edu",
    project: "E-Learning Platform",
    avatar: "",
    role: "Team Lead",
  },
  {
    id: "9",
    name: "David Chen",
    email: "david.chen@university.edu",
    project: "E-Learning Platform",
    avatar: "",
    role: "Backend Dev",
  },
  {
    id: "10",
    name: "Anna Rodriguez",
    email: "anna.rodriguez@university.edu",
    project: "Inventory Management System",
    avatar: "",
    role: "Team Lead",
  },
]

export function AdvisorCreateGroupPage() {
  const router = useRouter()

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    projectId: "",
    privacy: "private" as "private" | "project",
  })
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const selectedProject = React.useMemo(
    () => mockProjects.find((p) => p.id === formData.projectId) ?? null,
    [formData.projectId],
  )

  const filteredStudents = React.useMemo(
    () =>
      mockStudents.filter((student) => {
        const matchesProject = selectedProject ? student.project === selectedProject.name : true
        const lower = searchTerm.toLowerCase()
        const matchesSearch =
          !lower ||
          student.name.toLowerCase().includes(lower) ||
          student.email.toLowerCase().includes(lower) ||
          student.role.toLowerCase().includes(lower)
        return matchesProject && matchesSearch
      }),
    [selectedProject, searchTerm],
  )

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleMemberToggle(memberId: string) {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  function handleSelectAll() {
    if (!selectedProject) return
    const projectStudents = mockStudents.filter(
      (student) => student.project === selectedProject.name,
    )
    setSelectedMembers(projectStudents.map((s) => s.id))
  }

  function handleDeselectAll() {
    setSelectedMembers([])
  }

  function handleCancel() {
    router.push("/dashboard/advisor/messages")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name || !formData.projectId || selectedMembers.length === 0) {
      toast.error("Incomplete form", {
        description: "Please fill all required fields and select at least one member.",
      })
      return
    }

    setIsCreating(true)

    setTimeout(() => {
      setIsCreating(false)

      if (selectedProject) {
        const now = new Date().toISOString()
        const selectedMemberObjects = mockStudents
          .filter((s) => selectedMembers.includes(s.id))
          .map((s) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            avatar: s.avatar,
            status: "offline" as const,
          }))

        const newGroup: StoredGroup = {
          id: `g_${Date.now()}`,
          name: formData.name,
          project: selectedProject.name,
          members: selectedMemberObjects,
          lastMessage: {
            sender: "Advisor",
            content: formData.description?.trim() ? formData.description.trim() : "Group created.",
            timestamp: now,
            unread: false,
          },
        }

        const existing = loadStoredGroups()
        saveStoredGroups([newGroup, ...existing])
      }

      toast.success("Group created", {
        description: `"${formData.name}" has been created with ${selectedMembers.length} members.`,
      })
      router.push("/dashboard/advisor/messages")
    }, 1500)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Group</h1>
          <p className="text-sm text-muted-foreground">
            Set up a new communication group for your project team.
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Group Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Smart Campus Team"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, projectId: value }))
                      setSelectedMembers([])
                    }}
                  >
                    <SelectTrigger id="projectId">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} - {project.group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the group purpose..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy">Privacy Settings</Label>
                <Select
                  value={formData.privacy}
                  onValueChange={(value: "private" | "project") =>
                    setFormData((prev) => ({ ...prev, privacy: value }))
                  }
                >
                  <SelectTrigger id="privacy">
                    <SelectValue placeholder="Select privacy setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      Private – Only invited members
                    </SelectItem>
                    <SelectItem value="project">
                      Project Members – All project team members
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="btn-gradient">
                  {isCreating ? (
                    <>
                      <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-background border-b-transparent" />
                      Creating Group...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Group
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Members selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Members</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedProject
                ? `Select members from ${selectedProject.name}`
                : "Select a project first"}
            </p>
            {selectedProject && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedMembers.includes(student.id)
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedMembers.includes(student.id)}
                      onCheckedChange={() => handleMemberToggle(student.id)}
                      disabled={!selectedProject}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="text-xs">
                        {student.name
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.email}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {student.role}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {selectedProject
                        ? "No members found"
                        : "Select a project to view members"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {selectedMembers.length > 0 && (
              <div className="p-4 border-t bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedMembers.length} member
                    {selectedMembers.length !== 1 ? "s" : ""} selected
                  </span>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {selectedMembers.length}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {formData.name && selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Group Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{formData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.name} • {selectedProject.group}
                </p>
                {formData.description && (
                  <p className="text-sm mt-2">{formData.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedMembers.length} member
                    {selectedMembers.length !== 1 ? "s" : ""}{" "}
                    in this group
                  </span>
                </div>
                <Badge variant={formData.privacy === "private" ? "secondary" : "default"}>
                  {formData.privacy === "private" ? "Private" : "Project"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdvisorCreateGroupPage

