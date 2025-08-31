"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, Search, Plus, Mail, Phone, User, Calendar } from "lucide-react"

export function ParentCommunication() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [messageSubject, setMessageSubject] = useState("")
  const [messageContent, setMessageContent] = useState("")

  // Mock data for messages and teachers
  const messages = [
    {
      id: "1",
      from: "Mr. Paul Mbeki",
      subject: "Mathematics Progress Update",
      content: "Amina is doing excellent work in calculus. She scored 95% on the recent test.",
      timestamp: "2024-01-20T10:30:00Z",
      read: true,
      teacherId: "TCH001",
      avatar: "/placeholder-user.jpg",
    },
    {
      id: "2",
      from: "Mrs. Grace Tabi",
      subject: "English Literature Assignment",
      content: "Please remind Amina about the essay due next Friday. The topic is 'Themes in African Literature'.",
      timestamp: "2024-01-19T14:15:00Z",
      read: false,
      teacherId: "TCH002",
      avatar: "/placeholder-user.jpg",
    },
    {
      id: "3",
      from: "Dr. Marie Ngozi",
      subject: "Physics Lab Performance",
      content: "Amina showed great understanding in today's physics lab. Her experimental approach was methodical.",
      timestamp: "2024-01-18T16:45:00Z",
      read: true,
      teacherId: "TCH003",
      avatar: "/placeholder-user.jpg",
    },
  ]

  const teachers = [
    {
      id: "TCH001",
      name: "Mr. Paul Mbeki",
      subject: "Mathematics",
      email: "p.mbeki@pisonacademy.cm",
      phone: "+237 677 234 567",
      avatar: "/placeholder-user.jpg",
      lastContact: "2024-01-20",
    },
    {
      id: "TCH002",
      name: "Mrs. Grace Tabi",
      subject: "English",
      email: "bursar@pisonacademy.cm",
      phone: "+237 677 567 890",
      avatar: "/placeholder-user.jpg",
      lastContact: "2024-01-19",
    },
    {
      id: "TCH003",
      name: "Dr. Marie Ngozi",
      subject: "Physics",
      email: "admin@pisonacademy.cm",
      phone: "+237 677 123 456",
      avatar: "/placeholder-user.jpg",
      lastContact: "2024-01-18",
    },
  ]

  const filteredMessages = messages.filter(
    (message) =>
      message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendMessage = () => {
    if (selectedTeacher && messageSubject && messageContent) {
      // Here you would typically send the message to your backend
      console.log("Sending message:", {
        to: selectedTeacher,
        subject: messageSubject,
        content: messageContent,
      })

      // Reset form
      setSelectedTeacher("")
      setMessageSubject("")
      setMessageContent("")

      // Show success message (you could use a toast here)
      alert("Message sent successfully!")
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication</h1>
          <p className="text-muted-foreground">Stay connected with your child's teachers</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Send Message to Teacher</DialogTitle>
              <DialogDescription>Compose a message to one of your child's teachers</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher">Select Teacher</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Message subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
              </div>
              <Button onClick={handleSendMessage} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search messages or teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Messages from your child's teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No messages found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm ? "Try adjusting your search terms." : "You don't have any messages yet."}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        !message.read ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.from} />
                          <AvatarFallback>
                            {message.from
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{message.from}</p>
                            <div className="flex items-center gap-2">
                              {!message.read && (
                                <Badge variant="default" className="text-xs">
                                  New
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {formatTimestamp(message.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className="font-medium text-sm mb-2">{message.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Child's Teachers</CardTitle>
              <CardDescription>Contact information and communication history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTeachers.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <User className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No teachers found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search terms.</p>
                  </div>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <div key={teacher.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.avatar || "/placeholder.svg"} alt={teacher.name} />
                          <AvatarFallback>
                            {teacher.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{teacher.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Last contact: {teacher.lastContact}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden">
                            <DialogHeader>
                              <DialogTitle>Message {teacher.name}</DialogTitle>
                              <DialogDescription>
                                Send a message to {teacher.name} ({teacher.subject})
                              </DialogDescription>
                            </DialogHeader>
                            <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                  id="subject"
                                  placeholder="Message subject"
                                  value={messageSubject}
                                  onChange={(e) => setMessageSubject(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                  id="message"
                                  placeholder="Type your message here..."
                                  rows={4}
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  setSelectedTeacher(teacher.id)
                                  handleSendMessage()
                                }}
                                className="w-full"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Send Message
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
