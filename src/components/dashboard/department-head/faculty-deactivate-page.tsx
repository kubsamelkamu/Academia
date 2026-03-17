"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, UserX } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getFacultyById } from "@/lib/mock/faculty"
import { toast } from "sonner"

interface FacultyDeactivatePageProps {
  facultyId: string
}

export function FacultyDeactivatePage({ facultyId }: FacultyDeactivatePageProps) {
  const faculty = getFacultyById(facultyId)
  const [confirmed, setConfirmed] = useState(false)

  if (!faculty) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Faculty not found"
          description="The requested faculty member could not be found."
        />
        <Button variant="outline" asChild>
          <Link href="/dashboard/department-head/faculty">Back to Faculty</Link>
        </Button>
      </div>
    )
  }

  const handleDeactivate = () => {
    toast.warning("Faculty deactivated", {
      description: `${faculty.name} has been deactivated and can no longer sign in.`,
    })
    setConfirmed(true)
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Deactivate faculty"
        description="Deactivate this faculty member's account"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/faculty" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Faculty
            </Link>
          </Button>
        }
      />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <UserX className="h-5 w-5" />
            Deactivate {faculty.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Deactivating this account will revoke access. The faculty member will no longer be able
            to sign in. You can reactivate the account later from the faculty list.
          </p>
          {!confirmed ? (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeactivate}>
                Deactivate account
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/department-head/faculty/${faculty.id}`}>
                  Cancel
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Account deactivated.{" "}
                <Link
                  href="/dashboard/department-head/faculty"
                  className="underline underline-offset-2"
                >
                  Return to faculty list
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
