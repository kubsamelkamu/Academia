"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, Archive } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ProjectsArchivedPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Archived projects"
        description="Completed and archived projects"
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
            <Archive className="h-5 w-5" />
            Completed projects
          </CardTitle>
          <CardDescription>
            View completed and archived projects from the main overview. Use the Past tab to see all completed projects with documentation.
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
