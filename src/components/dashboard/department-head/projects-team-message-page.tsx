"use client"

import React from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { mockTeams } from "./projects-teams-data"
import { ArrowLeft, Send } from "lucide-react"
import { toast } from "sonner"

export function ProjectsTeamMessagePage() {
  const router = useRouter()
  const params = useParams()
  const teamId = (params?.teamId as string) || ""
  const team = mockTeams.find((t) => t.id === teamId)

  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Team not found</p>
          <Button variant="outline" onClick={() => router.push("/dashboard/department-head/projects/teams")}>
            Go back to teams
          </Button>
        </div>
      </div>
    )
  }

  const handleSend = () => {
    toast("Message sent", {
      description: `Your message has been queued for ${team.managerName}. (Mock flow)`,
    })
    setSubject("")
    setMessage("")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-primary/10 sticky top-0 z-10 backdrop-blur-sm">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 hover:bg-background/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold truncate max-w-2xl">
                  Message {team.managerName}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {team.groupName} • {team.projectTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-73px)] overflow-y-auto">
        <div className="px-8 py-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Contact group manager</CardTitle>
              <CardDescription>Send a message about project updates, deadlines, or feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mid-semester progress review"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Write your message to the team manager..."
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={!subject || !message} className="gap-2">
                  <Send className="h-4 w-4" />
                  Send message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

