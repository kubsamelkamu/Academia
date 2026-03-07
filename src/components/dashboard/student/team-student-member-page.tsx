"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Crown,
  AlertCircle,
  Info,
  FileText,
  Loader2,
  Target,
  Lightbulb,
  Github,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

type PresenceStatus = "online" | "away" | "offline"
type RequestStatus = "pending" | "approved" | "rejected"

interface GroupMember {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
  skills?: string[]
  joinedAt: string
}

interface GroupManager {
  id: number
  name: string
  email: string
  avatar: string
  status: PresenceStatus
  bio?: string
  expertise?: string[]
  socialLinks?: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
}

interface AvailableGroup {
  id: number
  name: string
  manager: GroupManager
  members: GroupMember[]
  currentSize: number
  maxSize: number
  department: string
  objectives?: string[]
  technologies?: string[]
  meetings?: {
    day: string
    time: string
    location: string
  }[]
}

interface JoinRequest {
  id: number
  groupName: string
  managerName: string
  status: RequestStatus
  requestedAt: string
  respondedAt?: string
  reason: string
  rejectionReason?: string
}

interface ManagerRequest {
  id: number
  status: RequestStatus
  requestedAt: string
  respondedAt?: string
  reason: string
}

export function StudentTeamMemberPage() {
  const [, setActiveTab] = useState("browse-groups")
  const [selectedGroup, setSelectedGroup] = useState<AvailableGroup | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showManagerRequestDialog, setShowManagerRequestDialog] = useState(false)
  const [showGroupDetailsDialog, setShowGroupDetailsDialog] = useState(false)
  const [requestReason, setRequestReason] = useState("")
  const [managerRequestReason, setManagerRequestReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentUser = {
    id: "STU045",
    name: "Alice Johnson",
    email: "alice.johnson@university.edu",
    department: "Computer Science",
    year: "3rd Year",
    avatar: "/avatars/alice.jpg",
    status: "online" as PresenceStatus,
  }

  // Mock data - would come from API in production
  const availableGroups: AvailableGroup[] = [
    {
      id: 1,
      name: "AI Research Group",
      manager: {
        id: 101,
        name: "Dr. Sarah Chen",
        email: "sarah.chen@university.edu",
        avatar: "/avatars/sarah.jpg",
        status: "online",
        bio: "Associate Professor of Computer Science with 10+ years experience in AI ethics and machine learning.",
        expertise: ["AI Ethics", "Machine Learning", "Healthcare Informatics"],
        socialLinks: {
          github: "https://github.com/sarachen",
          linkedin: "https://linkedin.com/in/sarachen",
          twitter: "https://twitter.com/sarachen",
          website: "https://sarachen.research.edu"
        }
      },
      members: [
        { id: 201, name: "John Smith", email: "john.smith@university.edu", role: "Frontend Developer", skills: ["Python", "Machine Learning"], joinedAt: "2024-01-15" },
        { id: 202, name: "Emily Brown", email: "emily.brown@university.edu", role: "Backend Developer", skills: ["Ethics", "Philosophy"], joinedAt: "2024-01-16" },
        { id: 203, name: "Michael Lee", email: "michael.lee@university.edu", role: "Frontend Developer", skills: ["React", "Python"], joinedAt: "2024-01-17" },
      ],
      currentSize: 4,
      maxSize: 7,
      department: "Computer Science",
      objectives: [
        "Develop ethical guidelines for AI in clinical settings",
        "Create fairness metrics for medical AI systems",
        "Publish research papers in top AI ethics journals"
      ],
      technologies: ["Python", "TensorFlow", "PyTorch", "React"],
      meetings: [
        { day: "Monday", time: "2:00 PM - 4:00 PM", location: "Room 301" },
        { day: "Wednesday", time: "10:00 AM - 12:00 PM", location: "Virtual (Zoom)" }
      ]
    },
    {
      id: 2,
      name: "Web Development Team",
      manager: {
        id: 102,
        name: "Prof. James Wilson",
        email: "j.wilson@university.edu",
        avatar: "/avatars/james.jpg",
        status: "away",
        bio: "Professor of Software Engineering with focus on web technologies.",
        expertise: ["React", "Node.js", "TypeScript"],
      },
      members: [
        { id: 204, name: "David Kim", email: "david.kim@university.edu", role: "Frontend Developer", skills: ["React", "CSS"], joinedAt: "2024-01-12" },
        { id: 205, name: "Lisa Wang", email: "lisa.wang@university.edu", role: "Backend Developer", skills: ["Node.js", "Python"], joinedAt: "2024-01-14" },
      ],
      currentSize: 3,
      maxSize: 7,
      department: "Computer Science",
      objectives: [
        "Build a modern e-learning platform",
        "Implement real-time collaboration features",
        "Ensure accessibility compliance"
      ],
      technologies: ["React", "Node.js", "TypeScript", "MongoDB"],
      meetings: [
        { day: "Tuesday", time: "3:00 PM - 5:00 PM", location: "Online" }
      ]
    },
    {
      id: 3,
      name: "Mobile App Innovation",
      manager: {
        id: 103,
        name: "Dr. Robert Taylor",
        email: "r.taylor@university.edu",
        avatar: "/avatars/robert.jpg",
        status: "offline",
      },
      members: [
        { id: 206, name: "Amanda Garcia", email: "amanda@university.edu", role: "Mobile Developer", joinedAt: "2024-01-08" },
        { id: 207, name: "Kevin Park", email: "kevin@university.edu", role: "UI/UX Designer", joinedAt: "2024-01-09" },
        { id: 208, name: "Rachel Green", email: "rachel@university.edu", role: "Developer", joinedAt: "2024-01-10" },
        { id: 209, name: "Tom Harris", email: "tom@university.edu", role: "Developer", joinedAt: "2024-01-11" },
        { id: 210, name: "Nina Patel", email: "nina@university.edu", role: "Developer", joinedAt: "2024-01-12" },
      ],
      currentSize: 6,
      maxSize: 7,
      department: "Computer Science",
      objectives: [
        "Develop AR-based campus navigation",
        "Integrate with university map services",
        "Create intuitive user interface"
      ],
      technologies: ["React Native", "AR Kit", "Node.js", "PostgreSQL"],
      meetings: [
        { day: "Thursday", time: "4:00 PM - 6:00 PM", location: "Lab 205" }
      ]
    },
  ]

  const myRequests: JoinRequest[] = [
    {
      id: 1,
      groupName: "AI Research Group",
      managerName: "Dr. Sarah Chen",
      status: "pending",
      requestedAt: "2024-01-15T10:30:00",
      reason: "Interested in AI ethics research, have completed relevant courses",
    },
    {
      id: 2,
      groupName: "Web Development Team",
      managerName: "Prof. James Wilson",
      status: "rejected",
      requestedAt: "2024-01-14T14:20:00",
      respondedAt: "2024-01-15T09:15:00",
      reason: "Looking to gain experience in full-stack development",
      rejectionReason: "Group currently looking for backend specialists, your profile shows more frontend experience",
    },
  ]

  const managerRequests: ManagerRequest[] = [
    {
      id: 1,
      status: "pending",
      requestedAt: "2024-01-10",
      reason: "I have 2 years of project management experience and want to lead a team",
    },
  ]

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase()

  const getStatusColor = (status: PresenceStatus) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "away": return "bg-yellow-500"
      case "offline": return "bg-gray-400"
      default: return "bg-gray-400"
    }
  }

  const getStatusText = (status: PresenceStatus) => {
    switch (status) {
      case "online": return "Online"
      case "away": return "Away"
      case "offline": return "Offline"
      default: return "Offline"
    }
  }

  const filteredGroups = availableGroups.filter((group) => {
    const q = searchQuery.toLowerCase()
    return (
      group.name.toLowerCase().includes(q) ||
      group.manager.name.toLowerCase().includes(q)
    )
  })

  const handleJoinRequest = (group: AvailableGroup) => {
    setSelectedGroup(group)
    setShowRequestDialog(true)
  }

  const handleViewDetails = (group: AvailableGroup) => {
    setSelectedGroup(group)
    setShowGroupDetailsDialog(true)
  }

  const handleManagerRequest = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setShowManagerRequestDialog(false)
      setManagerRequestReason("")
      alert("Manager request submitted successfully!")
    }, 1500)
  }

  const handleSubmitJoinRequest = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setShowRequestDialog(false)
      setRequestReason("")
      alert("Join request sent successfully!")
    }, 1500)
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Student Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find and join project groups in {currentUser.department}
          </p>
        </div>

        {/* User Profile Card */}
        <Card className="bg-primary/5 border-primary/20 w-full md:w-auto">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(currentUser.status)} ring-2 ring-white`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    Student
                  </Badge>
                  <span>{currentUser.year}</span>
                  <span>•</span>
                  <span>{currentUser.department}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Info Banner */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Showing groups from <span className="font-semibold">{currentUser.department}</span> department only
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="browse-groups" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="browse-groups" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Browse Groups</span>
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">My Requests</span>
            {myRequests.filter((r) => r.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0">
                {myRequests.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="become-manager" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Become Manager</span>
          </TabsTrigger>
        </TabsList>

        {/* Browse Groups Tab */}
        <TabsContent value="browse-groups" className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups by name or manager..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Groups Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="mt-1">{group.department}</CardDescription>
                      </div>
                      <Badge variant={group.currentSize < group.maxSize ? "default" : "secondary"}>
                        {group.currentSize < group.maxSize ? "Accepting Members" : "Full"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Group Manager - Simplified */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={group.manager.avatar} />
                          <AvatarFallback>{getInitials(group.manager.name)}</AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(group.manager.status)} ring-2 ring-white`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{group.manager.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Group Manager • {getStatusText(group.manager.status)}
                        </p>
                      </div>
                    </div>

                    {/* Members List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium">
                          Team Members ({group.currentSize}/{group.maxSize})
                        </p>
                        <Progress value={(group.currentSize / group.maxSize) * 100} className="w-20 h-2" />
                      </div>
                      <ScrollArea className="h-20">
                        <div className="space-y-1">
                          {group.members.map((member) => (
                            <div key={member.id} className="flex items-center gap-2 text-xs">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              <span>{member.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1">
                                {member.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Action Buttons - Only Details and Request to Join */}
                    <div className="flex gap-2 pt-2">
                      {group.currentSize < group.maxSize ? (
                        <Button className="flex-1" onClick={() => handleJoinRequest(group)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request to Join
                        </Button>
                      ) : (
                        <Button className="flex-1" variant="secondary" disabled>
                          Group Full
                        </Button>
                      )}
                      <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(group)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No groups found matching your search</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="my-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Join Requests</CardTitle>
              <CardDescription>Track the status of your group join requests</CardDescription>
            </CardHeader>
            <CardContent>
              {myRequests.length > 0 ? (
                <div className="space-y-4">
                  {myRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                request.status === "pending"
                                  ? "bg-yellow-100"
                                  : request.status === "approved"
                                    ? "bg-green-100"
                                    : "bg-red-100"
                              }`}
                            >
                              {request.status === "pending" && <Clock className="h-5 w-5 text-yellow-600" />}
                              {request.status === "approved" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                              {request.status === "rejected" && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                            <div>
                              <h4 className="font-medium">{request.groupName}</h4>
                              <p className="text-sm text-muted-foreground">Manager: {request.managerName}</p>
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(request.requestedAt).toLocaleDateString()}
                              </p>
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                <span className="font-medium">Your reason:</span> {request.reason}
                              </p>
                              {request.rejectionReason && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Rejection Reason</AlertTitle>
                                  <AlertDescription>{request.rejectionReason}</AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No join requests yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("browse-groups")}>
                    Browse Groups
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Become Manager Tab */}
        <TabsContent value="become-manager" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Request to Become Project Manager
              </CardTitle>
              <CardDescription>
                Submit a request to the department head to become a group manager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Requirements */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Manager Requirements</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Minimum 3.5 GPA</li>
                    <li>Previous project experience</li>
                    <li>Good academic standing</li>
                    <li>Leadership potential</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Request Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manager-request-reason">Why do you want to become a group manager?</Label>
                  <Textarea
                    id="manager-request-reason"
                    placeholder="Describe your motivation, experience, and qualifications..."
                    value={managerRequestReason}
                    onChange={(e) => setManagerRequestReason(e.target.value)}
                    rows={5}
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!managerRequestReason.trim() || isSubmitting}
                  onClick={() => setShowManagerRequestDialog(true)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>

              {/* Horizontal Rule */}
              <hr className="my-6 border-t border-border" />

              {/* Previous Requests */}
              <div>
                <h3 className="font-medium mb-4">Your Previous Requests</h3>
                <div className="space-y-3">
                  {managerRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Request #{request.id}</p>
                        <p className="text-xs text-muted-foreground">{request.reason.substring(0, 60)}...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          request.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Join Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request to Join Group</DialogTitle>
            <DialogDescription>
              Send a join request to {selectedGroup?.manager?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Group</Label>
              <div className="p-2 bg-muted rounded text-sm font-medium">
                {selectedGroup?.name}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="join-reason">Why do you want to join?</Label>
              <Textarea
                id="join-reason"
                placeholder="Explain your interest and what you can contribute..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitJoinRequest} disabled={!requestReason.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Request Dialog */}
      <Dialog open={showManagerRequestDialog} onOpenChange={setShowManagerRequestDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Manager Request</DialogTitle>
            <DialogDescription>Your request will be sent to the Department Head for review</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Before submitting</AlertTitle>
              <AlertDescription>
                Make sure you meet all requirements and have provided a strong reason for becoming a group manager.
                The approval process typically takes 2-3 business days.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManagerRequestDialog(false)} disabled={isSubmitting}>
              Go Back
            </Button>
            <Button onClick={handleManagerRequest} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Details Dialog - Simplified without project description and documents */}
      <Dialog open={showGroupDetailsDialog} onOpenChange={setShowGroupDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              {selectedGroup?.department}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-6 py-4">
              {/* Manager Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedGroup.manager.avatar} />
                    <AvatarFallback>{getInitials(selectedGroup.manager.name)}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${getStatusColor(selectedGroup.manager.status)} ring-2 ring-white`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedGroup.manager.name}</h3>
                  <p className="text-sm text-muted-foreground">Group Manager</p>
                  <p className="text-sm mt-2">{selectedGroup.manager.bio || "No bio available."}</p>
                  
                  {/* Expertise Tags */}
                  {selectedGroup.manager.expertise && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedGroup.manager.expertise.map((item, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-50">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="flex gap-2 mt-3">
                    {selectedGroup.manager.socialLinks?.github && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={selectedGroup.manager.socialLinks.github} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {selectedGroup.manager.socialLinks?.linkedin && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={selectedGroup.manager.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {selectedGroup.manager.socialLinks?.twitter && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={selectedGroup.manager.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {selectedGroup.manager.socialLinks?.website && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={selectedGroup.manager.socialLinks.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Objectives */}
              {selectedGroup.objectives && selectedGroup.objectives.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Objectives
                  </h4>
                  <ul className="space-y-2">
                    {selectedGroup.objectives.map((obj, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies */}
              {selectedGroup.technologies && selectedGroup.technologies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Team Members ({selectedGroup.currentSize}/{selectedGroup.maxSize})
                </h4>
                <div className="space-y-2">
                  {selectedGroup.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                          {member.skills && (
                            <div className="flex gap-1 mt-1">
                              {member.skills.slice(0, 2).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px]">
                                  {skill}
                                </Badge>
                              ))}
                              {member.skills.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{member.skills.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGroupDetailsDialog(false)}>
              Close
            </Button>
            {selectedGroup && selectedGroup.currentSize < selectedGroup.maxSize && (
              <Button onClick={() => {
                setShowGroupDetailsDialog(false)
                handleJoinRequest(selectedGroup)
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Request to Join
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Section */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Need Help Finding a Group?</p>
              <p className="text-xs text-muted-foreground">
                Contact your department head for assistance. You can browse available groups and send requests to join.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Add missing Send import
import { Send } from "lucide-react"