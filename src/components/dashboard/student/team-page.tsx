"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Eye,
  Info,
  Send,
  AlertCircle,
  PlusCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StudentTeamMemberPage } from "@/components/dashboard/student/team-student-member-page"

type CreateGroupFormData = {
  name: string
  objective: string
  technology: string
}

function CreateGroupForm({
  defaultValues,
  onSubmit,
  onSuccess,
}: {
  defaultValues?: CreateGroupFormData
  onSubmit: (data: CreateGroupFormData) => void
  onSuccess?: () => void
}) {
  const [name, setName] = useState(defaultValues?.name ?? "")
  const [objective, setObjective] = useState(defaultValues?.objective ?? "")
  const [technology, setTechnology] = useState(defaultValues?.technology ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !objective.trim() || !technology.trim()) return
    onSubmit({ name: name.trim(), objective: objective.trim(), technology: technology.trim() })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">Group Name <span className="text-destructive">*</span></Label>
        <Input
          id="group-name"
          placeholder="e.g. Tech Innovators"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-objective">Group Objective <span className="text-destructive">*</span></Label>
        <Textarea
          id="group-objective"
          placeholder="Describe the goals and objectives of your group project..."
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={4}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-technology">Technology We Use <span className="text-destructive">*</span></Label>
        <Input
          id="group-technology"
          placeholder="e.g. React, Node.js, PostgreSQL"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" />
        Create Group
      </Button>
    </form>
  )
}

