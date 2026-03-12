"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Send, 
  Phone, 
  Video, 
  Bell, 
  Users, 
  MessageSquare,
  Search,
  Paperclip,
  Smile,
  MoreVertical,
  CheckCheck,
  Clock,
  UserRound,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useMyGroupLeaderRequest } from "@/lib/hooks/use-group-leader-requests"
import {
  useCreateMyGroupAnnouncement,
  useDeleteMyGroupAnnouncement,
  useMyGroupAnnouncements,
  useUpdateMyGroupAnnouncement,
} from "@/lib/hooks/use-project-groups"
import {
  announcementIdSchema,
  createMyGroupAnnouncementSchema,
  updateMyGroupAnnouncementSchema,
} from "@/validations/announcements"

type MessageStatus = 'sent' | 'delivered' | 'read'
type UserStatus = 'online' | 'away' | 'offline'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  status: MessageStatus
  attachments?: {
    name: string
    size: string
    url: string
  }[]
}

interface Conversation {
  id: string
  name: string
  type: 'group' | 'manager' | 'member'
  avatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status?: UserStatus
  participants?: {
    id: string
    name: string
    status: UserStatus
  }[]
}

interface Announcement {
  id: string
  title: string
  content: string
  date: string
  author: string
  priority: 'high' | 'medium' | 'low'
}

