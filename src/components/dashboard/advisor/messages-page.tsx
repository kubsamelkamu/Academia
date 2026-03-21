 "use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Checkbox,
} from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Clock,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  Users,
} from "lucide-react"
import { toast } from "sonner"

interface GroupMember {
  id: string
  name: string
  role: string
  avatar: string
  status: "online" | "offline" | "away"
}

interface GroupLastMessage {
  sender: string
  content: string
  timestamp: string
  unread: boolean
}

interface MessageAttachment {
  name: string
  size: string
  type: "pdf" | "image" | "other"
}

interface Group {
  id: string
  name: string
  project: string
  members: GroupMember[]
  lastMessage: GroupLastMessage
}

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  type: "text"
  isOwn?: boolean
  attachments?: MessageAttachment[]
}

const baseGroups: Group[] = [
  {
    id: "1",
    name: "Smart Campus System Team",
    project: "Smart Campus System",
    members: [
      { id: "1", name: "John Doe", role: "Team Lead", avatar: "", status: "online" },
      { id: "2", name: "Jane Smith", role: "Developer", avatar: "", status: "offline" },
      { id: "3", name: "Mike Johnson", role: "Designer", avatar: "", status: "online" },
      { id: "4", name: "Sarah Wilson", role: "Tester", avatar: "", status: "away" },
    ],
    lastMessage: {
      sender: "John Doe",
      content: "Updated the wireframes for the dashboard",
      timestamp: "2024-01-15T10:30:00Z",
      unread: false,
    },
  },
  {
    id: "2",
    name: "AI Chatbot Development",
    project: "AI Chatbot",
    members: [
      { id: "5", name: "Alex Brown", role: "Team Lead", avatar: "", status: "online" },
      { id: "6", name: "Emma Davis", role: "AI Engineer", avatar: "", status: "online" },
      { id: "7", name: "Chris Lee", role: "Frontend Dev", avatar: "", status: "offline" },
    ],
    lastMessage: {
      sender: "Emma Davis",
      content: "The ML model training is complete!",
      timestamp: "2024-01-15T09:15:00Z",
      unread: true,
    },
  },
]

const STORAGE_KEY = "academia:advisor:groups:v1"

function loadStoredGroups(): Group[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as Group[]
  } catch {
    return []
  }
}

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "John Doe",
    content: "Hi team, I've updated the project timeline. Please review the changes.",
    timestamp: "2024-01-15T10:30:00Z",
    type: "text",
  },
  {
    id: "2",
    sender: "Advisor",
    content: "Thanks John. The timeline looks good. Let's schedule a meeting to discuss the next sprint.",
    timestamp: "2024-01-15T10:35:00Z",
    type: "text",
    isOwn: true,
  },
  {
    id: "3",
    sender: "Jane Smith",
    content: "I've completed the API integration. Here's the documentation.",
    timestamp: "2024-01-15T10:40:00Z",
    type: "text",
    attachments: [{ name: "API_Documentation.pdf", size: "2.5 MB", type: "pdf" }],
  },
  {
    id: "4",
    sender: "Mike Johnson",
    content: "Great work Jane! The new designs are ready for review.",
    timestamp: "2024-01-15T10:45:00Z",
    type: "text",
  },
]

