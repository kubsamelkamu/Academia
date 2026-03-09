"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Mail, Key, Users } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getFacultyById } from "@/lib/mock/faculty"
import { toast } from "sonner"

interface FacultyDetailPageProps {
  facultyId: string
}

export function FacultyDetailPage({ facultyId }: FacultyDetailPageProps) {
  const router = useRouter()
  const faculty = getFacultyById(facultyId)

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

  const handleResetPassword = () => {
    toast.success("Temporary password generated", {
      description: `${faculty.name} will receive login instructions and must change password on first login.`,
    })
  }

  const handleSendInvite = () => {
    toast.success("Invitation sent", {
      description: `Login instructions have been sent to ${faculty.email}`,
    })
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
                  {faculty.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{faculty.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{faculty.email}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {faculty.role.replace("_", " ")}
                  </Badge>
                  <Badge variant={faculty.status === "active" ? "default" : "secondary"}>
                    {faculty.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetPassword}>
                <Key className="mr-2 h-4 w-4" />
                Reset password
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendInvite}>
                <Mail className="mr-2 h-4 w-4" />
                Send invite
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/department-head/faculty/edit/${faculty.id}`}>
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Department</p>
              <p className="font-medium">{faculty.department}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Specialization</p>
              <p className="font-medium">{faculty.specialization ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Office</p>
              <p className="font-medium">{faculty.office ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Phone</p>
              <p className="font-medium">{faculty.phone ?? "—"}</p>
            </div>
          </div>
          <div className="flex gap-6 border-t pt-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <span>{faculty.courses ?? 0} courses</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="text-muted-foreground h-4 w-4" />
              <span>{faculty.students ?? 0} students supervised</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
