"use client"

import React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockTeams } from "./projects-teams-data"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import {
  Crown,
  Eye,
  FolderOpen,
  MessageSquare,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── helpers ──────────────────────────────────────────────────────── */
function initials(name: string) {
  const p = name.trim().split(" ")
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase()
}

function statusStyle(status: string) {
  switch (status) {
    case "active":    return "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400"
    case "submitted": return "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400"
    case "on-hold":   return "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400"
    default:          return "bg-muted text-muted-foreground"
  }
}

/* ── component ────────────────────────────────────────────────────── */
export function ProjectsTeamMemberDetailPage() {
  const params   = useParams()
  const teamId   = (params?.teamId   as string) || ""
  const memberId = decodeURIComponent((params?.memberId as string) || "")

  const team     = mockTeams.find((t) => t.id === teamId)
  const isMember = team?.members.includes(memberId)

  if (!team || !isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold">Student not found</p>
        <DashboardBackLink href="/dashboard/department-head/projects/teams" variant="outline" />
      </div>
    )
  }

  const isManager = memberId === team.managerName

  return (
    <div className="flex justify-center py-2 px-2">
      <Card className="w-full max-w-2xl overflow-hidden shadow-md">

        {/* ── Gradient header ───────────────────────────────────────── */}
        <div className="relative h-14 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
          <DashboardBackLink
            href={`/dashboard/department-head/projects/teams/${teamId}`}
            className="absolute top-2 left-2 h-6 text-[11px] px-2 bg-background/60 hover:bg-background/80 backdrop-blur-sm border-0 shadow-none"
          />

          <Button size="sm" asChild
            className="absolute top-2 right-2 h-6 text-[11px] gap-1 px-2"
          >
            <Link href="/dashboard/department-head/messages">
              <MessageSquare className="h-3 w-3" /> Message
            </Link>
          </Button>

          {/* Avatar */}
          <div className="absolute -bottom-5 left-4">
            <div className="h-10 w-10 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center font-bold text-primary text-sm shadow-sm">
              {initials(memberId)}
            </div>
          </div>
        </div>

        {/* ── Identity row ──────────────────────────────────────────── */}
        <div className="pt-6 px-4 pb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{memberId}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {team.groupName} · {team.semester}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isManager ? (
              <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20 text-[10px] h-5">
                <Crown className="h-2.5 w-2.5" /> Manager
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] h-5">Member</Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px] capitalize h-5", statusStyle(team.status))}>
              {team.status.replace("-", " ")}
            </Badge>
          </div>
        </div>

        <Separator />

        <CardContent className="pt-3 pb-3 px-4 space-y-3">

          {/* ── Project context ───────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FolderOpen className="h-3 w-3 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Project Context</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Project</p>
                <p className="text-xs font-medium mt-0.5 truncate" title={team.projectTitle}>{team.projectTitle}</p>
              </div>
              {[
                { label: "Group",    value: team.groupName },
                { label: "Advisor",  value: team.advisorName },
                { label: "Manager",  value: team.managerName },
                { label: "Semester", value: team.semester },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-[11px] font-medium mt-0.5 truncate" title={value}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Fellow members ────────────────────────────────────── */}
          {team.members.filter((m) => m !== memberId).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-3 w-3 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fellow Members</p>
                <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
                  {team.members.length - 1}
                </Badge>
              </div>
              <ul className="space-y-0.5">
                {team.members
                  .filter((m) => m !== memberId)
                  .map((m) => (
                    <li
                      key={m}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-semibold text-primary">{initials(m)}</span>
                        </div>
                        <span className="text-xs truncate">{m}</span>
                        {m === team.managerName && (
                          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 shrink-0 h-4">
                            Manager
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" asChild>
                        <Link href={`/dashboard/department-head/projects/teams/${teamId}/members/${encodeURIComponent(m)}`}>
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
