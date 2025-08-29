"use client"

import { useState } from 'react'
import { Download, FileText, Calendar, Clock, MapPin, Users, BookOpen, Printer, Eye, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimetablePeriod } from '@/lib/timetable-context'

interface TimetableViewerProps {
  className?: string
  periods: TimetablePeriod[]
  classData: {
    id: string
    name: string
    level: string
    subsystem: string
    branch: string
  }
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  "08:00-08:45", "08:45-09:30", "09:30-10:15", "10:15-11:00",
  "11:00-11:45", "11:45-12:30", "12:30-13:15", "13:15-14:00",
  "14:00-14:45", "14:45-15:30", "15:30-16:15", "16:15-17:00"
]

export function TimetableViewer({ className, periods, classData }: TimetableViewerProps) {
  const [selectedDay, setSelectedDay] = useState<string>("Monday")

  const exportToCSV = () => {
    const csvContent = [
      ['Day', 'Time', 'Subject', 'Teacher', 'Room'].join(','),
      ...periods.map(period => [
        period.day,
        `${period.startTime}-${period.endTime}`,
        period.subject,
        period.teacher,
        period.room
      ].join(','))
    ].join('\n')

    downloadFile(csvContent, `timetable_${classData.name.replace(/\s+/g, '_')}.csv`, 'text/csv')
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify({
      class: classData,
      periods: periods,
      generatedAt: new Date().toISOString()
    }, null, 2)

    downloadFile(jsonContent, `timetable_${classData.name.replace(/\s+/g, '_')}.json`, 'application/json')
  }

  const exportToPDF = () => {
    // Create a simple HTML representation for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Timetable - ${classData.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .period { margin: 5px 0; }
            .subject { font-weight: bold; }
            .teacher { color: #666; font-size: 0.9em; }
            .room { color: #999; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Timetable - ${classData.name}</h1>
            <p>Level: ${classData.level} | Subsystem: ${classData.subsystem} | Branch: ${classData.branch}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              ${periods.map(period => `
                <tr>
                  <td>${period.day}</td>
                  <td>${period.startTime}-${period.endTime}</td>
                  <td class="subject">${period.subject}</td>
                  <td class="teacher">${period.teacher}</td>
                  <td class="room">${period.room}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    downloadFile(htmlContent, `timetable_${classData.name.replace(/\s+/g, '_')}.html`, 'text/html')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const printTimetable = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Timetable - ${classData.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Timetable - ${classData.name}</h1>
              <p>Level: ${classData.level} | Subsystem: ${classData.subsystem} | Branch: ${classData.branch}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                ${periods.map(period => `
                  <tr>
                    <td>${period.day}</td>
                    <td>${period.startTime}-${period.endTime}</td>
                    <td><strong>${period.subject}</strong></td>
                    <td>${period.teacher}</td>
                    <td>${period.room}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
  }

  const getDayPeriods = (day: string) => {
    return periods
      .filter(p => p.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timetable for {classData.name}
              </CardTitle>
              <CardDescription>
                Level: {classData.level} | Subsystem: {classData.subsystem} | Branch: {classData.branch}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {periods.length} Periods
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToJSON}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as HTML
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={printTimetable}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Timetable
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList>
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
              <TabsTrigger value="daily">Daily View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      {daysOfWeek.map(day => (
                        <TableHead key={day}>{day}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeSlots.slice(0, 8).map((timeSlot, timeIndex) => (
                      <TableRow key={timeSlot}>
                        <TableCell className="font-medium">{timeSlot}</TableCell>
                        {daysOfWeek.map(day => {
                          const period = periods.find(p => p.day === day && p.startTime === timeSlot.split("-")[0])
                          
                          return (
                            <TableCell key={day}>
                              {period ? (
                                <div className="space-y-1 p-2 bg-muted/50 rounded">
                                  <div className="font-medium text-sm">{period.subject}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {period.teacher}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {period.room}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm p-2">-</div>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {daysOfWeek.map(day => {
                  const dayPeriods = getDayPeriods(day)

                  return (
                    <Card key={day}>
                      <CardHeader>
                        <CardTitle className="text-lg">{day}</CardTitle>
                        <CardDescription>{dayPeriods.length} periods</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {dayPeriods.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No periods scheduled</p>
                        ) : (
                          <div className="space-y-3">
                            {dayPeriods.map(period => (
                              <div key={period.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="text-center min-w-[60px]">
                                  <div className="text-sm font-medium">{period.startTime}</div>
                                  <div className="text-xs text-muted-foreground">to</div>
                                  <div className="text-sm font-medium">{period.endTime}</div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{period.subject}</div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {period.teacher}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {period.room}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-4">
                {daysOfWeek.map(day => {
                  const dayPeriods = getDayPeriods(day)
                  
                  return (
                    <Card key={day}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {day}
                        </CardTitle>
                        <CardDescription>{dayPeriods.length} periods scheduled</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {dayPeriods.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No periods scheduled for this day</p>
                        ) : (
                          <div className="space-y-2">
                            {dayPeriods.map(period => (
                              <div key={period.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div className="text-center min-w-[80px]">
                                    <div className="font-medium">{period.startTime}</div>
                                    <div className="text-xs text-muted-foreground">- {period.endTime}</div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">{period.subject}</div>
                                    <div className="text-sm text-muted-foreground">{period.teacher}</div>
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {period.room}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
