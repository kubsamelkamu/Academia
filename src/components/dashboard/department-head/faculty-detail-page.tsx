"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, Mail, UserCheck, Users } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReactivateTenantUser, useTenantUser } from "@/lib/hooks/use-users"
import { toast } from "sonner"

interface FacultyDetailPageProps {
  facultyId: string
}

function mapRoleLabel(roleName?: string): string {
  const normalized = (roleName ?? "").toLowerCase()

  if (normalized === "advisor") {
    return "Advisor"
  }
  if (normalized === "coordinator") {
    return "Coordinator"
  }
  if (normalized === "student") {
    return "Student"
  }

  return roleName ?? "Unknown"
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "—"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)
}

export function FacultyDetailPage({ facultyId }: FacultyDetailPageProps) {
  const { data: user, isLoading, isError, error } = useTenantUser(facultyId)
  const reactivateUserMutation = useReactivateTenantUser()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Faculty details"
          description="Loading faculty member details..."
        />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Faculty not found"
          description={
            error?.message
              ? `The requested faculty member could not be loaded: ${error.message}`
              : "The requested faculty member could not be found."
          }
        />
        <Button variant="outline" asChild>
          <Link href="/dashboard/department-head/faculty">Back to Faculty</Link>
        </Button>
      </div>
    )
  }

  const handleSendInvite = () => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    const displayName = fullName.length > 0 ? fullName : user.email

    toast.success("Invitation sent", {
      description: `Login instructions have been sent to ${displayName}`,
    })
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  const displayName = fullName.length > 0 ? fullName : user.email
  const roleName = user.roles?.[0]?.role?.name
  const roleLabel = mapRoleLabel(roleName)
  const isActive = (user.status ?? "").toUpperCase() === "ACTIVE"
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)

  const handleReactivate = async () => {
    try {
      await reactivateUserMutation.mutateAsync(user.id)
      toast.success("Faculty reactivated", {
        description: `${displayName} has been reactivated and can sign in again.`,
      })
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Unable to reactivate"
      toast.error("Reactivation failed", {
        description: message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Faculty details"
        description="View and manage this faculty member"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/faculty" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Faculty
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{displayName}</CardTitle>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">
                    {roleLabel}
                  </Badge>
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSendInvite}>
                <Mail className="mr-2 h-4 w-4" />
                Send invite
              </Button>
              {!isActive ? (
                <Button
                  size="sm"
                  onClick={handleReactivate}
                  disabled={reactivateUserMutation.isPending}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reactivate
                </Button>
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/department-head/faculty/edit/${user.id}`}>
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Email verification</p>
              <p className="font-medium">{user.emailVerified ? "Verified" : "Not verified"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Created at</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Last login</p>
              <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Current status</p>
              <div>
                <p className="font-medium">{isActive ? "Active" : "Inactive"}</p>
                {reactivateUserMutation.isPending ? (
                  <p className="text-muted-foreground text-xs">Updating status...</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex gap-6 border-t pt-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <span>Role: {roleLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="text-muted-foreground h-4 w-4" />
              <span>User ID: {user.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
