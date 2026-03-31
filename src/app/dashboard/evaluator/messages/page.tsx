"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Search,
  Send,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  Users,
  Pin,
  Star,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const MOCK_THREADS = [
  {
    id: "t1",
    contact: "Dr. Michael Brown",
    role: "Coordinator",
    initials: "MB",
    color: "bg-blue-500",
    lastMessage: "Please finalize your evaluation for the Real-Time Campus Analytics project by Friday.",
    time: "2 hrs ago",
    unread: 2,
    pinned: true,
    messages: [
      { id: "m1", from: "Dr. Michael Brown", fromMe: false, text: "Hi Dr. Martinez, hope you're well. Could you please review the evaluation rubric I sent last week?", time: "2024-01-14T08:30:00Z" },
      { id: "m2", from: "You", fromMe: true, text: "Good morning! Yes, I reviewed it. The rubric looks comprehensive. I have a few minor suggestions for the technical section.", time: "2024-01-14T09:15:00Z" },
      { id: "m3", from: "Dr. Michael Brown", fromMe: false, text: "Great! Feel free to adjust it as needed. Also, please finalize your evaluation for the Real-Time Campus Analytics project by Friday.", time: "2024-01-14T10:00:00Z" },
      { id: "m4", from: "Dr. Michael Brown", fromMe: false, text: "Please finalize your evaluation for the Real-Time Campus Analytics project by Friday.", time: "2024-01-14T10:05:00Z" },
    ],
  },
  {
    id: "t2",
    contact: "Prof. Lisa Anderson",
    role: "Advisor",
    initials: "LA",
    color: "bg-violet-500",
    lastMessage: "The AI Research Group is well-prepared for the defense. Looking forward to your evaluation.",
    time: "Yesterday",
    unread: 0,
    pinned: false,
    messages: [
      { id: "m5", from: "Prof. Lisa Anderson", fromMe: false, text: "Hello Dr. Martinez! The AI Research Group has been working very hard. They're well-prepared for the upcoming defense.", time: "2024-01-13T14:00:00Z" },
      { id: "m6", from: "You", fromMe: true, text: "Thank you for the update! I'll make sure to review their documentation thoroughly before the defense date.", time: "2024-01-13T15:30:00Z" },
      { id: "m7", from: "Prof. Lisa Anderson", fromMe: false, text: "The AI Research Group is well-prepared for the defense. Looking forward to your evaluation.", time: "2024-01-13T16:00:00Z" },
    ],
  },
  {
    id: "t3",
    contact: "Evaluator Panel",
    role: "Group Chat",
    initials: "EP",
    color: "bg-emerald-500",
    lastMessage: "Reminder: All evaluation scores must be submitted 48 hours after the defense.",
    time: "Jan 10",
    unread: 1,
    pinned: false,
    messages: [
      { id: "m8", from: "Dr. Michael Brown", fromMe: false, text: "Welcome to the evaluator panel group. This is where we'll coordinate defense evaluations.", time: "2024-01-10T09:00:00Z" },
      { id: "m9", from: "Prof. Anna Williams", fromMe: false, text: "Thanks for the heads up. Should we align our rubrics before evaluating?", time: "2024-01-10T09:15:00Z" },
      { id: "m10", from: "You", fromMe: true, text: "Good idea. I suggest we do a quick calibration session before the first defense.", time: "2024-01-10T10:00:00Z" },
      { id: "m11", from: "Dr. Michael Brown", fromMe: false, text: "Reminder: All evaluation scores must be submitted 48 hours after the defense.", time: "2024-01-10T16:00:00Z" },
    ],
  },
]

export default function EvaluatorMessagesPage() {
  const [selectedThread, setSelectedThread] = useState(MOCK_THREADS[0])
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")

  const filteredThreads = MOCK_THREADS.filter(t =>
    t.contact.toLowerCase().includes(search.toLowerCase()) ||
    t.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = () => {
    if (!draft.trim()) return
    toast.success("Message sent")
    setDraft("")
  }

  const totalUnread = MOCK_THREADS.reduce((s, t) => s + t.unread, 0)

  return (
    <div className="space-y-4 pb-8 animate-fade-in h-[calc(100vh-180px)] flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/dashboard/evaluator">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Communicate with coordinators and advisors</p>
        </div>
        {totalUnread > 0 && (
          <Badge className="bg-primary text-primary-foreground">{totalUnread} unread</Badge>
        )}
      </div>

      {/* Chat Layout */}
      <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[320px_1fr]">

        {/* Thread List */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardContent className="p-0 flex flex-col flex-1 min-h-0">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>
            </div>

            {/* Threads */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredThreads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${selectedThread.id === thread.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <div className="relative shrink-0">
                      <div className={`h-10 w-10 rounded-full ${thread.color} flex items-center justify-center text-white text-sm font-semibold`}>
                        {thread.initials}
                      </div>
                      {thread.unread > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] text-primary-foreground font-bold">{thread.unread}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {thread.pinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                          <p className={`text-sm truncate ${thread.unread > 0 ? "font-bold" : "font-medium"}`}>{thread.contact}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{thread.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{thread.role}</p>
                      <p className={`text-xs mt-0.5 truncate ${thread.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {thread.lastMessage}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          {/* Thread Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
            <div className={`h-10 w-10 rounded-full ${selectedThread.color} flex items-center justify-center text-white font-semibold shrink-0`}>
              {selectedThread.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{selectedThread.contact}</p>
              <p className="text-xs text-muted-foreground">{selectedThread.role}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {selectedThread.messages.length} messages
            </Badge>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {selectedThread.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                  {!msg.fromMe && (
                    <Avatar className="h-7 w-7 mr-2 mt-1 shrink-0">
                      <AvatarFallback className={`text-xs text-white ${selectedThread.color}`}>{selectedThread.initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.fromMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                    {!msg.fromMe && (
                      <p className="text-xs font-semibold opacity-70 mb-1">{msg.from}</p>
                    )}
                    <p className="text-sm">{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.fromMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      <span className="text-[10px]">
                        {new Date(msg.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.fromMe && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Compose */}
          <div className="border-t p-3 shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Write a message..."
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={2}
                className="resize-none text-sm flex-1"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button size="icon" className="btn-gradient h-10 w-10 shrink-0" onClick={handleSend} disabled={!draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
