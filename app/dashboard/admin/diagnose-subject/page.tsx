"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DiagnoseSubjectPage() {
  const [className, setClassName] = useState('AC 1');
  const [subjectName, setSubjectName] = useState('Computer Aided Management');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    if (!className || !subjectName) {
      setError('Please provide both class name and subject name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/admin/diagnose-class-subject?className=${encodeURIComponent(className)}&subjectName=${encodeURIComponent(subjectName)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'An error occurred');
        setResult(null);
      } else {
        setResult(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to diagnose');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFix = async () => {
    if (!result || !result.fix) {
      setError('No fix available for this issue');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/fix-class-subject-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.fix.body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to fix the issue');
      } else {
        setResult({
          ...result,
          found: true,
          message: data.message,
          link: data.link,
        });
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fix');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Diagnose Class-Subject Link</CardTitle>
          <CardDescription>
            Check if a subject is properly linked to a class for report card generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., AC 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g., Computer Aided Management"
              />
            </div>
          </div>

          <Button 
            onClick={handleDiagnose} 
            disabled={isLoading || !className || !subjectName}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Diagnosing...
              </>
            ) : (
              'Diagnose'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert variant={result.found ? 'default' : 'destructive'}>
                {result.found ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{result.found ? '✓ Found' : '✗ Issue Found'}:</strong> {result.message}
                </AlertDescription>
              </Alert>

              {result.found ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Link Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong>Class:</strong> {result.class?.name} (ID: {result.class?.id})
                    </div>
                    <div>
                      <strong>Subject:</strong> {result.subject?.name} (ID: {result.subject?.id})
                    </div>
                    {result.link && (
                      <div>
                        <strong>Academic Year:</strong> {result.link.academicYear}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Issue Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <strong>Issue Type:</strong> {result.issue}
                      </div>
                      {result.classFound && (
                        <div>
                          <strong>Class Found:</strong> {result.className} (ID: {result.classId})
                        </div>
                      )}
                      {result.subjectFound && (
                        <div>
                          <strong>Subject Found:</strong> {result.subjectName} (ID: {result.subjectId})
                        </div>
                      )}
                      {result.suggestions && result.suggestions.length > 0 && (
                        <div>
                          <strong>Suggestions:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {result.suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {result.fix && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Auto-Fix Available</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {result.issue === 'link_missing' 
                            ? 'The subject exists but is not linked to the class. Click the button below to automatically create the link.'
                            : 'A fix is available for this issue.'}
                        </p>
                        <Button 
                          onClick={handleFix} 
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Fixing...
                            </>
                          ) : (
                            'Fix Issue'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

