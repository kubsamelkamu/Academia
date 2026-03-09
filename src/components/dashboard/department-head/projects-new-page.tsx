"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FolderOpen } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ProjectsNewPage() {
  const [title, setTitle] = useState("")
  const [groupName, setGroupName] = useState("")
  const [advisorName, setAdvisorName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Project created", {
      description: "The new project has been created and is now active.",
    })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="New project"
        description="Create a new department project"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/projects" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., AI-Powered Student Assistant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupName">Group name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Group Alpha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advisorName">Advisor name</Label>
              <Input
                id="advisorName"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                placeholder="e.g., Dr. Sarah Johnson"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit">Create project</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/department-head/projects">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
