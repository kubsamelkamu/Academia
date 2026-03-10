"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"

interface DepartmentHeadStudentDetailPageProps {
  studentId: string
}

interface StudentSummary {
  id: string
  name: string
  email: string
  department: string
  role: string
}

interface StudentGroupMembership {
  groupId: string
  groupName: string
  projectTitle: string
  isManager: boolean
}

// Simple mock data for department head student view
const studentSummaries: StudentSummary[] = [
  {
    id: "u8",
    name: "Maria Garcia",
    email: "mgarcia@stanford.edu",
    department: "Computer Science",
    role: "group_manager",
  },
  {
    id: "u7",
    name: "Alex Johnson",
    email: "ajohnson@stanford.edu",
    department: "Computer Science",
    role: "student",
  },
  {
    id: "s1",
    name: "Alex Johnson",
    email: "ajohnson@stanford.edu",
    department: "Computer Science",
    role: "student",
  },
  {
    id: "s2",
    name: "David Kim",
    email: "dkim@stanford.edu",
    department: "Computer Science",
    role: "student",
  },
  {
    id: "u11",
    name: "Alice Brown",
    email: "abrown@stanford.edu",
    department: "Computer Science",
    role: "group_manager",
  },
  {
    id: "s3",
    name: "Charlie Davis",
    email: "cdavis@stanford.edu",
    department: "Computer Science",
    role: "student",
  },
]

const studentGroupMemberships: StudentGroupMembership[] = [
  {
    groupId: "g1",
    groupName: "AI‑Driven Academic Assistant",
    projectTitle: "AI‑Driven Academic Assistant",
    isManager: true,
  },
  {
    groupId: "g1",
    groupName: "AI‑Driven Academic Assistant",
    projectTitle: "AI‑Driven Academic Assistant",
    isManager: false,
  },
  {
    groupId: "g1",
    groupName: "AI‑Driven Academic Assistant",
    projectTitle: "AI‑Driven Academic Assistant",
    isManager: false,
  },
  {
    groupId: "g2",
    groupName: "Blockchain Voting",
    projectTitle: "Blockchain‑Based Voting System",
    isManager: true,
  },
  {
    groupId: "g2",
    groupName: "Blockchain Voting",
    projectTitle: "Blockchain‑Based Voting System",
    isManager: false,
  },
]

function getMembershipsForStudent(studentId: string): StudentGroupMembership[] {
  if (studentId === "u8") {
    return [studentGroupMemberships[0]]
  }
  if (studentId === "s1" || studentId === "u7") {
    return [studentGroupMemberships[1]]
  }
  if (studentId === "s2") {
    return [studentGroupMemberships[2]]
  }
  if (studentId === "u11") {
    return [studentGroupMemberships[3]]
  }
  if (studentId === "s3") {
    return [studentGroupMemberships[4]]
  }
  return []
}

export function DepartmentHeadStudentDetailPage({
  studentId,
}: DepartmentHeadStudentDetailPageProps) {
  const student = studentSummaries.find((s) => s.id === studentId)

  if (!student) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Student not found"
          description="The requested student could not be found."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/department-head/grades" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Grade Approval
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const memberships = getMembershipsForStudent(studentId)

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Student details"
        description={`Group participation details for ${student.name}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/grades" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Grade Approval
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm font-medium">{student.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{student.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="text-sm font-medium">{student.department}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <StatusBadge status={student.role} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Group memberships</CardTitle>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This student is not currently assigned to any project group in the mock data.
            </p>
          ) : (
            <div className="space-y-3">
              {memberships.map((membership, index) => (
                <div
                  key={`${membership.groupId}-${index}`}
                  className="rounded-md border bg-muted/40 px-3 py-2"
                >
                  <p className="text-sm font-medium">{membership.groupName}</p>
                  <p className="text-xs text-muted-foreground">
                    Project: {membership.projectTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role in group:{" "}
                    {membership.isManager ? "Group manager" : "Member"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

