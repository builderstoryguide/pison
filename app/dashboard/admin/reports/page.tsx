"use client";

import { useState } from 'react';
import PisonReportCard from '@/components/admin/reports/PisonReportCard';
import { PisonReportCardData } from '@/components/admin/reports/report-card-types';
import { Button } from '@/components/ui/button'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ReportGenerationPage = () => {
  const [selectedClass, setSelectedClass] = useState<string>();
  const [selectedStudent, setSelectedStudent] = useState<string>();
  const [selectedTerm, setSelectedTerm] = useState<string>();
  const [reportData, setReportData] = useState<PisonReportCardData>();
  const [isLoading, setIsLoading] = useState(false);

  // In a real implementation, these would be fetched from your API
  const classes = [{ id: 'class1', name: 'Class 1' }, { id: 'class2', name: 'Class 2' }];
  const students: Record<string, Array<{ id: string; name: string }>> = {
    class1: [{ id: 'student1', name: 'Test Student 1' }],
    class2: [{ id: 'student2', name: 'Test Student 2' }]
  };
  const terms = [{ id: 'first', name: 'First Term' }, { id: 'second', name: 'Second Term' }, { id: 'third', name: 'Third Term' }];

  const handleGenerateReport = async () => {
    if (!selectedStudent || !selectedClass || !selectedTerm) {
      alert("Please select a class, student, and term.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/reports/student-report?studentId=${selectedStudent}&classId=${selectedClass}&academicTermId=${selectedTerm}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReportData(data);
    } catch (_error) {
      // Error occurred - notify user
      alert("Failed to generate report. Please try again.");
      setReportData(undefined);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (reportData) {
    return (
      <div>
        <div className="p-4 bg-gray-200 flex justify-between items-center print:hidden">
            <h2 className="text-lg font-bold">Generated Report</h2>
            <Button onClick={() => setReportData(undefined)}>Generate New Report</Button>
        </div>
        <PisonReportCard reportData={reportData} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Report Card Generation</CardTitle>
          <CardDescription>Select a class and student to generate their report card.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="font-medium">Class</label>
            <Select onValueChange={setSelectedClass} value={selectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedClass && (
            <div className="space-y-2">
              <label className="font-medium">Student</label>
              <Select onValueChange={setSelectedStudent} value={selectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students[selectedClass]?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="font-medium">Term</label>
            <Select onValueChange={setSelectedTerm} value={selectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select a term..." />
              </SelectTrigger>
              <SelectContent>
                {terms.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateReport} disabled={!selectedStudent || !selectedClass || !selectedTerm || isLoading} className="w-full">
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportGenerationPage;