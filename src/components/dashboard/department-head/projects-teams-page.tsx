"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { mockTeams } from "./projects-teams-data"
import { ArrowLeft, Users, Search, Filter, Calendar, FolderOpen, MessageSquare, Eye } from "lucide-react"

export function ProjectsTeamsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "submitted" | "on-hold">("all")

  const filteredTeams = mockTeams.filter((team) => {
    const matchesSearch =
      team.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.managerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || team.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header - matching system background */}
      <div className="border-b bg-background">
        <div className="px-8 py-6">
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
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Project Teams
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Contact active project groups for the current semester
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - removed fixed height */}
      <div className="px-8 py-6 space-y-6">
        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams by group name, project, or manager..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="submitted">Submitted</option>
                  <option value="on-hold">On hold</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                  }}
                  className="whitespace-nowrap"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams List */}
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Current Semester Teams</CardTitle>
                <CardDescription>{filteredTeams.length} groups found</CardDescription>
              </div>
              <Badge variant="outline" className="px-3 py-1 bg-primary/5">
                Spring 2024
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {filteredTeams.map((team) => (
              <Card
                key={team.id}
                className="border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <CardContent className="py-4 px-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate" title={team.groupName}>
                          {team.groupName}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {team.status === "active"
                            ? "Active"
                            : team.status === "submitted"
                              ? "Submitted"
                              : "On hold"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate" title={team.projectTitle}>
                        {team.projectTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          Manager: <span className="font-medium text-foreground">{team.managerName}</span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {team.semester}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <Link href={`/dashboard/department-head/projects/teams/${team.id}`}>
                        <Eye className="h-4 w-4" />
                        View details
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <Link href="/dashboard/department-head/messages">
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTeams.length === 0 && (
              <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                No teams match your filters.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simple stats */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Teams</p>
                  <p className="text-2xl font-bold mt-2">{mockTeams.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Teams</p>
                  <p className="text-2xl font-bold mt-2">
                    {mockTeams.filter((t) => t.status === "active").length}
                  </p>
                </div>
                <FolderOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Students</p>
                  <p className="text-2xl font-bold mt-2">
                    {mockTeams.reduce((acc, t) => acc + t.members.length, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}