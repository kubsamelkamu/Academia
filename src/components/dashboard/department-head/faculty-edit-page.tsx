"use client"

import React, { useState } from "react"
import Link from "next/link"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getFacultyById } from "@/lib/mock/faculty"
import { toast } from "sonner"

interface FacultyEditPageProps {
  facultyId: string
}

export function FacultyEditPage({ facultyId }: FacultyEditPageProps) {
  const faculty = getFacultyById(facultyId)
  const [name, setName] = useState(faculty?.name ?? "")
  const [email, setEmail] = useState(faculty?.email ?? "")
  const [specialization, setSpecialization] = useState(faculty?.specialization ?? "")
  const [office, setOffice] = useState(faculty?.office ?? "")
  const [phone, setPhone] = useState(faculty?.phone ?? "")

  if (!faculty) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Faculty not found"
          description="The requested faculty member could not be found."
        />
        <DashboardBackLink href="/dashboard/department-head/faculty" variant="outline" />
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Faculty updated", {
      description: "Changes have been saved for " + name,
    })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Edit faculty"
        description={`Edit details for ${faculty.name}`}
        actions={<DashboardBackLink href="/dashboard/department-head/faculty" variant="outline" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Faculty details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@university.edu"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Artificial Intelligence"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office">Office</Label>
                <Input
                  id="office"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  placeholder="Room 401, CS Building"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/department-head/faculty/${faculty.id}`}>
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
