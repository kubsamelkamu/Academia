"use client"

import { useState } from "react"
import { Send, UserCircle, Search, MoreVertical, Phone, Video } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock Data
const conversations = [
    {
        id: "conv-1",
        name: "Alex Mercer",
        avatar: "/avatars/alex.jpg",
        lastMessage: "Thanks for the feedback on Chapter 1.",
        timestamp: "10:32 AM",
        unread: 2,
        online: true,
    },
    {
        id: "conv-2",
        name: "Maria Garcia",
        avatar: "/avatars/maria.jpg",
        lastMessage: "When is a good time to review the prototype?",
        timestamp: "Yesterday",
        unread: 0,
        online: false,
    },
    {
        id: "conv-3",
        name: "Team Alpha",
        avatar: "",
        lastMessage: "We have submitted the final report.",
        timestamp: "Tue",
        unread: 0,
        online: true,
    },
]

const messages = [
    {
        id: "m-1",
        sender: "Alex Mercer",
        isMe: false,
        text: "Hello Professor, I've updated the literature review based on your comments.",
        timestamp: "09:15 AM",
    },
    {
        id: "m-2",
        sender: "Advisor",
        isMe: true,
        text: "Great job, Alex. I will take a look at it this afternoon.",
        timestamp: "09:45 AM",
    },
    {
        id: "m-3",
        sender: "Alex Mercer",
        isMe: false,
        text: "Thanks for the feedback on Chapter 1. Let me know if there's anything else.",
        timestamp: "10:32 AM",
    },
]

export default function AdvisorMessagePage() {
    const [currentMessage, setCurrentMessage] = useState("")

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
            <DashboardPageHeader
                title="Messages"
                description="Communicate with your students and project groups."
                badge="Communication"
            />

            <Card className="flex-1 flex overflow-hidden border shadow-sm">

                {/* Sidebar: Conversations List */}
                <div className="w-1/3 border-r bg-muted/10 flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search messages..."
                                className="pl-8 bg-background"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col gap-1 p-2">
                            {conversations.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors ${chat.id === "conv-1" ? "bg-accent/80" : "hover:bg-accent/50"
                                        }`}
                                >
                                    <div className="relative">
                                        <Avatar>
                                            <AvatarImage src={chat.avatar} />
                                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                                {chat.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {chat.online && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-medium text-sm truncate">{chat.name}</h4>
                                            <span className="text-[10px] text-muted-foreground">{chat.timestamp}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                                    </div>
                                    {chat.unread > 0 && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
                                            {chat.unread}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main: Chat Interface */}
                <div className="flex-1 flex flex-col bg-background relative">

                    {/* Chat Header */}
                    <div className="h-16 border-b flex items-center justify-between px-6 bg-card">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">A</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold">Alex Mercer</h3>
                                <p className="text-xs text-green-500 font-medium">Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                <Video className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Body */}
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-end gap-2 ${msg.isMe ? "justify-end" : "justify-start"}`}
                                >
                                    {!msg.isMe && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                                {msg.sender.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className={`flex flex-col gap-1 max-w-[70%] ${msg.isMe ? "items-end" : "items-start"}`}>
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-sm ${msg.isMe
                                                    ? "bg-blue-500 text-white rounded-br-sm"
                                                    : "bg-muted rounded-bl-sm"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="p-4 border-t bg-card">
                        <form
                            className="flex items-center gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                setCurrentMessage("");
                            }}
                        >
                            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground">
                                <UserCircle className="h-5 w-5" />
                            </Button>
                            <Input
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-transparent px-4 h-11"
                            />
                            <Button type="submit" size="icon" className="h-11 w-11 rounded-full shrink-0 bg-blue-500 hover:bg-blue-600 shadow-sm" disabled={!currentMessage.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                </div>
            </Card>

        </div>
    )
}
