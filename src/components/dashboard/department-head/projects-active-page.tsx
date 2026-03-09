"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, FolderOpen } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ProjectsActivePage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Active projects"
        description="All current projects in progress"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/projects" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Current projects
          </CardTitle>
          <CardDescription>
            View and manage active projects from the main overview. Use the Active tab to see all projects in progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/department-head/projects">Open projects overview</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
