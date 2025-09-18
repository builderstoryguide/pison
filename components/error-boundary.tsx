"use client"

import React from 'react'
import { AlertTriangle, RefreshCcw, Bug, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible'
import { copyToClipboardWithFeedback } from '@/lib/clipboard-utils'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    }
  }

  generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Enhanced error logging with better error handling
    const errorDetails = {
      errorId: this.state.errorId,
      error: {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack || 'No stack trace available',
      },
      componentStack: errorInfo?.componentStack || 'No component stack available',
      timestamp: new Date().toISOString(),
    }

    // Log error details to console
    console.error('🚨 Error Boundary Caught Error:', errorDetails)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Check if it's a JSON parse error and provide specific guidance
    if (this.isJsonParseError(error)) {
      console.error('🔍 JSON Parse Error Detected:', {
        message: error.message,
        possibleCauses: [
          'API endpoint returning HTML error page instead of JSON',
          'Empty response from server',
          'Network connectivity issues',
          'Server-side error (500, 404, etc.)',
          'CORS issues',
          'Authentication redirect to login page',
        ],
        troubleshootingSteps: [
          '1. Check browser Network tab for failed requests',
          '2. Verify API endpoints are responding correctly',
          '3. Check server logs for errors',
          '4. Ensure authentication is working',
          '5. Verify environment variables are set',
        ],
      })
    }
  }

  isJsonParseError(error: Error): boolean {
    return (
      error.message.toLowerCase().includes('json') ||
      error.message.toLowerCase().includes('parse') ||
      error.message.toLowerCase().includes('unexpected token') ||
      error.message.toLowerCase().includes('unexpected end of json')
    )
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} reset={this.handleReset} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background p-6">
          <div className="container mx-auto max-w-4xl space-y-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
              <h1 className="text-3xl font-bold text-destructive mb-2">Application Error</h1>
              <p className="text-muted-foreground">
                Something went wrong. The error has been logged for investigation.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5" />
                      Error Details
                    </CardTitle>
                    <CardDescription>
                      Error ID: <code className="text-xs">{this.state.errorId}</code>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={this.isJsonParseError(this.state.error) ? 'destructive' : 'secondary'}>
                      {this.isJsonParseError(this.state.error) ? 'JSON Parse Error' : 'Application Error'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-mono text-sm">
                    {this.state.error.message}
                  </AlertDescription>
                </Alert>

                {this.isJsonParseError(this.state.error) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-destructive">🔍 JSON Parse Error Detected</h3>
                    <div className="text-sm space-y-2">
                      <p><strong>Common causes:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                        <li>API endpoint returning HTML error page instead of JSON</li>
                        <li>Empty response from server</li>
                        <li>Network connectivity issues</li>
                        <li>Server returning 500, 404, or other HTTP errors</li>
                        <li>Authentication redirect to login page</li>
                      </ul>
                      <p className="mt-3"><strong>How to debug:</strong></p>
                      <ol className="list-decimal list-inside ml-4 space-y-1 text-muted-foreground">
                        <li>Open browser Developer Tools (F12)</li>
                        <li>Go to Network tab and refresh the page</li>
                        <li>Look for failed requests (red status codes)</li>
                        <li>Check the response content of failed requests</li>
                        <li>Verify your server is running and accessible</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={this.handleReset} variant="default">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const errorText = `Error ID: ${this.state.errorId}\nError: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`
                      await copyToClipboardWithFeedback(
                        errorText,
                        () => {
                          console.log('Error details copied to clipboard')
                        },
                        (error) => {
                          console.error('Failed to copy error details:', error)
                        }
                      )
                    }}
                  >
                    Copy Error Details
                  </Button>
                </div>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="text-xs">
                      Show Technical Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded text-xs">
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap font-mono">
                          {this.state.error.stack}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div className="bg-muted p-3 rounded text-xs">
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap font-mono">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>If this error persists, please:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Check that your development server is running</li>
                  <li>Verify your database connection</li>
                  <li>Ensure all environment variables are configured</li>
                  <li>Look at the browser console and network tabs for more details</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('🚨 useErrorHandler caught error:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}

/**
 * Simple error boundary component
 */
export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  )
}

/**
 * Specialized error boundary for API calls
 */
export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send error to monitoring service if configured
    console.error('🔥 API Error:', {
      error: error.message,
      stack: error.stack,
      component: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
