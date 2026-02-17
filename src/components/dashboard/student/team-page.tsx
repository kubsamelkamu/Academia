"use client"

import { useMemo, useState } from "react"
import {
  DashboardEmptyState,
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Users, UserCheck, Clock3, UserPlus } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  role: string
  status: "Active" | "Pending"
}

interface StudentDirectoryItem {
  id: string
  name: string
  interest: string
}

const currentStudent = {
  id: "self",
  name: "You",
}

const studentDirectory: StudentDirectoryItem[] = [
  { id: "st1", name: "Amina Khaled", interest: "AI and Data Analysis" },
  { id: "st2", name: "Yousef Tarek", interest: "Backend Engineering" },
  { id: "st3", name: "Salma Wael", interest: "UI and UX Design" },
  { id: "st4", name: "Jean Claude", interest: "Mobile Development" },
  { id: "st5", name: "Grace Uwase", interest: "Cloud and DevOps" },
  { id: "st6", name: "Rana Youssef", interest: "Research and Documentation" },
]

export function StudentTeamPage() {
  const [teamName, setTeamName] = useState("")
  const [query, setQuery] = useState("")
  const [inviteQuery, setInviteQuery] = useState("")
  const [formationError, setFormationError] = useState("")
  const [members, setMembers] = useState<TeamMember[]>([])

  const isTeamStarted = members.length > 0

  const activeMembersCount = members.filter((item) => item.status === "Active").length
  const pendingMembersCount = members.filter((item) => item.status === "Pending").length
  const totalMembersCount = members.length
  const isTeamReady = activeMembersCount >= 3 && activeMembersCount <= 5
  const canInviteMore = totalMembersCount < 5

  const formationProgressNote = isTeamReady
    ? "Team formation requirements met"
    : `${Math.max(0, 3 - activeMembersCount)} more active member(s) needed`

  const visibleMembers = useMemo(
    () => members.filter((item) => {
      const normalized = query.toLowerCase().trim()
      return normalized.length === 0
        ? true
        : item.name.toLowerCase().includes(normalized) || item.role.toLowerCase().includes(normalized)
    }),
    [members, query]
  )

  const availableStudents = useMemo(() => {
    const normalized = inviteQuery.toLowerCase().trim()
    const takenIds = new Set(members.map((item) => item.id))

    return studentDirectory.filter((student) => {
      const alreadyIncluded = takenIds.has(student.id)
      if (alreadyIncluded) {
        return false
      }

      if (normalized.length === 0) {
        return true
      }

      return (
        student.name.toLowerCase().includes(normalized) ||
        student.interest.toLowerCase().includes(normalized)
      )
    })
  }, [inviteQuery, members])

  const initiateTeamFormation = () => {
    if (teamName.trim().length < 3) {
      setFormationError("Enter a team name with at least 3 characters.")
      return
    }

    setMembers([
      {
        id: currentStudent.id,
        name: `${currentStudent.name} (Leader)`,
        role: "Leader",
        status: "Active",
      },
    ])
    setFormationError("")
  }

  const inviteStudent = (student: StudentDirectoryItem) => {
    if (!canInviteMore) {
      return
    }

    setMembers((current) => [
      ...current,
      {
        id: student.id,
        name: student.name,
        role: "Member",
        status: "Pending",
      },
    ])
  }

  const markInvitationAccepted = (memberId: string) => {
    setMembers((current) =>
      current.map((item) => (item.id === memberId ? { ...item, status: "Active" } : item))
    )
  }

  const withdrawInvitation = (memberId: string) => {
    setMembers((current) => current.filter((item) => item.id !== memberId))
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Team"
        description="Initiate team formation, invite students, and meet the required 3–5 member team size."
        badge="Student"
      />

      <DashboardKpiGrid
        items={[
          { title: "Team Members", value: `${totalMembersCount}`, note: "Maximum 5", icon: Users },
          { title: "Active Members", value: `${activeMembersCount}`, note: "Minimum 3", icon: UserCheck },
          { title: "Formation Status", value: isTeamReady ? "Ready" : "In Progress", note: formationProgressNote, icon: CheckCircle2 },
          { title: "Pending Invitations", value: `${pendingMembersCount}`, note: "Awaiting response", icon: Clock3 },
        ]}
      />

      <DashboardSectionCard
        title="Team Formation"
        description="Create your team and invite students based on your project interests."
      >
        {!isTeamStarted ? (
          <div className="space-y-3">
            <Input
              value={teamName}
              onChange={(event) => {
                setTeamName(event.target.value)
                if (formationError) {
                  setFormationError("")
                }
              }}
              placeholder="Enter team name"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={initiateTeamFormation}>
                Initiate Team Formation
              </Button>
              <Badge variant="outline">Team size must be 3–5 students</Badge>
            </div>

            {formationError ? <p className="text-xs text-destructive">{formationError}</p> : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{teamName.trim()}</p>
                <Badge variant={isTeamReady ? "secondary" : "outline"}>
                  {isTeamReady ? "Ready" : "In Progress"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formationProgressNote}. You can invite up to {Math.max(0, 5 - totalMembersCount)} more student(s).
              </p>
            </div>
          </div>
        )}
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Members"
        description="Search members and manage pending invitations."
      >
        {!isTeamStarted ? (
          <DashboardEmptyState
            title="Start team formation first"
            description="Initiate team formation to begin inviting students and managing your members."
          />
        ) : (
          <>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or role"
              className="mb-3"
            />

            <div className="space-y-3">
              {visibleMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members found.</p>
              ) : (
                visibleMembers.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.status === "Pending" ? "outline" : "secondary"}>{item.status}</Badge>

                        {item.status === "Pending" ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => markInvitationAccepted(item.id)}>
                              Mark Accepted
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => withdrawInvitation(item.id)}>
                              Withdraw
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Invite Students"
        description="Send invitations to students you are interested in collaborating with."
      >
        {!isTeamStarted ? (
          <DashboardEmptyState
            title="Team not initiated"
            description="Create your team first before sending invitations."
          />
        ) : !canInviteMore ? (
          <DashboardEmptyState
            title="Team member limit reached"
            description="Your team has reached the maximum of 5 members. Remove or withdraw someone before inviting more students."
          />
        ) : (
          <>
            <Input
              value={inviteQuery}
              onChange={(event) => setInviteQuery(event.target.value)}
              placeholder="Search students by name or interest"
              className="mb-3"
            />

            <div className="space-y-3">
              {availableStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available students found.</p>
              ) : (
                availableStudents.map((student) => (
                  <div key={student.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">Interest: {student.interest}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => inviteStudent(student)}
                        disabled={!canInviteMore}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send Invitation
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DashboardSectionCard>
    </div>
  )
}
