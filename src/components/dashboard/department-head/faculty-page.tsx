"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  BarChart3,
  BookOpen,
  Download,
  Edit,
  Eye,
  FileText,
  Key,
  Mail,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  Users,
} from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockFaculty, type Faculty } from "@/lib/mock/faculty"

const generateTempPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function DepartmentHeadFacultyPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")

  const handleResetPassword = (faculty: Faculty) => {
    const newPassword = generateTempPassword()
    toast.success("Temporary Password Generated", {
      description: `New temporary password for ${faculty.name}: ${newPassword}. Faculty member must change on first login.`,
      duration: 5000,
    })
  }

  const handleSendInvite = (faculty: Faculty) => {
    toast.success("Invitation Sent", {
      description: `Login instructions have been sent to ${faculty.email}`,
    })
  }

  const handleExportData = () => {
    toast.success("Export Started", {
      description: "Faculty data export will be downloaded shortly",
    })
  }

  const filteredFaculty = mockFaculty.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = selectedRole === "all" || f.role === selectedRole
    const matchesStatus = selectedStatus === "all" || f.status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = [
    {
      label: "Total Faculty",
      value: mockFaculty.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Active Advisors",
      value: mockFaculty.filter((f) => f.role === "advisor" && f.status === "active").length,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Total Courses",
      value: mockFaculty.reduce((acc, f) => acc + (f.courses ?? 0), 0),
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      label: "Students Supervised",
      value: mockFaculty.reduce((acc, f) => acc + (f.students ?? 0), 0),
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
                placeholder="Search faculty by name, email, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex h-9 w-[150px] items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Roles</option>
                <option value="advisor">Advisor</option>
                <option value="evaluator">Evaluator</option>
                <option value="group_manager">Group Manager</option>
                <option value="dc_committee">DC Committee</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
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
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Users className="mr-2 h-4 w-4" />
              Grid
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map((f) => (
                  <TableRow
                    key={f.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/department-head/faculty/${f.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {f.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{f.name}</p>
                          <p className="text-muted-foreground text-sm">{f.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {f.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{f.specialization ?? "General"}</p>
                        <p className="text-muted-foreground text-xs">{f.office}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="text-muted-foreground h-3 w-3" />
                          <span>{f.courses} Courses</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="text-muted-foreground h-3 w-3" />
                          <span>{f.students} Students</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={f.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View detail"
                          asChild
                        >
                          <Link href={`/dashboard/department-head/faculty/${f.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit Faculty"
                          asChild
                        >
                          <Link href={`/dashboard/department-head/faculty/edit/${f.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(f)}
                          title="Generate Temporary Password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendInvite(f)}
                          title="Send Login Invite"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Deactivate"
                          asChild
                        >
                          <Link href={`/dashboard/department-head/faculty/deactivate/${f.id}`}>
                            <UserX className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredFaculty.map((faculty) => (
                <Card key={faculty.id} className="transition-shadow hover:shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
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
                        <Badge variant="outline" className="capitalize">
                          {faculty.role.replace("_", " ")}
                        </Badge>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground text-sm">
                          {faculty.specialization}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {faculty.courses} courses
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {faculty.students} students
                        </span>
                      </div>

                      <div className="text-muted-foreground text-sm">{faculty.office}</div>
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
                      <Button variant="ghost" size="sm" onClick={() => handleResetPassword(faculty)}>
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleSendInvite(faculty)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
