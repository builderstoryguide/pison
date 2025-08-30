"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export function StudentGradesView() {
  // Mock data for student grades
  const gradesData = {
    currentTerm: "Second Term",
    academicYear: "2024-2025",
    overallGPA: 3.8,
    subjects: [
      {
        name: "Mathematics",
        grade: "A",
        score: 85,
        coefficient: 4,
        assignments: [
          { title: "Calculus Test", score: 88, maxScore: 100, date: "2024-02-15" },
          { title: "Algebra Quiz", score: 82, maxScore: 100, date: "2024-02-20" },
          { title: "Geometry Assignment", score: 90, maxScore: 100, date: "2024-02-25" },
        ],
      },
      {
        name: "English",
        grade: "A",
        score: 88,
        coefficient: 3,
        assignments: [
          { title: "Essay Writing", score: 85, maxScore: 100, date: "2024-02-10" },
          { title: "Literature Test", score: 90, maxScore: 100, date: "2024-02-18" },
          { title: "Grammar Quiz", score: 89, maxScore: 100, date: "2024-02-22" },
        ],
      },
      {
        name: "Physics",
        grade: "B+",
        score: 82,
        coefficient: 4,
        assignments: [
          { title: "Mechanics Test", score: 80, maxScore: 100, date: "2024-02-12" },
          { title: "Lab Report", score: 85, maxScore: 100, date: "2024-02-19" },
          { title: "Thermodynamics Quiz", score: 81, maxScore: 100, date: "2024-02-26" },
        ],
      },
      {
        name: "Chemistry",
        grade: "A-",
        score: 87,
        coefficient: 4,
        assignments: [
          { title: "Organic Chemistry Test", score: 88, maxScore: 100, date: "2024-02-14" },
          { title: "Lab Experiment", score: 86, maxScore: 100, date: "2024-02-21" },
          { title: "Inorganic Chemistry Quiz", score: 87, maxScore: 100, date: "2024-02-28" },
        ],
      },
      {
        name: "Biology",
        grade: "A",
        score: 89,
        coefficient: 3,
        assignments: [
          { title: "Cell Biology Test", score: 90, maxScore: 100, date: "2024-02-11" },
          { title: "Dissection Lab", score: 88, maxScore: 100, date: "2024-02-17" },
          { title: "Genetics Quiz", score: 89, maxScore: 100, date: "2024-02-24" },
        ],
      },
      {
        name: "History",
        grade: "B+",
        score: 83,
        coefficient: 2,
        assignments: [
          { title: "World History Test", score: 82, maxScore: 100, date: "2024-02-13" },
          { title: "Research Paper", score: 85, maxScore: 100, date: "2024-02-16" },
          { title: "Geography Quiz", score: 82, maxScore: 100, date: "2024-02-23" },
        ],
      },
    ],
    performanceTrend: [
      { term: "First Term", gpa: 3.6 },
      { term: "Second Term", gpa: 3.8 },
    ],
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
      case "A+":
        return "text-green-600 bg-green-50"
      case "A-":
        return "text-green-600 bg-green-50"
      case "B":
      case "B+":
        return "text-blue-600 bg-blue-50"
      case "B-":
        return "text-blue-600 bg-blue-50"
      case "C":
      case "C+":
        return "text-yellow-600 bg-yellow-50"
      case "C-":
        return "text-yellow-600 bg-yellow-50"
      case "D":
      case "F":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Performance</h1>
          <p className="text-muted-foreground">
            {gradesData.currentTerm} • {gradesData.academicYear}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{gradesData.overallGPA}</div>
          <p className="text-sm text-muted-foreground">Overall GPA</p>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradesData.overallGPA}</div>
            <p className="text-xs text-muted-foreground">Second Term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradesData.subjects.length}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                gradesData.subjects.reduce((acc, subject) => acc + subject.score, 0) /
                  gradesData.subjects.length
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Grades</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Subject Performance
              </CardTitle>
              <CardDescription>Your grades across all subjects this term</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradesData.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{subject.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getGradeColor(subject.grade)}>
                            {subject.grade}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Coef: {subject.coefficient}
                          </span>
                        </div>
                      </div>
                      <Progress value={subject.score} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-1">
                        Score: {subject.score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {gradesData.subjects.map((subject, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{subject.name}</span>
                    <Badge variant="outline" className={getGradeColor(subject.grade)}>
                      {subject.grade} ({subject.score}%)
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Coefficient: {subject.coefficient} • Average: {subject.score}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subject.assignments.map((assignment, assignmentIndex) => (
                      <div
                        key={assignmentIndex}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">{assignment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${getScoreColor(assignment.score)}`}>
                            {assignment.score}/{assignment.maxScore}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((assignment.score / assignment.maxScore) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                All Assignments
              </CardTitle>
              <CardDescription>Complete list of your assignments and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradesData.subjects.map((subject) =>
                  subject.assignments.map((assignment, assignmentIndex) => (
                    <div
                      key={`${subject.name}-${assignmentIndex}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {subject.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{assignment.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getScoreColor(assignment.score)}`}>
                          {assignment.score}/{assignment.maxScore}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((assignment.score / assignment.maxScore) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>Your academic progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradesData.performanceTrend.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{trend.term}</h4>
                      <p className="text-sm text-muted-foreground">Academic Term</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{trend.gpa}</div>
                      <p className="text-sm text-muted-foreground">GPA</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    Your GPA has improved from {gradesData.performanceTrend[0].gpa} to{" "}
                    {gradesData.performanceTrend[1].gpa} this term. Keep up the excellent work!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
