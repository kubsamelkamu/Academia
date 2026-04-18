"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { mockTeams } from "./projects-teams-data"
import {
  Calendar,
  Eye,
  FolderOpen,
  LayoutGrid,
  LayoutList,
  MessageSquare,
  Search,
  Users,
  TrendingUp,
  Clock,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

function statusStyle(status: string) {
  switch (status) {
    case "active":    return { label: "Active",    cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400" }
    case "submitted": return { label: "Submitted", cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400" }
    case "on-hold":   return { label: "On Hold",   cls: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400" }
    default:          return { label: status,      cls: "bg-muted text-muted-foreground" }
  }
}

function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const parts = name.trim().split(" ")
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary",
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs"
      )}
    >
      {letters.toUpperCase()}
    </div>
  )
}

export function ProjectsTeamsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "submitted" | "on-hold">("all")
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")

  const filtered = mockTeams.filter((team) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !q ||
      team.groupName.toLowerCase().includes(q) ||
      team.projectTitle.toLowerCase().includes(q) ||
      team.managerName.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || team.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = [
    { label: "Total Teams",    value: mockTeams.length,                                          icon: Users,     color: "text-primary",              bg: "bg-primary/10" },
    { label: "Active",         value: mockTeams.filter((t) => t.status === "active").length,    icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "On Hold",        value: mockTeams.filter((t) => t.status === "on-hold").length,   icon: Clock,     color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10" },
    { label: "Total Students", value: mockTeams.reduce((a, t) => a + t.members.length, 0),       icon: User,      color: "text-muted-foreground",      bg: "bg-muted/60" },
  ]

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Project Teams"
        description="All active project groups for the current semester"
        actions={
          <DashboardBackLink href="/dashboard/department-head/projects" variant="outline" />
        }
      />

      {/* ── KPI row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{s.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by group name, project, or manager…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-9 w-40 text-xs shrink-0">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            <SelectItem value="active" className="text-xs">Active</SelectItem>
            <SelectItem value="submitted" className="text-xs">Submitted</SelectItem>
            <SelectItem value="on-hold" className="text-xs">On Hold</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs shrink-0 text-muted-foreground"
            onClick={() => { setSearchTerm(""); setStatusFilter("all") }}
          >
            Clear
          </Button>
        )}
        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5 shrink-0 self-center">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 w-7 p-0 rounded-md", viewMode === "list" && "bg-background shadow-sm text-foreground")}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <LayoutList className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 w-7 p-0 rounded-md", viewMode === "grid" && "bg-background shadow-sm text-foreground")}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-14 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No teams found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      {/* ── List table ───────────────────────────────────────────────── */}
      {filtered.length > 0 && viewMode === "list" && (
        /*
          Shared grid template (sm+):
          36px  avatar  |  2fr  group  |  2fr  project  |  1.5fr  manager  |  80px  members  |  140px  actions
        */
        <div className="rounded-xl border bg-card overflow-hidden">

          {/* ── Column header (desktop only) ── */}
          <div className="hidden sm:grid items-center border-b bg-muted/30 px-4 py-2.5
            [grid-template-columns:36px_2fr_2fr_1.5fr_80px_140px] gap-x-4
            text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span />
            <span>Group</span>
            <span>Project</span>
            <span>Manager · Semester</span>
            <span>Members</span>
            <span className="text-right">Actions</span>
          </div>

          {/* ── Rows ── */}
          <ul className="divide-y divide-border/60 overflow-y-auto max-h-[460px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.map((team, idx) => {
              const { label, cls } = statusStyle(team.status)
              return (
                <li
                  key={team.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors px-4 py-3",
                    idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                    "flex flex-col gap-3",
                    "sm:grid sm:items-center sm:gap-x-4",
                    "sm:[grid-template-columns:36px_2fr_2fr_1.5fr_80px_140px]"
                  )}
                >
                  <Initials name={team.groupName} />

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold truncate" title={team.groupName}>
                      {team.groupName}
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", cls)}>
                      {label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <FolderOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate" title={team.projectTitle}>
                      {team.projectTitle}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-medium truncate" title={team.managerName}>
                      {team.managerName}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {team.semester}
                    </span>
                  </div>

                  <div className="flex -space-x-1.5">
                    {team.members.slice(0, 3).map((m) => (
                      <Initials key={m} name={m} size="sm" />
                    ))}
                    {team.members.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground shrink-0">
                        +{team.members.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => router.push(`/dashboard/department-head/projects/teams/${team.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* ── Footer ── */}
          <div className="border-t bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
              <span className="font-medium text-foreground">{mockTeams.length}</span> teams
            </span>
            <Badge variant="secondary" className="text-[10px]">Spring 2024</Badge>
          </div>
        </div>
      )}

      {/* ── Grid view ────────────────────────────────────────────────── */}
      {filtered.length > 0 && viewMode === "grid" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[600px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.map((team) => {
              const { label, cls } = statusStyle(team.status)
              return (
                <Card
                  key={team.id}
                  className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all group"
                >
                  <CardContent className="pt-5 pb-4 px-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-bold text-sm text-primary">
                          {(team.groupName.trim().split(" ")[0]?.[0] ?? "") + (team.groupName.trim().split(" ")[1]?.[0] ?? "")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate leading-tight" title={team.groupName}>
                            {team.groupName}
                          </p>
                          <Badge variant="outline" className={cn("text-[10px] mt-0.5", cls)}>
                            {label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Project title */}
                    <div className="flex items-start gap-1.5 mb-3 min-w-0">
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed" title={team.projectTitle}>
                        {team.projectTitle}
                      </p>
                    </div>

                    {/* Manager + semester */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Initials name={team.managerName} size="sm" />
                        <span className="text-xs font-medium truncate" title={team.managerName}>
                          {team.managerName}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                        <Calendar className="h-3 w-3" />
                        {team.semester}
                      </span>
                    </div>

                    {/* Members strip */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 4).map((m) => (
                            <Initials key={m} name={m} size="sm" />
                          ))}
                          {team.members.length > 4 && (
                            <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground shrink-0">
                              +{team.members.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground ml-1">
                          {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 flex-1 text-xs gap-1.5"
                        onClick={() => router.push(`/dashboard/department-head/projects/teams/${team.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Footer */}
          <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
            <span>
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
              <span className="font-medium text-foreground">{mockTeams.length}</span> teams
            </span>
            <Badge variant="secondary" className="text-[10px]">Spring 2024</Badge>
          </div>
        </>
      )}
    </div>
  )
}
