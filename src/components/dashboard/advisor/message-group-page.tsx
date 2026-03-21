"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, MessageSquare, Send } from "lucide-react"

const groups = ["AI Research Group", "Team Atlas", "Team Nova"]

export function AdvisorMessageGroupPage() {
  const [group, setGroup] = React.useState(groups[0] ?? "")
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")

  function send() {
    if (!message.trim()) {
      toast.error("Message required", { description: "Please type a message before sending." })
      return
    }

    toast.success("Sent", { description: `${group}${subject ? ` • ${subject}` : ""}` })
    setSubject("")
    setMessage("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Message Group</h1>
          <p className="text-sm text-muted-foreground">Send an announcement or question to a project team.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            Compose
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            <Input id="group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Group name" />
            <p className="text-xs text-muted-foreground">Tip: replace this with a dropdown once groups come from the API.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Prototype feedback" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={7} placeholder="Write your message..." />
          </div>
          <div className="flex justify-end">
            <Button className="btn-gradient" onClick={send}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorMessageGroupPage

