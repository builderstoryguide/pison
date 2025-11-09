# Error Handling Guide - Teacher Assignment Management

## Problem Summary

The teacher assignment management page was experiencing an error: `Error: Error fetching assignments: {}`. This error occurred when opening the teacher assignment management page, and the error object was being serialized as an empty object `{}`, making debugging difficult.

## Root Causes Identified

1. **Inadequate Error Serialization**: Supabase errors were being logged directly without proper serialization, resulting in empty objects `{}` in console logs.

2. **Missing Error Handling in Submission Count Queries**: The submission count queries were not checking for errors, potentially causing silent failures.

3. **Loading State Not Reset on Errors**: When errors occurred in `loadAssignments`, `setLoading(false)` was not called before returning, leaving the loading state stuck.

4. **Generic Error Messages**: Error messages were not specific enough to help users understand what went wrong or how to fix it.

5. **No Error Recovery Mechanism**: Users had no way to retry failed operations without refreshing the page.

6. **Empty Error Objects**: Error objects with no enumerable properties were not being properly handled, resulting in empty serialization.

7. **Missing Error Validation**: Errors were not validated before serialization, leading to serialization failures.

8. **Insufficient Error Context**: Error logs lacked context information (user ID, timestamp, operation) making debugging difficult.

## Solutions Implemented

### 1. Proper Error Serialization

**Before:**
```typescript
if (assignmentsError) {
  console.error("Error fetching assignments:", assignmentsError)
  setError("Failed to load assignments")
  return
}
```

**After:**
```typescript
if (assignmentsError) {
  const errorDetails = serializeSupabaseError(assignmentsError)
  console.error("Error fetching assignments:", errorDetails)
  // ... specific error handling
}
```

**Benefits:**
- Errors are now properly serialized with full details (message, code, details, hint)
- Makes debugging easier with complete error information
- Consistent error handling across the codebase

### 2. Comprehensive Error Handling for Submission Counts

**Before:**
```typescript
const { count: submissionCount } = await supabase
  .from("assignment_submissions")
  .select("*", { count: "exact", head: true })
  .eq("assignment_id", assignment.id)
```

**After:**
```typescript
const { count, error: countError } = await supabase
  .from("assignment_submissions")
  .select("*", { count: "exact", head: true })
  .eq("assignment_id", assignment.id)

if (countError) {
  const errorDetails = serializeSupabaseError(countError)
  console.warn(`Error fetching submission count for assignment ${assignment.id}:`, errorDetails)
  // Continue with default count of 0 instead of failing
} else {
  submissionCount = count || 0
}
```

**Benefits:**
- Errors in count queries no longer cause the entire operation to fail
- Assignments are still displayed even if count queries fail
- Errors are logged for debugging while maintaining functionality

### 3. Always Reset Loading State

**Before:**
```typescript
if (assignmentsError) {
  console.error("Error fetching assignments:", assignmentsError)
  setError("Failed to load assignments")
  return  // Missing setLoading(false)
}
```

**After:**
```typescript
if (assignmentsError) {
  // ... error handling
  setLoading(false)  // Always reset before returning
  return
}
```

**Benefits:**
- Loading state is properly managed
- UI doesn't get stuck in loading state
- Better user experience

### 4. Specific Error Messages

**After:**
```typescript
if (errorDetails.message?.includes('relation "assignments" does not exist')) {
  setError("Database setup required")
  toast.error("Database setup required", {
    description: "The assignments table doesn't exist. Please run the database setup script.",
  })
} else if (errorDetails.message?.includes('permission denied') || errorDetails.code === '42501') {
  setError("Permission denied")
  toast.error("Permission denied", {
    description: "You don't have permission to view assignments. Please contact your administrator.",
  })
} else if (errorDetails.message?.includes('network') || errorDetails.message?.includes('fetch')) {
  setError("Network error")
  toast.error("Network error", {
    description: "Unable to connect to the server. Please check your internet connection.",
  })
}
```

**Benefits:**
- Users understand what went wrong
- Provides actionable guidance
- Different error types are handled appropriately

### 5. Error Recovery Mechanism

**Added:**
```typescript
{error && (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-900 mb-1">Error Loading Assignments</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAssignments()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Retry
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

**Benefits:**
- Users can retry failed operations
- Clear error display with retry button
- Better UX during error states

## Best Practices for Future Development

### 1. Always Use `serializeSupabaseError` for Error Logging

**Do:**
```typescript
import { serializeSupabaseError } from "@/lib/safe-error"

const errorDetails = serializeSupabaseError(error)
console.error("Error:", errorDetails)
```

**Don't:**
```typescript
console.error("Error:", error)  // May result in {} for Supabase errors
```

### 2. Always Handle Errors in Async Operations

**Do:**
```typescript
const { data, error } = await supabase.from("table").select("*")
if (error) {
  const errorDetails = serializeSupabaseError(error)
  // Handle error appropriately
  return
}
```

**Don't:**
```typescript
const { data } = await supabase.from("table").select("*")
// Error is ignored
```

### 3. Always Reset Loading States

**Do:**
```typescript
try {
  setLoading(true)
  // ... operations
} catch (err) {
  // ... error handling
} finally {
  setLoading(false)  // Always reset
}
```

**Don't:**
```typescript
try {
  setLoading(true)
  // ... operations
  if (error) {
    return  // Missing setLoading(false)
  }
} catch (err) {
  // ...
}
```

### 4. Provide Specific Error Messages

**Do:**
```typescript
if (errorDetails.message?.includes('relation "table" does not exist')) {
  toast.error("Database setup required", {
    description: "The table doesn't exist. Please run the database setup script.",
  })
} else if (errorDetails.code === '42501') {
  toast.error("Permission denied", {
    description: "You don't have permission. Please contact your administrator.",
  })
}
```

**Don't:**
```typescript
toast.error("Error", {
  description: "Something went wrong.",  // Too generic
})
```

### 5. Handle Errors in Nested Operations

**Do:**
```typescript
const results = await Promise.all(
  items.map(async (item) => {
    try {
      const { data, error } = await operation(item)
      if (error) {
        // Log and continue with default
        return defaultValue
      }
      return data
    } catch (err) {
      // Handle error but don't fail entire operation
      return defaultValue
    }
  })
)
```

**Don't:**
```typescript
const results = await Promise.all(
  items.map(async (item) => {
    // No error handling - one failure fails all
  })
)
```

### 6. Validate Errors Before Serialization

**Do:**
```typescript
if (assignmentsError) {
  // Log raw error first for debugging
  console.error("Raw assignment error:", {
    error: assignmentsError,
    errorType: typeof assignmentsError,
    context: operationContext,
  })

  // Validate error before serialization
  let errorDetails
  try {
    if (assignmentsError === null || assignmentsError === undefined) {
      errorDetails = {
        message: "Null or undefined error received",
        type: "null_error",
      }
    } else {
      errorDetails = serializeSupabaseError(assignmentsError)
      // Ensure errorDetails has a message
      if (!errorDetails.message || errorDetails.message.trim() === "") {
        errorDetails.message = "Error occurred but no message available"
      }
    }
  } catch (serializationError) {
    // If serialization itself fails, create a fallback error
    errorDetails = {
      message: "Error occurred but could not be serialized",
      type: "serialization_failure",
      rawError: String(assignmentsError),
    }
  }

  console.error("Error fetching assignments:", {
    errorDetails,
    context: operationContext,
    stackTrace: new Error().stack,
  })
}
```

**Don't:**
```typescript
if (assignmentsError) {
  const errorDetails = serializeSupabaseError(assignmentsError)
  // No validation - may fail if error is null/undefined
  console.error("Error:", errorDetails)
}
```

### 7. Add Context to Error Logs

**Do:**
```typescript
const operationContext = {
  operation: "loadAssignments",
  userId: user?.id,
  userEmail: user?.email,
  timestamp: new Date().toISOString(),
}

