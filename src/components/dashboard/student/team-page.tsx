"use client"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  User,
  UserPlus, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Eye,
  Info,
  Loader2,
  Send,
  AlertCircle,
  Github,
  Linkedin,
  Globe,
  PlusCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
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
import { StudentTeamMemberPage } from "@/components/dashboard/student/team-student-member-page"
import { useAuthStore } from "@/store/auth-store"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { getStudentProfiles, type StudentProfileListItem } from "@/lib/api/profile"
import { getStudentPublicProfile, type StudentPublicProfile } from "@/lib/api/profile"
import { useMyGroupLeaderRequest } from "@/lib/hooks/use-group-leader-requests"
import {
  projectGroupKeys,
  useAvailableStudents,
  useCreateProjectGroupInvitation,
  usePreviewProjectGroupInvitation,
  useCreateProjectGroup,
  useApproveMyGroupJoinRequest,
  useRejectMyGroupJoinRequest,
  useSubmitMyProjectGroup,
  useReopenMyProjectGroup,
  useMyGroupJoinRequests,
  useMyProjectGroup,
} from "@/lib/hooks/use-project-groups"
import { useDepartmentGroupSizeSettings } from "@/lib/hooks/use-department-group-size-settings"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api/errors"
import type {
  AvailableStudentListItem,
  MyProjectGroupJoinRequestStatus,
  ProjectGroupInvitationPreviewResult,
} from "@/types/project-groups"
import {
  createProjectGroupSchema,
  parseTechnologiesInput,
} from "@/validations/project-groups"

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
  onSubmit: (data: CreateGroupFormData) => Promise<boolean>
  onSuccess?: () => void
}) {
  const [name, setName] = useState(defaultValues?.name ?? "")
  const [objective, setObjective] = useState(defaultValues?.objective ?? "")
  const [technology, setTechnology] = useState(defaultValues?.technology ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!name.trim() || !objective.trim() || !technology.trim()) return
    setIsSubmitting(true)
    try {
      const didComplete = await onSubmit({
        name: name.trim(),
        objective: objective.trim(),
        technology: technology.trim(),
      })
      if (didComplete) {
        onSuccess?.()
      }
    } finally {
      setIsSubmitting(false)
    }
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Group
          </>
        )}
      </Button>
    </form>
  )
}

export function StudentTeamPage() {
  const [groupInfo, setGroupInfo] = useState<CreateGroupFormData | null>(null)
  const [groupExists, setGroupExists] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [createGroupDismissed, setCreateGroupDismissed] = useState(false)
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false)
  const [memberDetailsOpen, setMemberDetailsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<null | {
    id: string
    userId?: string
    name: string
    role: string
    status: string
    email: string
    joinDate: string
    avatarUrl?: string | null
  }>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [approveConfirmRequestId, setApproveConfirmRequestId] = useState<string | null>(null)
  const [approveConfirmStudentName, setApproveConfirmStudentName] = useState<string | null>(null)
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
  const [rejectConfirmRequestId, setRejectConfirmRequestId] = useState<string | null>(null)
  const [rejectConfirmStudentName, setRejectConfirmStudentName] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const createProjectGroupMutation = useCreateProjectGroup()
  const createInvitationMutation = useCreateProjectGroupInvitation()
  const previewInvitationMutation = usePreviewProjectGroupInvitation()
  const approveJoinRequestMutation = useApproveMyGroupJoinRequest()
  const rejectJoinRequestMutation = useRejectMyGroupJoinRequest()
  const submitMyProjectGroupMutation = useSubmitMyProjectGroup()
  const reopenMyProjectGroupMutation = useReopenMyProjectGroup()
  const queryClient = useQueryClient()

  const [studentProfilesPage, setStudentProfilesPage] = useState(1)
  const studentProfilesLimit = 10

  const [availableStudentsPage, setAvailableStudentsPage] = useState(1)
  const availableStudentsLimit = 20
  const [availableStudentsSearchInput, setAvailableStudentsSearchInput] = useState("")
  const [availableStudentsSearch, setAvailableStudentsSearch] = useState<string | undefined>(undefined)

  const [myGroupJoinRequestsPage, setMyGroupJoinRequestsPage] = useState(1)
  const [myGroupJoinRequestsLimit, setMyGroupJoinRequestsLimit] = useState(10)
  const [myGroupJoinRequestsStatus, setMyGroupJoinRequestsStatus] = useState<
    "ALL" | MyProjectGroupJoinRequestStatus
  >("PENDING")

  const [availableStudentDetailsOpen, setAvailableStudentDetailsOpen] = useState(false)
  const [selectedAvailableStudent, setSelectedAvailableStudent] = useState<AvailableStudentListItem | null>(null)
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null)

  const [invitationPreviewOpen, setInvitationPreviewOpen] = useState(false)
  const [invitationPreviewTab, setInvitationPreviewTab] = useState<"html" | "text">("html")
  const [previewingUserId, setPreviewingUserId] = useState<string | null>(null)
  const [previewInvitee, setPreviewInvitee] = useState<null | { id: string; name: string }>(null)
  const [invitationPreview, setInvitationPreview] = useState<ProjectGroupInvitationPreviewResult | null>(null)

  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfileListItem | null>(null)
  const [studentProfileDetailsOpen, setStudentProfileDetailsOpen] = useState(false)

  const hasFetchedStudentProfileRef = useRef(false)

  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const profileIsLoading = useAuthStore((s) => s.profileIsLoading)
  const profileError = useAuthStore((s) => s.profileError)
  const fetchStudentProfile = useAuthStore((s) => s.fetchStudentProfile)

  const groupLeaderMeQuery = useMyGroupLeaderRequest(Boolean(accessToken))

  const isApprovedGroupManager = groupLeaderMeQuery.data?.status === "APPROVED"
  const departmentName = user?.departmentName ?? user?.department?.name ?? ""

  const firstName = user?.firstName?.trim()
  const lastName = user?.lastName?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const profileName = fullName || user?.email || "Student"

  const profileEmail = user?.email ?? ""
  const profileDepartment = user?.departmentName ?? user?.department?.name ?? ""
  const profileTechStack = user?.techStack ?? user?.technologies ?? []

  const myProjectGroupQuery = useMyProjectGroup(Boolean(accessToken) && isApprovedGroupManager)

  const myGroupJoinRequestsStatusParam =
    myGroupJoinRequestsStatus === "ALL" ? undefined : myGroupJoinRequestsStatus

  const myGroupJoinRequestsQuery = useMyGroupJoinRequests({
    enabled: Boolean(accessToken) && isApprovedGroupManager && Boolean(myProjectGroupQuery.data),
    page: myGroupJoinRequestsPage,
    limit: myGroupJoinRequestsLimit,
    status: myGroupJoinRequestsStatusParam,
  })

  const pendingJoinRequestsCountQuery = useMyGroupJoinRequests({
    enabled: Boolean(accessToken) && isApprovedGroupManager && Boolean(myProjectGroupQuery.data),
    page: 1,
    limit: 1,
    status: "PENDING",
  })

  const myGroup = myProjectGroupQuery.data ?? null
  const groupStatus = myGroup?.status ?? undefined
  const groupApproved = groupStatus === "APPROVED"
  const groupSubmitted = groupStatus === "SUBMITTED"
  const groupRejected = groupStatus === "REJECTED"
  const groupIsDraft = (groupStatus ?? "DRAFT") === "DRAFT"
  const myGroupErrorStatus =
    myProjectGroupQuery.isError && isAxiosError(myProjectGroupQuery.error)
      ? Number(myProjectGroupQuery.error.response?.status)
      : undefined
  const myGroupErrorMessage = myProjectGroupQuery.isError
    ? String(myProjectGroupQuery.error?.message ?? "")
    : ""
  const myGroupNotFound =
    myProjectGroupQuery.isError &&
    (myGroupErrorStatus === 400 || myGroupErrorMessage.toLowerCase().includes("group not found"))
  const myGroupForbidden = myProjectGroupQuery.isError && myGroupErrorStatus === 403

  const derivedGroupExists = Boolean(myGroup) || (!myGroupNotFound && groupExists)
  const derivedActiveTab = (() => {
    if (!myGroup && (activeTab === "requests" || activeTab === "available")) {
      return "my-group"
    }
    return activeTab
  })()
  const shouldAutoOpenCreateGroup = myGroupNotFound && !createGroupDismissed

  const handleTechnologyClick = async (tech: string) => {
    const value = tech.trim()
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      toast.success(`Copied: ${value}`)
    } catch {
      toast.message(value)
    }
  }

  const openMemberDetails = (member: {
    id: string
    userId?: string
    name: string
    role: string
    status: string
    email: string
    joinDate: string
    avatarUrl?: string | null
  }) => {
    setSelectedMember(member)
    setMemberDetailsOpen(true)
  }

  const selectedMemberProfileQuery = useQuery<StudentPublicProfile, Error>({
    queryKey: ["student-public-profile", selectedMember?.userId],
    queryFn: () => getStudentPublicProfile(String(selectedMember?.userId ?? "")),
    enabled: memberDetailsOpen && Boolean(selectedMember?.userId),
    staleTime: 60_000,
    retry: false,
  })

  const groupMembers =
    myGroup
      ? [
          {
            id: myGroup.leader.id,
            userId: myGroup.leader.id,
            name:
              [myGroup.leader.firstName, myGroup.leader.lastName].filter(Boolean).join(" ") ||
              myGroup.leader.email,
            role: "Leader",
            status: "approved",
            email: myGroup.leader.email,
            joinDate: myGroup.createdAt,
            avatarUrl: myGroup.leader.avatarUrl,
          },
          ...myGroup.members.map((member) => ({
            id: member.id,
            userId: member.user.id,
            name:
              [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") || member.user.email,
            role: "Member",
            status: "approved",
            email: member.user.email,
            joinDate: member.joinedAt,
            avatarUrl: member.user.avatarUrl,
          })),
        ]
      : []

  const pendingJoinRequestsCount =
    pendingJoinRequestsCountQuery.data?.pagination?.total ??
    pendingJoinRequestsCountQuery.data?.items?.length ??
    0

  const myGroupJoinRequestsItems = myGroupJoinRequestsQuery.data?.items ?? []

  const myGroupJoinRequestsStatusLabel = (value: "ALL" | MyProjectGroupJoinRequestStatus) => {
    switch (value) {
      case "ALL":
        return "All"
      case "PENDING":
        return "Pending"
      case "APPROVED":
        return "Approved"
      case "REJECTED":
        return "Rejected"
      case "REVOKED":
        return "Revoked"
      case "CANCELLED":
        return "Cancelled"
      default:
        return value
    }
  }

  const getJoinRequestStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      case "REVOKED":
        return <Badge variant="outline">Revoked</Badge>
      case "CANCELLED":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const selectMyGroupJoinRequestsStatus = (next: "ALL" | MyProjectGroupJoinRequestStatus) => {
    setMyGroupJoinRequestsStatus(next)
    setMyGroupJoinRequestsPage(1)
  }

  const selectMyGroupJoinRequestsLimit = (next: number) => {
    setMyGroupJoinRequestsLimit(next)
    setMyGroupJoinRequestsPage(1)
  }

  const approveJoinRequest = async (requestId: string): Promise<boolean> => {
    if (approveJoinRequestMutation.isPending) return false

    try {
      const result = await approveJoinRequestMutation.mutateAsync({ requestId })
      if (result.memberAdded) {
        toast.success("Student added to your group")
      } else {
        toast.message("Join request was already approved")
      }

      return true
    } catch (error) {
      const message = getErrorMessage(error, "Failed to approve join request")
      const normalized = message.toLowerCase()

      if (normalized.includes("not found")) {
        toast.error("Join request not found")
        return false
      }

      if (
        normalized.includes("rejected") ||
        normalized.includes("revoked") ||
        normalized.includes("cancelled")
      ) {
        toast.error(message)
        return false
      }

      if (normalized.includes("not accepting") && normalized.includes("join")) {
        toast.error("Group is not accepting join requests")
        return false
      }

      if (normalized.includes("already") && normalized.includes("joined") && normalized.includes("group")) {
        toast.error("Student has already joined a group")
        return false
      }

      if (normalized.includes("already") && normalized.includes("group leader")) {
        toast.error("Student is already a group leader")
        return false
      }

      if (normalized.includes("group") && normalized.includes("full")) {
        toast.error("Group is full")
        return false
      }

      if (normalized.includes("only") && normalized.includes("approved") && normalized.includes("group")) {
        toast.error("Only approved group leaders can perform this action")
        return false
      }

      toast.error(message)

      return false
    }
  }

  const rejectJoinRequest = async (requestId: string, reason?: string): Promise<boolean> => {
    if (rejectJoinRequestMutation.isPending) return false

    const trimmedReason = reason?.trim()
    if (trimmedReason && trimmedReason.length > 500) {
      toast.error("Reason must be 500 characters or less")
      return false
    }

    try {
      const result = await rejectJoinRequestMutation.mutateAsync({
        requestId,
        dto: trimmedReason ? { reason: trimmedReason } : {},
      })

      if (result.request?.status === "REJECTED") {
        toast.success("Join request rejected")
      } else {
        toast.message("Request updated")
      }

      return true
    } catch (error) {
      const message = getErrorMessage(error, "Failed to reject join request")
      const normalized = message.toLowerCase()

      if (normalized.includes("not found")) {
        toast.error("Join request not found")
        return false
      }

      if (
        normalized.includes("approved") ||
        normalized.includes("revoked") ||
        normalized.includes("cancelled")
      ) {
        toast.error(message)
        return false
      }

      if (normalized.includes("only") && normalized.includes("pending")) {
        toast.error(message)
        return false
      }

      if (normalized.includes("only") && normalized.includes("approved") && normalized.includes("group")) {
        toast.error("Only approved group leaders can perform this action")
        return false
      }

      toast.error(message)
      return false
    }
  }

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

  useEffect(() => {
    if (!isApprovedGroupManager) return
    if (activeTab !== "student") return
    if (hasFetchedStudentProfileRef.current) return

    hasFetchedStudentProfileRef.current = true
    fetchStudentProfile().catch(() => {
      // Error is already handled in store state.
    })
  }, [activeTab, fetchStudentProfile, isApprovedGroupManager])

  const studentProfilesQuery = useQuery({
    queryKey: ["student-profiles", studentProfilesPage, studentProfilesLimit],
    queryFn: () => getStudentProfiles({ page: studentProfilesPage, limit: studentProfilesLimit }),
    enabled: isApprovedGroupManager && activeTab === "student",
    staleTime: 60_000,
  })

  const openStudentDetails = (item: StudentProfileListItem) => {
    setSelectedStudentProfile(item)
    setStudentProfileDetailsOpen(true)
  }

  const openAvailableStudentDetails = (item: AvailableStudentListItem) => {
    setSelectedAvailableStudent(item)
    setAvailableStudentDetailsOpen(true)
  }

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

  const groupSizeSettingsQuery = useDepartmentGroupSizeSettings({
    enabled: Boolean(accessToken) && isApprovedGroupManager,
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    const value = availableStudentsSearchInput.trim()
    const handle = window.setTimeout(() => {
      setAvailableStudentsPage(1)
      setAvailableStudentsSearch(value ? value : undefined)
    }, 400)

    return () => window.clearTimeout(handle)
  }, [availableStudentsSearchInput])

  const availableStudentsQuery = useAvailableStudents({
    enabled:
      Boolean(accessToken) &&
      isApprovedGroupManager &&
      Boolean(myGroup) &&
      derivedActiveTab === "available",
    page: availableStudentsPage,
    limit: availableStudentsLimit,
    search: availableStudentsSearch,
  })

  const isGroupManager = isApprovedGroupManager
  const canEditGroup = isGroupManager && groupIsDraft
  const canInvite = isGroupManager && !groupApproved && !groupRejected
  const groupSize = groupMembers.length
  const fallbackMinGroupSize = 3
  const fallbackMaxGroupSize = 5
  const minGroupSize = groupSizeSettingsQuery.data?.minGroupSize ?? fallbackMinGroupSize
  const maxGroupSize = groupSizeSettingsQuery.data?.maxGroupSize ?? fallbackMaxGroupSize
  const groupProgress = maxGroupSize > 0 ? (groupSize / maxGroupSize) * 100 : 0

  const canSubmitGroup =
    Boolean(myGroup) &&
    canEditGroup &&
    groupIsDraft &&
    groupSize >= minGroupSize &&
    groupSize <= maxGroupSize

  const canInviteMoreMembers = groupSize < maxGroupSize

  const availableStudentsCount = availableStudentsQuery.data?.pagination.total ?? availableStudentsQuery.data?.items.length ?? 0

  // Students who are not approved as group managers should see the normal student team page.
  if (!isApprovedGroupManager) {
    return <StudentTeamMemberPage />
  }

  return (
    <div className="min-h-full w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Student Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your project groups and team formations
          </p>
        </div>
        
        {/* User Profile Card */}
        <Card className="w-full border-primary/20 bg-primary/5 shadow-sm md:w-auto">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Avatar className="h-9 w-9 border-2 border-primary sm:h-10 sm:w-10">
                <AvatarImage src={user?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(profileName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{profileName}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:mt-0 sm:gap-2 sm:text-xs">
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    Group Leader
                  </Badge>
                  <Badge className="bg-green-100 text-[10px] text-green-800 hover:bg-green-200 sm:text-xs">Approved</Badge>
                  <span className="truncate">{profileDepartment || departmentName || "No department"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Messages */}
      {groupApproved && (
        <Alert className="mb-6 rounded-xl border-green-200 bg-green-50 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Group Formation Approved</AlertTitle>
          <AlertDescription className="text-green-700">
            Your group has been officially registered. No further changes can be made without Project Coordinator approval.
          </AlertDescription>
        </Alert>
      )}

      {groupSubmitted && !groupApproved && (
        <Alert className="mb-6 rounded-xl border-yellow-200 bg-yellow-50 shadow-sm">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Group Submitted for Review</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your group formation is pending approval from the Project Coordinator. You&apos;ll be notified once reviewed.
          </AlertDescription>
        </Alert>
      )}

      {groupRejected && (
        <Alert className="mb-6 rounded-xl shadow-sm" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Group Rejected</AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <p>
                Your group was rejected. Reopen it to return to draft and make changes before submitting again.
              </p>
              <div>
                <Button
                  variant="outline"
                  disabled={reopenMyProjectGroupMutation.isPending}
                  onClick={async () => {
                    try {
                      await reopenMyProjectGroupMutation.mutateAsync()
                      toast.success("Group reopened")
                    } catch (error) {
                      const message = getErrorMessage(error, "Failed to reopen group")
                      toast.error(message)
                    }
                  }}
                >
                  {reopenMyProjectGroupMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Reopening…
                    </>
                  ) : (
                    "Reopen Group"
                  )}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={derivedActiveTab} className="space-y-4 sm:space-y-6" onValueChange={setActiveTab}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] touch-pan-x">
          <TabsList className="inline-flex h-auto w-max min-w-max flex-nowrap gap-1 rounded-xl border bg-muted/40 p-1">
            <TabsTrigger value="overview" className="flex min-h-9 items-center gap-1.5 whitespace-nowrap px-3 text-xs sm:min-h-10 sm:gap-2 sm:text-sm">
              <Eye className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="my-group" className="flex min-h-9 items-center gap-1.5 whitespace-nowrap px-3 text-xs sm:min-h-10 sm:gap-2 sm:text-sm">
              <Users className="h-4 w-4" />
              <span>My Group</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex min-h-9 items-center gap-1.5 whitespace-nowrap px-3 text-xs sm:min-h-10 sm:gap-2 sm:text-sm" disabled={!myGroup}>
              <Clock className="h-4 w-4" />
              <span>Requests</span>
              {pendingJoinRequestsCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 rounded-full px-1 text-[10px] leading-none sm:h-5 sm:min-w-5 sm:text-xs">
                  {pendingJoinRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available" className="flex min-h-9 items-center gap-1.5 whitespace-nowrap px-3 text-xs sm:min-h-10 sm:gap-2 sm:text-sm" disabled={!myGroup}>
              <UserPlus className="h-4 w-4" />
              <span>Available</span>
            </TabsTrigger>
            <TabsTrigger value="student" className="flex min-h-9 items-center gap-1.5 whitespace-nowrap px-3 text-xs sm:min-h-10 sm:gap-2 sm:text-sm">
              <User className="h-4 w-4" />
              <span>Student</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Group Formation Process Card */}
          <Card className="border-border/80 shadow-sm">
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
                    Group Manager creates a group within the department ({minGroupSize}-{maxGroupSize} members required)
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
            <Card className="border-border/80 shadow-sm">
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

            <Card className="border-border/80 shadow-sm">
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
            <Card className="border-border/80 shadow-sm">
              <CardContent className="px-3 pb-3 pt-3 sm:pt-6">
                <div className="text-lg font-bold sm:text-2xl">{groupMembers.length}</div>
                <p className="text-[11px] text-muted-foreground sm:text-xs">Current Team Size</p>
                <Progress value={groupProgress} className="mt-1.5 sm:mt-2" />
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-sm">
              <CardContent className="px-3 pb-3 pt-3 sm:pt-6">
                <div className="text-lg font-bold sm:text-2xl">{pendingJoinRequestsCount}</div>
                <p className="text-[11px] text-muted-foreground sm:text-xs">Pending Requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3 pb-3 pt-3 sm:pt-6">
                <div className="text-lg font-bold sm:text-2xl">{availableStudentsCount}</div>
                <p className="text-[11px] text-muted-foreground sm:text-xs">Available Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3 pb-3 pt-3 sm:pt-6">
                <div className="text-lg font-bold sm:text-2xl">{minGroupSize}-{maxGroupSize}</div>
                <p className="text-[11px] text-muted-foreground sm:text-xs">Required Group Size</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Group Tab */}
        <TabsContent value="my-group" className="space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>My Group Members</CardTitle>
                <CardDescription>
                  {groupSize} of {maxGroupSize} members • Minimum {minGroupSize} required
                  {myGroup ? ` • Pending invites: ${myGroup.pendingInvitationsCount}` : ""}
                </CardDescription>
              </div>
              {canEditGroup && (
                <div className="flex gap-2 flex-wrap">
                  {myGroup && (
                    <Dialog open={groupDetailsOpen} onOpenChange={setGroupDetailsOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Mode
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Group Details</DialogTitle>
                          <DialogDescription>
                            View your group information. Click a technology to copy it.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                          <div className="space-y-1">
                            <p className="text-xl font-semibold">{myGroup.name}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{myGroup.objectives}</p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium">Technology</p>
                            {myGroup.technologies.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {myGroup.technologies.map((tech) => (
                                  <button
                                    key={tech}
                                    type="button"
                                    onClick={() => handleTechnologyClick(tech)}
                                    className="focus:outline-none"
                                  >
                                    <Badge variant="secondary" className="cursor-pointer">
                                      {tech}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No technologies listed.</p>
                            )}
                          </div>

                          <div className="text-sm">
                            <span className="font-medium">Pending invites:</span> {myGroup.pendingInvitationsCount}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {!derivedGroupExists && (
                    <Dialog
                      open={createGroupOpen || shouldAutoOpenCreateGroup}
                      onOpenChange={(open) => {
                        setCreateGroupOpen(open)
                        if (open) {
                          setCreateGroupDismissed(false)
                        } else {
                          setCreateGroupDismissed(true)
                        }
                      }}
                    >
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
                          onSubmit={async (data) => {
                            if (createProjectGroupMutation.isPending) return false

                            const technologies = parseTechnologiesInput(data.technology)
                            const dto = {
                              name: data.name,
                              objectives: data.objective,
                              technologies,
                            }

                            const parsed = createProjectGroupSchema.safeParse(dto)
                            if (!parsed.success) {
                              const message = parsed.error.issues[0]?.message ?? "Invalid group details"
                              toast.error(message)
                              return false
                            }

                            try {
                              const created = await createProjectGroupMutation.mutateAsync(parsed.data)

                              setGroupInfo({
                                name: created.name,
                                objective: created.objectives,
                                technology: created.technologies.join(", "),
                              })
                              setGroupExists(true)

                              toast.success("Group created")
                              queryClient.invalidateQueries({ queryKey: projectGroupKeys().me() }).catch(() => {})
                              setActiveTab("my-group")
                              return true
                            } catch (error) {
                              const message = getErrorMessage(error, "Failed to create group")
                              const normalized = message.toLowerCase()

                              if (normalized.includes("already") && normalized.includes("created") && normalized.includes("group")) {
                                toast.message("You already have a group.")
                                setGroupExists(true)
                                queryClient.invalidateQueries({ queryKey: projectGroupKeys().me() }).catch(() => {})
                                setActiveTab("my-group")
                                setCreateGroupOpen(false)
                                return true
                              }

                              if (normalized.includes("only") && normalized.includes("approved") && normalized.includes("group")) {
                                toast.error("Only approved group leaders can perform this action")
                                setCreateGroupOpen(false)
                                return true
                              }

                              toast.error(message)
                              return false
                            }
                          }}
                          onSuccess={() => setCreateGroupOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {myProjectGroupQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading group…
                </div>
              ) : myGroupForbidden ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access denied</AlertTitle>
                  <AlertDescription>Only approved group leaders can perform this action.</AlertDescription>
                </Alert>
              ) : myGroup ? (
                <>
                  <div className="space-y-4">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatarUrl ?? undefined} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{member.name}</p>
                              {member.role === 'Leader' && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  Leader
                                </Badge>
                              )}
                              {member.userId && user?.id && member.userId === user.id && (
                                <Badge variant="outline">You</Badge>
                              )}
                              {getStatusBadge(member.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined: {new Date(member.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMemberDetails(member)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : groupInfo ? (
                <div className="mb-6 p-4 rounded-lg border bg-muted/30 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Group Details</p>
                  <p className="font-semibold">{groupInfo.name}</p>
                  <p className="text-sm text-muted-foreground">{groupInfo.objective}</p>
                  <p className="text-xs">
                    <span className="font-medium">Technology:</span> {groupInfo.technology}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No group found yet. Create one to get started.</p>
                </div>
              )}
            </CardContent>
            {canEditGroup && myGroup && (
              <CardContent className="border-t pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <p className="text-sm font-medium">Group Status</p>
                    <p className="text-xs text-muted-foreground">
                      {groupSize < minGroupSize
                        ? `Need ${minGroupSize - groupSize} more members`
                        : groupSize > maxGroupSize
                          ? `Too many members (max ${maxGroupSize})`
                          : "✓ Ready for submission"}
                    </p>
                  </div>
                  <Button 
                    disabled={!canSubmitGroup || submitMyProjectGroupMutation.isPending}
                    onClick={async () => {
                      try {
                        await submitMyProjectGroupMutation.mutateAsync()
                        toast.success("Group submitted for review")
                      } catch (error) {
                        const message = getErrorMessage(error, "Failed to submit group")
                        toast.error(message)
                      }
                    }}
                  >
                    {submitMyProjectGroupMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit for Approval
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          <Dialog open={memberDetailsOpen} onOpenChange={setMemberDetailsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Member Details</DialogTitle>
                <DialogDescription>Profile details for this group member.</DialogDescription>
              </DialogHeader>

              {selectedMember && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedMember.avatarUrl ?? undefined} />
                      <AvatarFallback>{getInitials(selectedMember.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold truncate">{selectedMember.name}</p>
                        {selectedMember.role === "Leader" && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Leader
                          </Badge>
                        )}
                        {selectedMember.userId && user?.id && selectedMember.userId === user.id && (
                          <Badge variant="outline">You</Badge>
                        )}
                        {getStatusBadge(selectedMember.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{selectedMember.email}</p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Joined:</span>{" "}
                    {new Date(selectedMember.joinDate).toLocaleString()}
                  </div>

                  {selectedMemberProfileQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading profile…
                    </div>
                  ) : selectedMemberProfileQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Could not load profile</AlertTitle>
                      <AlertDescription>
                        {selectedMemberProfileQuery.error instanceof Error
                          ? selectedMemberProfileQuery.error.message
                          : "Failed to load member profile."}
                      </AlertDescription>
                    </Alert>
                  ) : selectedMemberProfileQuery.data ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Bio</p>
                        {selectedMemberProfileQuery.data.profile.bio ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {selectedMemberProfileQuery.data.profile.bio}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No bio provided.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Tech stack</p>
                        {selectedMemberProfileQuery.data.profile.techStack.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedMemberProfileQuery.data.profile.techStack.map((tech) => (
                              <button
                                key={tech}
                                type="button"
                                onClick={() => handleTechnologyClick(tech)}
                                className="focus:outline-none"
                              >
                                <Badge variant="secondary" className="cursor-pointer">
                                  {tech}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No tech stack listed.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Links</p>
                        {(() => {
                          const gh = safeExternalUrl(selectedMemberProfileQuery.data.profile.githubUrl)
                          const li = safeExternalUrl(selectedMemberProfileQuery.data.profile.linkedinUrl)
                          const pf = safeExternalUrl(selectedMemberProfileQuery.data.profile.portfolioUrl)

                          if (!gh && !li && !pf) {
                            return <p className="text-sm text-muted-foreground">No links added.</p>
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
                    </>
                  ) : null}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {myGroupJoinRequestsStatus === "PENDING" ? "Pending Join Requests" : "Join Requests"}
              </CardTitle>
              <CardDescription>
                Students requesting to join your group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog
                open={approveConfirmOpen}
                onOpenChange={(open) => {
                  setApproveConfirmOpen(open)
                  if (!open) {
                    setApproveConfirmRequestId(null)
                    setApproveConfirmStudentName(null)
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve join request?</DialogTitle>
                    <DialogDescription>
                      {approveConfirmStudentName ? (
                        <>
                          This will add <span className="font-medium text-foreground">{approveConfirmStudentName}</span> to your group.
                          The student will be removed from any other pending join requests and invitations.
                        </>
                      ) : (
                        "This will add the student to your group and revoke their other pending requests/invitations."
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={approveJoinRequestMutation.isPending}
                      onClick={() => setApproveConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={approveJoinRequestMutation.isPending || !approveConfirmRequestId}
                      onClick={async () => {
                        if (!approveConfirmRequestId) return
                        const didApprove = await approveJoinRequest(approveConfirmRequestId)
                        if (didApprove) {
                          setApproveConfirmOpen(false)
                        }
                      }}
                    >
                      {approveJoinRequestMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Approving…
                        </>
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={rejectConfirmOpen}
                onOpenChange={(open) => {
                  setRejectConfirmOpen(open)
                  if (!open) {
                    setRejectConfirmRequestId(null)
                    setRejectConfirmStudentName(null)
                    setRejectReason("")
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject join request?</DialogTitle>
                    <DialogDescription>
                      {rejectConfirmStudentName ? (
                        <>
                          You’re about to reject <span className="font-medium text-foreground">{rejectConfirmStudentName}</span>.
                          You may optionally provide a reason.
                        </>
                      ) : (
                        "You may optionally provide a rejection reason."
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label htmlFor="reject-reason">Reason (optional)</Label>
                    <Textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="e.g. Group is currently full for our tech stack needs"
                      disabled={rejectJoinRequestMutation.isPending}
                    />
                    <div className="text-xs text-muted-foreground">
                      {rejectReason.length}/500
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={rejectJoinRequestMutation.isPending}
                      onClick={() => setRejectConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-red-600"
                      disabled={rejectJoinRequestMutation.isPending || !rejectConfirmRequestId}
                      onClick={async () => {
                        if (!rejectConfirmRequestId) return
                        const didReject = await rejectJoinRequest(rejectConfirmRequestId, rejectReason)
                        if (didReject) {
                          setRejectConfirmOpen(false)
                        }
                      }}
                    >
                      {rejectJoinRequestMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Rejecting…
                        </>
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {myGroupJoinRequestsQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="mt-2">Loading requests…</span>
                </div>
              ) : myGroupJoinRequestsQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Failed to load join requests</AlertTitle>
                  <AlertDescription>{getErrorMessage(myGroupJoinRequestsQuery.error, "Please try again")}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Status: {myGroupJoinRequestsStatusLabel(myGroupJoinRequestsStatus)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsStatus("ALL")}>All</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsStatus("PENDING")}>Pending</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsStatus("APPROVED")}>Approved</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsStatus("REJECTED")}>Rejected</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsStatus("REVOKED")}>Revoked</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsStatus("CANCELLED")}>Cancelled</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Limit: {myGroupJoinRequestsLimit}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsLimit(5)}>5</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsLimit(10)}>10</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectMyGroupJoinRequestsLimit(20)}>20</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={myGroupJoinRequestsPage <= 1 || myGroupJoinRequestsQuery.isFetching}
                        onClick={() => setMyGroupJoinRequestsPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>

                      <div className="text-sm text-muted-foreground">
                        <span className="hidden sm:inline">
                          Page <span className="font-medium text-foreground">{myGroupJoinRequestsPage}</span> of{" "}
                          <span className="font-medium text-foreground">{myGroupJoinRequestsQuery.data?.pagination?.pages ?? 1}</span>
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(() => {
                          if (myGroupJoinRequestsQuery.isFetching) return true
                          const pages = myGroupJoinRequestsQuery.data?.pagination?.pages
                          if (typeof pages === "number" && Number.isFinite(pages)) {
                            return myGroupJoinRequestsPage >= pages
                          }
                          return (myGroupJoinRequestsQuery.data?.items?.length ?? 0) < myGroupJoinRequestsLimit
                        })()}
                        onClick={() => setMyGroupJoinRequestsPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  {myGroupJoinRequestsItems.length > 0 ? (
                    <div className="space-y-4">
                      {myGroupJoinRequestsItems.map((request) => {
                        const studentName =
                          [request.student?.firstName, request.student?.lastName].filter(Boolean).join(" ") ||
                          request.student?.email ||
                          "Student"
                        const studentDepartment = request.student?.departmentName || departmentName || "Unknown department"

                        return (
                          <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarImage src={request.student?.avatarUrl ?? undefined} />
                                <AvatarFallback>{getInitials(studentName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{studentName}</p>
                                  {getJoinRequestStatusBadge(String(request.status ?? ""))}
                                </div>
                                <p className="text-sm text-muted-foreground">{studentDepartment}</p>
                                <p className="text-xs text-muted-foreground">
                                  Requested: {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                                {request.status === "REJECTED" && request.rejectionReason ? (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Reason: {request.rejectionReason}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {canEditGroup && request.status === "PENDING" && (
                              <div className="flex gap-2 self-end sm:self-center">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={approveJoinRequestMutation.isPending}
                                  onClick={() => {
                                    setApproveConfirmRequestId(request.id)
                                    setApproveConfirmStudentName(studentName)
                                    setApproveConfirmOpen(true)
                                  }}
                                >
                                  {approveJoinRequestMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 mr-2" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  disabled={rejectJoinRequestMutation.isPending}
                                  onClick={() => {
                                    setRejectConfirmRequestId(request.id)
                                    setRejectConfirmStudentName(studentName)
                                    setRejectReason("")
                                    setRejectConfirmOpen(true)
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {myGroupJoinRequestsStatus === "PENDING" ? "No pending requests" : "No requests found"}
                      </p>
                    </div>
                  )}
                </>
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
              {!myGroup ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">Create a group first to invite members.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="available-students-search">Search students</Label>
                    <Input
                      id="available-students-search"
                      placeholder="Search by first name or last name..."
                      value={availableStudentsSearchInput}
                      onChange={(e) => setAvailableStudentsSearchInput(e.target.value)}
                    />
                  </div>

                  {availableStudentsQuery.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Could not load available students</AlertTitle>
                      <AlertDescription>
                        {availableStudentsQuery.error instanceof Error
                          ? availableStudentsQuery.error.message
                          : "Failed to load available students."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {availableStudentsQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading students…
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {(availableStudentsQuery.data?.items ?? []).length > 0 ? (
                          (availableStudentsQuery.data?.items ?? []).map((item) => {
                            const first = item.user.firstName?.trim() ?? ""
                            const last = item.user.lastName?.trim() ?? ""
                            const displayName = [first, last].filter(Boolean).join(" ")
                            const name = displayName || item.user.email || "Student"
                            const email = item.user.email

                            return (
                              <div
                                key={item.user.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar>
                                    <AvatarImage src={item.user.avatarUrl ?? undefined} />
                                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{name}</p>
                                    {departmentName && (
                                      <p className="text-sm text-muted-foreground">{departmentName}</p>
                                    )}
                                    {email && <p className="text-xs text-muted-foreground">{email}</p>}
                                  </div>
                                </div>

                                {isGroupManager && (
                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                    <Button variant="outline" size="sm" onClick={() => openAvailableStudentDetails(item)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Button>

                                    {canInvite && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={
                                            !canInviteMoreMembers ||
                                            (previewInvitationMutation.isPending && previewingUserId === item.user.id)
                                          }
                                          onClick={async () => {
                                            if (!item.user.id) return
                                            if (!canInviteMoreMembers) {
                                              toast.error("Group has reached the maximum size")
                                              return
                                            }

                                            const first = item.user.firstName?.trim() ?? ""
                                            const last = item.user.lastName?.trim() ?? ""
                                            const displayName = [first, last].filter(Boolean).join(" ")
                                            const name = displayName || item.user.email || "Student"

                                            setPreviewingUserId(item.user.id)
                                            setPreviewInvitee({ id: item.user.id, name })
                                            setInvitationPreview(null)
                                            setInvitationPreviewTab("html")

                                            try {
                                              const result = await previewInvitationMutation.mutateAsync({
                                                invitedUserId: item.user.id,
                                              })
                                              setInvitationPreview(result)
                                              setInvitationPreviewOpen(true)
                                            } catch (error) {
                                              const message = getErrorMessage(error, "Failed to preview invitation")
                                              toast.error(message)
                                            } finally {
                                              setPreviewingUserId(null)
                                            }
                                          }}
                                        >
                                          {previewInvitationMutation.isPending && previewingUserId === item.user.id ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Previewing…
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="h-4 w-4 mr-2" />
                                              Preview
                                            </>
                                          )}
                                        </Button>

                                        <Button
                                          size="sm"
                                          disabled={
                                            !canInviteMoreMembers ||
                                            (createInvitationMutation.isPending && invitingUserId === item.user.id)
                                          }
                                          onClick={async () => {
                                            if (!item.user.id) return
                                            if (!canInviteMoreMembers) {
                                              toast.error("Group has reached the maximum size")
                                              return
                                            }

                                            setInvitingUserId(item.user.id)
                                            try {
                                              const result = await createInvitationMutation.mutateAsync({
                                                invitedUserId: item.user.id,
                                              })

                                              if (result.message) {
                                                toast.message(result.message)
                                              } else {
                                                toast.success("Invitation sent")
                                              }

                                              queryClient.invalidateQueries({ queryKey: projectGroupKeys().root }).catch(() => {})
                                            } catch (error) {
                                              const message = getErrorMessage(error, "Failed to send invitation")
                                              toast.error(message)
                                            } finally {
                                              setInvitingUserId(null)
                                            }
                                          }}
                                        >
                                          {createInvitationMutation.isPending && invitingUserId === item.user.id ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Inviting…
                                            </>
                                          ) : (
                                            <>
                                              <UserPlus className="h-4 w-4 mr-2" />
                                              Invite
                                            </>
                                          )}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                            <p className="mt-2 text-sm text-muted-foreground">No available students found.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={availableStudentsPage <= 1 || availableStudentsQuery.isFetching}
                          onClick={() => setAvailableStudentsPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Page {availableStudentsQuery.data?.pagination.page ?? availableStudentsPage} of {availableStudentsQuery.data?.pagination.pages ?? 1}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            availableStudentsQuery.isFetching ||
                            (availableStudentsQuery.data?.pagination.pages
                              ? availableStudentsPage >= availableStudentsQuery.data.pagination.pages
                              : (availableStudentsQuery.data?.items ?? []).length < availableStudentsLimit)
                          }
                          onClick={() => setAvailableStudentsPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={availableStudentDetailsOpen} onOpenChange={setAvailableStudentDetailsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Student Details</DialogTitle>
                <DialogDescription>Profile details for this student.</DialogDescription>
              </DialogHeader>

              {selectedAvailableStudent && (() => {
                const first = selectedAvailableStudent.user.firstName?.trim() ?? ""
                const last = selectedAvailableStudent.user.lastName?.trim() ?? ""
                const displayName = [first, last].filter(Boolean).join(" ")
                const name = displayName || selectedAvailableStudent.user.email || "Student"
                const email = selectedAvailableStudent.user.email

                const gh = safeExternalUrl(selectedAvailableStudent.profile.githubUrl)
                const li = safeExternalUrl(selectedAvailableStudent.profile.linkedinUrl)
                const pf = safeExternalUrl(selectedAvailableStudent.profile.portfolioUrl)

                return (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedAvailableStudent.user.avatarUrl ?? undefined} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-base font-semibold truncate">{name}</p>
                        {email && <p className="text-sm text-muted-foreground truncate">{email}</p>}
                        {departmentName && <p className="text-xs text-muted-foreground">{departmentName}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Bio</p>
                      {selectedAvailableStudent.profile.bio ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {selectedAvailableStudent.profile.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No bio provided.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tech stack</p>
                      {selectedAvailableStudent.profile.techStack.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedAvailableStudent.profile.techStack.map((tech) => (
                            <button
                              key={tech}
                              type="button"
                              onClick={() => handleTechnologyClick(tech)}
                              className="focus:outline-none"
                            >
                              <Badge variant="secondary" className="cursor-pointer">
                                {tech}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tech stack listed.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Links</p>
                      {gh || li || pf ? (
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
                      ) : (
                        <p className="text-sm text-muted-foreground">No links added.</p>
                      )}
                    </div>
                  </div>
                )
              })()}
            </DialogContent>
          </Dialog>

          <Dialog
            open={invitationPreviewOpen}
            onOpenChange={(open) => {
              setInvitationPreviewOpen(open)
              if (!open) {
                setInvitationPreview(null)
                setPreviewInvitee(null)
                setInvitationPreviewTab("html")
              }
            }}
          >
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Invitation Preview</DialogTitle>
                <DialogDescription>
                  {previewInvitee ? `Preview email for ${previewInvitee.name}.` : "Preview group invitation email."}
                </DialogDescription>
              </DialogHeader>

              {invitationPreview ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Subject</p>
                    <p className="text-sm text-muted-foreground break-words">{invitationPreview.subject}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Expires:</span>{" "}
                      {(() => {
                        const time = new Date(invitationPreview.expiresAt).getTime()
                        return Number.isFinite(time)
                          ? new Date(time).toLocaleString()
                          : invitationPreview.expiresAt
                      })()}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Template:</span>{" "}
                      {invitationPreview.templateId ?? "—"}
                    </div>
                  </div>

                  <Tabs value={invitationPreviewTab} onValueChange={(v) => setInvitationPreviewTab(v as "html" | "text")}>
                    <TabsList>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                      <TabsTrigger value="text">Text</TabsTrigger>
                    </TabsList>

                    <TabsContent value="html" className="mt-3">
                      <div className="border rounded-md overflow-hidden">
                        <iframe
                          title="Invitation email preview"
                          sandbox=""
                          className="w-full h-[420px]"
                          srcDoc={invitationPreview.htmlContent}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="mt-3">
                      <ScrollArea className="h-[420px] border rounded-md p-3">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {invitationPreview.textContent}
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading preview…
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInvitationPreviewOpen(false)}
                  disabled={createInvitationMutation.isPending}
                >
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    const invitedUserId = previewInvitee?.id
                    if (!invitedUserId) {
                      toast.error("Select a student to invite")
                      return
                    }
                    if (!canInviteMoreMembers) {
                      toast.error("Group has reached the maximum size")
                      return
                    }

                    setInvitingUserId(invitedUserId)
                    try {
                      const result = await createInvitationMutation.mutateAsync({ invitedUserId })
                      if (result.message) {
                        toast.message(result.message)
                      } else {
                        toast.success("Invitation sent")
                      }
                      setInvitationPreviewOpen(false)
                      queryClient.invalidateQueries({ queryKey: projectGroupKeys().root }).catch(() => {})
                    } catch (error) {
                      const message = getErrorMessage(error, "Failed to send invitation")
                      toast.error(message)
                    } finally {
                      setInvitingUserId(null)
                    }
                  }}
                  disabled={!canInvite || !canInviteMoreMembers || createInvitationMutation.isPending}
                >
                  {createInvitationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedStudentProfile.profile.bio}</p>
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