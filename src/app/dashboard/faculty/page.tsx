"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { DashboardKpiGrid, DashboardPageHeader, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useAllTenantInvitationsList,
  useResendTenantInvitation,
  useRevokeTenantInvitation,
} from "@/lib/hooks/use-invitations"
import {
  useDeactivateTenantUser,
  useTenantUser,
  useTenantUserRoleCounts,
  useTenantUsersPaged,
  useUpdateTenantUser,
} from "@/lib/hooks/use-users"
import { cn } from "@/lib/utils"
import type { TenantInvitation } from "@/types/invitations"
import type { TenantUserDetail, TenantUserListItem, TenantUserRoleName } from "@/types/tenant-users"
import { Clock3, PencilLine, Trash2, UserCheck, Users } from "lucide-react"

type DepartmentRole = "All" | "Department Head" | "Coordinator" | "Advisor" | "Student"

const PAGE_SIZE = 20

const updateTenantUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address"),
})

type UpdateTenantUserFormData = z.infer<typeof updateTenantUserSchema>

const roleFilterOptions: DepartmentRole[] = ["All", "Department Head", "Coordinator", "Advisor", "Student"]

function roleNamesForUiRole(role: DepartmentRole): TenantUserRoleName[] | undefined {
  switch (role) {
    case "Department Head":
      return ["DEPARTMENT_HEAD"]
    case "Advisor":
      return ["ADVISOR"]
    case "Coordinator":
      return ["COORDINATOR"]
    case "Student":
      return ["STUDENT"]
    case "All":
      return ["DEPARTMENT_HEAD", "ADVISOR", "COORDINATOR", "STUDENT"]
    default:
      return ["DEPARTMENT_HEAD", "ADVISOR", "COORDINATOR", "STUDENT"]
  }
}

function pickPrimaryRoleName(user: TenantUserListItem): string {
  const raw = user.roles?.[0]?.role?.name
  if (!raw) return ""
  return String(raw)
}

function formatRoleLabel(raw: string): string {
  const normalized = raw.toUpperCase().replace(/\s+/g, "_")
  switch (normalized) {
    case "DEPARTMENT_HEAD":
      return "Department Head"
    case "COORDINATOR":
      return "Coordinator"
    case "ADVISOR":
      return "Advisor"
    case "STUDENT":
      return "Student"
    default:
      return raw
  }
}

function formatStatusLabel(raw: string | null | undefined): string {
  if (!raw) return ""
  if (raw.toUpperCase() === "ACTIVE") return "Active"
  return raw
}

function formatInvitationDate(raw: string | null | undefined): string {
  if (!raw) return "-"

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString()
}

function formatShortDate(raw: string | null | undefined): string {
  if (!raw) return "-"

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString()
}

function getInvitationBadgeVariant(status: TenantInvitation["status"]): "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PENDING":
      return "secondary"
    case "REVOKED":
      return "destructive"
    case "ACCEPTED":
    case "EXPIRED":
    default:
      return "outline"
  }
}

function getRoleCount(role: DepartmentRole, counts: ReturnType<typeof useTenantUserRoleCounts>["counts"]): number {
  switch (role) {
    case "All":
      return counts.all
    case "Department Head":
      return counts.departmentHead
    case "Coordinator":
      return counts.coordinator
    case "Advisor":
      return counts.advisor
    case "Student":
      return counts.student
    default:
      return 0
  }
}

function UserManageDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const userQuery = useTenantUser(userId, { enabled: open && Boolean(userId) })
  const updateUserMutation = useUpdateTenantUser(userId)
  const deactivateUserMutation = useDeactivateTenantUser()

  async function handleDeactivate(currentUser: TenantUserDetail) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Deactivate ${currentUser.email}?`)
      if (!confirmed) {
        return
      }
    }

    try {
      await deactivateUserMutation.mutateAsync(currentUser.id)
      toast.success("User deactivated")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deactivate user")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>Review account details, update profile fields, or deactivate this user.</DialogDescription>
        </DialogHeader>

        {userQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading user details...</p>
        ) : userQuery.isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{userQuery.error?.message || "Failed to load user details"}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => userQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : userQuery.data ? (
          <ManageUserForm
            key={userQuery.data.id}
            user={userQuery.data}
            onClose={() => onOpenChange(false)}
            onDeactivate={handleDeactivate}
            isUpdating={updateUserMutation.isPending}
            isDeactivating={deactivateUserMutation.isPending}
            onSubmit={async (values) => {
              try {
                await updateUserMutation.mutateAsync({
                  firstName: values.firstName.trim(),
                  lastName: values.lastName.trim(),
                  email: values.email.trim(),
                })
                toast.success("User updated")
                onOpenChange(false)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update user")
              }
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No user selected.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ManageUserForm({
  user,
  onSubmit,
  onClose,
  onDeactivate,
  isUpdating,
  isDeactivating,
}: {
  user: TenantUserDetail
  onSubmit: (values: UpdateTenantUserFormData) => Promise<void>
  onClose: () => void
  onDeactivate: (user: TenantUserDetail) => Promise<void>
  isUpdating: boolean
  isDeactivating: boolean
}) {
  const form = useForm<UpdateTenantUserFormData>({
    resolver: zodResolver(updateTenantUserSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
    },
  })

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{formatRoleLabel(pickPrimaryRoleName(user)) || "User"}</Badge>
          {user.status ? <Badge variant="secondary">{formatStatusLabel(user.status)}</Badge> : null}
        </div>
        <p className="mt-2">Joined {formatShortDate(user.createdAt)}</p>
        <p>Last login {formatShortDate(user.lastLoginAt)}</p>
      </div>

      <form id="manage-user-form" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="manage-user-first-name">First name</Label>
            <Input id="manage-user-first-name" {...form.register("firstName")} />
            {form.formState.errors.firstName ? (
              <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manage-user-last-name">Last name</Label>
            <Input id="manage-user-last-name" {...form.register("lastName")} />
            {form.formState.errors.lastName ? (
              <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manage-user-email">Email</Label>
          <Input id="manage-user-email" type="email" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
      </form>

      <DialogFooter className="justify-between sm:justify-between">
        <Button
          type="button"
          variant="destructive"
          onClick={() => void onDeactivate(user)}
          disabled={isUpdating || isDeactivating}
        >
          <Trash2 className="h-4 w-4" />
          {isDeactivating ? "Deactivating..." : "Deactivate"}
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating || isDeactivating}>
            Cancel
          </Button>
          <Button form="manage-user-form" type="submit" disabled={isUpdating || isDeactivating}>
            <PencilLine className="h-4 w-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

export default function FacultyPage() {
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeRole, setActiveRole] = useState<DepartmentRole>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)

  const setRoleAndResetPage = (nextRole: DepartmentRole) => {
    setActiveRole(nextRole)
    setPage(1)
  }

  const usersQueryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: searchQuery,
      roleNames: roleNamesForUiRole(activeRole),
    }),
    [activeRole, page, searchQuery]
  )

  const usersQuery = useTenantUsersPaged(usersQueryParams)
  const roleCountsQuery = useTenantUserRoleCounts()
  const invitesQuery = useAllTenantInvitationsList()
  const resendInvitationMutation = useResendTenantInvitation()
  const revokeInvitationMutation = useRevokeTenantInvitation()
  const directoryUsers = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data])
  const pagination = usersQuery.data?.pagination
  const totalPages = pagination?.pages ?? 1
  const canPrev = page > 1
  const canNext = page < totalPages
  const recentInvites = useMemo(() => {
    return (invitesQuery.data ?? []).slice(0, 5)
  }, [invitesQuery.data])
  const pendingInviteCount = useMemo(() => {
    return (invitesQuery.data ?? []).filter((invite) => invite.status === "PENDING").length
  }, [invitesQuery.data])

  const departmentBreakdownNote = useMemo(() => {
    if (roleCountsQuery.isLoading) return "All roles within your department"

    const head = roleCountsQuery.counts.departmentHead
    const advisors = roleCountsQuery.counts.advisor
    const coordinators = roleCountsQuery.counts.coordinator
    const students = roleCountsQuery.counts.student

    return `Head ${head} • Advisors ${advisors} • Coordinators ${coordinators} • Students ${students}`
  }, [
    roleCountsQuery.counts.advisor,
    roleCountsQuery.counts.coordinator,
    roleCountsQuery.counts.departmentHead,
    roleCountsQuery.counts.student,
    roleCountsQuery.isLoading,
  ])
  const summaryCards = useMemo(
    () => [
      {
        title: "Department Users",
        value: roleCountsQuery.isLoading ? "-" : String(roleCountsQuery.counts.all),
        note: departmentBreakdownNote,
        icon: Users,
      },
      {
        title: "Students",
        value: roleCountsQuery.isLoading ? "-" : String(roleCountsQuery.counts.student),
        note: "Student accounts in your department",
        icon: Users,
      },
      {
        title: "Advisors",
        value: roleCountsQuery.isLoading ? "-" : String(roleCountsQuery.counts.advisor),
        note: "Advisor accounts in your department",
        icon: UserCheck,
      },
      {
        title: "Coordinators",
        value: roleCountsQuery.isLoading ? "-" : String(roleCountsQuery.counts.coordinator),
        note: "Coordinator accounts in your department",
        icon: UserCheck,
      },
      {
        title: "Pending Invites",
        value: invitesQuery.isLoading ? "-" : String(pendingInviteCount),
        note: "All invitations awaiting acceptance",
        icon: Clock3,
      },
    ],
    [
      departmentBreakdownNote,
      invitesQuery.isLoading,
      pendingInviteCount,
      roleCountsQuery.counts.advisor,
      roleCountsQuery.counts.all,
      roleCountsQuery.counts.coordinator,
      roleCountsQuery.counts.student,
      roleCountsQuery.isLoading,
    ]
  )

  async function onResendInvite(invitationId: string) {
    try {
      await resendInvitationMutation.mutateAsync(invitationId)
      toast.success("Invitation resent")
      await invitesQuery.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation")
    }
  }

  async function onRevokeInvite(invitation: TenantInvitation) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Revoke invitation for ${invitation.email}?`)
      if (!confirmed) {
        return
      }
    }

    try {
      await revokeInvitationMutation.mutateAsync(invitation.id)
      toast.success("Invitation revoked")
      await invitesQuery.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke invitation")
    }
  }

  return (
    <div className="space-y-6">
      <UserManageDialog
        userId={selectedUserId}
        open={manageDialogOpen}
        onOpenChange={(open) => {
          setManageDialogOpen(open)
          if (!open) {
            setSelectedUserId(null)
          }
        }}
      />

      <DashboardPageHeader
        title="Faculty"
        description="Manage faculty operations with live role counts, directory search, and invitation activity."
        badge="Department Head"
      />

      <DashboardKpiGrid items={summaryCards} />

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardSectionCard
          className="xl:col-span-2"
          title="Directory Filters"
          description="Use role filters and search to narrow the live department directory."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {roleFilterOptions.map((role) => (
                <Button
                  key={role}
                  type="button"
                  size="sm"
                  variant={activeRole === role ? "default" : "outline"}
                  onClick={() => setRoleAndResetPage(role)}
                  className="gap-2"
                >
                  <span>{role}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      activeRole === role
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {roleCountsQuery.isLoading ? "-" : getRoleCount(role, roleCountsQuery.counts)}
                  </span>
                </Button>
              ))}
              <Badge variant="secondary">Focused Role: {activeRole}</Badge>
            </div>

            {roleCountsQuery.isError ? (
              <p className="text-xs text-destructive">
                {roleCountsQuery.error?.message || "Failed to load role counts."}
              </p>
            ) : null}

            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Counts, directory results, and invite activity all refresh from live backend APIs for this tenant context.
            </div>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Recent Invitations"
          description="Latest invitations sent from this department (all roles)."
        >
          <div className="space-y-3">
            {invitesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading invites...</p>
            ) : invitesQuery.isError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  {invitesQuery.error?.message || "Failed to load invites"}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => invitesQuery.refetch()}>
                  Retry
                </Button>
              </div>
            ) : recentInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invitations found yet.</p>
            ) : (
              recentInvites.map((invite) => {
                const fullName = [invite.firstName, invite.lastName].filter(Boolean).join(" ") || invite.email
                const isPendingInvite = invite.status === "PENDING"

                return (
                  <div key={invite.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{invite.email}</p>
                      </div>
                      <Badge variant={getInvitationBadgeVariant(invite.status)}>{invite.status}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{invite.roleName}</span>
                      <span>{formatInvitationDate(invite.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => void onResendInvite(invite.id)}
                        disabled={resendInvitationMutation.isPending || revokeInvitationMutation.isPending}
                      >
                        Resend
                      </Button>
                      {isPendingInvite ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => void onRevokeInvite(invite)}
                          disabled={revokeInvitationMutation.isPending || resendInvitationMutation.isPending}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}

            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              {pendingInviteCount} pending invite{pendingInviteCount === 1 ? "" : "s"} awaiting acceptance.
            </div>
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard
        title="Department People Directory"
        description="Live directory of department head, coordinators, advisors, and students."
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search by name, email, or role"
              className="sm:max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{activeRole}</Badge>
              <span>
                {pagination ? `${pagination.total} result${pagination.total === 1 ? "" : "s"}` : `${directoryUsers.length} results`}
              </span>
            </div>
          </div>

          {usersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : usersQuery.isError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{usersQuery.error?.message || "Failed to load users"}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => usersQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : directoryUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users match the selected role or search criteria.</p>
          ) : (
            directoryUsers.map((user: TenantUserListItem) => {
              const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
              const roleLabel = formatRoleLabel(pickPrimaryRoleName(user))
              const statusLabel = formatStatusLabel(user.status)

              return (
                <Card key={user.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{fullName}</p>
                        {roleLabel ? <Badge variant="outline">{roleLabel}</Badge> : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {formatShortDate(user.createdAt)}
                        {user.lastLoginAt ? ` • Last login ${formatShortDate(user.lastLoginAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {statusLabel ? (
                        <Badge variant={statusLabel.toUpperCase() === "ACTIVE" ? "secondary" : "outline"}>
                          {statusLabel}
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setManageDialogOpen(true)
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <p className="text-xs text-muted-foreground">
              {pagination ? (
                <>Page {pagination.page} of {pagination.pages} • {pagination.total} total</>
              ) : (
                <>Page {page}</>
              )}
            </p>
            {usersQuery.isFetching ? <p className="text-xs text-muted-foreground">Refreshing...</p> : null}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={!canPrev || usersQuery.isFetching}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={!canNext || usersQuery.isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
