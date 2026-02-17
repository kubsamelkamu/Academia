"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AlertTriangle, GraduationCap, Plus, Send, Timer, Users } from "lucide-react"

type InviteRole = "Coordinator" | "Advisor" | "Committee Member"
type DepartmentRole = "All" | "Department Head" | "Coordinator" | "Advisor" | "Committee Member" | "Student"

interface InviteRecord {
  id: string
  name: string
  email: string
  role: InviteRole
  status: "Pending" | "Sent"
  createdAt: string
}

interface UserRoleStat {
  role: Exclude<DepartmentRole, "All">
  count: number
  note: string
}

interface DepartmentUser {
  id: string
  name: string
  role: Exclude<DepartmentRole, "All">
  status: "Active" | "At Capacity" | "Pending"
}

const supervisionLoad = [
  { track: "Capstone Track", usage: 84, total: 100, risk: "Normal" },
  { track: "Research Track", usage: 92, total: 100, risk: "High" },
  { track: "Industry Projects", usage: 71, total: 100, risk: "Normal" },
  { track: "Innovation Lab", usage: 64, total: 100, risk: "Normal" },
]

const availabilitySignals = [
  { label: "Available for new supervision", count: 14, variant: "secondary" as const },
  { label: "Near capacity", count: 12, variant: "outline" as const },
  { label: "Over capacity", count: 6, variant: "destructive" as const },
]

const initialInvites: InviteRecord[] = [
  {
    id: "invite-1",
    name: "Dr. Sara Ibrahim",
    email: "sara.ibrahim@university.edu",
    role: "Advisor",
    status: "Pending",
    createdAt: "Today, 09:40",
  },
  {
    id: "invite-2",
    name: "Eng. Kareem Nabil",
    email: "kareem.nabil@university.edu",
    role: "Committee Member",
    status: "Sent",
    createdAt: "Yesterday, 16:10",
  },
]

const userRoleStats: UserRoleStat[] = [
  { role: "Department Head", count: 1, note: "Primary owner" },
  { role: "Coordinator", count: 4, note: "Program operations" },
  { role: "Advisor", count: 36, note: "Academic supervision" },
  { role: "Committee Member", count: 12, note: "Defense evaluations" },
  { role: "Student", count: 214, note: "Active in department" },
]

const departmentUsers: DepartmentUser[] = [
  { id: "u1", name: "Dr. Nadia Hassan", role: "Coordinator", status: "Active" },
  { id: "u2", name: "Dr. Sara Ibrahim", role: "Advisor", status: "At Capacity" },
  { id: "u3", name: "Prof. Mohamed Adel", role: "Advisor", status: "Active" },
  { id: "u4", name: "Eng. Kareem Nabil", role: "Committee Member", status: "Pending" },
  { id: "u5", name: "Rana Youssef", role: "Student", status: "Active" },
  { id: "u6", name: "Yousef Tarek", role: "Student", status: "Pending" },
]

