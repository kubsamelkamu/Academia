"use client"

import React from "react"
import Link from "next/link"
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  User,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { mockGrades } from "@/data/mockData"
import { cn } from "@/lib/utils"
import { DashboardBackButton, DashboardBackLink } from "@/components/dashboard/dashboard-back"

interface DepartmentHeadStudentDetailPageProps {
  studentId: string
  onClose?: () => void
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

const studentSummaries: StudentSummary[] = [
  { id: "u8",  name: "Maria Garcia",  email: "mgarcia@stanford.edu",  department: "Computer Science", role: "group_manager" },
  { id: "u7",  name: "Alex Johnson",  email: "ajohnson@stanford.edu", department: "Computer Science", role: "student" },
  { id: "s1",  name: "Alex Johnson",  email: "ajohnson@stanford.edu", department: "Computer Science", role: "student" },
  { id: "s2",  name: "David Kim",     email: "dkim@stanford.edu",     department: "Computer Science", role: "student" },
  { id: "u11", name: "Alice Brown",   email: "abrown@stanford.edu",   department: "Computer Science", role: "group_manager" },
  { id: "s3",  name: "Charlie Davis", email: "cdavis@stanford.edu",   department: "Computer Science", role: "student" },
]

const studentGroupMemberships: StudentGroupMembership[] = [
  { groupId: "g1", groupName: "AI‑Driven Academic Assistant", projectTitle: "AI‑Driven Academic Assistant",   isManager: true  },
  { groupId: "g1", groupName: "AI‑Driven Academic Assistant", projectTitle: "AI‑Driven Academic Assistant",   isManager: false },
  { groupId: "g1", groupName: "AI‑Driven Academic Assistant", projectTitle: "AI‑Driven Academic Assistant",   isManager: false },
  { groupId: "g2", groupName: "Blockchain Voting",            projectTitle: "Blockchain‑Based Voting System", isManager: true  },
  { groupId: "g2", groupName: "Blockchain Voting",            projectTitle: "Blockchain‑Based Voting System", isManager: false },
]

function getMembershipsForStudent(studentId: string): StudentGroupMembership[] {
  if (studentId === "u8")                       return [studentGroupMemberships[0]]
  if (studentId === "s1" || studentId === "u7") return [studentGroupMemberships[1]]
  if (studentId === "s2")                       return [studentGroupMemberships[2]]
  if (studentId === "u11")                      return [studentGroupMemberships[3]]
  if (studentId === "s3")                       return [studentGroupMemberships[4]]
  return []
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// Grade colors are semantic (score-driven) — not themed
function gradeColor(score: number) {
  if (score >= 85) return "text-emerald-600"
  if (score >= 70) return "text-blue-600"
  if (score >= 50) return "text-amber-600"
  return "text-destructive"
}

function gradeBg(score: number) {
  if (score >= 85) return "bg-emerald-500/15 text-emerald-700"
  if (score >= 70) return "bg-blue-500/15 text-blue-700"
  if (score >= 50) return "bg-amber-500/15 text-amber-700"
  return "bg-destructive/15 text-destructive"
}

function progressColor(score: number) {
  if (score >= 85) return "[&>div]:bg-emerald-500"
  if (score >= 70) return "[&>div]:bg-blue-500"
  if (score >= 50) return "[&>div]:bg-amber-500"
  return "[&>div]:bg-destructive"
}

export function DepartmentHeadStudentDetailPage({
  studentId,
  onClose,
}: DepartmentHeadStudentDetailPageProps) {
  const student = studentSummaries.find((s) => s.id === studentId)

  if (!student) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Student not found</p>
              <p className="text-sm text-muted-foreground mt-1">The requested student could not be found.</p>
            </div>
            {onClose ? (
              <DashboardBackButton onClick={onClose} variant="outline" />
            ) : (
              <DashboardBackLink href="/dashboard/department-head/review" variant="outline" />
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const memberships   = getMembershipsForStudent(studentId)
  const isManager     = student.role === "group_manager"
  const studentGrades = mockGrades.filter(
    (g) => g.studentName.toLowerCase() === student.name.toLowerCase()
  )
  const avgScore = studentGrades.length > 0
    ? studentGrades.reduce((s, g) => s + g.finalScore, 0) / studentGrades.length
    : null

  return (
    <div className={onClose ? "" : "bg-background/50 py-4"}>
      <div className={onClose ? "" : "mx-auto max-w-2xl px-4 sm:px-6"}>

        {/* ── Single card ── */}
        <Card className="overflow-hidden">

          {/* Gradient header with back button pinned top-left */}
          <div className="relative h-16 bg-gradient-to-br from-primary/25 via-primary/10 to-background">
            {onClose ? (
              <DashboardBackButton
                onClick={onClose}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary/80 hover:text-primary h-7 px-2 shadow-none"
              />
            ) : (
              <DashboardBackLink
                href="/dashboard/department-head/review"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary/80 hover:text-primary h-7 px-2 shadow-none border-0 bg-transparent"
              />
            )}
          </div>

          <CardContent className="px-5 pb-5 -mt-7 space-y-4">

            {/* Avatar + name row */}
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <div className="h-12 w-12 rounded-xl border-4 border-background bg-primary/15 flex items-center justify-center text-base font-bold text-primary shadow-sm shrink-0">
                  {initials(student.name)}
                </div>
                <div className="pb-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base font-bold">{student.name}</h2>
                    {isManager && <Crown className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs shrink-0">
                <MessageSquare className="h-3 w-3" /> Message
              </Button>
            </div>

            {/* Pill badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 capitalize">
                {isManager ? <Crown className="h-2.5 w-2.5" /> : <GraduationCap className="h-2.5 w-2.5" />}
                {roleLabel(student.role)}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <BookOpen className="h-2.5 w-2.5" /> {student.department}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Users className="h-2.5 w-2.5" /> {memberships.length} {memberships.length === 1 ? "group" : "groups"}
              </Badge>
              {avgScore !== null && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <TrendingUp className="h-2.5 w-2.5" /> Avg {avgScore.toFixed(1)}%
                </Badge>
              )}
            </div>

            <Separator />

            {/* Profile fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Full Name",  value: student.name },
                { label: "Email",      value: student.email },
                { label: "Department", value: student.department },
                { label: "Role",       value: roleLabel(student.role) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">{label}</p>
                  <p className="text-xs font-medium truncate">{value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Grade history */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold">Grade History</p>
                <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5">
                  {studentGrades.length} record{studentGrades.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              {studentGrades.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No grades recorded yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {studentGrades.map((grade) => (
                    <div key={grade.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", gradeBg(grade.finalScore))}>
                        {grade.grade}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium capitalize">{grade.type}</p>
                          <Badge variant="outline" className="text-[10px] gap-1 py-0 h-4">
                            {grade.status === "final"
                              ? <><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />Final</>
                              : <><Clock className="h-2.5 w-2.5 text-amber-500" />Provisional</>
                            }
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Progress value={grade.finalScore} className={cn("h-1 w-20", progressColor(grade.finalScore))} />
                          <span className={cn("text-[11px] font-semibold", gradeColor(grade.finalScore))}>
                            {grade.finalScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{grade.updatedAt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Group memberships */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold">Group Memberships</p>
                <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5">{memberships.length}</Badge>
              </div>
              {memberships.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Not assigned to any group.</p>
              ) : (
                <div className="space-y-1.5">
                  {memberships.map((m, i) => (
                    <div key={`${m.groupId}-${i}`} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {m.isManager
                          ? <Crown className="h-3 w-3 text-primary" />
                          : <BookOpen className="h-3 w-3 text-primary" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{m.groupName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.projectTitle}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20 hidden sm:flex h-4">
                          {m.isManager
                            ? <><Crown className="h-2 w-2" />Manager</>
                            : <><User className="h-2 w-2" />Member</>
                          }
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2" asChild>
                          <Link href={`/dashboard/department-head/review/group-${m.groupId}`}>
                            <Users className="h-3 w-3" /><span className="hidden sm:inline">View</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
