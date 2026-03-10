"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, Users, UserCheck } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"
import { mockStudentGroups } from "@/data/mockData"

interface GroupDetailPageProps {
  groupId: string
}

export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
  const group = mockStudentGroups.find((g) => g.id === groupId)

  if (!group) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Group not found"
          description="The requested project group could not be found."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/department-head/grades" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Grade Overview
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={group.name}
        description="Detailed view of project group and members"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/grades" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Grade Overview
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Group summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Group name</p>
            <p className="text-sm font-medium">{group.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Project title</p>
            <p className="text-sm font-medium">{group.projectTitle}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Group manager</p>
            <p className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              {group.managerName}
            </p>
            <p className="text-xs text-muted-foreground">{group.managerEmail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={group.status} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members ({group.members.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {group.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {member.name}
                  {member.isManager && (
                    <span className="ml-1 text-[10px] uppercase tracking-wide text-emerald-600">
                      (Manager)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={member.role} />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  asChild
                >
                  <Link
                    href={`/dashboard/department-head/grades/student-${member.id}`}
                    className="gap-1"
                  >
                    <Users className="h-3 w-3" />
                    View
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

