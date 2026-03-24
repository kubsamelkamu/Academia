"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserCheck, UserX } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDeactivateTenantUser, useReactivateTenantUser, useTenantUser } from "@/lib/hooks/use-users"
import { toast } from "sonner"

interface FacultyDeactivatePageProps {
  facultyId: string
}

export function FacultyDeactivatePage({ facultyId }: FacultyDeactivatePageProps) {
  const router = useRouter()
  const { data: user, isLoading, isError, error } = useTenantUser(facultyId)
  const deactivateUserMutation = useDeactivateTenantUser()
  const reactivateUserMutation = useReactivateTenantUser()
  const [confirmed, setConfirmed] = useState(false)
  const [lastAction, setLastAction] = useState<"deactivate" | "reactivate" | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Deactivate faculty"
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

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  const displayName = fullName.length > 0 ? fullName : user.email
  const isActive = (user.status ?? "").toUpperCase() === "ACTIVE"

  const handleDeactivate = async () => {
    try {
      await deactivateUserMutation.mutateAsync(user.id)
      toast.warning("Faculty deactivated", {
        description: `${displayName} has been deactivated and can no longer sign in.`,
      })
      setLastAction("deactivate")
      setConfirmed(true)
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Unable to deactivate"
      toast.error("Deactivation failed", {
        description: message,
      })
    }
  }

  const handleReactivate = async () => {
    try {
      await reactivateUserMutation.mutateAsync(user.id)
      toast.success("Faculty reactivated", {
        description: `${displayName} has been reactivated and can sign in again.`,
      })
      setLastAction("reactivate")
      setConfirmed(true)
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
        title={isActive ? "Deactivate faculty" : "Reactivate faculty"}
        description={
          isActive
            ? "Deactivate this faculty member's account"
            : "Reactivate this faculty member's account"
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/faculty" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Faculty
            </Link>
          </Button>
        }
      />

      <Card className={isActive ? "border-destructive/50" : "border-green-500/40"}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isActive ? "text-destructive" : "text-green-700 dark:text-green-400"}`}>
            {isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            {isActive ? "Deactivate" : "Reactivate"} {displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive ? (
            <p className="text-muted-foreground text-sm">
              Deactivating this account will revoke access. The faculty member will no longer be able
              to sign in. You can reactivate the account later from the faculty list.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Reactivating this account will restore sign-in access for this faculty member.
            </p>
          )}
          {!confirmed ? (
            <div className="flex gap-2">
              {isActive ? (
                <Button
                  variant="destructive"
                  onClick={handleDeactivate}
                  disabled={deactivateUserMutation.isPending || reactivateUserMutation.isPending}
                >
                  Deactivate account
                </Button>
              ) : (
                <Button
                  onClick={handleReactivate}
                  disabled={deactivateUserMutation.isPending || reactivateUserMutation.isPending}
                >
                  Reactivate account
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href={`/dashboard/department-head/faculty/${user.id}`}>
                  Cancel
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {lastAction === "reactivate" ? "Account reactivated." : "Account deactivated."}{" "}
                <Link
                  href="/dashboard/department-head/faculty"
                  className="underline underline-offset-2"
                >
                  Return to faculty list
                </Link>
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/dashboard/department-head/faculty")}
                >
                  Back to Faculty List
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
