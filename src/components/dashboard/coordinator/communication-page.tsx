"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Search,
  MessageSquare,
  Users,
  Plus,
  Inbox,
  Send,
  Archive,
  Star,
  MoreVertical,
  CheckCheck,
  Megaphone,
  Bell,
  Filter,
  Link as LinkIcon,
  Calendar,
  Paperclip,
  X,
  ChevronRight,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Pin,
  Eye,
  Edit,
  Trash2,
  Globe,
  Lock,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { mockUsers } from "@/data/mockData"
import { cn } from "@/lib/utils"

/* ─── Types ───────────────────────────────────────────────────────────── */
interface Participant {
  id: string
  name: string
  role: string
}

interface ChatMessage {
  id: string
  sender: string
  senderId: string
  content: string
  timestamp: string
  isOwn: boolean
}

interface Conversation {
  id: string
  title: string
  context: string         // group/project name or role group
  participants: Participant[]
  lastMessage: string
  lastSender: string
  lastAt: string
  unread: number
  isStarred: boolean
  isArchived: boolean
  status: "active" | "pending" | "resolved"
  messages: ChatMessage[]
  tag: "advisor" | "evaluator" | "student" | "committee" | "system"
}

type InboxFilter = "all" | "unread" | "starred" | "archived"

/* ─── Mock Data ───────────────────────────────────────────────────────── */
const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    title: "Defense schedule confirmation",
    context: "AI Research Group — Prof. Lisa Anderson",
    tag: "advisor",
    participants: [
      { id: "u5", name: "Prof. Lisa Anderson", role: "Advisor" },
      { id: "u8", name: "Maria Garcia",        role: "Group Manager" },
    ],
    lastMessage: "Could you confirm the defense room allocation for next Friday?",
    lastSender: "Prof. Lisa Anderson",
    lastAt: "2024-03-18T10:30:00Z",
    unread: 2,
    isStarred: true,
    isArchived: false,
    status: "active",
    messages: [
      { id: "m1", sender: "Prof. Lisa Anderson", senderId: "u5", content: "Hi Coordinator, the AI Research Group is almost ready for their defense. Could you confirm the room allocation for next Friday?", timestamp: "2024-03-18T10:00:00Z", isOwn: false },
      { id: "m2", sender: "Coordinator",          senderId: "me", content: "Hello Prof. Anderson, I will check with the admin office and confirm by EOD today.", timestamp: "2024-03-18T10:15:00Z", isOwn: true },
      { id: "m3", sender: "Prof. Lisa Anderson", senderId: "u5", content: "Could you confirm the defense room allocation for next Friday?", timestamp: "2024-03-18T10:30:00Z", isOwn: false },
    ],
  },
  {
    id: "c2",
    title: "Evaluation score submission delay",
    context: "Dr. David Martinez — Evaluator",
    tag: "evaluator",
    participants: [
      { id: "u6", name: "Dr. David Martinez", role: "Evaluator" },
    ],
    lastMessage: "I need an extension until Monday to complete the scoring rubric.",
    lastSender: "Dr. David Martinez",
    lastAt: "2024-03-16T15:10:00Z",
    unread: 1,
    isStarred: false,
    isArchived: false,
    status: "pending",
    messages: [
      { id: "m4", sender: "Dr. David Martinez", senderId: "u6", content: "Good afternoon, I had a conference this week and haven't been able to complete the evaluations for Projects p1 and p2.", timestamp: "2024-03-16T14:50:00Z", isOwn: false },
      { id: "m5", sender: "Coordinator",        senderId: "me", content: "Dr. Martinez, thank you for informing us. When can you submit the scores?", timestamp: "2024-03-16T15:00:00Z", isOwn: true },
      { id: "m6", sender: "Dr. David Martinez", senderId: "u6", content: "I need an extension until Monday to complete the scoring rubric.", timestamp: "2024-03-16T15:10:00Z", isOwn: false },
    ],
  },
  {
    id: "c3",
    title: "Group progress update",
    context: "Data Analytics Team — Dr. Michael Brown",
    tag: "student",
    participants: [
      { id: "u8",  name: "Maria Garcia",     role: "Group Manager" },
      { id: "u2",  name: "Dr. Michael Brown", role: "Advisor" },
    ],
    lastMessage: "We have uploaded the updated prototype demo to the portal.",
    lastSender: "Maria Garcia",
    lastAt: "2024-03-15T09:05:00Z",
    unread: 0,
    isStarred: false,
    isArchived: false,
    status: "active",
    messages: [
      { id: "m7", sender: "Maria Garcia", senderId: "u8", content: "Good morning! The team has been working hard this week.", timestamp: "2024-03-15T08:30:00Z", isOwn: false },
      { id: "m8", sender: "Coordinator",  senderId: "me", content: "Great to hear. Do you have a progress demo ready for the mid-review?", timestamp: "2024-03-15T08:50:00Z", isOwn: true },
      { id: "m9", sender: "Maria Garcia", senderId: "u8", content: "We have uploaded the updated prototype demo to the portal.", timestamp: "2024-03-15T09:05:00Z", isOwn: false },
    ],
  },
  {
    id: "c4",
    title: "DC Committee review request",
    context: "Dept. Committee — Prof. Emily Davis",
    tag: "committee",
    participants: [
      { id: "u3", name: "Prof. Emily Davis", role: "DC Committee" },
      { id: "u4", name: "Dr. Robert Taylor",  role: "DC Committee" },
    ],
    lastMessage: "The committee review meeting is scheduled for March 22nd.",
    lastSender: "You",
    lastAt: "2024-03-14T11:20:00Z",
    unread: 0,
    isStarred: true,
    isArchived: false,
    status: "resolved",
    messages: [
      { id: "m10", sender: "Prof. Emily Davis", senderId: "u3", content: "Could you circulate the final project list to the committee?", timestamp: "2024-03-14T10:00:00Z", isOwn: false },
      { id: "m11", sender: "Coordinator",       senderId: "me", content: "Certainly! I will share the list by tomorrow. Also, the committee review meeting is scheduled for March 22nd.", timestamp: "2024-03-14T11:20:00Z", isOwn: true },
    ],
  },
  {
    id: "c5",
    title: "Grade complaint escalation",
    context: "Alex Johnson — Student",
    tag: "student",
    participants: [
      { id: "u7", name: "Alex Johnson", role: "Student" },
    ],
    lastMessage: "I would like to formally escalate my grade complaint to the coordinator.",
    lastSender: "Alex Johnson",
    lastAt: "2024-03-12T08:45:00Z",
    unread: 0,
    isStarred: false,
    isArchived: true,
    status: "resolved",
    messages: [
      { id: "m12", sender: "Alex Johnson", senderId: "u7", content: "I would like to formally escalate my grade complaint to the coordinator.", timestamp: "2024-03-12T08:45:00Z", isOwn: false },
      { id: "m13", sender: "Coordinator",  senderId: "me", content: "Alex, I have received your complaint. It has been forwarded to the review committee. You will hear back within 5 working days.", timestamp: "2024-03-12T09:30:00Z", isOwn: true },
    ],
  },
]

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const TAG_CONFIG = {
  advisor:   { label: "Advisor",    cls: "bg-primary/10 text-primary border-primary/20" },
  evaluator: { label: "Evaluator",  cls: "bg-muted text-foreground border-border" },
  student:   { label: "Student",    cls: "bg-primary/[0.06] text-primary/80 border-primary/10" },
  committee: { label: "Committee",  cls: "bg-muted text-muted-foreground border-border" },
  system:    { label: "System",     cls: "bg-destructive/10 text-destructive border-destructive/20" },
}