export function StudentTeamPage() {
  const [groupSubmitted, setGroupSubmitted] = useState(false)
  const [groupApproved] = useState(false)
  const [groupInfo, setGroupInfo] = useState<CreateGroupFormData | null>(null)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)

  // Mock data - would come from API in production
  const currentUser = {
    name: 'John Doe',
    id: 'STU001',
    role: 'Group Manager',
    department: 'Computer Science',
    email: 'john.doe@university.edu',
    managerApprovalStatus: 'approved' as 'approved' | 'pending' | 'rejected' | 'not_requested',
  }

  const isApprovedGroupManager = currentUser.managerApprovalStatus === 'approved'

  // Students who are not approved as group managers should see the normal student team page.
  if (!isApprovedGroupManager) {
    return <StudentTeamMemberPage />
  }

  const groupMembers = [
    { id: 1, name: 'John Doe', role: 'Group Manager', status: 'approved', email: 'john@university.edu', joinDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', role: 'Member', status: 'approved', email: 'jane@university.edu', joinDate: '2024-01-16' },
    { id: 3, name: 'Mike Johnson', role: 'Member', status: 'pending', email: 'mike@university.edu', joinDate: '2024-01-17' },
    { id: 4, name: 'Sarah Wilson', role: 'Member', status: 'approved', email: 'sarah@university.edu', joinDate: '2024-01-15' },
  ]

  const pendingRequests = [
    { id: 5, name: 'Alex Brown', department: 'Computer Science', requestedAt: '2024-01-18' },
    { id: 6, name: 'Emily Davis', department: 'Computer Science', requestedAt: '2024-01-18' },
  ]

  const availableStudents = [
    { id: 7, name: 'Chris Lee', department: 'Computer Science', email: 'chris@university.edu' },
    { id: 8, name: 'Pat Taylor', department: 'Computer Science', email: 'pat@university.edu' },
    { id: 9, name: 'Jordan Wong', department: 'Computer Science', email: 'jordan@university.edu' },
  ]

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return null
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const isGroupManager = currentUser.role === 'Group Manager'
  const canEditGroup = !groupApproved && !groupSubmitted && isGroupManager
  const groupSize = groupMembers.length
  const minGroupSize = 3
  const maxGroupSize = 7
  const groupProgress = (groupSize / maxGroupSize) * 100

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Student Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your project groups and team formations
          </p>
        </div>
        
        {/* User Profile Card */}
        <Card className="bg-primary/5 border-primary/20 w-full md:w-auto">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {currentUser.role}
                  </Badge>
                  <span>{currentUser.department}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Messages */}
      {groupApproved && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Group Formation Approved</AlertTitle>
          <AlertDescription className="text-green-700">
            Your group has been officially registered. No further changes can be made without Project Coordinator approval.
          </AlertDescription>
        </Alert>
      )}

      {groupSubmitted && !groupApproved && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Group Submitted for Review</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your group formation is pending approval from the Project Coordinator. You&apos;ll be notified once reviewed.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="my-group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">My Group</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Available</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Group Formation Process Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Group Formation Process
              </CardTitle>
              <CardDescription>
                Understanding the student team formation workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Step 1: Create Group</h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-10">
                    Group Manager creates a group within the department (3-7 members required)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Step 2: Build Team</h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-10">
                    Invite students or approve join requests to build your group
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Send className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Step 3: Submit for Approval</h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-10">
                    Group Manager submits the formed group to Project Coordinator
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Step 4: Official Registration</h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-10">
                    Project Coordinator approves the group for official registration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles and Responsibilities */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  Group Manager Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>Create and manage the project group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>Invite students to join the group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>Approve or reject join requests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>Remove members before finalizing group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>Submit group for coordinator approval</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Member Participation Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <span className="text-green-600 text-xs">1</span>
                    </div>
                    <div>
                      <span className="font-medium">Request to Join:</span>
                      <p className="text-muted-foreground">Browse available groups and submit join requests</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <span className="text-green-600 text-xs">2</span>
                    </div>
                    <div>
                      <span className="font-medium">Accept Invitations:</span>
                      <p className="text-muted-foreground">Receive and respond to group manager invitations</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{groupMembers.length}</div>
                <p className="text-xs text-muted-foreground">Current Team Size</p>
                <Progress value={groupProgress} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{pendingRequests.length}</div>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{availableStudents.length}</div>
                <p className="text-xs text-muted-foreground">Available Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{minGroupSize}-{maxGroupSize}</div>
                <p className="text-xs text-muted-foreground">Required Group Size</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Group Tab */}
        <TabsContent value="my-group" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>My Group Members</CardTitle>
                <CardDescription>
                  {groupSize} of {maxGroupSize} members • Minimum {minGroupSize} required
                </CardDescription>
              </div>
              {canEditGroup && (
                <div className="flex gap-2 flex-wrap">
                  <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Group</DialogTitle>
                        <DialogDescription>
                          Set up your project group with required details
                        </DialogDescription>
                      </DialogHeader>
                      <CreateGroupForm
                        key={createGroupOpen ? "open" : "closed"}
                        defaultValues={groupInfo ?? undefined}
                        onSubmit={(data) => {
                          setGroupInfo(data)
                        }}
                        onSuccess={() => setCreateGroupOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Members
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Students</DialogTitle>
                        <DialogDescription>
                          Search and invite students to join your group
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Search Students</Label>
                          <Input placeholder="Search by name or email..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Invitation Message (Optional)</Label>
                          <Textarea placeholder="Add a personal message to your invitation..." />
                        </div>
                        <Button className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send Invitations
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {groupInfo && (
                <div className="mb-6 p-4 rounded-lg border bg-muted/30 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Group Details</p>
                  <p className="font-semibold">{groupInfo.name}</p>
                  <p className="text-sm text-muted-foreground">{groupInfo.objective}</p>
                  <p className="text-xs">
                    <span className="font-medium">Technology:</span> {groupInfo.technology}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {groupMembers.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{member.name}</p>
                          {member.role === 'Group Manager' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Manager
                            </Badge>
                          )}
                          {getStatusBadge(member.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(member.joinDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canEditGroup && member.role !== 'Group Manager' && (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            {canEditGroup && (
              <CardContent className="border-t pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <p className="text-sm font-medium">Group Status</p>
                    <p className="text-xs text-muted-foreground">
                      {groupSize >= minGroupSize ? '✓ Ready for submission' : `Need ${minGroupSize - groupSize} more members`}
                    </p>
                  </div>
                  <Button 
                    disabled={groupSize < minGroupSize || groupSize > maxGroupSize}
                    onClick={() => setGroupSubmitted(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Join Requests</CardTitle>
              <CardDescription>
                Students requesting to join your group
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(request.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-muted-foreground">{request.department}</p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {isGroupManager && !groupApproved && (
                        <div className="flex gap-2 self-end sm:self-center">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No pending requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Students Tab */}
        <TabsContent value="available" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Students</CardTitle>
              <CardDescription>
                Students who haven&apos;t joined any group yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableStudents.map((student) => (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.department}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    {isGroupManager && canEditGroup && (
                      <Button size="sm" className="self-end sm:self-center">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Need Help?</p>
              <p className="text-xs text-muted-foreground">
                Contact your Project Coordinator for assistance with group formation or if you need to make changes after approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}