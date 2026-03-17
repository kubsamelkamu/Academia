"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MessageSquare, 
  Users, 
  Clock, 
  Plus,
  Inbox,
  Send,
  Archive,
  Star,
  MoreVertical,
  CheckCheck,
  AlertCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  groupName: string
  groupId: string
  lastMessage: string
  lastMessageSender: string
  unread: number
  updatedAt: string
  participants: number
  isStarred?: boolean
  isArchived?: boolean
  status: "active" | "pending" | "resolved"
}

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Mid‑semester review",
    groupName: "Group Alpha – AI-Powered Student Assistant",
    groupId: "group-alpha",
    lastMessage: "We have completed the prototype and are preparing for user testing.",
    lastMessageSender: "Dr. Smith",
    unread: 2,
    updatedAt: "2024-03-18T10:30:00Z",
    participants: 6,
    isStarred: true,
    status: "active"
  },
  {
    id: "conv-2",
    title: "Ethics approval clarification",
    groupName: "Group Beta – Blockchain-Based Voting System",
    groupId: "group-beta",
    lastMessage: "Could you confirm the required documents for ethics committee?",
    lastMessageSender: "Prof. Johnson",
    unread: 0,
    updatedAt: "2024-03-16T15:10:00Z",
    participants: 4,
    status: "pending"
  },
  {
    id: "conv-3",
    title: "Hardware procurement",
    groupName: "Group Gamma – Smart Campus IoT Platform",
    groupId: "group-gamma",
    lastMessage: "We have shared the updated bill of materials.",
    lastMessageSender: "You",
    unread: 1,
    updatedAt: "2024-03-15T09:05:00Z",
    participants: 5,
    status: "active"
  },
  {
    id: "conv-4",
    title: "Budget approval request",
    groupName: "Group Delta – AR/VR Learning Platform",
    groupId: "group-delta",
    lastMessage: "The budget has been approved. Please proceed with procurement.",
    lastMessageSender: "Dean Williams",
    unread: 0,
    updatedAt: "2024-03-14T11:20:00Z",
    participants: 3,
    isStarred: true,
    status: "resolved"
  },
]

type FilterType = "all" | "unread" | "starred" | "archived"

export function DepartmentHeadMessagesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [conversations, setConversations] = useState(mockConversations)

  const filterConversations = () => {
    let filtered = conversations

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.lastMessageSender.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply tab filter
    switch (activeFilter) {
      case "unread":
        filtered = filtered.filter((c) => c.unread > 0 && !c.isArchived)
        break
      case "starred":
        filtered = filtered.filter((c) => c.isStarred && !c.isArchived)
        break
      case "archived":
        filtered = filtered.filter((c) => c.isArchived)
        break
      default:
        filtered = filtered.filter((c) => !c.isArchived)
    }

    return filtered
  }

  const filteredConversations = filterConversations()
  const unreadCount = conversations.reduce((acc, c) => acc + c.unread, 0)

  const handleStarToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, isStarred: !c.isStarred } : c)
    )
  }

  const handleArchiveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c)
    )
  }

  const getStatusBadge = (status: Conversation["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "resolved":
        return <Badge variant="outline">Resolved</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header - matching system background */}
      <div className="border-b bg-background">
        <div className="px-8 py-6">
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
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Messages
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Communicate with project teams and faculty members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1 bg-primary/5">
                {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
              </Badge>
              <Button size="sm" className="gap-2" asChild>
                <Link href="/dashboard/department-head/messages/new">
                  <Plus className="h-4 w-4" />
                  New message
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content - removed fixed height and overflow */}
      <div className="px-8 py-6 space-y-6">
        {/* Search and filters */}
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by group, subject, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" className="whitespace-nowrap">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                    <DropdownMenuItem>Export conversations</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Clear all filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setActiveFilter(v as FilterType)}>
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all" className="gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Unread</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="starred" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Starred</span>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archived</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Conversation list */}
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent conversations</CardTitle>
                <CardDescription>
                  {filteredConversations.length} {filteredConversations.length === 1 ? 'thread' : 'threads'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={cn(
                    "border transition-all cursor-pointer group",
                    conv.unread > 0 
                      ? "border-primary/30 bg-primary/5 hover:bg-primary/10" 
                      : "border-border/60 hover:border-primary/30 hover:shadow-sm"
                  )}
                  onClick={() => router.push(`/dashboard/department-head/messages/${conv.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.groupName.split(' ')[1]?.charAt(0) || 'G'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={cn(
                                "text-sm truncate",
                                conv.unread > 0 && "font-semibold"
                              )}>
                                {conv.title}
                              </h3>
                              {getStatusBadge(conv.status)}
                              {conv.isStarred && (
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              <span className="truncate">{conv.groupName}</span>
                              <span className="text-muted-foreground/50">•</span>
                              <span>{conv.participants} participants</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(conv.updatedAt)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleStarToggle(conv.id, e)}
                            >
                              <Star className={cn(
                                "h-4 w-4",
                                conv.isStarred && "fill-yellow-400 text-yellow-400"
                              )} />
                            </Button>
                          </div>
                        </div>

                        {/* Message preview */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              <span className="font-medium text-foreground/80">
                                {conv.lastMessageSender}:
                              </span>{' '}
                              {conv.lastMessage}
                            </p>
                          </div>
                          {conv.unread > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 flex-shrink-0">
                              {conv.unread} new
                            </Badge>
                          )}
                          {conv.lastMessageSender === "You" && (
                            <CheckCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="border border-dashed rounded-lg p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">No conversations found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {searchTerm 
                      ? "No messages match your search criteria. Try different keywords or clear your filters."
                      : activeFilter === "archived"
                      ? "You don't have any archived conversations."
                      : "Start a new conversation with a project team or faculty member."}
                  </p>
                  {!searchTerm && activeFilter !== "archived" && (
                    <Button className="mt-2 gap-2" asChild>
                      <Link href="/dashboard/department-head/messages/new">
                        <Plus className="h-4 w-4" />
                        Start new conversation
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}