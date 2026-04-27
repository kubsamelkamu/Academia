"use client"

import React, { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Download,
  Edit,
  Eye,
  Grid3x3,
  List,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserCheck,
  UserX,
  Users,
  GraduationCap,
  ShieldCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useTenantUsers } from "@/lib/hooks/use-users"

// ─── Types ────────────────────────────────────────────────────────────────────

type FacultyRole = "advisor" | "coordinator" | "student"

type FacultyUser = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: FacultyRole
  roleLabel: "Advisor" | "Coordinator" | "Student"
  status: "active"
  emailVerified: boolean
  lastLoginAt: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FACULTY_PAGE_SIZE = 9

const ALLOWED_ROLE_MAP: Record<
  string,
  { role: FacultyRole; label: FacultyUser["roleLabel"] }
> = {
  advisor: { role: "advisor", label: "Advisor" },
  coordinator: { role: "coordinator", label: "Coordinator" },
  student: { role: "student", label: "Student" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastLogin(value: string | null) {
  if (!value) return "Never"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepartmentHeadFacultyPage() {
  const { data: tenantUsers = [], isLoading, isError, error, refetch } =
    useTenantUsers()

  // list state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // dialog state – view detail
  const [detailUser, setDetailUser] = useState<FacultyUser | null>(null)

  // dialog state – edit
  const [editUser, setEditUser] = useState<FacultyUser | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")

  // dialog state – compose email
  const [emailUser, setEmailUser] = useState<FacultyUser | null>(null)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")

  // dialog state – deactivate
  const [deleteUser, setDeleteUser] = useState<FacultyUser | null>(null)

  // ── derived data ────────────────────────────────────────────────────────────

  const facultyUsers: FacultyUser[] = tenantUsers
    .map((user) => {
      const roleName = user.roles?.[0]?.role?.name ?? ""
      const normalizedRole = roleName.toLowerCase()
      const mappedRole = ALLOWED_ROLE_MAP[normalizedRole]
      if (!mappedRole || (user.status ?? "").toUpperCase() !== "ACTIVE")
        return null
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
      return {
        id: user.id,
        name: fullName.length > 0 ? fullName : user.email,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        role: mappedRole.role,
        roleLabel: mappedRole.label,
        status: "active" as const,
        emailVerified: Boolean(user.emailVerified),
        lastLoginAt: user.lastLoginAt ?? null,
      }
    })
    .filter((u): u is FacultyUser => u !== null)

  const filteredFaculty = facultyUsers.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || f.role === selectedRole
    return matchesSearch && matchesRole
  })

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFaculty.length / FACULTY_PAGE_SIZE)
  )
  const safePage = Math.min(currentPage, totalPages)
  const pagedFaculty = filteredFaculty.slice(
    (safePage - 1) * FACULTY_PAGE_SIZE,
    safePage * FACULTY_PAGE_SIZE
  )

  const kpi = [
    {
      label: "Total Members",
      value: facultyUsers.length,
      sub: "All active users",
      icon: Users,
    },
    {
      label: "Advisors",
      value: facultyUsers.filter((f) => f.role === "advisor").length,
      sub: "Supervising projects",
      icon: UserCheck,
    },
    {
      label: "Coordinators",
      value: facultyUsers.filter((f) => f.role === "coordinator").length,
      sub: "Program coordination",
      icon: ShieldCheck,
    },
    {
      label: "Students",
      value: facultyUsers.filter((f) => f.role === "student").length,
      sub: "Enrolled this semester",
      icon: GraduationCap,
    },
  ]

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleExportData = () => {
    toast.success("Export started", {
      description: "Faculty data export will download shortly",
    })
  }

  const openEdit = (faculty: FacultyUser) => {
    setEditUser(faculty)
    setEditName(faculty.name)
    setEditRole(faculty.roleLabel)
  }

  const openEmail = (faculty: FacultyUser) => {
    setEmailUser(faculty)
    setEmailSubject("")
    setEmailBody("")
  }

  const handleSaveEdit = () => {
    if (!editUser) return
    toast.success(`Profile updated for ${editName}`)
    setEditUser(null)
  }

  const handleSendEmail = () => {
    if (!emailUser) return
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Please fill in both subject and message.")
      return
    }
    toast.success(`Email sent to ${emailUser.name}`, {
      description: `Subject: ${emailSubject}`,
    })
    setEmailUser(null)
  }

  const handleDeactivate = () => {
    if (!deleteUser) return
    toast.success(`${deleteUser.name} has been deactivated`)
    setDeleteUser(null)
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Faculty Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage members, assignments, and access credentials
          </p>
        </div>
        <div className="flex gap-2 mt-1 sm:mt-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportData}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/dashboard/department-head/invitations">
              <Plus className="h-3.5 w-3.5" />
              Add Faculty
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpi.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Members Card ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Members</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading…"
                  : `${filteredFaculty.length} member${filteredFaculty.length !== 1 ? "s" : ""} found`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name or email…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-8 h-8 w-48 text-sm"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">All Roles</option>
                <option value="advisor">Advisor</option>
                <option value="coordinator">Coordinator</option>
                <option value="student">Student</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedRole("all")
                  setCurrentPage(1)
                  refetch()
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              {/* View toggle */}
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  title="Grid view"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  title="List view"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading members…
            </div>
          ) : isError ? (
            <div className="py-12 text-center">
              <p className="text-sm text-destructive mb-3">
                Failed to load users{error?.message ? `: ${error.message}` : ""}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium">No members found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <>
              {/* ── List view ── */}
              {viewMode === "list" && (
                <div className="space-y-2">
                  {pagedFaculty.map((faculty) => (
                    <div
                      key={faculty.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow"
                    >
                      {/* Left: avatar + name/email */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={faculty.avatarUrl ?? undefined} alt={faculty.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {initials(faculty.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{faculty.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{faculty.email}</p>
                        </div>
                      </div>

                      {/* Middle: role + verified */}
                      <div className="hidden sm:flex items-center gap-2 mx-4 shrink-0">
                        <Badge variant="outline" className="text-xs capitalize">
                          {faculty.roleLabel}
                        </Badge>
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            faculty.emailVerified ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          <UserCheck className="h-3 w-3 shrink-0" />
                          {faculty.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>

                      {/* Right: status badge + action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="default" className="capitalize text-xs">
                          {faculty.status}
                        </Badge>
                        <div className="flex items-center gap-0.5 border-l pl-2 ml-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View detail" onClick={() => setDetailUser(faculty)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(faculty)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Compose email" onClick={() => openEmail(faculty)}>
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Deactivate" onClick={() => setDeleteUser(faculty)}>
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Grid view ── */}
              {viewMode === "grid" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pagedFaculty.map((faculty) => (
                    <Card key={faculty.id} className="transition-shadow hover:shadow-lg overflow-hidden">
                      <CardContent className="pt-5 px-5">
                        {/* Top row */}
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11 shrink-0">
                            <AvatarImage src={faculty.avatarUrl ?? undefined} alt={faculty.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {initials(faculty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm truncate">{faculty.name}</p>
                              <Badge variant="default" className="text-[10px] capitalize shrink-0">
                                {faculty.status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs truncate mt-0.5">{faculty.email}</p>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{faculty.roleLabel}</Badge>
                            <span className={`text-xs flex items-center gap-1 ${faculty.emailVerified ? "text-emerald-600" : "text-muted-foreground"}`}>
                              <UserCheck className="h-3 w-3 shrink-0" />
                              {faculty.emailVerified ? "Verified" : "Unverified"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3 shrink-0" />
                            Last login: {formatLastLogin(faculty.lastLoginAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View detail" onClick={() => setDetailUser(faculty)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(faculty)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Compose email" onClick={() => openEmail(faculty)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Deactivate" onClick={() => setDeleteUser(faculty)}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {(safePage - 1) * FACULTY_PAGE_SIZE + 1}–
                    {Math.min(
                      safePage * FACULTY_PAGE_SIZE,
                      filteredFaculty.length
                    )}{" "}
                    of {filteredFaculty.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={safePage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={safePage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Need to add more members?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use the invitations page to send email invites or bulk import via
              CSV
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/department-head/reports">View Reports</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/department-head/invitations">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Invite Members
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════
           VIEW DETAIL DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!detailUser}
        onOpenChange={(open) => { if (!open) setDetailUser(null) }}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {detailUser ? `${detailUser.name} details` : "Member details"}
            </DialogTitle>
            <DialogDescription>View faculty member profile details.</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <>
              {/* Gradient header */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                    <AvatarImage
                      src={detailUser.avatarUrl ?? undefined}
                      alt={detailUser.name}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                      {initials(detailUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold truncate">
                      {detailUser.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {detailUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="capitalize text-xs">
                        {detailUser.roleLabel}
                      </Badge>
                      <Badge variant="default" className="capitalize text-xs">
                        {detailUser.status}
                      </Badge>
                      {detailUser.emailVerified && (
                        <Badge
                          variant="outline"
                          className="text-xs text-emerald-600 border-emerald-300"
                        >
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* Profile details card */}
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Profile Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Role
                      </p>
                      <p className="font-medium">{detailUser.roleLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Email Verified
                      </p>
                      <p
                        className={`font-medium ${detailUser.emailVerified ? "text-emerald-600" : "text-muted-foreground"}`}
                      >
                        {detailUser.emailVerified ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Last Login
                      </p>
                      <p className="font-medium">
                        {formatLastLogin(detailUser.lastLoginAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick-action card */}
                <Card className="border-border/60">
                  <CardContent className="px-4 py-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={() => {
                        setDetailUser(null)
                        openEdit(detailUser)
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={() => {
                        setDetailUser(null)
                        openEmail(detailUser)
                      }}
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="px-6 pb-5 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailUser(null)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           EDIT DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => { if (!open) setEditUser(null) }}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {editUser ? `Edit ${editUser.name}` : "Edit member"}
            </DialogTitle>
            <DialogDescription>Update member profile details.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <>
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-md shrink-0">
                    <AvatarImage
                      src={editUser.avatarUrl ?? undefined}
                      alt={editUser.name}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {initials(editUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{editUser.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {editUser.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Edit Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Display Name
                      </label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Role</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="Advisor">Advisor</option>
                        <option value="Coordinator">Coordinator</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Email{" "}
                        <span className="text-muted-foreground font-normal">
                          (read-only)
                        </span>
                      </label>
                      <Input
                        value={editUser.email}
                        disabled
                        className="bg-muted/60 text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="px-6 pb-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           COMPOSE EMAIL DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!emailUser}
        onOpenChange={(open) => { if (!open) setEmailUser(null) }}
      >
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {emailUser ? `Message ${emailUser.name}` : "Compose message"}
            </DialogTitle>
            <DialogDescription>Compose and send an email to this member.</DialogDescription>
          </DialogHeader>
          {emailUser && (
            <>
              {/* Email header bar */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-5 pb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight">New Message</p>
                  <p className="text-xs text-muted-foreground">
                    Compose and send an email to this member
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* To / Recipient card */}
                <Card className="border-border/60">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10 shrink-0">
                        To
                      </p>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage
                            src={emailUser.avatarUrl ?? undefined}
                            alt={emailUser.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {initials(emailUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          {emailUser.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:block">
                          &lt;{emailUser.email}&gt;
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize ml-auto shrink-0"
                        >
                          {emailUser.roleLabel}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compose card */}
                <Card className="border-border/60">
                  <CardContent className="px-4 pb-4 pt-3 space-y-3">
                    {/* Subject */}
                    <div className="flex items-center gap-1.5 border-b pb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
                        Subject
                      </p>
                      <Separator orientation="vertical" className="h-4" />
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Enter subject…"
                        className="border-0 shadow-none focus-visible:ring-0 px-2 h-8 text-sm"
                      />
                    </div>
                    {/* Body */}
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write your message here…"
                      rows={6}
                      className="resize-none border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Footer toolbar */}
              <div className="px-6 pb-5 flex items-center justify-between gap-2 border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  {emailBody.length > 0
                    ? `${emailBody.length} character${emailBody.length !== 1 ? "s" : ""}`
                    : "Start typing your message"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEmailUser(null)}
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleSendEmail}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Email
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           DEACTIVATE DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!deleteUser}
        onOpenChange={(open) => { if (!open) setDeleteUser(null) }}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {deleteUser ? `Deactivate ${deleteUser.name}` : "Deactivate member"}
            </DialogTitle>
            <DialogDescription>Confirm deactivating a member.</DialogDescription>
          </DialogHeader>
          {deleteUser && (
            <>
              {/* Danger header */}
              <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background px-6 pt-6 pb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-bold text-destructive">
                    Deactivate Member
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Access will be revoked. You can re-activate them later.
                </p>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* Member identity card */}
                <Card className="border-border/60">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={deleteUser.avatarUrl ?? undefined}
                        alt={deleteUser.name}
                      />
                      <AvatarFallback className="bg-destructive/10 text-destructive font-bold">
                        {initials(deleteUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{deleteUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {deleteUser.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs shrink-0">
                      {deleteUser.roleLabel}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Warning card */}
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="px-4 py-3">
                    <p className="text-sm font-medium text-destructive">
                      Are you sure you want to deactivate{" "}
                      <span className="font-bold">{deleteUser.name}</span>?
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      They will immediately lose access to all department
                      resources, projects, and communications.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="px-6 pb-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDeactivate}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Yes, Deactivate
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
