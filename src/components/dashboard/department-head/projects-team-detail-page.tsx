"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { mockTeams } from "./projects-teams-data"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackButton, DashboardBackLink } from "@/components/dashboard/dashboard-back"
import {
  Calendar,
  Clock,
  Crown,
  Eye,
  FolderOpen,
  MessageSquare,
  TrendingUp,
  Users,
  UserCheck,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── shared helpers ─────────────────────────────────────────────── */
function initials(name: string) {
  const p = name.trim().split(" ")
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase()
}

function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm" }[size]
  return (
    <div className={cn("rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary", sizeClass)}>
      {initials(name)}
    </div>
  )
}

function statusStyle(status: string) {
  switch (status) {
    case "active":    return { label: "Active",    cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400" }
    case "submitted": return { label: "Submitted", cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400" }
    case "on-hold":   return { label: "On Hold",   cls: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400" }
    default:          return { label: status,      cls: "bg-muted text-muted-foreground" }
  }
}

/* ── Member popup card ──────────────────────────────────────────── */
function MemberPopup({
  member,
  team,
  open,
  onClose,
}: {
  member: string
  team: ReturnType<typeof import("./projects-teams-data").mockTeams.find>
  open: boolean
  onClose: () => void
}) {
  if (!team) return null
  const isManager = member === team.managerName
  const { cls } = statusStyle(team.status)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">

        {/* Gradient header */}
        <div className="relative h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 shrink-0">
          <DashboardBackButton
            onClick={onClose}
            className="absolute top-3 left-3 h-7 text-xs bg-background/60 hover:bg-background/80 backdrop-blur-sm border-0 shadow-none"
          />
          <Button size="sm" asChild
            className="absolute top-3 right-3 h-7 text-xs gap-1.5"
          >
            <Link href="/dashboard/department-head/messages">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </Link>
          </Button>
          {/* Avatar overlap */}
          <div className="absolute -bottom-6 left-5">
            <div className="h-12 w-12 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center font-bold text-primary text-base shadow-sm">
              {initials(member)}
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="pt-8 px-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold truncate">{member}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {team.groupName} · {team.semester}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {isManager ? (
              <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20 text-[10px]">
                <Crown className="h-2.5 w-2.5" /> Manager
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Member</Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px] capitalize", cls)}>
              {team.status.replace("-", " ")}
            </Badge>
          </div>
        </div>

        <Separator className="mx-5" />

        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Project context */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project Context</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Project</p>
                <p className="text-sm font-medium mt-0.5">{team.projectTitle}</p>
              </div>
              {[
                { label: "Group",    value: team.groupName },
                { label: "Advisor",  value: team.advisorName },
                { label: "Manager",  value: team.managerName },
                { label: "Semester", value: team.semester },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-xs font-medium mt-0.5 truncate" title={value}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Fellow members */}
          {team.members.filter((m) => m !== member).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Users className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fellow Members</p>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {team.members.length - 1}
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {team.members.filter((m) => m !== member).map((m) => (
                  <li key={m} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-primary">{initials(m)}</span>
                      </div>
                      <span className="text-sm truncate">{m}</span>
                      {m === team.managerName && (
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 shrink-0">
                          Manager
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}

/* ── Main page ──────────────────────────────────────────────────── */
export function ProjectsTeamDetailPage() {
  const params = useParams()
  const teamId = (params?.teamId as string) || ""
  const team   = mockTeams.find((t) => t.id === teamId)

  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold">Team not found</p>
        <DashboardBackLink href="/dashboard/department-head/projects/teams" variant="outline" />
      </div>
    )
  }

  const { label, cls } = statusStyle(team.status)

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title={team.groupName}
        description={team.projectTitle}
        actions={
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" asChild>
              <Link href="/dashboard/department-head/messages">
                <MessageSquare className="h-3.5 w-3.5" /> Message Team
              </Link>
            </Button>
            <DashboardBackLink href="/dashboard/department-head/projects/teams" variant="outline" />
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Members",       value: team.members.length,                             icon: Users,    color: "text-primary",          bg: "bg-primary/10" },
          { label: "Status",        value: label,                                            icon: Activity, color: cn(cls.split(" ")[1]),   bg: cn(cls.split(" ")[0]) },
          { label: "Semester",      value: team.semester,                                    icon: Calendar, color: "text-muted-foreground", bg: "bg-muted/60" },
          { label: "Last Activity", value: new Date(team.lastActivity).toLocaleDateString(), icon: Clock,    color: "text-muted-foreground", bg: "bg-muted/60" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", k.bg)}>
                <k.icon className={cn("h-4 w-4", k.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Project Overview</span>
            <Badge variant="outline" className={cn("ml-auto text-[10px]", cls)}>{label}</Badge>
          </div>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Project Title", value: team.projectTitle },
                { label: "Group Name",    value: team.groupName },
                { label: "Advisor",       value: team.advisorName },
                { label: "Manager",       value: team.managerName },
                { label: "Semester",      value: team.semester },
                { label: "Last Activity", value: new Date(team.lastActivity).toLocaleDateString() },
              ].map(({ label: l, value }) => (
                <div key={l}>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</p>
                  <p className="text-sm font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" asChild>
                <Link href="/dashboard/department-head/projects">
                  <FolderOpen className="h-3.5 w-3.5" /> View Project
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" asChild>
                <Link href="/dashboard/department-head/messages">
                  <MessageSquare className="h-3.5 w-3.5" /> Contact Team
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Advisor</span>
          </div>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Initials name={team.advisorName} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{team.advisorName}</p>
                <p className="text-xs text-muted-foreground">Project Advisor</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-3">
              <Initials name={team.managerName} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{team.managerName}</p>
                <p className="text-xs text-muted-foreground">Group Manager</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Members</span>
            <Badge variant="secondary" className="text-[10px]">{team.members.length}</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:block">{team.semester}</span>
        </div>

        {/* Column header */}
        <div className="hidden sm:grid px-5 py-2 border-b bg-muted/20
          [grid-template-columns:36px_1fr_auto] gap-x-4
          text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span />
          <span>Name</span>
          <span className="text-right">Action</span>
        </div>

        <ul className="divide-y divide-border/50 overflow-y-auto max-h-[320px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {team.members.map((member, idx) => {
            const isManager = member === team.managerName
            return (
              <li
                key={member}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors",
                  "sm:grid sm:[grid-template-columns:36px_1fr_auto] sm:gap-x-4",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                )}
              >
                <Initials name={member} />
                <div className="min-w-0 flex-1 sm:flex-none flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member}</p>
                  {isManager && (
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 shrink-0">
                      Manager
                    </Badge>
                  )}
                </div>
                <div className="ml-auto sm:ml-0 flex items-center justify-end gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => setSelectedMember(member)}
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1.5" asChild>
                    <Link href="/dashboard/department-head/messages">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Message</span>
                    </Link>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="border-t bg-muted/20 px-5 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>
            <span className="font-medium text-foreground">{team.members.length}</span> member{team.members.length !== 1 ? "s" : ""} in this group
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {label}
          </span>
        </div>
      </div>

      {/* Member detail popup */}
      {selectedMember && (
        <MemberPopup
          member={selectedMember}
          team={team}
          open={!!selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}
