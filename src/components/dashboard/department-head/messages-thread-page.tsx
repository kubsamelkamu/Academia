"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DashboardBackButton } from "@/components/dashboard/dashboard-back"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  MessageSquare, 
  Users, 
  PhoneCall, 
  Video,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Check,
  Reply,
  Copy,
  Trash2,
  Edit
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ============ Types ============
interface Message {
  id: string
  author: "department_head" | "team"
  name: string
  avatar?: string
  content: string
  createdAt: string
  readBy?: string[]
  attachments?: Attachment[]
  replyTo?: ReplyReference
  isEdited?: boolean
}

interface Attachment {
  id: string
  name: string
  size: string
  type: string
  url: string
}

interface ReplyReference {
  id: string
  content: string
  author: string
}

interface Participant {
  id: string
  name: string
  role: string
  avatar?: string
  isOnline?: boolean
}

interface Conversation {
  id: string
  title: string
  groupName: string
  participants: Participant[]
}

// ============ Mock Data ============
const MOCK_CONVERSATIONS: Record<string, Conversation> = {
  "conv-1": {
    id: "conv-1",
    title: "Mid‑semester review",
    groupName: "Group Alpha – AI-Powered Student Assistant",
    participants: [
      { id: "p1", name: "Dr. Sarah Chen", role: "Supervisor", isOnline: true },
      { id: "p2", name: "Mike Johnson", role: "Team Lead", isOnline: true },
      { id: "p3", name: "Emily Davis", role: "Member" },
    ],
  },
  "conv-2": {
    id: "conv-2",
    title: "Ethics approval clarification",
    groupName: "Group Beta – Blockchain-Based Voting System",
    participants: [
      { id: "p4", name: "Prof. Robert Lee", role: "Supervisor" },
      { id: "p5", name: "Anna Smith", role: "Team Lead" },
    ],
  },
}

const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "m1",
      author: "team",
      name: "Dr. Sarah Chen",
      avatar: "SC",
      content: "We have completed the prototype and are preparing for user testing next week. The system is now stable and we've fixed all critical bugs from the last sprint.",
      createdAt: "2024-03-18T10:15:00Z",
      readBy: ["department_head"],
      attachments: [{ id: "a1", name: "testing_schedule.pdf", size: "2.4 MB", type: "pdf", url: "#" }]
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
    {
      id: "m4",
      author: "team",
      name: "Emily Davis",
      avatar: "ED",
      content: "All test cases have been prepared. We're ready to start as soon as you approve the schedule.",
      createdAt: "2024-03-18T10:30:00Z",
      readBy: ["department_head"],
    },
    {
      id: "m5",
      author: "department_head",
      name: "You",
      content: "Schedule approved. Looking forward to seeing the results!",
      createdAt: "2024-03-18T10:35:00Z",
      readBy: ["team"],
    },
  ],
  "conv-2": [
    {
      id: "m1",
      author: "team",
      name: "Prof. Robert Lee",
      avatar: "RL",
      content: "Could you confirm the required documents for the ethics committee submission?",
      createdAt: "2024-03-16T15:00:00Z",
      readBy: ["department_head"],
    },
  ],
}

// ============ Custom Hooks ============
const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>(() => MOCK_MESSAGES[conversationId] ?? [])
  
  const sendMessage = (content: string, replyTo?: Message) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      author: "department_head",
      name: "You",
      content: content.trim(),
      createdAt: new Date().toISOString(),
      readBy: ["team"],
      ...(replyTo && {
        replyTo: {
          id: replyTo.id,
          content: replyTo.content.slice(0, 100) + (replyTo.content.length > 100 ? "..." : ""),
          author: replyTo.name
        }
      })
    }
    
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }
  
  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
    toast.success("Message deleted")
  }
  
  const editMessage = (id: string, newContent: string) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, content: newContent, isEdited: true } : m
    ))
    toast.success("Message updated")
  }
  
  return { messages, sendMessage, deleteMessage, editMessage }
}

const useTimeAgo = () => {
  const format = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    
    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
  
  return { formatTime: format }
}

