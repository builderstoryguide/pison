"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  CalendarDays,
  Bell,
  AlertCircle,
} from "lucide-react"

export function StudentScheduleView() {
  // Mock data for student schedule
  const scheduleData = {
    currentWeek: "Week of March 4-8, 2024",
    academicYear: "2024-2025",
    term: "Second Term",
    schedule: [
      {
        day: "Monday",
        date: "2024-03-04",
        periods: [
          { time: "07:30 - 08:30", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 101" },
          { time: "08:30 - 09:30", subject: "English", teacher: "Mrs. Smith", room: "Room 102" },
          { time: "09:30 - 10:30", subject: "Physics", teacher: "Dr. Brown", room: "Lab 1" },
          { time: "10:45 - 11:45", subject: "Chemistry", teacher: "Ms. Davis", room: "Lab 2" },
          { time: "11:45 - 12:45", subject: "Biology", teacher: "Mr. Wilson", room: "Room 103" },
          { time: "12:45 - 13:45", subject: "History", teacher: "Mrs. Taylor", room: "Room 104" },
        ],
      },
      {
        day: "Tuesday",
        date: "2024-03-05",
        periods: [
          { time: "07:30 - 08:30", subject: "Biology", teacher: "Mr. Wilson", room: "Room 103" },
          { time: "08:30 - 09:30", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 101" },
          { time: "09:30 - 10:30", subject: "English", teacher: "Mrs. Smith", room: "Room 102" },
          { time: "10:45 - 11:45", subject: "History", teacher: "Mrs. Taylor", room: "Room 104" },
          { time: "11:45 - 12:45", subject: "Physics", teacher: "Dr. Brown", room: "Lab 1" },
          { time: "12:45 - 13:45", subject: "Chemistry", teacher: "Ms. Davis", room: "Lab 2" },
        ],
      },
      {
        day: "Wednesday",
        date: "2024-03-06",
        periods: [
          { time: "07:30 - 08:30", subject: "Physics", teacher: "Dr. Brown", room: "Lab 1" },
          { time: "08:30 - 09:30", subject: "Chemistry", teacher: "Ms. Davis", room: "Lab 2" },
          { time: "09:30 - 10:30", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 101" },
          { time: "10:45 - 11:45", subject: "English", teacher: "Mrs. Smith", room: "Room 102" },
          { time: "11:45 - 12:45", subject: "Biology", teacher: "Mr. Wilson", room: "Room 103" },
          { time: "12:45 - 13:45", subject: "History", teacher: "Mrs. Taylor", room: "Room 104" },
        ],
      },
      {
        day: "Thursday",
        date: "2024-03-07",
        periods: [
          { time: "07:30 - 08:30", subject: "English", teacher: "Mrs. Smith", room: "Room 102" },
          { time: "08:30 - 09:30", subject: "Biology", teacher: "Mr. Wilson", room: "Room 103" },
          { time: "09:30 - 10:30", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 101" },
          { time: "10:45 - 11:45", subject: "Physics", teacher: "Dr. Brown", room: "Lab 1" },
          { time: "11:45 - 12:45", subject: "Chemistry", teacher: "Ms. Davis", room: "Lab 2" },
          { time: "12:45 - 13:45", subject: "History", teacher: "Mrs. Taylor", room: "Room 104" },
        ],
      },
      {
        day: "Friday",
        date: "2024-03-08",
        periods: [
          { time: "07:30 - 08:30", subject: "Chemistry", teacher: "Ms. Davis", room: "Lab 2" },
          { time: "08:30 - 09:30", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 101" },
          { time: "09:30 - 10:30", subject: "English", teacher: "Mrs. Smith", room: "Room 102" },
          { time: "10:45 - 11:45", subject: "Biology", teacher: "Mr. Wilson", room: "Room 103" },
          { time: "11:45 - 12:45", subject: "Physics", teacher: "Dr. Brown", room: "Lab 1" },
          { time: "12:45 - 13:45", subject: "History", teacher: "Mrs. Taylor", room: "Room 104" },
        ],
      },
    ],
    upcomingEvents: [
      {
        title: "Mathematics Test",
        date: "2024-03-15",
        time: "09:00",
        type: "exam",
        subject: "Mathematics",
      },
      {
        title: "Physics Lab Practical",
        date: "2024-03-12",
        time: "14:00",
        type: "practical",
        subject: "Physics",
      },
      {
        title: "English Essay Due",
        date: "2024-03-10",
        time: "23:59",
        type: "assignment",
        subject: "English",
      },
      {
        title: "Chemistry Quiz",
        date: "2024-03-14",
        time: "10:30",
        type: "quiz",
        subject: "Chemistry",
      },
    ],
    teachers: [
          { name: "Mr. Johnson", subject: "Mathematics", email: "johnson@pisonacademy.cm" },
    { name: "Mrs. Smith", subject: "English", email: "smith@pisonacademy.cm" },
    { name: "Dr. Brown", subject: "Physics", email: "brown@pisonacademy.cm" },
    { name: "Ms. Davis", subject: "Chemistry", email: "davis@pisonacademy.cm" },
    { name: "Mr. Wilson", subject: "Biology", email: "wilson@pisonacademy.cm" },
    { name: "Mrs. Taylor", subject: "History", email: "taylor@pisonacademy.cm" },
    ],
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-red-100 text-red-800"
      case "quiz":
        return "bg-yellow-100 text-yellow-800"
      case "assignment":
        return "bg-blue-100 text-blue-800"
      case "practical":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSubjectColor = (subject: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ]
    const index = scheduleData.teachers.findIndex(teacher => teacher.subject === subject)
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground">
            {scheduleData.currentWeek} • {scheduleData.term}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Academic Year</div>
          <div className="font-medium">{scheduleData.academicYear}</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleData.upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleData.teachers.length}</div>
            <p className="text-xs text-muted-foreground">Subject teachers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Weekly Timetable
              </CardTitle>
              <CardDescription>Your class schedule for the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {scheduleData.schedule.map((day, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">{day.day}</h3>
                      <Badge variant="outline">{day.date}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {day.periods.map((period, periodIndex) => (
                        <div
                          key={periodIndex}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {period.time}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getSubjectColor(period.subject)}>
                                {period.subject}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {period.teacher}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {period.room}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Important dates and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduleData.upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">{event.subject}</Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {event.date} at {event.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Subject Teachers
              </CardTitle>
              <CardDescription>Your teachers and their contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {scheduleData.teachers.map((teacher, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{teacher.name}</h4>
                      <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                    <Badge className={getSubjectColor(teacher.subject)}>
                      {teacher.subject}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