function statusColor(status: GroupMember["status"]) {
  if (status === "online") return "bg-success"
  if (status === "away") return "bg-warning"
  return "bg-muted"
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function AdvisorCreateGroupForm() {
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    projectId: "",
    privacy: "private" as "private" | "project",
  })
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const mockProjects = [
    { id: "1", name: "Smart Campus System", group: "Team Alpha" },
    { id: "2", name: "AI Chatbot", group: "Team Beta" },
    { id: "3", name: "E-Learning Platform", group: "Team Gamma" },
  ]

  const mockStudents = [
    { id: "1", name: "John Doe", project: "Smart Campus System" },
    { id: "2", name: "Jane Smith", project: "Smart Campus System" },
    { id: "3", name: "Mike Johnson", project: "AI Chatbot" },
  ]

  const selectedProject = mockProjects.find((p) => p.id === formData.projectId)

  const filteredStudents = mockStudents.filter((student) => {
    const matchesProject = selectedProject ? student.project === selectedProject.name : true
    const lower = searchTerm.toLowerCase()
    return matchesProject && student.name.toLowerCase().includes(lower)
  })

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const handleSelectAll = () => {
    setSelectedMembers(filteredStudents.map((s) => s.id))
  }

  const handleCreate = () => {
    if (!formData.name || !formData.projectId || selectedMembers.length === 0) {
      toast.error("Incomplete")
      return
    }
    toast.success("Group created!")
  }

  return (
    <div className="space-y-6 p-1">

      <DialogHeader>
        <DialogTitle>Create New Group</DialogTitle>
      </DialogHeader>
      
      {/* Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Group Name *</Label>
            <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={formData.projectId} onValueChange={(v) => handleInputChange("projectId", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select value={formData.privacy} onValueChange={(v) => handleInputChange("privacy", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="project">Project Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3} 
            />
          </div>

          {/* Students */}
          <div className="space-y-2">
            <Label>Members ({selectedMembers.length})</Label>
            <div className="flex gap-2 mb-2">
              <Button size="sm" variant="outline" onClick={handleSelectAll}>Select All</Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedMembers([])}>Clear</Button>
            </div>
            <div className="border p-3 rounded-md max-h-32 overflow-auto">
              <Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-2" />
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                    <Checkbox 
                      checked={selectedMembers.includes(student.id)}
                      onCheckedChange={() => handleMemberToggle(student.id)}
                    />
                    <span className="text-sm">{student.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">({student.project})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


      <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
        Create Group
      </Button>
    </div>
  )
}

export function AdvisorMessagesPage() {
  const [groups, setGroups] = React.useState<Group[]>(baseGroups)
  const [selectedGroup, setSelectedGroup] = React.useState<Group>(baseGroups[0]!)
  const [newMessage, setNewMessage] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    const stored = loadStoredGroups()
    const merged = [...stored, ...baseGroups]
    setGroups(merged)
    setSelectedGroup((prev) => merged.find((g) => g.id === prev.id) ?? merged[0] ?? prev)
  }, [])

  const filteredGroups = React.useMemo(
    () =>
      groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.project.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [groups, searchTerm],
  )

  function handleSendMessage() {
    if (!newMessage.trim()) return

    toast.success("Message sent", {
      description: "Your message has been sent to the group.",
    })

    setNewMessage("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Group Messaging</h1>
          <p className="text-sm text-muted-foreground">Communicate with your project teams.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="mr-2 h-4 w-4" />
              Create New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <AdvisorCreateGroupForm />
          </DialogContent>

        </Dialog>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Groups</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup.id === group.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm">{group.name}</h3>
                      {group.lastMessage.unread && (
                        <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{group.project}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{group.members.length} members</span>
                    </div>
                    {group.lastMessage && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{group.lastMessage.sender}:</span>{" "}
                        {group.lastMessage.content}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{selectedGroup.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedGroup.project}</p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{selectedGroup.members.length} members</span>
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {selectedGroup.members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${statusColor(
                        member.status,
                      )}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{member.name}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${message.isOwn ? "order-2" : "order-1"}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{message.sender}</span>
                          <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-black/10 rounded text-xs"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span>{attachment.name}</span>
                                <span className="text-muted-foreground">({attachment.size})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[60px] resize-none pr-12"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2 h-6 w-6 p-0"
                  >
                    <Paperclip className="h-3 w-3" />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} className="btn-gradient">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-muted-foreground">Active Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {groups.reduce((acc, group) => acc + group.members.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {groups.filter((g) => g.lastMessage.unread).length}
                </p>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