// ============ Subcomponents ============
const MessageBubble = ({ 
  message, 
  isSelf, 
  showAvatar,
  onReply,
  onCopy,
  onEdit,
  onDelete
}: { 
  message: Message
  isSelf: boolean
  showAvatar: boolean
  onReply: () => void
  onCopy: () => void
  onEdit?: () => void
  onDelete?: () => void
}) => {
  const { formatTime } = useTimeAgo()
  const [showActions, setShowActions] = useState(false)
  
  return (
    <div 
      className={cn("flex gap-3 group", isSelf ? "justify-end" : "justify-start")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isSelf && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {message.avatar || message.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("max-w-[70%] space-y-1", !isSelf && !showAvatar && "ml-11")}>
        {message.replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-3 border-l-2 border-muted">
            <Reply className="h-3 w-3" />
            <span>Replying to {message.replyTo.author}</span>
            <span className="truncate">“{message.replyTo.content}”</span>
          </div>
        )}
        
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm relative transition-all",
          isSelf
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/50 text-foreground rounded-bl-md"
        )}>
          {!isSelf && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium">{message.name}</span>
              <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
            </div>
          )}
          
          <p className="whitespace-pre-line leading-relaxed break-words">
            {message.content}
            {message.isEdited && (
              <span className="text-[10px] ml-2 opacity-60">(edited)</span>
            )}
          </p>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map(att => (
                <div key={att.id} className="flex items-center gap-2 text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate">{att.name}</span>
                  <span className="opacity-60">{att.size}</span>
                </div>
              ))}
            </div>
          )}
          
          {isSelf && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] opacity-60">{formatTime(message.createdAt)}</span>
              {message.readBy?.includes("team") ? (
                <CheckCheck className="h-3 w-3 opacity-60" />
              ) : (
                <Check className="h-3 w-3 opacity-40" />
              )}
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-1 transition-opacity duration-200",
          showActions ? "opacity-100" : "opacity-0",
          isSelf ? "justify-end" : "justify-start"
        )}>
          <button
            onClick={onReply}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="Reply"
          >
            <Reply className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={onCopy}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="Copy"
          >
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
          {isSelf && (
            <>
              <button
                onClick={onEdit}
                className="p-1 rounded-md hover:bg-muted transition-colors"
                title="Edit"
              >
                <Edit className="h-3 w-3 text-muted-foreground" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {isSelf && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            ME
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

const MessageList = ({ 
  messages, 
  onReply, 
  onCopy, 
  onEdit, 
  onDelete 
}: {
  messages: Message[]
  onReply: (message: Message) => void
  onCopy: (content: string) => void
  onEdit: (message: Message) => void
  onDelete: (id: string) => void
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-4 py-6 space-y-4 min-h-full">
        {messages.map((msg, idx) => {
          const isSelf = msg.author === "department_head"
          const showAvatar = idx === 0 || messages[idx - 1]?.author !== msg.author
          
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={isSelf}
              showAvatar={showAvatar}
              onReply={() => onReply(msg)}
              onCopy={() => onCopy(msg.content)}
              onEdit={isSelf ? () => onEdit(msg) : undefined}
              onDelete={isSelf ? () => onDelete(msg.id) : undefined}
            />
          )
        })}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Send a message to start the conversation</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

const MessageComposer = ({ 
  value, 
  onChange, 
  onSend, 
  replyTo,
  onCancelReply
}: {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  replyTo?: Message | null
  onCancelReply: () => void
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [value])
  
  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      {replyTo && (
        <div className="px-4 pt-3 pb-2 border-b bg-muted/30">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Reply className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground flex-shrink-0">
                Replying to {replyTo.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {replyTo.content}
              </span>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 rounded-md hover:bg-muted transition-colors flex-shrink-0"
            >
              <span className="sr-only">Cancel reply</span>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex gap-3">
          <Textarea
            ref={textareaRef}
            rows={1}
            placeholder="Type a message..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[40px] max-h-[120px] resize-none bg-muted/30 border-0 focus-visible:ring-1"
          />
          
          <div className="flex items-end gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              className="h-9 w-9"
              onClick={onSend}
              disabled={!value.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ Main Component ============
export function DepartmentHeadMessagesThreadPage() {
  const router = useRouter()
  const params = useParams()
  const threadId = params?.threadId as string
  
  const conversation = MOCK_CONVERSATIONS[threadId]
  const { messages, sendMessage, deleteMessage, editMessage } = useMessages(threadId)
  const [newMessage, setNewMessage] = useState("")
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  
  const onlineCount = conversation?.participants.filter(p => p.isOnline).length ?? 0
  
  const handleSend = () => {
    if (!newMessage.trim()) return
    sendMessage(newMessage, replyTo ?? undefined)
    setNewMessage("")
    setReplyTo(null)
    toast.success("Message sent")
  }
  
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  }
  
  const handleEdit = (message: Message) => {
    const newContent = window.prompt("Edit message", message.content)
    if (newContent && newContent.trim() && newContent !== message.content) {
      editMessage(message.id, newContent.trim())
    }
  }
  
  const handleCall = (type: "audio" | "video") => {
    toast.info(`${type === "audio" ? "Audio" : "Video"} call`, {
      description: `Connecting to ${conversation?.groupName}...`,
    })
  }
  
  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Conversation not found</p>
            <p className="text-xs text-muted-foreground mt-1">The conversation may have been archived or deleted</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/department-head/messages")}>
            Go back
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <DashboardBackButton
                onClick={() => router.back()}
                className="h-8 px-2 gap-1.5 shrink-0"
              />
              
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">{conversation.title}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="truncate">{conversation.groupName}</span>
                  {onlineCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{onlineCount} online</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCall("audio")}>
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Audio call</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCall("video")}>
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video call</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* Messages - Only scrollable area */}
        <MessageList
          messages={messages}
          onReply={setReplyTo}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={deleteMessage}
        />
        
        {/* Composer - Fixed at bottom */}
        <div className="flex-shrink-0">
          <MessageComposer
            value={newMessage}
            onChange={setNewMessage}
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}