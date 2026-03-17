"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Send, 
  Users, 
  PhoneCall, 
  Video,
  Save,
  X,
  Paperclip,
  AtSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Mock data - replace with actual data from your backend
const recentRecipients: Recipient[] = [
  { id: "1", name: "Group Alpha", type: "group", avatar: "GA" },
  { id: "2", name: "Dr. Sarah Johnson", type: "advisor", avatar: "SJ" },
  { id: "3", name: "Group Beta", type: "group", avatar: "GB" },
  { id: "4", name: "Prof. Michael Chen", type: "advisor", avatar: "MC" },
]

const quickTemplates = [
  { id: "1", name: "Meeting Reminder", content: "This is a reminder about our upcoming meeting scheduled for..." },
  { id: "2", name: "Project Update", content: "I'd like to provide an update on the current project status..." },
  { id: "3", name: "Feedback Request", content: "Could you please provide feedback on the recent submission..." },
]

interface Recipient {
  id: string
  name: string
  type: "group" | "advisor" | "department"
  avatar?: string
}

// Custom Dropdown Component (replacing Select)
const PriorityDropdown = ({ 
  value, 
  onChange 
}: { 
  value: "normal" | "high" | "urgent", 
  onChange: (value: "normal" | "high" | "urgent") => void 
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const priorities = [
    { value: "normal", label: "Normal", color: "bg-secondary" },
    { value: "high", label: "High", color: "bg-yellow-500" },
    { value: "urgent", label: "Urgent", color: "bg-destructive" },
  ]

  const selectedPriority = priorities.find(p => p.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-background hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", selectedPriority?.color)} />
          {selectedPriority?.label}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          {priorities.map((priority) => (
            <button
              key={priority.value}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors",
                value === priority.value && "bg-secondary/50"
              )}
              onClick={() => {
                onChange(priority.value as typeof value)
                setIsOpen(false)
              }}
            >
              <span className={cn("w-2 h-2 rounded-full", priority.color)} />
              {priority.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Custom Recipient Type Dropdown
const RecipientTypeDropdown = ({ 
  value, 
  onChange 
}: { 
  value: "group" | "advisor" | "department", 
  onChange: (value: "group" | "advisor" | "department") => void 
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const types = [
    { value: "group", label: "Group", icon: Users },
    { value: "advisor", label: "Advisor", icon: Users },
    { value: "department", label: "Department", icon: Users },
  ]

  const selectedType = types.find(t => t.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-[180px] px-3 py-2 text-sm border rounded-md bg-background hover:bg-secondary/50 transition-colors"
      >
        <span>{selectedType?.label}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          {types.map((type) => (
            <button
              key={type.value}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors",
                value === type.value && "bg-secondary/50"
              )}
              onClick={() => {
                onChange(type.value as typeof value)
                setIsOpen(false)
              }}
            >
              <type.icon className="h-4 w-4" />
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function DepartmentHeadMessagesComposePage() {
  const router = useRouter()
  const [isSending, setIsSending] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [recipientType, setRecipientType] = React.useState<"group" | "advisor" | "department">("group")
  const [recipient, setRecipient] = React.useState("")
  const [selectedRecipient, setSelectedRecipient] = React.useState<Recipient | null>(null)
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [priority, setPriority] = React.useState<"normal" | "high" | "urgent">("normal")
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [showRecipientSuggestions, setShowRecipientSuggestions] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const filteredRecipients = recentRecipients.filter(r => 
    r.name.toLowerCase().includes(recipient.toLowerCase())
  )

  const handleSend = async () => {
    if (!selectedRecipient || !message.trim()) {
      toast.error("Missing information", {
        description: "Please select a recipient and write a message.",
      })
      return
    }

    setIsSending(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success("Message sent successfully", {
        description: `Your message has been sent to ${selectedRecipient.name}.`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      })
      
      // Reset form or navigate
      setSelectedRecipient(null)
      setRecipient("")
      setSubject("")
      setMessage("")
      setPriority("normal")
      setAttachments([])
      
      // Optional: Navigate to sent messages
      // router.push("/department/messages/sent")
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again or contact support.",
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!message.trim()) {
      toast.error("Cannot save empty draft", {
        description: "Please write something before saving.",
      })
      return
    }

    setIsSaving(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success("Draft saved", {
        description: "Your message has been saved to drafts.",
      })
    } catch (error) {
      toast.error("Failed to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAudio = () => {
    toast.info("Audio call", {
      description: "Starting audio call feature will be available soon.",
    })
  }

  const handleVideo = () => {
    toast.info("Video call", {
      description: "Starting video call feature will be available soon.",
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files])
      toast.success(`${files.length} file(s) attached`)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const applyTemplate = (content: string) => {
    setMessage(content)
    toast.info("Template applied", {
      description: "Message template has been applied.",
    })
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "bg-destructive"
      case "high": return "bg-yellow-500"
      default: return "bg-secondary"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 overflow-y-auto">
      {/* Header - removed sticky positioning */}
      <div className="border-b bg-background/95">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 hover:bg-secondary/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  New message
                </h1>
                <p className="text-sm text-muted-foreground">
                  Start a new conversation with a project team or advisor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleAudio}
              >
                <PhoneCall className="h-4 w-4" />
                Audio
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleVideo}
              >
                <Video className="h-4 w-4" />
                Video
              </Button>
              {/* Simple divider instead of Separator component */}
              <div className="h-8 w-px bg-border" />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - removed container and adjusted padding */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-12 gap-6 max-w-full">
          {/* Compose form */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="h-5 w-5 text-primary" />
                      Compose message
                    </CardTitle>
                    <CardDescription>
                      Send a message to groups, advisors, or departments
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="px-3 py-1">
                    Draft
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Recipient selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      To
                    </label>
                    <RecipientTypeDropdown 
                      value={recipientType} 
                      onChange={setRecipientType}
                    />
                  </div>
                  
                  <div className="relative">
                    <Input
                      placeholder={`Search ${recipientType}s...`}
                      value={recipient}
                      onChange={(e) => {
                        setRecipient(e.target.value)
                        setShowRecipientSuggestions(true)
                      }}
                      onFocus={() => setShowRecipientSuggestions(true)}
                      className="pl-9"
                    />
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    
                    {showRecipientSuggestions && recipient && (
                      <Card className="absolute z-20 w-full mt-1 shadow-lg">
                        <CardContent className="p-2">
                          {filteredRecipients.length > 0 ? (
                            <div className="space-y-1">
                              {filteredRecipients.map((r) => (
                                <button
                                  key={r.id}
                                  className="w-full text-left px-3 py-2 rounded-md hover:bg-secondary/50 flex items-center gap-3 transition-colors"
                                  onClick={() => {
                                    setSelectedRecipient(r)
                                    setRecipient(r.name)
                                    setShowRecipientSuggestions(false)
                                  }}
                                >
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                    {r.avatar}
                                  </div>
                                  <div>
                                    <p className="font-medium">{r.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{r.type}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground p-2">No recipients found</p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {selectedRecipient && (
                    <Badge variant="secondary" className="mt-2">
                      {selectedRecipient.name} ({selectedRecipient.type})
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => {
                          setSelectedRecipient(null)
                          setRecipient("")
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>

                {/* Subject and priority */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      placeholder="What's this about?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <PriorityDropdown value={priority} onChange={setPriority} />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    rows={8}
                    placeholder="Write your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length} characters
                  </p>
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attachments</label>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <Badge key={index} variant="outline" className="gap-2 px-3 py-1">
                          {file.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                      Attach files
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setSelectedRecipient(null)
                        setRecipient("")
                        setSubject("")
                        setMessage("")
                        setAttachments([])
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      className="gap-2 min-w-[100px]"
                      onClick={handleSend}
                      disabled={!selectedRecipient || !message.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Quick templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick templates</CardTitle>
                <CardDescription>Use predefined message templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full text-left p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                    onClick={() => applyTemplate(template.content)}
                  >
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {template.content}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Recent recipients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent conversations</CardTitle>
                <CardDescription>Quickly message recent contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentRecipients.map((recipient) => (
                  <button
                    key={recipient.id}
                    className="w-full text-left p-2 rounded-lg hover:bg-secondary/50 flex items-center gap-3 transition-colors"
                    onClick={() => {
                      setSelectedRecipient(recipient)
                      setRecipient(recipient.name)
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {recipient.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{recipient.type}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Tips */}
            <Alert className="bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pro tips</AlertTitle>
              <AlertDescription className="text-sm space-y-1 mt-2">
                <p>• Use @mentions to notify specific members</p>
                <p>• You can attach multiple files at once</p>
                <p>• Priority flags help recipients prioritize</p>
                <p>• Messages are saved automatically every 30 seconds</p>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}