console.error("Error fetching assignments:", {
  errorDetails,
  context: operationContext,
  stackTrace: new Error().stack,
})
```

**Don't:**
```typescript
console.error("Error:", errorDetails)
// No context - harder to debug
```

### 8. Implement Retry Logic for Network Errors

**Do:**
```typescript
const loadAssignments = async (isRetry: boolean = false) => {
  try {
    // ... database query
    
    if (assignmentsError) {
      const errorDetails = serializeSupabaseError(assignmentsError)
      
      // Determine if error is retryable
      const isRetryable = 
        errorDetails.message?.includes('network') ||
        errorDetails.message?.includes('fetch') ||
        errorDetails.message?.includes('timeout') ||
        errorDetails.type === "empty_object"

      // Auto-retry with exponential backoff
      if (isRetryable && retryCount < 2) {
        const delay = 1000 * Math.pow(2, retryCount)
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          loadAssignments(true)
        }, delay)
      } else {
        // Show error with manual retry option
        toast.error("Error loading assignments", {
          description: errorDetails.message,
          action: isRetryable ? {
            label: "Retry",
            onClick: () => {
              setRetryCount(0)
              loadAssignments(false)
            },
          } : undefined,
        })
      }
    }
  } catch (err) {
    // ... error handling
  }
}
```

**Don't:**
```typescript
if (assignmentsError) {
  toast.error("Error loading assignments")
  // No retry mechanism
}
```

### 9. Handle Empty Error Objects

The enhanced `serializeSupabaseError` function now handles empty error objects:

```typescript
// Before: Empty object {} would serialize to "{}"
// After: Empty object is detected and handled
if (Object.keys(allProps).length === 0) {
  return {
    message: "Empty error object received - this may indicate a serialization issue, network problem, or malformed error response",
    type: "empty_object",
    raw: e,
    timestamp: new Date().toISOString()
  }
}
```

### 10. Error Type Guards

**Do:**
```typescript
// Check error type before handling
if (errorDetails.type === "empty_object") {
  // Handle empty object error
} else if (errorDetails.type === "PostgrestError") {
  // Handle Supabase error
} else if (errorDetails.type === "Error") {
  // Handle standard Error object
}
```

**Don't:**
```typescript
// Assume all errors are the same type
if (error) {
  // Generic handling
}
```

## Error Serialization Enhancements

The `serializeSupabaseError` function has been enhanced to:

1. **Deep Property Extraction**: Extracts all enumerable properties from error objects, including non-enumerable common properties
2. **Empty Object Detection**: Detects and handles empty error objects with meaningful messages
3. **Fallback Messages**: Always returns a meaningful message, even when error objects are empty or malformed
4. **Context Information**: Includes timestamps and error types in all serialized errors
5. **Multiple Error Formats**: Handles Error objects, Supabase errors, plain objects, and primitives

## Testing Error Handling

When testing error handling:

1. **Test with null/undefined errors**: Ensure serialization doesn't fail
2. **Test with empty objects**: Verify meaningful messages are returned
3. **Test with network errors**: Verify retry logic works correctly
4. **Test with malformed errors**: Ensure fallback mechanisms work
5. **Test with different error types**: Verify all error types are handled

## Summary

The enhanced error handling system now:

- ✅ Properly serializes all error types, including empty objects
- ✅ Validates errors before serialization
- ✅ Provides context information in all error logs
- ✅ Implements retry logic for network errors
- ✅ Always returns meaningful error messages
- ✅ Handles edge cases gracefully
- ✅ Provides user-friendly error messages
- ✅ Includes comprehensive logging for debugging

## Testing Checklist

When implementing error handling, test for:

- [ ] Database table doesn't exist
- [ ] Permission denied errors
- [ ] Network connectivity issues
- [ ] Invalid data responses
- [ ] Null/undefined data handling
- [ ] Loading state management
- [ ] Error recovery mechanisms
- [ ] User-friendly error messages
- [ ] Error logging with full details

## Common Error Types and Handling

### 1. Table Doesn't Exist
```typescript
if (errorDetails.message?.includes('relation "table" does not exist')) {
  // Handle database setup required
}
```

### 2. Permission Denied
```typescript
if (errorDetails.code === '42501' || errorDetails.message?.includes('permission denied')) {
  // Handle permission error
}
```

### 3. Network Error
```typescript
if (errorDetails.message?.includes('network') || errorDetails.message?.includes('fetch')) {
  // Handle network error
}
```

### 4. Invalid Data
```typescript
if (!data) {
  // Handle null/undefined data
  return defaultValue
}
```

## Conclusion

Proper error handling is crucial for:
1. **Debugging**: Complete error information makes issues easier to identify and fix
2. **User Experience**: Clear error messages help users understand and resolve issues
3. **Reliability**: Graceful error handling prevents cascading failures
4. **Maintainability**: Consistent error handling patterns make code easier to maintain

Always follow these practices when working with Supabase operations and async functions to prevent similar issues in the future.

