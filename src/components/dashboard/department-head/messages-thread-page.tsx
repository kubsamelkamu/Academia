"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  Clock, 
  PhoneCall, 
  Video,
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  Check,
  AlertCircle,
  Download,
  Copy,
  Trash2,
  Edit,
  Reply,
  Star,
  Archive,
  Bell,
  BellOff
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  author: "department_head" | "team"
  name: string
  avatar?: string
  content: string
  createdAt: string
  readBy?: string[]
  attachments?: Array<{
    id: string
    name: string
    size: string
    type: string
    url: string
  }>
  isEdited?: boolean
  replyTo?: {
    id: string
    content: string
    author: string
  }
}

interface ConversationMeta {
  id: string
  title: string
  groupName: string
  groupId: string
  participants: Array<{
    id: string
    name: string
    role: string
    avatar?: string
    isOnline?: boolean
    lastSeen?: string
  }>
  isMuted?: boolean
  isStarred?: boolean
}

const threadMeta: ConversationMeta[] = [
  {
    id: "conv-1",
    title: "Mid‑semester review",
    groupName: "Group Alpha – AI-Powered Student Assistant",
    groupId: "group-alpha",
    participants: [
      { id: "p1", name: "Dr. Sarah Chen", role: "Supervisor", isOnline: true },
      { id: "p2", name: "Mike Johnson", role: "Team Lead", isOnline: true },
      { id: "p3", name: "Emily Davis", role: "Member", lastSeen: "2024-03-18T09:30:00Z" },
    ],
    isStarred: true,
  },
  {
    id: "conv-2",
    title: "Ethics approval clarification",
    groupName: "Group Beta – Blockchain-Based Voting System",
    groupId: "group-beta",
    participants: [
      { id: "p4", name: "Prof. Robert Lee", role: "Supervisor", isOnline: false },
      { id: "p5", name: "Anna Smith", role: "Team Lead", lastSeen: "2024-03-17T16:20:00Z" },
    ],
  },
  {
    id: "conv-3",
    title: "Hardware procurement",
    groupName: "Group Gamma – Smart Campus IoT Platform",
    groupId: "group-gamma",
    participants: [
      { id: "p6", name: "Dr. James Wilson", role: "Supervisor", isOnline: true },
      { id: "p7", name: "Tom Brown", role: "Team Lead", lastSeen: "2024-03-18T11:45:00Z" },
    ],
  },
]

const baseMessages: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "m1",
      author: "team",
      name: "Dr. Sarah Chen",
      avatar: "SC",
      content: "We have completed the prototype and are preparing for user testing next week. The system is now stable and we've fixed all critical bugs from the last sprint.",
      createdAt: "2024-03-18T10:15:00Z",
      readBy: ["department_head"],
      attachments: [
        {
          id: "a1",
          name: "testing_schedule.pdf",
          size: "2.4 MB",
          type: "pdf",
          url: "#"
        }
      ]
    },
    {
      id: "m2",
      author: "department_head",
      name: "You",
      content: "Great work! Could you please share a short demo video and an updated timeline? Also, what's your ETA for the user testing phase?",
      createdAt: "2024-03-18T10:20:00Z",
      readBy: ["team"],
    },
    {
      id: "m3",
      author: "team",
      name: "Mike Johnson",
      avatar: "MJ",
      content: "We're aiming to start user testing by March 25th. I'll upload the demo video by EOD today.",
      createdAt: "2024-03-18T10:25:00Z",
      readBy: ["department_head"],
      replyTo: {
        id: "m2",
        content: "Could you please share a short demo video and an updated timeline?",
        author: "You"
      }
    },
  ],
  "conv-2": [
    {
      id: "m1",
      author: "team",
      name: "Prof. Robert Lee",
      avatar: "RL",
      content: "Could you confirm the required documents for the ethics committee submission? We want to make sure we don't miss anything.",
      createdAt: "2024-03-16T15:00:00Z",
      readBy: ["department_head"],
    },
  ],
  "conv-3": [
    {
      id: "m1",
      author: "team",
      name: "Tom Brown",
      avatar: "TB",
      content: "We have shared the updated bill of materials in the shared folder. Please review when you have a moment.",
      createdAt: "2024-03-15T09:00:00Z",
      readBy: ["department_head"],
      attachments: [
        {
          id: "a2",
          name: "bill_of_materials.xlsx",
          size: "1.8 MB",
          type: "xlsx",
          url: "#"
        }
      ]
    },
  ],
}

