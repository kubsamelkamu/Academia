"use client"

import React, { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  BarChart3,
  Download,
  Edit,
  Eye,
  Mail,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  Users,
} from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTenantUsers } from "@/lib/hooks/use-users"

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

const FACULTY_PAGE_SIZE = 9

const ALLOWED_ROLE_MAP: Record<string, { role: FacultyRole; label: FacultyUser["roleLabel"] }> = {
  advisor: { role: "advisor", label: "Advisor" },
  coordinator: { role: "coordinator", label: "Coordinator" },
  student: { role: "student", label: "Student" },
}

function formatLastLogin(value: string | null) {
  if (!value) {
    return "Never"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function DepartmentHeadFacultyPage() {
  const { data: tenantUsers = [], isLoading, isError, error } = useTenantUsers()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const facultyUsers: FacultyUser[] = tenantUsers
    .map((user) => {
      const roleName = user.roles?.[0]?.role?.name ?? ""
      const normalizedRole = roleName.toLowerCase()
      const mappedRole = ALLOWED_ROLE_MAP[normalizedRole]

      if (!mappedRole || (user.status ?? "").toUpperCase() !== "ACTIVE") {
        return null
      }

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()

      return {
        id: user.id,
        name: fullName.length > 0 ? fullName : user.email,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        role: mappedRole.role,
        roleLabel: mappedRole.label,
        status: "active",
        emailVerified: Boolean(user.emailVerified),
        lastLoginAt: user.lastLoginAt ?? null,
      }
    })
    .filter((user): user is FacultyUser => user !== null)

  const handleSendInvite = (faculty: FacultyUser) => {
    toast.success("Invitation Sent", {
      description: `Login instructions have been sent to ${faculty.email}`,
    })
  }

  const handleExportData = () => {
    toast.success("Export Started", {
      description: "Faculty data export will be downloaded shortly",
    })
  }

  const filteredFaculty = facultyUsers.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = selectedRole === "all" || f.role === selectedRole
    const matchesStatus = selectedStatus === "all" || f.status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredFaculty.length / FACULTY_PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pagedFaculty = filteredFaculty.slice(
    (safePage - 1) * FACULTY_PAGE_SIZE,
    safePage * FACULTY_PAGE_SIZE
  )

  const stats = [
    {
      label: "Total Faculty",
      value: facultyUsers.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Active Advisors",
      value: facultyUsers.filter((f) => f.role === "advisor" && f.status === "active").length,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Active Coordinators",
      value: facultyUsers.filter((f) => f.role === "coordinator" && f.status === "active").length,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      label: "Active Students",
      value: facultyUsers.filter((f) => f.role === "student" && f.status === "active").length,
      icon: Users,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Faculty Management"
        description="Manage faculty members, their assignments, and access credentials"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild>
              <Link href="/dashboard/department-head/invitations">
                <Plus className="mr-2 h-4 w-4" /> Add Faculty
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{stat.label}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search faculty by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value)
                  setCurrentPage(1)
                }}
                className="flex h-9 w-[150px] items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Roles</option>
                <option value="advisor">Advisor</option>
                <option value="coordinator">Coordinator</option>
                <option value="student">Student</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="flex h-9 w-[150px] items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedRole("all")
                  setSelectedStatus("all")
                  setCurrentPage(1)
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faculty List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Faculty Members</CardTitle>
            <CardDescription>{filteredFaculty.length} faculty members found</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-muted-foreground p-6 text-sm">Loading active users...</div>
          ) : isError ? (
            <div className="p-6 text-sm text-destructive">
              Failed to load users{error?.message ? `: ${error.message}` : ""}
            </div>
          ) : (
            <>
              <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                {pagedFaculty.map((faculty) => (
                <Card key={faculty.id} className="transition-shadow hover:shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={faculty.avatarUrl ?? undefined} alt={faculty.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {faculty.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{faculty.name}</p>
                          <p className="text-muted-foreground text-sm">{faculty.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={faculty.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {faculty.status}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">
                          {faculty.roleLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {faculty.emailVerified ? "Email verified" : "Email not verified"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Last login: {formatLastLogin(faculty.lastLoginAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                      <Button variant="ghost" size="sm" title="View detail" asChild>
                        <Link href={`/dashboard/department-head/faculty/${faculty.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/department-head/faculty/edit/${faculty.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleSendInvite(faculty)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        title="Deactivate"
                        asChild
                      >
                        <Link href={`/dashboard/department-head/faculty/deactivate/${faculty.id}`}>
                          <UserX className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-muted-foreground text-sm">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                    disabled={safePage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-muted/20">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Faculty Management Tools</h3>
              <p className="text-muted-foreground text-sm">
                Generate reports, manage assignments, and more
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/department-head/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