export default function FacultyPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<InviteRole>("Advisor")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [invites, setInvites] = useState<InviteRecord[]>(initialInvites)
  const [activeRole, setActiveRole] = useState<DepartmentRole>("All")
  const [searchQuery, setSearchQuery] = useState("")

  const pendingInviteCount = useMemo(
    () => invites.filter((item) => item.status === "Pending").length,
    [invites]
  )

  const filteredUsers = useMemo(() => {
    return departmentUsers.filter((user) => {
      const roleMatch = activeRole === "All" || user.role === activeRole
      const query = searchQuery.trim().toLowerCase()
      const searchMatch =
        query.length === 0 ||
        user.name.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)

      return roleMatch && searchMatch
    })
  }, [activeRole, searchQuery])

  const filteredInvites = useMemo(() => {
    return invites.filter((invite) => activeRole === "All" || invite.role === activeRole)
  }, [activeRole, invites])

  const handleInviteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    const newInvite: InviteRecord = {
      id: `invite-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status: "Pending",
      createdAt: "Just now",
    }

    setInvites((current) => [newInvite, ...current])
    setName("")
    setEmail("")
    setRole("Advisor")
    setMessage("")
    setError("")
    setIsInviteOpen(false)
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Faculty"
        description="Manage people and supervision quality inside your department."
        badge="Department Head"
        actions={
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Faculty User</DialogTitle>
                <DialogDescription>
                  Add a new faculty member, coordinator, or committee member to the department workspace.
                </DialogDescription>
              </DialogHeader>

              <form id="faculty-invite-form" className="space-y-4" onSubmit={handleInviteSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Full name</Label>
                  <Input
                    id="invite-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@university.edu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(event) => setRole(event.target.value as InviteRole)}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px] h-9 w-full rounded-md border px-3 py-1 text-sm outline-none"
                  >
                    <option value="Coordinator">Coordinator</option>
                    <option value="Advisor">Advisor</option>
                    <option value="Committee Member">Committee Member</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-message">Message (optional)</Label>
                  <Textarea
                    id="invite-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Include role context or onboarding notes"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </form>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)} type="button">
                  Cancel
                </Button>
                <Button form="faculty-invite-form" type="submit">
                  <Send className="h-4 w-4" />
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <DashboardKpiGrid
        items={[
          { title: "Active Faculty", value: "52", note: "Within this department", icon: Users },
          { title: "Supervisors", value: "36", note: "Currently mentoring teams", icon: GraduationCap },
          { title: "At Capacity", value: "7", note: "Need load balancing", icon: AlertTriangle },
          { title: "Avg Review Cycle", value: "4d", note: "Department turnaround", icon: Timer },
        ]}
      />

      <DashboardSectionCard
        title="Department User Roles"
        description="Interactive role cards with user counts. Click a role to filter records below."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {userRoleStats.map((item) => {
            const isActive = activeRole === item.role
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => setActiveRole(item.role)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-accent"
                )}
              >
                <p className="text-xs text-muted-foreground">{item.role}</p>
                <p className="mt-1 text-2xl font-semibold">{item.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeRole === "All" ? "default" : "outline"}
            onClick={() => setActiveRole("All")}
          >
            Show All Roles
          </Button>
          <Badge variant="secondary">Focused Role: {activeRole}</Badge>
        </div>
      </DashboardSectionCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardSectionCard
          className="xl:col-span-2"
          title="Supervision Load Distribution"
          description="Compare faculty advisory load and identify imbalance risks."
        >
          <div className="space-y-4">
            {supervisionLoad.map((row) => (
              <div key={row.track} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">{row.track}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={row.risk === "High" ? "destructive" : "secondary"}>{row.risk}</Badge>
                    <span className="text-muted-foreground">
                      {row.usage}/{row.total}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={row.risk === "High" ? "h-2 rounded-full bg-destructive" : "h-2 rounded-full bg-primary"}
                    style={{ width: `${row.usage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Availability Signals"
          description="Detect overbooked and available faculty quickly."
        >
          <div className="space-y-3">
            {availabilitySignals.map((item) => (
              <div key={item.label} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{item.label}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant={item.variant}>{item.count}</Badge>
                  <span className="text-xs text-muted-foreground">Faculty members</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard
        title="Department People Directory"
        description="Search and monitor users by role and workload status."
      >
        <div className="space-y-3">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by user name or role"
          />

          {filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users match the selected role/filter.</p>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <Badge
                    variant={
                      user.status === "At Capacity"
                        ? "destructive"
                        : user.status === "Pending"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {user.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Recent Invites"
        description="Track invitation status for newly invited users in this department."
      >
        <div className="space-y-3">
          {filteredInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invites sent yet.</p>
          ) : (
            filteredInvites.map((invite) => (
              <div key={invite.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{invite.name}</p>
                  <Badge variant={invite.status === "Pending" ? "secondary" : "outline"}>{invite.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{invite.email}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{invite.role}</span>
                  <span>{invite.createdAt}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {pendingInviteCount} pending invite{pendingInviteCount === 1 ? "" : "s"} awaiting acceptance.
        </div>
      </DashboardSectionCard>
    </div>
  )
}