export function DepartmentHeadMessagesThreadPage() {
  const router = useRouter()
  const params = useParams()
  const threadId = (params?.threadId as string) || ""
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>(() => baseMessages[threadId] ?? [])
  const [newMessage, setNewMessage] = useState("")
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isStarred, setIsStarred] = useState(false)

  const meta = threadMeta.find((m) => m.id === threadId)
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-muted mx-auto flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">Conversation not found</p>
            <p className="text-sm text-muted-foreground">
              The conversation you&apos;re looking for does not exist or has been archived.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard/department-head/messages")}>
            Go back to messages
          </Button>
        </div>
      </div>
    )
  }

  const handleSend = () => {
    if (!newMessage.trim()) return

    const msg: Message = {
      id: `local-${Date.now()}`,
      author: "department_head",
      name: "You",
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      readBy: ["team"],
      ...(replyTo && {
        replyTo: {
          id: replyTo.id,
          content: replyTo.content.substring(0, 100) + (replyTo.content.length > 100 ? "..." : ""),
          author: replyTo.name
        }
      })
    }
    
    setMessages((prev) => [...prev, msg])
    setNewMessage("")
    setReplyTo(null)
    
    toast.success("Message sent", {
      description: "Your message has been delivered to the group.",
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCall = (type: "audio" | "video") => {
    toast.info(`${type === "audio" ? "Audio" : "Video"} call initiated`, {
      description: `Connecting to ${meta.groupName}...`,
      duration: 3000,
    })
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  }

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
    toast.success("Message deleted")
  }

  const handleEditMessage = (id: string) => {
    // Implement edit functionality
    toast.info("Edit message feature coming soon")
  }

  const getTimeString = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const onlineParticipants = meta.participants.filter(p => p.isOnline)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 sticky top-0 z-10 backdrop-blur-sm">
          <div className="px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="gap-2 hover:bg-background/80 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-semibold truncate max-w-2xl" title={meta.title}>
                      {meta.title}
                    </h1>
                    <div className="flex items-center gap-1">
                      {onlineParticipants.length > 0 && (
                        <Badge variant="default" className="bg-green-500 gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          {onlineParticipants.length} online
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span className="truncate">{meta.groupName}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{meta.participants.length} participants</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsStarred(!isStarred)}
                      className="h-8 w-8"
                    >
                      <Star className={cn("h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isStarred ? "Remove from starred" : "Add to starred"}
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                      className="h-8 w-8"
                    >
                      {isMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMuted ? "Unmute notifications" : "Mute notifications"}
                  </TooltipContent>
                </Tooltip>
                
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleCall("audio")}
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span className="hidden sm:inline">Audio</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start audio call</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleCall("video")}
                    >
                      <Video className="h-4 w-4" />
                      <span className="hidden sm:inline">Video</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start video call</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-73px)] overflow-y-auto">
          <div className="px-4 sm:px-8 py-6 flex flex-col gap-4 max-w-4xl mx-auto">
            {/* Thread body */}
            <Card className="flex-1 border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {messages.map((msg, index) => {
                    const isSelf = msg.author === "department_head"
                    const showAvatar = index === 0 || messages[index - 1]?.author !== msg.author
                    
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3 group",
                          isSelf ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isSelf && showAvatar && (
                          <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {msg.avatar || msg.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[85%] space-y-1",
                          !isSelf && !showAvatar && "ml-11"
                        )}>
                          {/* Reply indicator */}
                          {msg.replyTo && (
                            <div className="text-xs text-muted-foreground mb-1 pl-3 border-l-2 border-muted">
                              Replying to {msg.replyTo.author}: “{msg.replyTo.content}”
                            </div>
                          )}
                          
                          {/* Message bubble */}
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm shadow-sm relative group",
                              isSelf
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            )}
                          >
                            {!isSelf && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">{msg.name}</span>
                                <span className="text-[10px] opacity-60">
                                  {getTimeString(msg.createdAt)}
                                </span>
                              </div>
                            )}
                            
                            <p className="whitespace-pre-line leading-relaxed">
                              {msg.content}
                            </p>
                            
                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map(att => (
                                  <div
                                    key={att.id}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-background/10 backdrop-blur-sm"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    <span className="text-xs flex-1 truncate">{att.name}</span>
                                    <span className="text-xs opacity-60">{att.size}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => window.open(att.url)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {isSelf && (
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] opacity-60">
                                  {getTimeString(msg.createdAt)}
                                </span>
                                {msg.readBy?.includes("team") ? (
                                  <CheckCheck className="h-3 w-3 opacity-60" />
                                ) : (
                                  <Check className="h-3 w-3 opacity-40" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Message actions */}
                          <div className={cn(
                            "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                            isSelf ? "justify-end" : "justify-start"
                          )}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setReplyTo(msg)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reply</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleCopyMessage(msg.content)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy</TooltipContent>
                            </Tooltip>
                            
                            {isSelf && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleEditMessage(msg.id)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {isSelf && showAvatar && (
                          <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              DH
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })}

                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start the conversation by sending a message below
                      </p>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>

            {/* Composer */}
            <Card className="border border-primary/10 shadow-sm sticky bottom-0 bg-background/95 backdrop-blur-sm">
              <CardContent className="pt-4 space-y-3">
                {/* Reply indicator */}
                {replyTo && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Reply className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Replying to {replyTo.name}
                      </span>
                      <span className="text-xs truncate max-w-xs">
                        “{replyTo.content.substring(0, 100)}”
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setReplyTo(null)}
                    >
                      <AlertCircle className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Textarea
                    rows={3}
                    placeholder="Write a message to this project team..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="resize-none"
                  />
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach file</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Smile className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add emoji</TooltipContent>
                      </Tooltip>
                      
                      <span className="text-xs text-muted-foreground ml-2">
                        Press <kbd className="px-1 py-0.5 rounded bg-muted">⌘</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted">↵</kbd> to send
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}