const STATUS_CONFIG = {
  active:   { label: "Active",   cls: "bg-primary/10 text-primary border-primary/20" },
  pending:  { label: "Pending",  cls: "bg-muted text-foreground border-border" },
  resolved: { label: "Resolved", cls: "bg-muted text-muted-foreground border-border" },
}

function formatRelative(iso: string) {
  const d = new Date(iso), now = new Date()
  const h = (now.getTime() - d.getTime()) / 36e5
  if (h < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (h < 48) return "Yesterday"
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase()
}

/* ─── Conversation Row ────────────────────────────────────────────────── */
function ConvRow({
  conv,
  active,
  onSelect,
  onStar,
  onArchive,
}: {
  conv: Conversation
  active: boolean
  onSelect: () => void
  onStar: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
}) {
  const tc = TAG_CONFIG[conv.tag]
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "w-full rounded-xl border p-3.5 text-left transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary/40 bg-primary/5"
          : conv.unread > 0
          ? "border-primary/20 bg-primary/[0.03] hover:bg-primary/5"
          : "border-border/60 hover:border-primary/20 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {initials(conv.participants[0]?.name ?? "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-sm truncate", conv.unread > 0 ? "font-semibold" : "font-medium")}>
                {conv.title}
              </span>
              {conv.isStarred && <Star className="h-3 w-3 fill-primary text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground">{formatRelative(conv.lastAt)}</span>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onStar}
              >
                <Star className={cn("h-3 w-3", conv.isStarred && "fill-primary text-primary")} />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onArchive}
              >
                <Archive className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground truncate mb-2 flex items-center gap-1">
            <Users className="h-3 w-3 shrink-0" /> {conv.context}
          </p>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground line-clamp-1 flex-1 min-w-0">
              <span className="font-medium text-foreground/70">{conv.lastSender === "You" || conv.lastSender === "Coordinator" ? "You" : conv.lastSender}:</span>{" "}
              {conv.lastMessage}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {conv.unread > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0 h-5">{conv.unread}</Badge>
              )}
              {(conv.lastSender === "You" || conv.lastSender === "Coordinator") && conv.unread === 0 && (
                <CheckCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <Badge variant="outline" className={`text-xs ${tc.cls}`}>{tc.label}</Badge>
            <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[conv.status].cls}`}>{STATUS_CONFIG[conv.status].label}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Chat Panel ──────────────────────────────────────────────────────── */
function ChatPanel({
  conv,
  onBack,
  onSend,
}: {
  conv: Conversation
  onBack: () => void
  onSend: (convId: string, text: string) => void
}) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conv.messages.length])

  const handleSend = async () => {
    if (!draft.trim()) return
    setSending(true)
    await new Promise(r => setTimeout(r, 300))
    onSend(conv.id, draft.trim())
    setDraft("")
    setSending(false)
  }

  const tc = TAG_CONFIG[conv.tag]

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials(conv.participants[0]?.name ?? "?")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{conv.title}</p>
            <p className="text-xs text-muted-foreground truncate">{conv.context}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs hidden sm:flex ${tc.cls}`}>{tc.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info("Marked as resolved")}>Mark as resolved</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Archived")}>Archive conversation</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => toast.error("Feature coming soon")}>
                Delete conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Members bar */}
      <div className="px-4 py-2 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Participants:</span>
          {conv.participants.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="bg-primary/10 text-primary text-[8px]">{initials(p.name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">· {p.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {conv.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
              {!msg.isOwn && (
                <Avatar className="h-7 w-7 shrink-0 mr-2 mt-1">
                  <AvatarFallback className="bg-muted text-foreground text-[10px]">{initials(msg.sender)}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                msg.isOwn
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              )}>
                {!msg.isOwn && (
                  <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender}</p>
                )}
                <p className="leading-relaxed">{msg.content}</p>
                <p className={cn("text-xs mt-1.5", msg.isOwn ? "opacity-70 text-right" : "opacity-50")}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {msg.isOwn && <CheckCheck className="inline h-3 w-3 ml-1" />}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Compose bar */}
      <div className="px-4 py-3 border-t bg-background shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder={`Reply to ${conv.participants[0]?.name ?? "conversation"}…`}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="resize-none min-h-[40px] max-h-[120px] flex-1 text-sm py-2"
            rows={1}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={sending || !draft.trim()}
            onClick={handleSend}
          >
            {sending
              ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

/* ─── Compose Dialog ──────────────────────────────────────────────────── */
function ComposeDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (conv: Conversation) => void }) {
  const [role, setRole]     = useState("all")
  const [userId, setUserId] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody]     = useState("")
  const [saving, setSaving] = useState(false)

  const filtered = role === "all" ? mockUsers : mockUsers.filter(u => u.role === role)

  const handleCreate = async () => {
    if (!userId || !subject.trim() || !body.trim()) {
      toast.error("Please fill all fields"); return
    }
    const user = mockUsers.find(u => u.id === userId)!
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    const newConv: Conversation = {
      id: `new-${Date.now()}`,
      title: subject.trim(),
      context: `${user.name} — ${user.role.replace(/_/g, " ")}`,
      tag: (["advisor","evaluator","student"].includes(user.role) ? user.role : "committee") as Conversation["tag"],
      participants: [{ id: user.id, name: user.name, role: user.role.replace(/_/g, " ") }],
      lastMessage: body.trim(),
      lastSender: "Coordinator",
      lastAt: new Date().toISOString(),
      unread: 0,
      isStarred: false,
      isArchived: false,
      status: "active",
      messages: [
        { id: `msg-${Date.now()}`, sender: "Coordinator", senderId: "me", content: body.trim(), timestamp: new Date().toISOString(), isOwn: true },
      ],
    }
    onCreate(newConv)
    toast.success("Message Sent", { description: `Conversation started with ${user.name}` })
    setRole("all"); setUserId(""); setSubject(""); setBody("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> New Message
          </DialogTitle>
          <DialogDescription>Start a conversation with any member of the project system</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Filter by Role</Label>
              <Select value={role} onValueChange={v => { setRole(v); setUserId("") }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="advisor">Advisors</SelectItem>
                  <SelectItem value="evaluator">Evaluators</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="group_manager">Group Managers</SelectItem>
                  <SelectItem value="dc_committee">DC Committee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recipient</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {filtered.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject…" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Message</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" className="resize-none text-sm min-h-[90px]" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={handleCreate} disabled={saving || !userId || !subject.trim() || !body.trim()}>
              {saving
                ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : <Send className="h-4 w-4" />
              }
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Announcements Tab ───────────────────────────────────────────────── */

type AnnCategory = "general" | "academic" | "deadline" | "event" | "urgent"
type AnnAudience = "all" | "advisors" | "students" | "evaluators"

interface AnnItem {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
  category: AnnCategory
  audience: AnnAudience
  isPinned: boolean
  isPublished: boolean
  views: number
}

const ANN_CATEGORY_CFG: Record<AnnCategory, { label: string; cls: string; icon: React.ElementType }> = {
  general:  { label: "General",  cls: "bg-muted text-foreground border-border",                     icon: Info },
  academic: { label: "Academic", cls: "bg-primary/10 text-primary border-primary/20",               icon: CheckCircle2 },
  deadline: { label: "Deadline", cls: "bg-primary/[0.06] text-primary/80 border-primary/10",        icon: Clock },
  event:    { label: "Event",    cls: "bg-muted text-muted-foreground border-border",               icon: Star },
  urgent:   { label: "Urgent",   cls: "bg-destructive/10 text-destructive border-destructive/20",   icon: AlertCircle },
}
const ANN_AUDIENCE_CFG: Record<AnnAudience, { label: string }> = {
  all:        { label: "Everyone" },
  advisors:   { label: "Advisors Only" },
  students:   { label: "Students Only" },
  evaluators: { label: "Evaluators Only" },
}

const SEED_ANNOUNCEMENTS: AnnItem[] = [
  { id: "a1", title: "Final Submission Deadline Extended", content: "Due to popular request and consideration of student workload, the final project submission deadline has been extended by one week. New deadline: February 15, 2024. Please ensure all documentation is complete before submission.", author: "Dr. Michael Brown", createdAt: "2024-01-15T10:00:00Z", category: "deadline", audience: "all",      isPinned: true,  isPublished: true,  views: 142 },
  { id: "a2", title: "Defense Schedule – February 2024",  content: "Defense sessions for the February cohort have been finalized. All project teams are required to confirm their defense time slots by January 20, 2024.", author: "Dr. Michael Brown", createdAt: "2024-01-12T14:30:00Z", category: "event",    audience: "all",      isPinned: true,  isPublished: true,  views: 98  },
  { id: "a3", title: "Advisor Evaluation Guidelines Updated", content: "The evaluation rubric for project assessment has been updated. Advisors are requested to review the new guidelines before submitting their evaluation scores.", author: "Dr. Michael Brown", createdAt: "2024-01-10T09:15:00Z", category: "academic", audience: "advisors", isPinned: false, isPublished: true,  views: 67  },
  { id: "a4", title: "System Maintenance Notice",          content: "The academic management system will undergo scheduled maintenance on January 18, 2024 from 2:00 AM to 6:00 AM. During this period, the system will be unavailable.", author: "Dr. Michael Brown", createdAt: "2024-01-08T16:00:00Z", category: "general",  audience: "all",      isPinned: false, isPublished: true,  views: 203 },
  { id: "a5", title: "New Plagiarism Policy Effective Immediately", content: "Important policy update: All project submissions will now undergo mandatory plagiarism detection. Projects with similarity index above 20% will be flagged for review.", author: "Dr. Michael Brown", createdAt: "2024-01-05T11:00:00Z", category: "urgent",   audience: "all",      isPinned: false, isPublished: true,  views: 289 },
  { id: "a6", title: "Mid-Semester Progress Review Reminder", content: "All advisors are reminded to submit the mid-semester progress report for each supervised group by January 31, 2024.", author: "Dr. Michael Brown", createdAt: "2024-01-03T08:00:00Z", category: "academic", audience: "advisors", isPinned: false, isPublished: false, views: 0   },
]

const ROLE_OPTIONS = [
  { value: "students",         label: "Students",      icon: GraduationCap },
  { value: "advisors",         label: "Advisors",      icon: BookOpen },
  { value: "evaluators",       label: "Evaluators",    icon: ClipboardList },
  { value: "dc_committee",     label: "DC Committee",  icon: Users },
  { value: "department_admin", label: "Dept. Admins",  icon: Users },
]

const TEMPLATES = [
  { title: "Defense Reminder",          body: "This is a reminder that the project defense sessions are scheduled for next week. Please ensure all your deliverables are submitted on time." },
  { title: "Grade Submission Deadline", body: "Please note that the deadline for submitting final grades is approaching. All scores must be entered into the system by the end of this week." },
  { title: "Rubric Update",             body: "The evaluation rubric has been updated. Please review the latest version on the coordinator portal before starting your next evaluation." },
  { title: "Mid-Semester Review",       body: "The mid-semester project review is coming up. Advisors are requested to provide a progress report for all supervised groups." },
]

function AnnCard({ ann, onPin, onDelete }: { ann: AnnItem; onPin: (id: string) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const cc = ANN_CATEGORY_CFG[ann.category]
  const CatIcon = cc.icon
  const isLong = ann.content.length > 160
  return (
    <div className={cn(
      "group rounded-xl border bg-card p-4 transition-all hover:shadow-sm",
      ann.isPinned ? "border-primary/25 bg-primary/[0.01]" : "border-border/70 hover:border-primary/20",
      !ann.isPublished && "opacity-70"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", cc.cls.split(" ").slice(0,2).join(" "))}>
          <CatIcon className={cn("h-3.5 w-3.5", cc.cls.split(" ")[1])} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                {ann.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                <span className="font-semibold text-sm leading-tight">{ann.title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ann.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{ann.views}</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className={cn("p-1 rounded-md hover:bg-muted transition-colors", ann.isPinned ? "text-primary" : "text-muted-foreground")} title={ann.isPinned?"Unpin":"Pin"} onClick={() => onPin(ann.id)}>
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive transition-colors" title="Delete" onClick={() => onDelete(ann.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className={cn("text-sm text-muted-foreground mt-1.5 leading-relaxed", !expanded && isLong && "line-clamp-2")}>{ann.content}</p>
          {isLong && (
            <button onClick={() => setExpanded(v=>!v)} className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline">
              {expanded?"Show less":"Read more"}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <Badge variant="outline" className={cn("text-xs", cc.cls)}><CatIcon className="h-3 w-3 mr-1" />{cc.label}</Badge>
            <Badge variant="outline" className="text-xs">{ANN_AUDIENCE_CFG[ann.audience].label}</Badge>
            {ann.isPublished
              ? <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20"><Globe className="h-3 w-3 mr-1" />Published</Badge>
              : <Badge variant="outline" className="text-xs text-muted-foreground"><Lock className="h-3 w-3 mr-1" />Draft</Badge>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

function AnnouncementsTab({ sheetOpen, onSheetOpenChange }: { sheetOpen: boolean; onSheetOpenChange: (v: boolean) => void }) {
  const [items, setItems]           = useState<AnnItem[]>(SEED_ANNOUNCEMENTS)
  const [annSearch, setAnnSearch]   = useState("")

  /* Compose form state */
  const [subject, setSubject]   = useState("")
  const [body, setBody]         = useState("")
  const [audience, setAudience] = useState<string[]>([])
  const [deadline, setDeadline] = useState("")
  const [link, setLink]         = useState("")
  const [priority, setPriority] = useState("normal")
  const [category, setCategory] = useState<AnnCategory>("general")
  const [pinned, setPinned]     = useState(false)
  const [sending, setSending]   = useState(false)

  const filteredAnns = useMemo(() => {
    const q = annSearch.toLowerCase()
    return items.filter(a => !annSearch || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
  }, [items, annSearch])

  const pinned2  = filteredAnns.filter(a => a.isPinned)
  const regular  = filteredAnns.filter(a => !a.isPinned)

  const handlePublish = async (publish: boolean) => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and content are required"); return }
    setSending(true)
    await new Promise(r => setTimeout(r, 700))
    setSending(false)
    const newAnn: AnnItem = {
      id: `a-${Date.now()}`, title: subject, content: body,
      author: "Dr. Michael Brown", createdAt: new Date().toISOString(),
      category, audience: (audience[0] as AnnAudience) ?? "all",
      isPinned: pinned, isPublished: publish, views: 0,
    }
    setItems(prev => [newAnn, ...prev])
    const aud = audience.length === 0 ? "all users" : audience.join(", ")
    toast.success(publish ? "Announcement Published" : "Draft Saved", { description: publish ? `Sent to ${aud}` : `"${subject}" saved as draft` })
    setSubject(""); setBody(""); setAudience([]); setDeadline(""); setLink(""); setPinned(false); setCategory("general")
    onSheetOpenChange(false)
  }

  const handlePin    = (id: string) => setItems(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a))
  const handleDelete = (id: string) => { setItems(prev => prev.filter(a => a.id !== id)); toast.success("Removed") }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search announcements…" value={annSearch} onChange={e => setAnnSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-2 shrink-0 pl-0 sm:pl-0 text-xs text-muted-foreground">
          <Pin className="h-3.5 w-3.5 text-primary" />
          <span>{items.filter(a=>a.isPinned).length} pinned</span>
          <span>·</span>
          <Eye className="h-3.5 w-3.5" />
          <span>{items.reduce((s,a)=>s+a.views,0)} total views</span>
        </div>
      </div>

      {/* Pinned */}
      {pinned2.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Pinned</p>
          </div>
          {pinned2.map(a => <AnnCard key={a.id} ann={a} onPin={handlePin} onDelete={handleDelete} />)}
        </div>
      )}

      {/* Regular */}
      {regular.length > 0 ? (
        <div className="space-y-2">
          {pinned2.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All Announcements</p>
            </div>
          )}
          {regular.map(a => <AnnCard key={a.id} ann={a} onPin={handlePin} onDelete={handleDelete} />)}
        </div>
      ) : filteredAnns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-xl border border-dashed text-center">
          <Megaphone className="h-9 w-9 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground text-sm">{annSearch ? "No matching announcements" : "No announcements yet"}</p>
          {!annSearch && <Button size="sm" className="mt-4 gap-1.5 text-xs" onClick={() => onSheetOpenChange(true)}><Plus className="h-3.5 w-3.5" /> New Announcement</Button>}
        </div>
      ) : null}

      {/* ── Compose Sheet ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => onSheetOpenChange(false)} />
          <div className="w-full max-w-md bg-background border-l overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b sticky top-0 bg-background z-10">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Megaphone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">New Announcement</p>
                <p className="text-xs text-muted-foreground">Broadcast to selected groups</p>
              </div>
              <button onClick={() => onSheetOpenChange(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 flex-1">
              <div className="space-y-1.5">
                <Label className="text-sm">Title <span className="text-destructive">*</span></Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Announcement title…" className="h-9 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Category</Label>
                  <Select value={category} onValueChange={v => setCategory(v as AnnCategory)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ANN_CATEGORY_CFG).map(([k,c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Audience</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 font-normal text-sm">
                      {audience.length === 0 ? "All users (default)" : `${audience.length} group${audience.length !== 1 ? "s" : ""} selected`}
                      <Filter className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {ROLE_OPTIONS.map(r => (
                      <DropdownMenuCheckboxItem key={r.value} checked={audience.includes(r.value)}
                        onCheckedChange={c => setAudience(prev => c ? [...prev, r.value] : prev.filter(v => v !== r.value))}>
                        <r.icon className="h-4 w-4 mr-2 text-muted-foreground" />{r.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {audience.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {audience.map(a => (
                      <Badge key={a} variant="outline" className="text-xs gap-1 bg-primary/5 border-primary/20 text-primary">
                        {ROLE_OPTIONS.find(r => r.value === a)?.label}
                        <button onClick={() => setAudience(p => p.filter(v => v !== a))}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Content <span className="text-destructive">*</span></Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your announcement…" className="resize-none text-sm min-h-[110px]" />
                <p className="text-xs text-muted-foreground text-right">{body.length} chars</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Deadline (opt.)</Label>
                  <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />Link (opt.)</Label>
                  <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" className="h-9 text-sm" />
                </div>
              </div>

              {/* Pin toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <div role="checkbox" aria-checked={pinned} tabIndex={0}
                  onClick={() => setPinned(v=>!v)} onKeyDown={e => e.key===" " && setPinned(v=>!v)}
                  className={cn("h-4 w-4 rounded border-2 flex items-center justify-center transition-colors", pinned ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                  {pinned && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="text-sm flex items-center gap-1.5"><Pin className="h-3.5 w-3.5 text-primary" />Pin this announcement</span>
              </label>

              {/* Quick Templates */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Templates</p>
                <div className="space-y-1.5">
                  {TEMPLATES.map(t => (
                    <button key={t.title} onClick={() => { setSubject(t.title); setBody(t.body) }}
                      className="w-full text-left rounded-lg border bg-muted/20 px-3 py-2 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                      <p className="text-xs font-medium group-hover:text-primary transition-colors">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.body}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs h-9" disabled={sending || !subject.trim() || !body.trim()} onClick={() => handlePublish(false)}>
                  {sending ? <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  Save Draft
                </Button>
                <Button className="flex-1 gap-1.5 text-xs h-9" disabled={sending || !subject.trim() || !body.trim()} onClick={() => handlePublish(true)}>
                  {sending ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Megaphone className="h-4 w-4" />}
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export function CoordinatorCommunicationPage() {
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS)
  const [activeId, setActiveId]           = useState<string | null>(null)
  const [search, setSearch]               = useState("")
  const [inboxFilter, setInboxFilter]     = useState<InboxFilter>("all")
  const [composeOpen, setComposeOpen]     = useState(false)
  const [showChat, setShowChat]           = useState(false)   // mobile: show chat panel
  const [activeTab, setActiveTab]         = useState<"inbox" | "announcements">("inbox")
  const [annSheetOpen, setAnnSheetOpen]   = useState(false)

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + c.unread, 0), [conversations])

  const filtered = useMemo(() => {
    let list = conversations
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.context.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      )
    }
    switch (inboxFilter) {
      case "unread":   list = list.filter(c => c.unread > 0 && !c.isArchived); break
      case "starred":  list = list.filter(c => c.isStarred && !c.isArchived); break
      case "archived": list = list.filter(c => c.isArchived); break
      default:         list = list.filter(c => !c.isArchived); break
    }
    return list
  }, [conversations, search, inboxFilter])

  const activeConv = conversations.find(c => c.id === activeId) ?? null

  const selectConv = (id: string) => {
    setActiveId(id)
    setShowChat(true)
    // mark as read
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  const handleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isStarred: !c.isStarred } : c))
  }

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c))
    if (activeId === id) { setActiveId(null); setShowChat(false) }
  }

  const handleSendMessage = (convId: string, text: string) => {
    const now = new Date().toISOString()
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c
      return {
        ...c,
        messages: [...c.messages, { id: `msg-${Date.now()}`, sender: "Coordinator", senderId: "me", content: text, timestamp: now, isOwn: true }],
        lastMessage: text,
        lastSender: "Coordinator",
        lastAt: now,
      }
    }))
    toast.success("Message sent")
  }

  const handleCreate = (conv: Conversation) => {
    setConversations(prev => [conv, ...prev])
    setActiveId(conv.id)
    setShowChat(true)
  }

  return (
    <div className="space-y-5 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Communication Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Messages, announcements, and team coordination
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
          {activeTab === "inbox" ? (
            <>
              {totalUnread > 0 && (
                <Badge variant="outline" className="gap-1.5 bg-primary/5 border-primary/20 text-primary">
                  <MessageSquare className="h-3.5 w-3.5" /> {totalUnread} unread
                </Badge>
              )}
              <Button size="sm" className="gap-1.5" onClick={() => setComposeOpen(true)}>
                <Plus className="h-4 w-4" /> New Message
              </Button>
            </>
          ) : (
            <Button size="sm" className="gap-1.5" onClick={() => setAnnSheetOpen(true)}>
              <Megaphone className="h-4 w-4" /> New Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "inbox" | "announcements")} className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="inbox"         className="gap-2 shrink-0"><Inbox className="h-4 w-4" /> Inbox</TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2 shrink-0"><Megaphone className="h-4 w-4" /> Announcements</TabsTrigger>
        </TabsList>

        {/* ── Inbox ── */}
        <TabsContent value="inbox">
          {/* Search + sub-tabs row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1 shrink-0 overflow-x-auto rounded-lg bg-muted p-1 whitespace-nowrap">
              {(["all", "unread", "starred", "archived"] as InboxFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setInboxFilter(f)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium capitalize transition-all",
                    inboxFilter === f
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all"      && <Inbox className="h-3.5 w-3.5" />}
                  {f === "unread"   && <MessageSquare className="h-3.5 w-3.5" />}
                  {f === "starred"  && <Star className="h-3.5 w-3.5" />}
                  {f === "archived" && <Archive className="h-3.5 w-3.5" />}
                  {f}
                  {f === "unread" && totalUnread > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1 py-0 h-4">{totalUnread}</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2-panel layout */}
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]" style={{ minHeight: 560 }}>

            {/* Sidebar – conversation list */}
            <div className={cn("flex flex-col gap-2", showChat && "hidden lg:flex")}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-muted-foreground">No conversations</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {search ? "Try a different search" : "Start a new message to begin"}
                  </p>
                  {!search && (
                    <Button size="sm" className="mt-4 gap-1.5" onClick={() => setComposeOpen(true)}>
                      <Plus className="h-4 w-4" /> New Message
                    </Button>
                  )}
                </div>
              ) : (
                filtered.map(c => (
                  <ConvRow
                    key={c.id}
                    conv={c}
                    active={c.id === activeId}
                    onSelect={() => selectConv(c.id)}
                    onStar={e => handleStar(c.id, e)}
                    onArchive={e => handleArchive(c.id, e)}
                  />
                ))
              )}
            </div>

            {/* Chat panel */}
            <Card className={cn(
              "border-none shadow-sm overflow-hidden flex flex-col",
              !showChat && "hidden lg:flex",
              showChat && "flex"
            )} style={{ minHeight: 560 }}>
              {activeConv ? (
                <ChatPanel
                  conv={activeConv}
                  onBack={() => setShowChat(false)}
                  onSend={handleSendMessage}
                />
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-primary/60" />
                  </div>
                  <p className="font-semibold text-lg">Select a conversation</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Choose a thread from the list or start a new message.
                  </p>
                  <Button className="mt-6 gap-2" onClick={() => setComposeOpen(true)}>
                    <Plus className="h-4 w-4" /> New Message
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ── Announcements ── */}
        <TabsContent value="announcements">
          <AnnouncementsTab sheetOpen={annSheetOpen} onSheetOpenChange={setAnnSheetOpen} />
        </TabsContent>
      </Tabs>

      {/* Compose dialog */}
      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} onCreate={handleCreate} />
    </div>
  )
}
