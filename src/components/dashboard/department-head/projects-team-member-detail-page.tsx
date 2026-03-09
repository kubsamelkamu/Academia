"use client"

import React from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockTeams } from "./projects-teams-data"
import { ArrowLeft, Users, FolderOpen } from "lucide-react"

export function ProjectsTeamMemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = (params?.teamId as string) || ""
  const memberId = decodeURIComponent((params?.memberId as string) || "")

  const team = mockTeams.find((t) => t.id === teamId)
  const isMember = team?.members.includes(memberId)

  if (!team || !isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Student not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/department-head/projects/teams")}
          >
            Go back to teams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-primary/10 sticky top-0 z-10 backdrop-blur-sm">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 hover:bg-background/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold truncate max-w-2xl">{memberId}</h1>
                <p className="text-sm text-muted-foreground truncate">{team.groupName}</p>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {team.semester}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-73px)] overflow-y-auto">
        <div className="px-8 py-6 space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Student Overview
              </CardTitle>
              <CardDescription>Basic profile information for this team member.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                  {memberId
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{memberId}</p>
                  <p className="text-sm text-muted-foreground">Member of {team.groupName}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Project</p>
                  <p className="font-medium">{team.projectTitle}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Advisor</p>
                  <p className="font-medium">{team.advisorName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Semester</p>
                  <p className="font-medium">{team.semester}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium">Team member</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Academic Summary
              </CardTitle>
              <CardDescription>Placeholder academic information for this student.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Detailed academic integration will be connected to the student profile module in a later phase.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

