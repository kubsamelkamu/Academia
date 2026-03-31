"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdvisorGroupMessages,
  useAdvisorMessageGroups,
  useSendGroupMessageMutation,
} from "@/lib/hooks/useAdvisor"
import type {
  AdvisorMessage,
  AdvisorMessageAttachment,
  AdvisorMessageGroup,
  AdvisorMessageGroupMember,
} from "@/lib/types/advisor"
import { Loader2, MessageSquare, Plus, Search, Send, Users } from "lucide-react"

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AdvisorMessagesPage() {
  const searchParams = useSearchParams()
  const requestedGroupId = searchParams.get("group") ?? ""
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedGroupId, setSelectedGroupId] = React.useState(requestedGroupId)
  const [draft, setDraft] = React.useState("")

  const groupsQuery = useAdvisorMessageGroups(searchTerm ? { search: searchTerm } : undefined)
  const groups: AdvisorMessageGroup[] = groupsQuery.data?.items ?? []

  React.useEffect(() => {
    if (requestedGroupId) {
      setSelectedGroupId(requestedGroupId)
      return
    }
    if (!selectedGroupId && groups[0]?.id) {
      setSelectedGroupId(groups[0].id)
    }
  }, [groups, requestedGroupId, selectedGroupId])

  const effectiveSelectedGroupId = selectedGroupId || groups[0]?.id || ""
  const groupMessagesQuery = useAdvisorGroupMessages(effectiveSelectedGroupId || undefined)
  const selectedGroup =
    groupMessagesQuery.data?.group ??
    groups.find((group: AdvisorMessageGroup) => group.id === effectiveSelectedGroupId) ??
    null
  const messages = groupMessagesQuery.data?.items ?? []

  const sendGroupMessageMutation = useSendGroupMessageMutation()

  async function handleSendMessage() {
    if (!effectiveSelectedGroupId) {
      toast.error("Choose a message group first.")
      return
    }
    if (!draft.trim()) {
      toast.error("Message is required.")
      return
    }
    try {
      await sendGroupMessageMutation.mutateAsync({
        groupId: effectiveSelectedGroupId,
        dto: { content: draft.trim() },
      })
      setDraft("")
      toast.success("Message sent.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Group Messaging</h1>
          <p className="text-sm text-muted-foreground">Chat with your assigned project teams in real time.</p>
        </div>
        <Button asChild className="btn-gradient">
          <Link href="/dashboard/advisor/create-group">
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Group list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Groups</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search groups..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[560px]">
              <div className="space-y-2 p-4">
                {groupsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading groups…</p>
                ) : groups.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium">No groups yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create your first group or assign projects to this advisor.
                    </p>
                  </div>
                ) : (
                  groups.map((group: AdvisorMessageGroup) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        effectiveSelectedGroupId === group.id
                          ? "border-primary/40 bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.project}</p>
                        </div>
                        {group.lastMessage.unread && <Badge>New</Badge>}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{group.members.length} members</span>
                        <span>{formatTime(group.lastMessage.timestamp)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{group.lastMessage.sender}:</span>{" "}
                        {group.lastMessage.content}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card>
          <CardHeader>
            {selectedGroup ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{selectedGroup.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedGroup.project}</p>
                  </div>
                  <Badge variant="outline">{selectedGroup.privacy}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.members.map((member: AdvisorMessageGroupMember) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                      <span className="text-muted-foreground">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <CardTitle className="text-lg">Messages</CardTitle>
                <p className="text-sm text-muted-foreground">Select a group to start chatting.</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[420px] rounded-lg border p-4">
              <div className="space-y-3">
                {groupMessagesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading messages…</p>
                ) : !selectedGroup ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium">Choose a group</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your advisor conversations will appear here.
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium">No messages yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Send the first message to kick off the conversation.
                    </p>
                  </div>
                ) : (
                  messages.map((message: AdvisorMessage) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                          message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs opacity-80">
                          <span>{message.sender}</span>
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                        <p>{message.content}</p>
                        {message.attachments?.length ? (
                          <div className="mt-3 space-y-2 border-t border-black/10 pt-2 text-xs">
                            {message.attachments.map((attachment: AdvisorMessageAttachment) => (
                              <div
                                key={`${message.id}:${attachment.name}`}
                                className="rounded bg-black/10 px-2 py-1"
                              >
                                {attachment.name}
                                {attachment.size ? ` (${attachment.size})` : ""}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="space-y-3 rounded-lg border p-4">
              <Textarea
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  selectedGroup
                    ? `Write a message to ${selectedGroup.name}…`
                    : "Select a group first"
                }
                disabled={!selectedGroup || sendGroupMessageMutation.isPending}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedGroup || sendGroupMessageMutation.isPending}
                >
                  {sendGroupMessageMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvisorMessagesPage
