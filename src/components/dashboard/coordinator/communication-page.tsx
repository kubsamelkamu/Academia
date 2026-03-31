"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { MessageSquare, Send, Megaphone } from 'lucide-react';
import { mockUsers, type User } from '@/data/mockData';
import { toast } from 'sonner';

export function CoordinatorCommunicationPage() {
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [link, setLink] = useState('');

  const roleOptions = [
    { value: 'students', label: 'Students' },
    { value: 'advisors', label: 'Advisors' },
    { value: 'evaluators', label: 'Evaluators' },
    { value: 'dc_committee', label: 'DC Committee' },
    { value: 'department_admin', label: 'Department Admins' },
    { value: 'project_coordinator', label: 'Project Coordinators' },
  ];
  const [, setUploadedFile] = useState<File | null>(null);
  interface ConversationMessage {
    id: string
    senderName: string
    content: string
    timestamp: string
  }

  interface Conversation {
    user: typeof mockUsers[number]
    messages: ConversationMessage[]
  }

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [composeRole, setComposeRole] = useState('all')
  const [composeUserId, setComposeUserId] = useState('')
  const [messageCounter, setMessageCounter] = useState(1)

  const filteredUsers = composeRole === 'all' ? mockUsers : mockUsers.filter((u) => u.role === composeRole);

  const handleContactClick = (user: User) => {
    setIsComposing(false);
    setComposeUserId('');
    setComposeRole('all');
    setCurrentConversation({
      user,
      messages: [
        {
          id: `conv-${messageCounter}`,
          senderName: user.name,
          content: `Hello! I'm ${user.name}, a ${user.role.replace('_', ' ')}. How can I help you today?`,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    setMessageCounter((prev) => prev + 1);
  };

  const handleStartNewMessage = () => {
    if (!composeUserId) {
      toast.error('Select a user to start a message.');
      return;
    }

    const user = mockUsers.find((item) => item.id === composeUserId);
    if (!user) {
      toast.error('Selected user not found.');
      return;
    }

    handleContactClick(user);
  };

  const handleSendMessage = () => {
    if (message.trim() && currentConversation) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderName: "Coordinator", // Current user
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage]
      } : null);

      toast('Message Sent', { description: 'Your message has been delivered.' });
      setMessage('');
    }
  };

  const handleSendAnnouncement = () => {
    if (announcement.trim()) {
      const audienceText = targetAudience.length === 0 ? 'all users' : targetAudience.join(', ');
      toast('Announcement Published', { description: `Announcement sent to ${audienceText}.` });
      setAnnouncement('');
      setTargetAudience([]);
      setDeadline('');
      setLink('');
      setUploadedFile(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-6 animate-in fade-in duration-500 px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-inherit">Communication Hub</h1>
            <p className="text-muted-foreground mt-2">Communicate with students, advisors, evaluators, and DC Committee</p>
          </div>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</TabsTrigger>
            <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" /> Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 h-[500px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg">
                        {currentConversation ? `Conversation with ${currentConversation.user.name}` : 'Recent Conversations'}
                      </CardTitle>
                      {currentConversation && (
                        <p className="text-sm text-muted-foreground">
                          {currentConversation.user.name} - {currentConversation.user.role.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!currentConversation && (
                        <Button variant="outline" size="sm" onClick={() => setIsComposing((x) => !x)} className="text-xs">
                          New Message
                        </Button>
                      )}
                      {currentConversation && (
                        <Button variant="outline" size="sm" onClick={() => setCurrentConversation(null)} className="text-xs">
                          Back
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {currentConversation ? (
                    <ScrollArea className="h-full p-4">
                      <div className="space-y-4">
                        {currentConversation.messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.senderName === 'Coordinator' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${
                              msg.senderName === 'Coordinator'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a conversation to start messaging</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {currentConversation && (
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="h-[500px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-lg">Contacts</CardTitle>
                  <CardDescription>Start a conversation</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  {isComposing ? (
                    <div className="p-4 space-y-4">
                      <div>
                        <Label htmlFor="role-select">Filter by Role</Label>
                        <Select value={composeRole} onValueChange={setComposeRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="student">Students</SelectItem>
                            <SelectItem value="advisor">Advisors</SelectItem>
                            <SelectItem value="evaluator">Evaluators</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="user-select">Select User</Label>
                        <Select value={composeUserId} onValueChange={setComposeUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} - {user.role.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleStartNewMessage} className="flex-1">
                          Start Conversation
                        </Button>
                        <Button variant="outline" onClick={() => setIsComposing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {mockUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleContactClick(user)}
                          >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Create Announcement</CardTitle>
                <CardDescription>Send announcements to specific groups or all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="announcement">Announcement Message</Label>
                  <Textarea
                    id="announcement"
                    placeholder="Enter your announcement..."
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Target Audience</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {targetAudience.length === 0 ? 'All Users' : `${targetAudience.length} selected`}
                        <span className="ml-2">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {roleOptions.map((role) => (
                        <DropdownMenuCheckboxItem
                          key={role.value}
                          checked={targetAudience.includes(role.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTargetAudience([...targetAudience, role.value]);
                            } else {
                              setTargetAudience(targetAudience.filter((r) => r !== role.value));
                            }
                          }}
                        >
                          {role.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="link">Link (Optional)</Label>
                    <Input
                      id="link"
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="file">Attachment (Optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <Button onClick={handleSendAnnouncement} className="w-full">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Publish Announcement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}