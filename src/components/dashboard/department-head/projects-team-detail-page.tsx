"use client"

import React from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockTeams } from "./projects-teams-data"
import { ArrowLeft, Users, FolderOpen, Calendar } from "lucide-react"
import Link from "next/link"

export function ProjectsTeamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = (params?.teamId as string) || ""

  const team = mockTeams.find((t) => t.id === teamId)

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Team not found</p>
          <Button variant="outline" onClick={() => router.push("/dashboard/department-head/projects/teams")}>
            Go back to teams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header - matching system background, removed sticky positioning */}
      <div className="border-b bg-background">
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
                <h1 className="text-xl font-semibold truncate max-w-2xl" title={team.groupName}>
                  {team.groupName}
                </h1>
                <p className="text-sm text-muted-foreground truncate" title={team.projectTitle}>
                  {team.projectTitle}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {team.semester}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content - removed fixed height */}
      <div className="px-8 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Team Overview
            </CardTitle>
            <CardDescription>
              Manager: <span className="font-medium text-foreground">{team.managerName}</span> • Advisor:{" "}
              <span className="font-medium text-foreground">{team.advisorName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Last activity: {new Date(team.lastActivity).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {team.members.length} members
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.members.map((member) => (
                <div key={member} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {member
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{member}</span>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    <Link
                      href={`/dashboard/department-head/projects/teams/${team.id}/members/${encodeURIComponent(
                        member,
                      )}`}
                    >
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}