export function StudentMessagesPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const groupLeaderMeQuery = useMyGroupLeaderRequest(Boolean(accessToken))
  const isApprovedGroupManager = groupLeaderMeQuery.data?.status === "APPROVED"

  const announcementsQuery = useMyGroupAnnouncements({
    enabled: Boolean(accessToken),
    page: 1,
    limit: 20,
  })

  const createAnnouncementMutation = useCreateMyGroupAnnouncement()
  const updateAnnouncementMutation = useUpdateMyGroupAnnouncement()
  const deleteAnnouncementMutation = useDeleteMyGroupAnnouncement()

  const canManageAnnouncements =
    isApprovedGroupManager && announcementsQuery.data?.items !== undefined

  const handleDeleteAnnouncement = async (announcementId: string) => {
    const parsedId = announcementIdSchema.safeParse(announcementId)
    if (!parsedId.success) {
      toast.error(parsedId.error.issues[0]?.message ?? "Invalid announcement ID")
      return
    }

    const ok = window.confirm("Delete this announcement? This cannot be undone.")
    if (!ok) return

    try {
      await deleteAnnouncementMutation.mutateAsync({ announcementId: parsedId.data })
      toast.success("Announcement deleted")
    } catch {
      toast.error("Failed to delete announcement")
    }
  }

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [advisorInput, setAdvisorInput] = useState('')
  const [advisorMessages, setAdvisorMessages] = useState<Message[]>([
    {
      id: 'am1',
      senderId: 'advisor',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '/avatars/sarah.jpg',
      content: 'Hi! I\'m your project advisor. Feel free to ask about your thesis, milestones, or schedule anytime.',
      timestamp: '2024-07-23T09:00:00.000Z',
      status: 'read'
    },
    {
      id: 'am2',
      senderId: 'current',
      senderName: 'You',
      content: 'Thank you. I\'ll reach out when I have questions.',
      timestamp: '2024-07-24T09:15:00.000Z',
      status: 'read'
    },
    {
      id: 'am3',
      senderId: 'advisor',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '/avatars/sarah.jpg',
      content: 'Sounds good. Remember the design phase deliverable is due next Friday.',
      timestamp: '2024-07-25T11:20:00.000Z',
      status: 'delivered'
    }
  ])
  const advisorProfile = { name: 'Dr. Sarah Chen', role: 'Project Advisor', status: 'online' as UserStatus }

  // Mock data - would come from API in production
  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'AI Research Group',
      type: 'group',
      lastMessage: 'Meeting at 3pm tomorrow to discuss findings',
      lastMessageTime: '2024-07-25T14:30:00',
      unreadCount: 2,
      participants: [
        { id: '101', name: 'Dr. Sarah Chen', status: 'online' },
        { id: '102', name: 'John Smith', status: 'away' },
        { id: '103', name: 'Emily Brown', status: 'offline' },
      ]
    },
    {
      id: '2',
      name: 'Dr. Sarah Chen',
      type: 'manager',
      avatar: '/avatars/sarah.jpg',
      lastMessage: 'Great progress on the research proposal',
      lastMessageTime: '2024-07-25T11:20:00',
      unreadCount: 1,
      status: 'online'
    },
    {
      id: '3',
      name: 'Web Development Team',
      type: 'group',
      lastMessage: 'I will complete my task today',
      lastMessageTime: '2024-07-24T16:45:00',
      unreadCount: 0,
      participants: [
        { id: '104', name: 'Prof. James Wilson', status: 'away' },
        { id: '105', name: 'David Kim', status: 'online' },
        { id: '106', name: 'Lisa Wang', status: 'online' },
      ]
    },
    {
      id: '4',
      name: 'Prof. James Wilson',
      type: 'manager',
      avatar: '/avatars/james.jpg',
      lastMessage: 'Please review the updated timeline',
      lastMessageTime: '2024-07-24T09:15:00',
      unreadCount: 0,
      status: 'away'
    },
  ]

  const messages: Record<string, Message[]> = {
    '1': [
      {
        id: 'm1',
        senderId: '101',
        senderName: 'Dr. Sarah Chen',
        senderAvatar: '/avatars/sarah.jpg',
        content: 'Good morning team! Let\'s discuss our findings from this week.',
        timestamp: '2024-07-25T09:00:00',
        status: 'read'
      },
      {
        id: 'm2',
        senderId: '102',
        senderName: 'John Smith',
        content: 'I\'ve completed the data analysis. Results look promising.',
        timestamp: '2024-07-25T09:15:00',
        status: 'read'
      },
      {
        id: 'm3',
        senderId: '103',
        senderName: 'Emily Brown',
        content: 'Great! I\'ll prepare the presentation slides.',
        timestamp: '2024-07-25T09:20:00',
        status: 'read'
      },
      {
        id: 'm4',
        senderId: '101',
        senderName: 'Dr. Sarah Chen',
        senderAvatar: '/avatars/sarah.jpg',
        content: 'Perfect. Let\'s meet at 3pm to go through everything.',
        timestamp: '2024-07-25T09:25:00',
        status: 'read'
      },
      {
        id: 'm5',
        senderId: '102',
        senderName: 'John Smith',
        content: 'Works for me. Should I share the data before the meeting?',
        timestamp: '2024-07-25T09:30:00',
        status: 'delivered'
      },
    ],
    '2': [
      {
        id: 'm6',
        senderId: '101',
        senderName: 'Dr. Sarah Chen',
        senderAvatar: '/avatars/sarah.jpg',
        content: 'Your research proposal draft looks excellent. I have a few suggestions.',
        timestamp: '2024-07-25T10:00:00',
        status: 'read'
      },
      {
        id: 'm7',
        senderId: 'current',
        senderName: 'You',
        content: 'Thank you! I\'d love to hear your feedback.',
        timestamp: '2024-07-25T10:05:00',
        status: 'read'
      },
      {
        id: 'm8',
        senderId: '101',
        senderName: 'Dr. Sarah Chen',
        senderAvatar: '/avatars/sarah.jpg',
        content: 'Great progress on the research proposal. The methodology section is particularly strong.',
        timestamp: '2024-07-25T11:20:00',
        status: 'delivered'
      },
    ]
  }

  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementContent, setAnnouncementContent] = useState("")
  const [announcementPriority, setAnnouncementPriority] = useState<Announcement["priority"]>("medium")
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)

  const announcementItems = announcementsQuery.data?.items

  const announcements: Announcement[] = useMemo(() => {
    if (!announcementItems) return []

    return announcementItems.map((item) => {
      const priority = item.priority === "HIGH" ? "high" : item.priority === "LOW" ? "low" : "medium"
      const authorName =
        [item.createdBy?.firstName, item.createdBy?.lastName].filter(Boolean).join(" ") || "Unknown"

      return {
        id: item.id,
        title: item.title,
        content: item.message,
        date: item.createdAt,
        author: authorName,
        priority,
      }
    })
  }, [announcementItems])

  const isEditingAnnouncement = editingAnnouncementId !== null

  const openNewAnnouncementDialog = () => {
    setEditingAnnouncementId(null)
    setAnnouncementTitle("")
    setAnnouncementContent("")
    setAnnouncementPriority("medium")
    setCreateAnnouncementOpen(true)
  }

  const openEditAnnouncementDialog = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id)
    setAnnouncementTitle(announcement.title)
    setAnnouncementContent(announcement.content)
    setAnnouncementPriority(announcement.priority)
    setCreateAnnouncementOpen(true)
  }

  const handleAnnouncementDialogOpenChange = (open: boolean) => {
    setCreateAnnouncementOpen(open)
    if (!open) {
      setEditingAnnouncementId(null)
      setAnnouncementTitle("")
      setAnnouncementContent("")
      setAnnouncementPriority("medium")
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return
    // In production, this would send the message
    setMessageInput('')
  }

  const handleSendAdvisorMessage = () => {
    if (!advisorInput.trim()) return
    setAdvisorMessages((prev) => [
      ...prev,
      {
        id: `am-${Date.now()}`,
        senderId: 'current',
        senderName: 'You',
        content: advisorInput.trim(),
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
    ])
    setAdvisorInput('')
  }

  const handleCall = (type: 'audio' | 'video') => {
    alert(`${type === 'audio' ? 'Audio' : 'Video'} call initiated with ${selectedConversation?.name}`)
  }

  const handleCreateAnnouncement = async () => {
    const priorityApi =
      announcementPriority === "high" ? "HIGH" : announcementPriority === "low" ? "LOW" : "MEDIUM"

    const parsed = createMyGroupAnnouncementSchema.safeParse({
      title: announcementTitle,
      priority: priorityApi,
      message: announcementContent,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid announcement"
      toast.error(message)
      return
    }

    try {
      await createAnnouncementMutation.mutateAsync({
        title: parsed.data.title,
        priority: parsed.data.priority,
        message: parsed.data.message,
      })

      setAnnouncementTitle("")
      setAnnouncementContent("")
      setAnnouncementPriority("medium")
      setCreateAnnouncementOpen(false)
      toast.success("Announcement posted")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post announcement"
      toast.error(message)
    }
  }

  const handleUpdateAnnouncement = async (announcementId: string) => {
    const parsedId = announcementIdSchema.safeParse(announcementId)
    if (!parsedId.success) {
      toast.error(parsedId.error.issues[0]?.message ?? "Invalid announcement ID")
      return
    }

    const priorityApi =
      announcementPriority === "high" ? "HIGH" : announcementPriority === "low" ? "LOW" : "MEDIUM"

    const parsed = updateMyGroupAnnouncementSchema.safeParse({
      title: announcementTitle,
      priority: priorityApi,
      message: announcementContent,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid announcement"
      toast.error(message)
      return
    }

    try {
      await updateAnnouncementMutation.mutateAsync({
        announcementId: parsedId.data,
        dto: {
          title: parsed.data.title,
          priority: parsed.data.priority,
          message: parsed.data.message,
        },
      })

      setEditingAnnouncementId(null)
      setAnnouncementTitle("")
      setAnnouncementContent("")
      setAnnouncementPriority("medium")
      setCreateAnnouncementOpen(false)
      toast.success("Announcement updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update announcement"
      toast.error(message)
    }
  }

  const handleSubmitAnnouncement = async () => {
    if (!isEditingAnnouncement) {
      await handleCreateAnnouncement()
      return
    }

    if (!editingAnnouncementId) return
    await handleUpdateAnnouncement(editingAnnouncementId)
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chat with your group managers and team members
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="chats" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chats</span>
          </TabsTrigger>
          <TabsTrigger value="advisor" className="gap-2">
            <UserRound className="h-4 w-4" />
            <span>Chat with Advisor</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>Announcements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <Badge variant="outline">{filteredConversations.length} total</Badge>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0 ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            {conv.avatar ? (
                              <AvatarImage src={conv.avatar} />
                            ) : (
                              <AvatarFallback className={conv.type === 'group' ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}>
                                {conv.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(conv.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {conv.status && (
                            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(conv.status)} ring-2 ring-white`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{conv.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatMessageTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No conversations found</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {selectedConversation.avatar ? (
                              <AvatarImage src={selectedConversation.avatar} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {selectedConversation.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(selectedConversation.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {selectedConversation.status && (
                            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(selectedConversation.status)} ring-2 ring-white`} />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{selectedConversation.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {selectedConversation.type === 'group' 
                              ? `${selectedConversation.participants?.length} participants` 
                              : selectedConversation.status === 'online' ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleCall('audio')}>
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleCall('video')}>
                          <Video className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                            <DropdownMenuItem>Block</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Group Participants (if group chat) - Using div border instead of Separator */}
                    {selectedConversation.type === 'group' && selectedConversation.participants && (
                      <>
                        <div className="h-px w-full bg-border my-2" />
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {selectedConversation.participants.map((participant) => (
                            <div key={participant.id} className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
                              <span className={`h-2 w-2 rounded-full ${getStatusColor(participant.status)}`} />
                              <span className="text-xs">{participant.name.split(' ')[0]}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {messages[selectedConversation.id]?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderId === 'current' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-[70%] ${msg.senderId === 'current' ? 'flex-row-reverse' : ''}`}>
                              {msg.senderId !== 'current' && (
                                <Avatar className="h-8 w-8 mt-1">
                                  {msg.senderAvatar ? (
                                    <AvatarImage src={msg.senderAvatar} />
                                  ) : (
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(msg.senderName)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              )}
                              <div>
                                {msg.senderId !== 'current' && (
                                  <p className="text-xs font-medium mb-1 ml-1">{msg.senderName}</p>
                                )}
                                <div
                                  className={`p-3 rounded-lg ${
                                    msg.senderId === 'current'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm">{msg.content}</p>
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {msg.attachments.map((att, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs bg-background/20 rounded p-1">
                                          <Paperclip className="h-3 w-3" />
                                          <span className="truncate">{att.name}</span>
                                          <span className="text-xs opacity-70">({att.size})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                                  msg.senderId === 'current' ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span>{formatMessageTime(msg.timestamp)}</span>
                                  {msg.senderId === 'current' && (
                                    <>
                                      {msg.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-500" />}
                                      {msg.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                                      {msg.status === 'sent' && <Clock className="h-3 w-3" />}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Chat with Advisor - same layout as Chats */}
        <TabsContent value="advisor" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Advisor conversation list (single item) */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Chat with Advisor</CardTitle>
                  <Badge variant="outline">1 conversation</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Private conversation with your project advisor
                </p>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="flex items-start gap-3 p-4 cursor-default bg-muted/50 border-b">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/sarah.jpg" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(advisorProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(advisorProfile.status)} ring-2 ring-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{advisorProfile.name}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {advisorMessages.length > 0
                            ? formatMessageTime(advisorMessages[advisorMessages.length - 1].timestamp)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {advisorMessages.length > 0
                            ? advisorMessages[advisorMessages.length - 1].content
                            : 'Start a conversation with your advisor'}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Advisor chat window */}
            <Card className="lg:col-span-2 flex flex-col">
              {/* Chat Header - matches Chats section */}
              <CardHeader className="border-b py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/sarah.jpg" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(advisorProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(advisorProfile.status)} ring-2 ring-white`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{advisorProfile.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {advisorProfile.status === 'online' ? 'Online' : advisorProfile.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => alert(`Audio call initiated with ${advisorProfile.name}`)}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => alert(`Video call initiated with ${advisorProfile.name}`)}>
                      <Video className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {/* Messages - matches Chats section */}
              <CardContent className="flex-1 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {advisorMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === 'current' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${msg.senderId === 'current' ? 'flex-row-reverse' : ''}`}>
                          {msg.senderId !== 'current' && (
                            <Avatar className="h-8 w-8 mt-1">
                              {msg.senderAvatar ? (
                                <AvatarImage src={msg.senderAvatar} />
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(msg.senderName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          )}
                          <div>
                            {msg.senderId !== 'current' && (
                              <p className="text-xs font-medium mb-1 ml-1">{msg.senderName}</p>
                            )}
                            <div
                              className={`p-3 rounded-lg ${
                                msg.senderId === 'current'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((att, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs bg-background/20 rounded p-1">
                                      <Paperclip className="h-3 w-3" />
                                      <span className="truncate">{att.name}</span>
                                      <span className="text-xs opacity-70">({att.size})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                              msg.senderId === 'current' ? 'justify-end' : 'justify-start'
                            }`}>
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {msg.senderId === 'current' && (
                                <>
                                  {msg.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-500" />}
                                  {msg.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                                  {msg.status === 'sent' && <Clock className="h-3 w-3" />}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input - matches Chats section */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={advisorInput}
                    onChange={(e) => setAdvisorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAdvisorMessage()}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSendAdvisorMessage} disabled={!advisorInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Team Announcements
                  </CardTitle>
                  <CardDescription>
                    Important updates from your group managers
                  </CardDescription>
                </div>

                {isApprovedGroupManager && (
                  <Button className="gap-2" onClick={openNewAnnouncementDialog}>
                    <Plus className="h-4 w-4" />
                    Create Announcement
                  </Button>
                )}
              </div>
              <CardDescription>
                Important updates from your group managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcementsQuery.isLoading ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Loading announcements…</p>
                  </div>
                ) : announcementsQuery.isError ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">Couldn’t load announcements</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Please try again.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" onClick={() => announcementsQuery.refetch()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">No announcements yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isApprovedGroupManager
                        ? "Create the first announcement for your team."
                        : "Your group leader will post updates here."}
                    </p>

                    {isApprovedGroupManager && (
                      <div className="mt-4 flex justify-center">
                        <Button className="gap-2" onClick={openNewAnnouncementDialog}>
                          <Plus className="h-4 w-4" />
                          Create Announcement
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  announcements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start border-l-4 border-l-transparent hover:border-l-primary transition-all">
                        <div className="p-4 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                announcement.priority === 'high' ? 'bg-red-100' :
                                announcement.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                              }`}>
                                <Bell className={`h-5 w-5 ${
                                  announcement.priority === 'high' ? 'text-red-600' :
                                  announcement.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold">{announcement.title}</h4>
                                  <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                                    {announcement.priority} priority
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>Posted by {announcement.author}</span>
                                  <span>•</span>
                                  <span>{new Date(announcement.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="whitespace-nowrap">
                                New
                              </Badge>

                              {canManageAnnouncements && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      aria-label="Announcement actions"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      disabled={updateAnnouncementMutation.isPending}
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        openEditAnnouncementDialog(announcement)
                                      }}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={deleteAnnouncementMutation.isPending}
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        void handleDeleteAnnouncement(announcement.id)
                                      }}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createAnnouncementOpen} onOpenChange={handleAnnouncementDialogOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{isEditingAnnouncement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
            <DialogDescription>
              {isEditingAnnouncement
                ? "Update this announcement. Changes are visible to group members."
                : "Post an update to your team. This is visible to group members."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                placeholder="e.g., Meeting moved to Friday"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-priority">Priority</Label>
              <select
                id="announcement-priority"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value as Announcement["priority"])}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-content">Announcement</Label>
              <Textarea
                id="announcement-content"
                placeholder="Write your announcement..."
                className="min-h-[120px]"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAnnouncementOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAnnouncement}>
              {isEditingAnnouncement ? "Save Changes" : "Post Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}