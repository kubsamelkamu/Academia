"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Globe,
  Paperclip,
  Upload,
  CheckCircle2,
  Users,
  Eye,
  Info,
  FileText,
  Calendar,
  Send
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

import type { AnnouncementPriority, AnnouncementStatus } from "@/lib/mock/announcements"

const GROUP_OPTIONS = [
  { id: "g1", name: "AI Research Group", memberCount: 8, description: "Advanced AI and ML projects" },
  { id: "g2", name: "Team Atlas", memberCount: 5, description: "Web development team" },
  { id: "g3", name: "Team Nova", memberCount: 6, description: "Mobile app development" },
  { id: "g4", name: "Quantum Computing", memberCount: 4, description: "Quantum algorithms research" },
]

type AnnouncementFormData = {
  title: string
  priority: AnnouncementPriority
  status: AnnouncementStatus
  content: string
  selectedGroupIds: string[]
  attachmentUrl: string
  attachmentFile: File | null
  deadline: string
}

export function AdvisorAnnouncementNewPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: "",
    priority: "medium",
    status: "published",
    content: "",
    selectedGroupIds: [],
    attachmentUrl: "",
    attachmentFile: null,
    deadline: "",
  })

  const completionProgress = useMemo(() => {
    let score = 0
    if (formData.title.trim()) score += 20
    if (formData.content.trim()) score += 20
    if (formData.selectedGroupIds.length > 0) score += 20
    if (formData.priority) score += 20
    if (formData.deadline) score += 20
    return score
  }, [formData])

  const handleFieldChange = <K extends keyof AnnouncementFormData>(field: K, value: AnnouncementFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleGroup = (id: string) => {
    const current = formData.selectedGroupIds
    const next = current.includes(id) 
      ? current.filter(g => g !== id) 
      : [...current, id]
    handleFieldChange("selectedGroupIds", next)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const missingFields = []
    if (!formData.title) missingFields.push("title")
    if (!formData.content) missingFields.push("content")
    if (formData.selectedGroupIds.length === 0) missingFields.push("recipients")
    if (!formData.deadline) missingFields.push("deadline")

    if (missingFields.length > 0) {
      toast.error("Required fields missing", {
        description: `Please provide: ${missingFields.join(", ")}`
      })
      return
    }

    const selectedDate = new Date(formData.deadline)
    const now = new Date()
    if (selectedDate <= now) {
      toast.error("Invalid deadline", {
        description: "Deadline must be a future date and time"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Announcement broadcasted with deadline!")
      router.push("/dashboard/advisor/announcements")
    } catch (error) {
      toast.error("Error creating announcement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDeadline = (deadline: string) => {
    if (!deadline) return null
    const date = new Date(deadline)
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(date)
  }

  // Get button color based on completion and priority
  const getButtonColor = () => {
    if (completionProgress < 100) return 'bg-primary'
    switch(formData.priority) {
      case 'high':
        return 'bg-destructive hover:bg-destructive/90'
      case 'medium':
        return 'bg-orange-400 hover:bg-orange-400/90'
      case 'low':
        return 'bg-blue-400 hover:bg-blue-400/90'
      default:
        return 'bg-primary'
    }
  }

  // Title inherits button color
  const getTitleColor = () => {
    if (completionProgress < 100) return 'text-primary'
    switch(formData.priority) {
      case 'high':
        return 'text-destructive'
      case 'medium':
        return 'text-orange-400'
      case 'low':
        return 'text-blue-400'
      default:
        return 'text-primary'
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header Area with Title Inheriting Button Color */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="mb-2 -ml-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Overview
            </Button>
            
            {/* Title that inherits button color */}
            <div className="relative">
              <h1 
                className={`
                  text-3xl font-bold tracking-tight inline-block
                  transition-all duration-300 ease-in-out
                  ${getTitleColor()}
                  hover:scale-105 origin-left
                `}
              >
                New Announcement
              </h1>
              
              {/* Animated underline that matches title color */}
              <div 
                className={`
                  absolute bottom-0 left-0 h-1 rounded-full
                  transition-all duration-500 ease-out
                  ${getTitleColor().replace('text', 'bg')}
                  ${formData.title ? 'w-3/4 opacity-100' : 'w-1/2 opacity-50'}
                `}
                style={{ width: formData.title ? '75%' : '50%' }}
              />
            </div>
            
            <p className="text-muted-foreground flex items-center gap-2">
              <span>Draft and preview your message with deadline.</span>
              
              {/* Priority Indicator Dot */}
              <span className="inline-flex items-center gap-1.5">
                <span 
                  className={`
                    inline-block h-2 w-2 rounded-full animate-pulse
                    ${completionProgress < 100 ? 'bg-primary' :
                      formData.priority === 'high' ? 'bg-destructive' : 
                      formData.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400'}
                  `} 
                />
                <span className="text-xs capitalize text-muted-foreground">
                  {formData.priority} priority
                </span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="px-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Readiness</p>
              <p 
                className={`
                  text-sm font-bold transition-colors
                  ${getTitleColor()}
                `}
              >
                {completionProgress}% Complete
              </p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || completionProgress < 100}
              className={`
                shadow-md transition-all duration-300
                ${getButtonColor()}
                text-white
              `}
            >
              {isSubmitting ? "Sending..." : "Publish Now"}
              <Send className={`
                ml-2 h-4 w-4 transition-transform
                ${completionProgress === 100 ? 'group-hover:translate-x-1' : ''}
              `} />
            </Button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Editor Side */}
          <div className="space-y-6 lg:col-span-7">
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className={`
                    h-5 w-5 transition-colors
                    ${getTitleColor()}
                  `} />
                  Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                
                {/* Subject & Priority */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Subject Line <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      placeholder="Enter a clear title..." 
                      value={formData.title}
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      className={`
                        bg-background border-input focus-visible:ring-primary
                        transition-all duration-300
                        ${formData.title ? 
                          completionProgress < 100 ? 'border-primary/50' :
                          formData.priority === 'high' ? 'border-destructive/50' :
                          formData.priority === 'medium' ? 'border-orange-400/50' :
                          formData.priority === 'low' ? 'border-blue-400/50' :
                          'border-primary/50'
                        : ''}
                      `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Priority <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.priority} onValueChange={(v) => handleFieldChange("priority", v as AnnouncementPriority)}>
                      <SelectTrigger className={`
                        bg-background capitalize transition-colors
                        ${completionProgress < 100 ? 'border-primary/50' :
                          formData.priority === 'high' ? 'border-destructive/50 ring-destructive/20' : 
                          formData.priority === 'medium' ? 'border-orange-400/50 ring-orange-400/20' : 
                          formData.priority === 'low' ? 'border-blue-400/50 ring-blue-400/20' :
                          'border-primary/50'}
                      `}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-blue-600 dark:text-blue-400">Low</SelectItem>
                        <SelectItem value="medium" className="text-orange-600 dark:text-orange-400">Medium</SelectItem>
                        <SelectItem value="high" className="text-destructive">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Deadline Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Calendar className={`
                      h-4 w-4 transition-colors
                      ${getTitleColor()}
                    `} />
                    Deadline <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => handleFieldChange("deadline", e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`
                        bg-background border-input focus-visible:ring-primary
                        transition-all duration-300
                        ${formData.deadline ? 
                          completionProgress < 100 ? 'border-primary/50' :
                          formData.priority === 'high' ? 'border-destructive/50' :
                          formData.priority === 'medium' ? 'border-orange-400/50' :
                          formData.priority === 'low' ? 'border-blue-400/50' :
                          'border-primary/50'
                        : ''}
                      `}
                    />
                    {formData.deadline && (
                      <div className={`
                        flex items-center px-3 py-2 rounded-md bg-muted/30 border text-sm
                        transition-colors
                        ${completionProgress < 100 ? 'border-primary/20' :
                          formData.priority === 'high' ? 'border-destructive/20' :
                          formData.priority === 'medium' ? 'border-orange-400/20' :
                          formData.priority === 'low' ? 'border-blue-400/20' :
                          'border-primary/20'}
                      `}>
                        <span className="text-muted-foreground">Selected: </span>
                        <span className={`
                          ml-1 font-medium
                          ${getTitleColor()}
                        `}>
                          {formatDeadline(formData.deadline)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Set the date and time by which recipients need to respond or complete tasks
                  </p>
                </div>

                {/* Content Area */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Announcement Body <span className="text-destructive">*</span>
                  </Label>
                  <Textarea 
                    placeholder="Type your detailed message here..."
                    rows={10}
                    value={formData.content}
                    onChange={(e) => handleFieldChange("content", e.target.value)}
                    className={`
                      bg-background border-input focus-visible:ring-primary 
                      leading-relaxed resize-none transition-all duration-300
                      ${formData.content ? 
                        completionProgress < 100 ? 'border-primary/30' :
                        formData.priority === 'high' ? 'border-destructive/30' :
                        formData.priority === 'medium' ? 'border-orange-400/30' :
                        formData.priority === 'low' ? 'border-blue-400/30' :
                        'border-primary/30'
                      : ''}
                    `}
                  />
                </div>

                {/* Group Selector */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Distribute To <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {GROUP_OPTIONS.map((group) => {
                      const isSelected = formData.selectedGroupIds.includes(group.id)
                      return (
                        <div
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={`
                            group cursor-pointer rounded-xl border-2 p-4 transition-all
                            ${isSelected 
                              ? completionProgress < 100
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : formData.priority === 'high' 
                                  ? 'border-destructive bg-destructive/5 ring-1 ring-destructive' 
                                  : formData.priority === 'medium'
                                    ? 'border-orange-400 bg-orange-400/5 ring-1 ring-orange-400'
                                    : formData.priority === 'low'
                                      ? 'border-blue-400 bg-blue-400/5 ring-1 ring-blue-400'
                                      : 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-muted bg-background hover:border-primary/40'}
                          `}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold ${isSelected ? getTitleColor() : 'text-foreground'}`}>
                              {group.name}
                            </span>
                            {isSelected && <CheckCircle2 className={`
                              h-4 w-4
                              ${getTitleColor()}
                            `} />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {group.memberCount} members
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Resources (Optional)</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Link URL..." 
                        className="pl-9 bg-background"
                        value={formData.attachmentUrl}
                        onChange={(e) => handleFieldChange("attachmentUrl", e.target.value)}
                      />
                    </div>
                    <label className="flex items-center justify-center px-4 h-10 border border-dashed rounded-md bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors text-sm font-medium">
                      <Upload className={`
                        mr-2 h-4 w-4
                        ${getTitleColor()}
                      `} />
                      {formData.attachmentFile ? "File Added" : "Upload File"}
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleFieldChange("attachmentFile", e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Preview Side */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Eye className={`
                  h-4 w-4 transition-colors
                  ${getTitleColor()}
                `} />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Preview</span>
              </div>

              <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-border hover:shadow-3xl transition-shadow">
                {/* Priority Indicator Bar - matches button color */}
                <div className={`h-2 w-full ${
                  completionProgress < 100 ? 'bg-primary' :
                  formData.priority === 'high' ? 'bg-destructive' : 
                  formData.priority === 'medium' ? 'bg-orange-400' : 
                  formData.priority === 'low' ? 'bg-blue-400' : 'bg-primary'
                }`} />

                <CardContent className="p-8 space-y-6 bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`
                      h-10 w-10 rounded-full flex items-center justify-center font-bold border
                      ${completionProgress < 100 
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : formData.priority === 'high' 
                          ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                          : formData.priority === 'medium'
                            ? 'bg-orange-400/10 border-orange-400/20 text-orange-400'
                            : formData.priority === 'low'
                              ? 'bg-blue-400/10 border-blue-400/20 text-blue-400'
                              : 'bg-primary/10 border-primary/20 text-primary'
                      }
                    `}>
                      AD
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Project Advisor</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tight">System Broadcast • Just Now</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className={`
                      text-2xl font-bold leading-tight transition-colors
                      ${!formData.title ? 'text-muted-foreground/30' : getTitleColor()}
                    `}>
                      {formData.title || "Headline will appear here..."}
                    </h2>
                    
                    {/* Deadline Badge in Preview */}
                    {formData.deadline && (
                      <div className={`
                        inline-flex items-center gap-2 px-3 py-1.5 rounded-full border
                        ${completionProgress < 100 
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : formData.priority === 'high' 
                            ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                            : formData.priority === 'medium'
                              ? 'bg-orange-400/10 border-orange-400/20 text-orange-400'
                              : formData.priority === 'low'
                                ? 'bg-blue-400/10 border-blue-400/20 text-blue-400'
                                : 'bg-primary/10 border-primary/20 text-primary'
                        }
                      `}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">Deadline: {formatDeadline(formData.deadline)}</span>
                      </div>
                    )}
                    
                    <p className={`text-base leading-relaxed whitespace-pre-wrap ${!formData.content && 'text-muted-foreground/30 italic'}`}>
                      {formData.content || "The body of your message will update here as you type. Use this to check for tone and formatting."}
                    </p>
                  </div>

                  {(formData.attachmentFile || formData.attachmentUrl) && (
                    <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-background flex items-center justify-center border shadow-sm">
                        <Paperclip className={`
                          h-4 w-4
                          ${getTitleColor()}
                        `} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate">
                          {formData.attachmentFile?.name || formData.attachmentUrl || "Resource Attached"}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Reference Material</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Users className="h-4 w-4 text-muted-foreground" />
                       <span className="text-xs font-medium text-muted-foreground">
                         Audience: {formData.selectedGroupIds.length} Groups
                       </span>
                    </div>
                    <Badge variant="outline" className={`
                      text-[10px] uppercase font-bold tracking-tighter
                      ${completionProgress < 100 
                        ? 'border-primary/30 text-primary'
                        : formData.priority === 'high' 
                          ? 'border-destructive/30 text-destructive' 
                          : formData.priority === 'medium'
                            ? 'border-orange-400/30 text-orange-400'
                            : formData.priority === 'low'
                              ? 'border-blue-400/30 text-blue-400'
                              : 'border-primary/30 text-primary'}
                    `}>
                      {formData.priority} Priority
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Informational Note */}
              <div className={`
                rounded-xl border p-4 flex gap-3 transition-colors
                ${completionProgress < 100 
                  ? 'bg-primary/5 border-primary/10'
                  : formData.priority === 'high' 
                    ? 'bg-destructive/5 border-destructive/10' 
                    : formData.priority === 'medium'
                      ? 'bg-orange-400/5 border-orange-400/10'
                      : formData.priority === 'low'
                        ? 'bg-blue-400/5 border-blue-400/10'
                        : 'bg-primary/5 border-primary/10'
                }
              `}>
                <Info className={`
                  h-5 w-5 shrink-0
                  ${getTitleColor()}
                `} />
                <div className="text-xs text-muted-foreground leading-snug">
                  <strong className={`
                    block mb-1
                    ${getTitleColor()}
                  `}>
                    Important Information
                  </strong>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All fields marked with <span className="text-destructive">*</span> are required</li>
                    <li>Deadlines must be set to a future date and time</li>
                    <li>
                      <span className={`font-bold ${getTitleColor()}`}>
                        {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                      </span> priority triggers {formData.priority === 'high' ? 'immediate' : 'standard'} notifications
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}