"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Database, 
  Users, 
  BookOpen, 
  Award, 
  CheckCircle,
  RefreshCw,
  Activity
} from "lucide-react"

interface DatabaseData {
  teacher: any
  classes: Record<string, any>
  students: Record<string, any>
  subjects: Record<string, any>
  assignments: Record<string, any>
  grades: {
    assessments: Record<string, any>
    grades: Record<string, any>
    statistics: any
  }
  assessments: {
    assessments: Record<string, any>
    statistics: any
  }
  performance: any
  cache: any
}

export default function TestUltraFastTeacher() {
  const [data, setData] = useState<DatabaseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/teachers/ultra-fast?teacherId=1')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
      setLastFetch(new Date())
      
      console.log('✅ Database data fetched successfully:', result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('❌ Error fetching database data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getDataSource = () => {
    if (!data) return 'No data'
    return data.performance?.source || 'Unknown'
  }

  const getQueryTime = () => {
    if (!data) return 'N/A'
    return `${data.performance?.queryTimeMs?.toFixed(2) || 'N/A'}ms`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ultra-Fast Teacher System Test</h1>
          <p className="text-muted-foreground">
            Testing real database data integration with ultra-fast performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {lastFetch && (
              <span>Last fetch: {formatTimestamp(lastFetch.toISOString())}</span>
            )}
          </div>
          <Button 
            onClick={fetchData} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Data Source Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Source Information
          </CardTitle>
          <CardDescription>
            Real-time information about data fetching and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <Database className="h-8 w-8 mx-auto mb-2" />
              </div>
              <p className="text-sm font-medium">Data Source</p>
              <p className="text-xs text-muted-foreground">{getDataSource()}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                <Activity className="h-8 w-8 mx-auto mb-2" />
              </div>
              <p className="text-sm font-medium">Query Time</p>
              <p className="text-xs text-muted-foreground">{getQueryTime()}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                <CheckCircle className="h-8 mx-auto mb-2" />
              </div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Loading...' : error ? 'Error' : 'Connected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading database data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(data.classes).length}</div>
                  <p className="text-xs text-muted-foreground">From database</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(data.students).length}</div>
                  <p className="text-xs text-muted-foreground">From database</p>
                </CardContent>
              </Card>


              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assessments</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(data.assessments.assessments).length}</div>
                  <p className="text-xs text-muted-foreground">From database</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Classes from Database</CardTitle>
                <CardDescription>Real class data fetched from the database</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Subsystem</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Enrollment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(data.classes).map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.level}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {cls.subsystem}
                          </Badge>
                        </TableCell>
                        <TableCell>{cls.branch}</TableCell>
                        <TableCell>{cls.currentEnrollment}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grades from Database</CardTitle>
                <CardDescription>Real grade data fetched from the database</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Graded At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(data.grades.grades).map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.studentName}</TableCell>
                        <TableCell>{grade.assessmentId}</TableCell>
                        <TableCell>{grade.marks}</TableCell>
                        <TableCell>{grade.percentage}%</TableCell>
                        <TableCell>
                          <Badge variant="outline">{grade.grade}</Badge>
                        </TableCell>
                        <TableCell>{formatTimestamp(grade.gradedAt || grade.submittedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessments from Database</CardTitle>
                <CardDescription>Real assessment data fetched from the database</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(data.assessments.assessments).map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {assessment.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{assessment.subjectName}</TableCell>
                        <TableCell>{assessment.className}</TableCell>
                        <TableCell>{assessment.totalMarks}</TableCell>
                        <TableCell>
                          <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                            {assessment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTimestamp(assessment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
