"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  User,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Crown,
  AlertCircle,
  Info,
  FileText,
  Loader2,
  Target,
  Lightbulb,
  Send,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"
import { useQuery } from "@tanstack/react-query"
import { getStudentProfiles, type StudentProfileListItem } from "@/lib/api/profile"
import { toast } from "sonner"
import { useCreateGroupLeaderRequest, useMyGroupLeaderRequest } from "@/lib/hooks/use-group-leader-requests"
import {
  useBrowseProjectGroups,
  useCancelProjectGroupJoinRequest,
  useCreateProjectGroupJoinRequest,
  useMyProjectGroup,
  useMyProjectGroupJoinRequests,
  useProjectGroupDetails,
} from "@/lib/hooks/use-project-groups"

type PresenceStatus = "online" | "away" | "offline"
type RequestStatus = "pending" | "approved" | "rejected" | "revoked" | "cancelled"
type JoinRequestStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "REVOKED" | "CANCELLED"

interface GroupMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  skills?: string[]
  joinedAt: string
}

interface GroupManager {
  id: string
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
  id: string
  name: string
  manager: GroupManager
  members: GroupMember[]
  currentSize: number
  maxSize: number
  isJoinable?: boolean
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
  id: string
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
  const [activeTab, setActiveTab] = useState("browse-groups")
  const [selectedGroup, setSelectedGroup] = useState<AvailableGroup | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showManagerRequestDialog, setShowManagerRequestDialog] = useState(false)
  const [showGroupDetailsDialog, setShowGroupDetailsDialog] = useState(false)
  const [cancelJoinRequestDialogOpen, setCancelJoinRequestDialogOpen] = useState(false)
  const [cancelJoinRequestTarget, setCancelJoinRequestTarget] = useState<{ id: string; groupName: string } | null>(null)
  const [requestReason, setRequestReason] = useState("")
  const [managerRequestReason, setManagerRequestReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const hasFetchedStudentProfileRef = useRef(false)
  const hasShownJoinRequestsErrorRef = useRef(false)

  const [browseGroupsPage, setBrowseGroupsPage] = useState(1)
  const browseGroupsLimit = 20

  const [myJoinRequestsPage, setMyJoinRequestsPage] = useState(1)
  const [myJoinRequestsLimit, setMyJoinRequestsLimit] = useState(20)
  const [myJoinRequestsStatus, setMyJoinRequestsStatus] = useState<JoinRequestStatusFilter>("ALL")

  const createGroupLeaderRequestMutation = useCreateGroupLeaderRequest()
  const createJoinRequestMutation = useCreateProjectGroupJoinRequest()
  const cancelJoinRequestMutation = useCancelProjectGroupJoinRequest()

  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const profileIsLoading = useAuthStore((s) => s.profileIsLoading)
  const profileError = useAuthStore((s) => s.profileError)
  const fetchStudentProfile = useAuthStore((s) => s.fetchStudentProfile)
  const groupLeaderMeQuery = useMyGroupLeaderRequest(Boolean(accessToken))

  const myProjectGroupQuery = useMyProjectGroup(activeTab === "my-group" && Boolean(accessToken))
  const myGroup = myProjectGroupQuery.data ?? null
  const myGroupErrorMessage = myProjectGroupQuery.isError
    ? String(myProjectGroupQuery.error?.message ?? "")
    : ""
  const myGroupNotFound =
    myProjectGroupQuery.isError && myGroupErrorMessage.toLowerCase().includes("group not found")

  const groupStatus = String(myGroup?.status ?? "")
  const groupRejected = groupStatus === "REJECTED"
  const groupSubmitted = groupStatus === "SUBMITTED"
  const groupApproved = groupStatus === "APPROVED"
  const myUserId = user?.id ? String(user.id) : null

  const myJoinRequestsApiStatus = myJoinRequestsStatus === "ALL" ? undefined : myJoinRequestsStatus

  const myJoinRequestsQuery = useMyProjectGroupJoinRequests({
    enabled: activeTab === "my-requests" && Boolean(accessToken),
    page: myJoinRequestsPage,
    limit: myJoinRequestsLimit,
    status: myJoinRequestsApiStatus,
  })

  const pendingJoinRequestsCountQuery = useMyProjectGroupJoinRequests({
    enabled: Boolean(accessToken),
    page: 1,
    limit: 1,
    status: "PENDING",
  })

  const [studentProfilesPage, setStudentProfilesPage] = useState(1)
  const studentProfilesLimit = 10

  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfileListItem | null>(null)
  const [studentProfileDetailsOpen, setStudentProfileDetailsOpen] = useState(false)

  const currentUser = {
    id: "STU045",
    name: "Alice Johnson",
    email: "alice.johnson@university.edu",
    department: "Computer Science",
    year: "3rd Year",
    avatar: "/avatars/alice.jpg",
    status: "online" as PresenceStatus,
  }

  const firstName = user?.firstName?.trim()
  const lastName = user?.lastName?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const profileName = fullName || user?.email || currentUser.name

  const profileEmail = user?.email ?? currentUser.email
  const profileDepartment = user?.departmentName ?? user?.department?.name ?? currentUser.department
  const profileTechStack = user?.techStack ?? user?.technologies ?? []

  const safeExternalUrl = (value?: string | null): string | null => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      const url = new URL(trimmed)
      if (url.protocol !== "http:" && url.protocol !== "https:") return null
      return url.toString()
    } catch {
      return null
    }
  }

  const githubUrl = safeExternalUrl(user?.githubUrl)
  const linkedinUrl = safeExternalUrl(user?.linkedinUrl)
  const portfolioUrl = safeExternalUrl(user?.portfolioUrl)

  const studentProfilesQuery = useQuery({
    queryKey: ["student-profiles", studentProfilesPage, studentProfilesLimit],
    queryFn: () => getStudentProfiles({ page: studentProfilesPage, limit: studentProfilesLimit }),
    enabled: activeTab === "student",
    staleTime: 60_000,
  })

  const openStudentDetails = (item: StudentProfileListItem) => {
    setSelectedStudentProfile(item)
    setStudentProfileDetailsOpen(true)
  }

  useEffect(() => {
    if (activeTab !== "student") return
    if (hasFetchedStudentProfileRef.current) return

    hasFetchedStudentProfileRef.current = true
    fetchStudentProfile().catch(() => {
      // Error is already handled in store state.
    })
  }, [activeTab, fetchStudentProfile])

  useEffect(() => {
    if (activeTab !== "browse-groups") return

    const handle = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setBrowseGroupsPage((p) => (p === 1 ? p : 1))
    }, 300)

    return () => {
      window.clearTimeout(handle)
    }
  }, [activeTab, searchQuery])

  useEffect(() => {
    if (activeTab !== "my-requests") return
    if (!myJoinRequestsQuery.isError) return
    if (hasShownJoinRequestsErrorRef.current) return

    hasShownJoinRequestsErrorRef.current = true
    const message = myJoinRequestsQuery.error?.message ?? "Failed to load join requests"
    const normalized = message.toLowerCase()

    if (normalized.includes("invalid status")) {
      toast.error("Invalid status filter")
      return
    }

    if (normalized.includes("not assigned") && normalized.includes("department")) {
      toast.error("You are not assigned to a department.")
      return
    }

    toast.error(message)
  }, [activeTab, myJoinRequestsQuery.isError, myJoinRequestsQuery.error])

  const clampMyJoinRequestsPage = (value: number) => {
    const normalized = Number.isFinite(value) ? Math.trunc(value) : 1
    const minClamped = Math.max(1, normalized)

    const maxPages = myJoinRequestsQuery.data?.pagination?.pages
    if (typeof maxPages === "number" && Number.isFinite(maxPages) && maxPages > 0) {
      return Math.min(minClamped, maxPages)
    }

    return minClamped
  }

  const commitMyJoinRequestsPageFromInput = (rawValue: string) => {
    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed)) return
    setMyJoinRequestsPage(clampMyJoinRequestsPage(parsed))
  }

  const myJoinRequestsStatusLabel = (status: JoinRequestStatusFilter) => {
    if (status === "ALL") return "All"
    const normalized = status.toLowerCase()
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  const selectMyJoinRequestsStatus = (next: JoinRequestStatusFilter) => {
    setMyJoinRequestsStatus(next)
    setMyJoinRequestsPage(1)
    hasShownJoinRequestsErrorRef.current = false
  }

  const selectMyJoinRequestsLimit = (next: number) => {
    setMyJoinRequestsLimit(next)
    setMyJoinRequestsPage(1)
    hasShownJoinRequestsErrorRef.current = false
  }

  const browseGroupsQuery = useBrowseProjectGroups({
    enabled: activeTab === "browse-groups" && Boolean(accessToken),
    page: browseGroupsPage,
    limit: browseGroupsLimit,
    search: debouncedSearchQuery,
  })

  const clampBrowseGroupsPage = (value: number) => {
    const normalized = Number.isFinite(value) ? Math.trunc(value) : 1
    const minClamped = Math.max(1, normalized)

    const maxPages = browseGroupsQuery.data?.pagination?.pages
    if (typeof maxPages === "number" && Number.isFinite(maxPages) && maxPages > 0) {
      return Math.min(minClamped, maxPages)
    }

    return minClamped
  }

  const commitBrowseGroupsPageFromInput = (rawValue: string) => {
    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed)) return
    setBrowseGroupsPage(clampBrowseGroupsPage(parsed))
  }

  const availableGroups: AvailableGroup[] = (browseGroupsQuery.data?.items ?? []).map((item) => {
    const leaderName = `${item.leader?.firstName ?? ""} ${item.leader?.lastName ?? ""}`.trim()

    return {
      id: item.id,
      name: item.name,
      manager: {
        id: item.leader?.id ?? "",
        name: leaderName || "Group Leader",
        email: "",
        avatar: item.leader?.avatarUrl ?? "",
        status: "offline",
      },
      members: [],
      currentSize: item.memberCount,
      maxSize: item.maxGroupSize,
      isJoinable: item.isJoinable,
      department: profileDepartment,
      objectives: item.objectives ? [item.objectives] : [],
      technologies: Array.isArray(item.technologies) ? item.technologies : [],
      meetings: [],
    }
  })

  const myRequests: JoinRequest[] = (myJoinRequestsQuery.data?.items ?? []).map((item) => {
    const rawStatus = String(item.status ?? "").toUpperCase()

    const normalizedStatus: RequestStatus =
      rawStatus === "APPROVED"
        ? "approved"
        : rawStatus === "REJECTED"
          ? "rejected"
          : rawStatus === "REVOKED"
            ? "revoked"
            : rawStatus === "CANCELLED"
              ? "cancelled"
              : "pending"

    const leaderName = `${item.group?.leader?.firstName ?? ""} ${item.group?.leader?.lastName ?? ""}`.trim()

    return {
      id: item.id,
      groupName: item.group?.name ?? "",
      managerName: leaderName || "Group Leader",
      status: normalizedStatus,
      requestedAt: item.createdAt,
      respondedAt: item.decidedAt ?? undefined,
      reason: item.message ?? "",
      rejectionReason: item.rejectionReason ?? undefined,
    }
  })

  const managerRequests: ManagerRequest[] = (() => {
    const status = groupLeaderMeQuery.data?.status
    if (!status) return []

    const normalizedStatus: RequestStatus =
      String(status).toUpperCase() === "APPROVED"
        ? "approved"
        : String(status).toUpperCase() === "REJECTED"
          ? "rejected"
          : "pending"

    const createdAt = "createdAt" in (groupLeaderMeQuery.data ?? {})
      ? (groupLeaderMeQuery.data as { createdAt: string }).createdAt
      : new Date().toISOString()

    const message = "message" in (groupLeaderMeQuery.data ?? {})
      ? (groupLeaderMeQuery.data as { message: string | null }).message
      : null

    return [
      {
        id: 1,
        status: normalizedStatus,
        requestedAt: createdAt,
        reason: message ?? "Applied to become a group leader",
      },
    ]
  })()

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
    if (group.currentSize >= group.maxSize) {
      toast.message("This group is full.")
      return
    }

    if (group.isJoinable === false) {
      toast.message("This group is not accepting join requests.")
      return
    }

    setSelectedGroup(group)
    setShowRequestDialog(true)
  }

  const handleViewDetails = (group: AvailableGroup) => {
    setSelectedGroup(group)
    setSelectedGroupId(group.id)
    setShowGroupDetailsDialog(true)
  }

  const groupDetailsQuery = useProjectGroupDetails({
    enabled: showGroupDetailsDialog && activeTab === "browse-groups" && Boolean(accessToken),
    groupId: selectedGroupId,
  })

  const effectiveSelectedGroup: AvailableGroup | null = (() => {
    if (!groupDetailsQuery.data) return selectedGroup

    const details = groupDetailsQuery.data
    const leaderName = `${details.leader?.firstName ?? ""} ${details.leader?.lastName ?? ""}`.trim()

    return {
      id: details.id,
      name: details.name,
      manager: {
        id: details.leader?.id ?? "",
        name: leaderName || "Group Leader",
        email: details.leader?.email ?? "",
        avatar: details.leader?.avatarUrl ?? "",
        status: "offline",
      },
      members: (details.members ?? []).map((member) => {
        const fullName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()
        return {
          id: member.id,
          name: fullName || member.email || "Member",
          email: member.email,
          role: "Member",
          avatar: member.avatarUrl ?? undefined,
          joinedAt: member.joinedAt,
        }
      }),
      currentSize: details.memberCount,
      maxSize: details.maxGroupSize,
      isJoinable: details.isJoinable,
      department: profileDepartment,
      objectives: details.objectives ? [details.objectives] : [],
      technologies: Array.isArray(details.technologies) ? details.technologies : [],
      meetings: [],
    }
  })()

  const handleManagerRequest = () => {
    const reason = managerRequestReason.trim()
    if (!reason || createGroupLeaderRequestMutation.isPending) return

    if (groupLeaderMeQuery.data?.status) {
      toast.message("You already have an application on file.")
      return
    }

    createGroupLeaderRequestMutation
      .mutateAsync({ reason })
      .then(() => {
        setShowManagerRequestDialog(false)
        setManagerRequestReason("")
        toast.success("Group leader request submitted")
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Request failed"
        // Common backend errors to present clearly.
        if (message.toLowerCase().includes("already") && message.toLowerCase().includes("appl")) {
          toast.message("You have already applied to become a group leader.")
          return
        }

        if (message.toLowerCase().includes("not assigned") && message.toLowerCase().includes("department")) {
          toast.error("You must be assigned to a department before applying.")
          return
        }

        if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("forbidden")) {
          toast.error("You are not authorized to apply. Please login again.")
          return
        }

        toast.error(message)
      })
  }

  const handleSubmitJoinRequest = () => {
    const groupId = selectedGroup?.id
    if (!groupId) {
      toast.error("Select a group first.")
      return
    }

    if (createJoinRequestMutation.isPending) return

    const message = requestReason.trim()
    if (!message) {
      toast.message("Please enter a message.")
      return
    }
    if (message.length > 1000) {
      toast.error("Message must be 1000 characters or less.")
      return
    }

    createJoinRequestMutation
      .mutateAsync({
        groupId,
        dto: { message },
      })
      .then((result) => {
        setShowRequestDialog(false)
        setRequestReason("")

        if (result.message) {
          toast.message(result.message)
        } else {
          toast.success("Join request sent")
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Request failed"
        const normalized = message.toLowerCase()

        if (normalized.includes("already joined") && normalized.includes("group")) {
          toast.message("You already belong to a project group.")
          return
        }

        if (normalized.includes("already") && normalized.includes("group leader")) {
          toast.message("Group leaders cannot send join requests.")
          return
        }

        if (normalized.includes("group not found")) {
          toast.error("Group not found.")
          return
        }

        if (normalized.includes("not accepting") || (normalized.includes("group") && normalized.includes("draft"))) {
          toast.message("This group is not accepting join requests.")
          return
        }

        if (normalized.includes("group is full") || normalized.includes("full")) {
          toast.message("This group is full.")
          return
        }

        if (normalized.includes("unauthorized") || normalized.includes("forbidden")) {
          toast.error("You are not authorized to send join requests. Please login again.")
          return
        }

        toast.error(message)
      })
  }

  const handleCancelJoinRequest = (requestId: string, groupName: string) => {
    if (!requestId.trim()) return
    if (cancelJoinRequestMutation.isPending) return

    setCancelJoinRequestTarget({ id: requestId, groupName })
    setCancelJoinRequestDialogOpen(true)
  }

  const confirmCancelJoinRequest = () => {
    const requestId = cancelJoinRequestTarget?.id
    if (!requestId) return
    if (cancelJoinRequestMutation.isPending) return

    cancelJoinRequestMutation
      .mutateAsync({ requestId })
      .then(() => {
        setCancelJoinRequestDialogOpen(false)
        setCancelJoinRequestTarget(null)
        toast.success("Join request cancelled")
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Request failed"
        const normalized = message.toLowerCase()

        if (normalized.includes("not found")) {
          toast.error("Join request not found")
          return
        }

        if (normalized.includes("approved")) {
          toast.message("This join request is already approved.")
          return
        }

        if (normalized.includes("rejected")) {
          toast.message("This join request is already rejected.")
          return
        }

        if (normalized.includes("revoked")) {
          toast.message("This join request is already revoked.")
          return
        }

        if (normalized.includes("cancelled") || normalized.includes("canceled")) {
          toast.message("This join request is already cancelled.")
          return
        }

        toast.error(message)
      })
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
            Find and join project groups in {profileDepartment || currentUser.department}
          </p>
        </div>

        <Card className="bg-primary/5 border-primary/20 w-full md:w-auto">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={user?.avatarUrl ?? currentUser.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(profileName)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(currentUser.status)} ring-2 ring-white`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    Student
                  </Badge>
                  <span>{currentUser.year}</span>
                  <span>•</span>
                  <span>{profileDepartment || currentUser.department}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Showing groups from <span className="font-semibold">{profileDepartment || currentUser.department}</span> department only.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        className="space-y-6"
        onValueChange={(value) => {
          setActiveTab(value)
          if (value === "browse-groups") {
            setBrowseGroupsPage(1)
          }
          if (value === "my-requests") {
            setMyJoinRequestsPage(1)
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="my-group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">My Group</span>
          </TabsTrigger>
          <TabsTrigger value="browse-groups" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Browse Groups</span>
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">My Requests</span>
            {(pendingJoinRequestsCountQuery.data?.pagination?.total ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0">
                {pendingJoinRequestsCountQuery.data?.pagination?.total ?? 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="become-manager" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Become Manager</span>
          </TabsTrigger>
          <TabsTrigger value="student" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Student</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-group" className="space-y-6">
          {myProjectGroupQuery.isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your group…
                </div>
              </CardContent>
            </Card>
          ) : myProjectGroupQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to load your group</AlertTitle>
              <AlertDescription>
                {myGroupNotFound
                  ? "You are not in a project group yet."
                  : myGroupErrorMessage || "Request failed"}
              </AlertDescription>
            </Alert>
          ) : myGroup ? (
            <>
              {groupApproved ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Group Approved</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your group is officially registered.
                  </AlertDescription>
                </Alert>
              ) : groupSubmitted ? (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Submitted for Review</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Your group is pending review.
                  </AlertDescription>
                </Alert>
              ) : groupRejected ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Rejected</AlertTitle>
                  <AlertDescription>
                    {myGroup.rejectionReason
                      ? `Reason: ${myGroup.rejectionReason}`
                      : "Your group was rejected."}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{myGroup.name}</CardTitle>
                      <CardDescription>
                        You are a group member.
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{String(myGroup.status ?? "DRAFT")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Objectives</p>
                    <p className="text-sm text-muted-foreground">{myGroup.objectives}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {(myGroup.technologies ?? []).map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Members</p>
                      <p className="text-xs text-muted-foreground">
                        Pending invitations: {myGroup.pendingInvitationsCount}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={myGroup.leader.avatarUrl ?? undefined} />
                            <AvatarFallback>
                              {getInitials(
                                `${myGroup.leader.firstName ?? ""} ${myGroup.leader.lastName ?? ""}`.trim() ||
                                  myGroup.leader.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {`${myGroup.leader.firstName ?? ""} ${myGroup.leader.lastName ?? ""}`.trim() ||
                                  myGroup.leader.email}
                              </p>
                              {myUserId && myGroup.leader.id === myUserId ? (
                                <Badge variant="outline">You</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{myGroup.leader.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Leader</Badge>
                      </div>

                      {(myGroup.members ?? []).map((member) => {
                        const name =
                          `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email

                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={member.user.avatarUrl ?? undefined} />
                                <AvatarFallback>{getInitials(name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">{name}</p>
                                  {myUserId && member.user.id === myUserId ? (
                                    <Badge variant="outline">You</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline">Member</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {myGroup.reviewedBy ? (
                    <div className="text-xs text-muted-foreground">
                      Reviewed by: {myGroup.reviewedBy.firstName} {myGroup.reviewedBy.lastName}
                      {myGroup.reviewedAt ? ` • ${new Date(myGroup.reviewedAt).toLocaleString()}` : ""}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">You are not in a project group yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

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
                    
                    <div className="flex gap-2 pt-2">
                      {group.currentSize < group.maxSize ? (
                        <Button className="flex-1" disabled={group.isJoinable === false} onClick={() => handleJoinRequest(group)}>
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

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={browseGroupsPage <= 1 || browseGroupsQuery.isFetching}
              onClick={() => setBrowseGroupsPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                Showing{" "}
                <span className="font-medium text-foreground">{browseGroupsQuery.data?.items?.length ?? 0}</span>
                {browseGroupsQuery.data?.pagination?.total != null
                  ? (
                      <>
                        {" "}
                        of <span className="font-medium text-foreground">{browseGroupsQuery.data.pagination.total}</span>
                      </>
                    )
                  : null}
                {" "}
                groups
                <span className="mx-2">•</span>
              </span>
              Page <span className="font-medium text-foreground">{browseGroupsPage}</span>
              {browseGroupsQuery.data?.pagination?.pages
                ? (
                    <>
                      {" "}
                      of <span className="font-medium text-foreground">{browseGroupsQuery.data.pagination.pages}</span>
                    </>
                  )
                : null}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Go to</span>
              <Input
                key={browseGroupsPage}
                type="number"
                inputMode="numeric"
                min={1}
                max={browseGroupsQuery.data?.pagination?.pages}
                defaultValue={browseGroupsPage}
                className="h-8 w-20"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return
                  commitBrowseGroupsPageFromInput(e.currentTarget.value)
                }}
                onBlur={(e) => {
                  commitBrowseGroupsPageFromInput(e.currentTarget.value)
                }}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={(() => {
                if (browseGroupsQuery.isFetching) return true
                const pages = browseGroupsQuery.data?.pagination?.pages
                if (typeof pages === "number" && Number.isFinite(pages)) {
                  return browseGroupsPage >= pages
                }
                return (browseGroupsQuery.data?.items?.length ?? 0) < browseGroupsLimit
              })()}
              onClick={() => setBrowseGroupsPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Join Requests</CardTitle>
              <CardDescription>Track the status of your group join requests</CardDescription>
            </CardHeader>
            <CardContent>
              {myJoinRequestsQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="mt-2">Loading requests…</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Status: {myJoinRequestsStatusLabel(myJoinRequestsStatus)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsStatus("ALL")}>All</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsStatus("PENDING")}>Pending</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsStatus("APPROVED")}>Approved</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsStatus("REJECTED")}>Rejected</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsStatus("REVOKED")}>Revoked</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsStatus("CANCELLED")}>Cancelled</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Limit: {myJoinRequestsLimit}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsLimit(5)}>5</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsLimit(10)}>10</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyJoinRequestsLimit(20)}>20</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={myJoinRequestsPage <= 1 || myJoinRequestsQuery.isFetching}
                        onClick={() => setMyJoinRequestsPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>

                      <div className="text-sm text-muted-foreground">
                        <span className="hidden sm:inline">
                          Page <span className="font-medium text-foreground">{myJoinRequestsPage}</span> of{" "}
                          <span className="font-medium text-foreground">{myJoinRequestsQuery.data?.pagination?.pages ?? 1}</span>
                          {myJoinRequestsQuery.data?.pagination?.total != null ? (
                            <>
                              {" "}• <span className="font-medium text-foreground">{myJoinRequestsQuery.data.pagination.total}</span> total
                            </>
                          ) : null}
                        </span>
                      </div>

                      <div className="hidden md:flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Go to</span>
                        <Input
                          key={myJoinRequestsPage}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={myJoinRequestsQuery.data?.pagination?.pages}
                          defaultValue={myJoinRequestsPage}
                          className="h-8 w-20"
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return
                            commitMyJoinRequestsPageFromInput(e.currentTarget.value)
                          }}
                          onBlur={(e) => {
                            commitMyJoinRequestsPageFromInput(e.currentTarget.value)
                          }}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(() => {
                          if (myJoinRequestsQuery.isFetching) return true
                          const pages = myJoinRequestsQuery.data?.pagination?.pages
                          if (typeof pages === "number" && Number.isFinite(pages)) {
                            return myJoinRequestsPage >= pages
                          }
                          return (myJoinRequestsQuery.data?.items?.length ?? 0) < myJoinRequestsLimit
                        })()}
                        onClick={() => setMyJoinRequestsPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>

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
                                  {(request.status === "revoked" || request.status === "cancelled") && (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
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

                              {request.status === "pending" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="md:ml-2"
                                  disabled={
                                    cancelJoinRequestMutation.isPending &&
                                    cancelJoinRequestMutation.variables?.requestId === request.id
                                  }
                                  onClick={() => handleCancelJoinRequest(request.id, request.groupName)}
                                >
                                  {cancelJoinRequestMutation.isPending &&
                                  cancelJoinRequestMutation.variables?.requestId === request.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              ) : null}
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manager-request-reason">Why do you want to become a group Leader?</Label>
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
                  disabled={!managerRequestReason.trim() || Boolean(groupLeaderMeQuery.data?.status) || createGroupLeaderRequestMutation.isPending}
                  onClick={() => setShowManagerRequestDialog(true)}
                >
                  {createGroupLeaderRequestMutation.isPending ? (
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

                <p className="text-xs text-muted-foreground">
                  {groupLeaderMeQuery.isLoading
                    ? "Checking your application status…"
                    : !groupLeaderMeQuery.data?.status
                      ? "You haven’t applied to become a group leader yet."
                      : String(groupLeaderMeQuery.data.status).toUpperCase() === "PENDING"
                        ? "Your application is pending review."
                        : String(groupLeaderMeQuery.data.status).toUpperCase() === "APPROVED"
                          ? "You’re approved as a group leader."
                          : String(groupLeaderMeQuery.data.status).toUpperCase() === "REJECTED"
                            ? "Your application was rejected. You can review the reason below."
                            : `Application status: ${String(groupLeaderMeQuery.data.status)}`}
                </p>
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
                        {request.status === "rejected" && "rejectionReason" in (groupLeaderMeQuery.data ?? {}) && (groupLeaderMeQuery.data as { rejectionReason: string | null }).rejectionReason ? (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Rejection reason</AlertTitle>
                            <AlertDescription>
                              {(groupLeaderMeQuery.data as { rejectionReason: string | null }).rejectionReason}
                            </AlertDescription>
                          </Alert>
                        ) : null}
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

        {/* Student Tab */}
        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                  View your student profile details used across teams and requests.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={profileIsLoading}
                onClick={() => fetchStudentProfile().catch(() => {})}
              >
                {profileIsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {profileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Could not load profile</AlertTitle>
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={user?.avatarUrl ?? undefined} />
                    <AvatarFallback>{getInitials(profileName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold truncate">{profileName}</p>
                    <p className="text-sm text-muted-foreground truncate">{profileEmail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Student</Badge>
                      {profileDepartment && <Badge variant="secondary">{profileDepartment}</Badge>}
                    </div>
                  </div>
                </div>

                {profileIsLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading profile…
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tech stack</h3>
                {profileTechStack.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileTechStack.slice(0, 12).map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tech stack added yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Bio</h3>
                {user?.bio?.trim() ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{user.bio.trim()}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No bio added yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Links</h3>
                {githubUrl || linkedinUrl || portfolioUrl ? (
                  <div className="flex flex-wrap gap-2">
                    {githubUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={githubUrl} target="_blank" rel="noreferrer">
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {linkedinUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={linkedinUrl} target="_blank" rel="noreferrer">
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {portfolioUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={portfolioUrl} target="_blank" rel="noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Portfolio
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No links added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Student Profiles</CardTitle>
                <CardDescription>Browse student profiles (paginated).</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={studentProfilesQuery.isFetching}
                  onClick={() => studentProfilesQuery.refetch()}
                >
                  {studentProfilesQuery.isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing
                    </>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {studentProfilesQuery.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Could not load students</AlertTitle>
                  <AlertDescription>
                    {studentProfilesQuery.error instanceof Error
                      ? studentProfilesQuery.error.message
                      : "Failed to load student profiles."}
                  </AlertDescription>
                </Alert>
              )}

              {studentProfilesQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading students…
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[320px]">
                    <div className="space-y-3 pr-3">
                      {(studentProfilesQuery.data?.items ?? []).length > 0 ? (
                        (studentProfilesQuery.data?.items ?? []).map((item) => {
                          const fullName = [item.user.firstName, item.user.lastName].filter(Boolean).join(" ")
                          const displayName = fullName || item.user.email || "Student"
                          const techStack = item.profile.techStack ?? []
                          return (
                            <div key={item.user.id ?? displayName} className="rounded-lg border p-3">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={item.user.avatarUrl ?? undefined} />
                                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold truncate">{displayName}</p>
                                      {item.user.email && (
                                        <p className="text-xs text-muted-foreground truncate">{item.user.email}</p>
                                      )}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => openStudentDetails(item)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View details
                                    </Button>
                                  </div>
                                  {item.profile.bio && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      {item.profile.bio}
                                    </p>
                                  )}

                                  {techStack.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {techStack.slice(0, 8).map((tech) => (
                                        <Badge key={tech} variant="secondary">
                                          {tech}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-10">
                          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No student profiles found.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={studentProfilesPage <= 1 || studentProfilesQuery.isFetching}
                      onClick={() => setStudentProfilesPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      Page <span className="font-medium text-foreground">{studentProfilesPage}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        studentProfilesQuery.isFetching ||
                        (studentProfilesQuery.data?.items?.length ?? 0) < studentProfilesLimit
                      }
                      onClick={() => setStudentProfilesPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Profile Details Dialog */}
      <Dialog
        open={studentProfileDetailsOpen}
        onOpenChange={(open) => {
          setStudentProfileDetailsOpen(open)
          if (!open) setSelectedStudentProfile(null)
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
            <DialogDescription>Profile details and tech stack.</DialogDescription>
          </DialogHeader>

          {selectedStudentProfile ? (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedStudentProfile.user.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {getInitials(
                      [selectedStudentProfile.user.firstName, selectedStudentProfile.user.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                        selectedStudentProfile.user.email ||
                        "Student"
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold truncate">
                    {[selectedStudentProfile.user.firstName, selectedStudentProfile.user.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                      "Student"}
                  </p>
                  {selectedStudentProfile.user.email && (
                    <p className="text-sm text-muted-foreground truncate">{selectedStudentProfile.user.email}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Student</Badge>
                    {selectedStudentProfile.profile.updatedAt && (
                      <Badge variant="secondary">
                        Updated {new Date(selectedStudentProfile.profile.updatedAt).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Bio</p>
                {selectedStudentProfile.profile.bio ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {selectedStudentProfile.profile.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No bio provided.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Tech stack</p>
                {selectedStudentProfile.profile.techStack.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudentProfile.profile.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tech stack provided.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Links</p>
                {(() => {
                  const gh = safeExternalUrl(selectedStudentProfile.profile.githubUrl)
                  const li = safeExternalUrl(selectedStudentProfile.profile.linkedinUrl)
                  const pf = safeExternalUrl(selectedStudentProfile.profile.portfolioUrl)

                  if (!gh && !li && !pf) {
                    return <p className="text-sm text-muted-foreground">No links provided.</p>
                  }

                  return (
                    <div className="flex flex-wrap gap-2">
                      {gh && (
                        <Button asChild variant="outline" size="sm">
                          <a href={gh} target="_blank" rel="noreferrer">
                            <Github className="h-4 w-4 mr-2" />
                            GitHub
                          </a>
                        </Button>
                      )}
                      {li && (
                        <Button asChild variant="outline" size="sm">
                          <a href={li} target="_blank" rel="noreferrer">
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                      {pf && (
                        <Button asChild variant="outline" size="sm">
                          <a href={pf} target="_blank" rel="noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Portfolio
                          </a>
                        </Button>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => setShowRequestDialog(false)} disabled={createJoinRequestMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmitJoinRequest} disabled={!requestReason.trim() || createJoinRequestMutation.isPending}>
              {createJoinRequestMutation.isPending ? (
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

      {/* Cancel Join Request Confirmation */}
      <Dialog
        open={cancelJoinRequestDialogOpen}
        onOpenChange={(open) => {
          if (cancelJoinRequestMutation.isPending) return
          setCancelJoinRequestDialogOpen(open)
          if (!open) {
            setCancelJoinRequestTarget(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel join request?</DialogTitle>
            <DialogDescription>
              {cancelJoinRequestTarget?.groupName
                ? `This will cancel your pending join request to ${cancelJoinRequestTarget.groupName}.`
                : "This will cancel your pending join request."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelJoinRequestDialogOpen(false)}
              disabled={cancelJoinRequestMutation.isPending}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelJoinRequest}
              disabled={cancelJoinRequestMutation.isPending}
            >
              {cancelJoinRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, cancel"
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
            <Button
              variant="outline"
              onClick={() => setShowManagerRequestDialog(false)}
              disabled={createGroupLeaderRequestMutation.isPending}
            >
              Go Back
            </Button>
            <Button onClick={handleManagerRequest} disabled={createGroupLeaderRequestMutation.isPending}>
              {createGroupLeaderRequestMutation.isPending ? (
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
      <Dialog
        open={showGroupDetailsDialog}
        onOpenChange={(open) => {
          setShowGroupDetailsDialog(open)
          if (!open) {
            setSelectedGroupId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{effectiveSelectedGroup?.name}</DialogTitle>
            <DialogDescription>
              {effectiveSelectedGroup?.department}
            </DialogDescription>
          </DialogHeader>
          
          {effectiveSelectedGroup && (
            <div className="space-y-6 py-4">
              {/* Manager Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={effectiveSelectedGroup.manager.avatar} />
                    <AvatarFallback>{getInitials(effectiveSelectedGroup.manager.name)}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${getStatusColor(effectiveSelectedGroup.manager.status)} ring-2 ring-white`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{effectiveSelectedGroup.manager.name}</h3>
                  <p className="text-sm text-muted-foreground">Group Manager</p>
                  <p className="text-sm mt-2">{effectiveSelectedGroup.manager.bio || "No bio available."}</p>
                  
                  {/* Expertise Tags */}
                  {effectiveSelectedGroup.manager.expertise && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {effectiveSelectedGroup.manager.expertise.map((item, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-50">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="flex gap-2 mt-3">
                    {effectiveSelectedGroup.manager.socialLinks?.github && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={effectiveSelectedGroup.manager.socialLinks.github} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {effectiveSelectedGroup.manager.socialLinks?.linkedin && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={effectiveSelectedGroup.manager.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {effectiveSelectedGroup.manager.socialLinks?.twitter && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={effectiveSelectedGroup.manager.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {effectiveSelectedGroup.manager.socialLinks?.website && (
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <a href={effectiveSelectedGroup.manager.socialLinks.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Objectives */}
              {effectiveSelectedGroup.objectives && effectiveSelectedGroup.objectives.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Objectives
                  </h4>
                  <ul className="space-y-2">
                    {effectiveSelectedGroup.objectives.map((obj, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies */}
              {effectiveSelectedGroup.technologies && effectiveSelectedGroup.technologies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {effectiveSelectedGroup.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Team Members ({effectiveSelectedGroup.currentSize}/{effectiveSelectedGroup.maxSize})
                </h4>
                <div className="space-y-2">
                  {effectiveSelectedGroup.members.map((member) => (
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
            {effectiveSelectedGroup && effectiveSelectedGroup.currentSize < effectiveSelectedGroup.maxSize && (
              <Button onClick={() => {
                setShowGroupDetailsDialog(false)
                handleJoinRequest(effectiveSelectedGroup)
              }} disabled={effectiveSelectedGroup.isJoinable === false}>
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