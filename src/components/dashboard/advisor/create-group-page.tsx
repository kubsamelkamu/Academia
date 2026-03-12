"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus } from "lucide-react"

export function AdvisorCreateGroupPage() {
  const [name, setName] = React.useState("")
  const [projectTitle, setProjectTitle] = React.useState("")
  const [notes, setNotes] = React.useState("")

  function create() {
    if (!name.trim() || !projectTitle.trim()) {
      toast.error("Missing information", { description: "Please provide a group name and project title." })
      return
    }

    toast.success("Group created", { description: `${name} • ${projectTitle}` })
    setName("")
    setProjectTitle("")
    setNotes("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Create New Group</h1>
          <p className="text-sm text-muted-foreground">Set up a new student group and associate it with a project.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Group Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Team Orion" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Project title</Label>
            <Input
              id="project"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Secure Research Data Platform"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end">
            <Button className="btn-gradient" onClick={create}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorCreateGroupPage

