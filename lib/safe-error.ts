/**
 * Deeply extracts all enumerable properties from an object
 */
function extractAllProperties(obj: any): Record<string, any> {
	const properties: Record<string, any> = {}
	
	if (!obj || typeof obj !== "object") {
		return properties
	}
	
	// Extract own enumerable properties
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			try {
				const value = obj[key]
				// Skip functions and circular references
				if (typeof value !== "function" && value !== obj) {
					properties[key] = value
				}
			} catch {
				// Skip properties that can't be accessed
			}
		}
	}
	
	// Also check for common error properties that might not be enumerable
	const commonProps = ["message", "name", "stack", "code", "details", "hint", "status", "error", "error_description"]
	for (const prop of commonProps) {
		if (prop in obj && !(prop in properties)) {
			try {
				const value = obj[prop]
				if (typeof value !== "function" && value !== obj) {
					properties[prop] = value
				}
			} catch {
				// Skip properties that can't be accessed
			}
		}
	}
	
	return properties
}

/**
 * Tries to extract a meaningful message from an error object
 */
function extractErrorMessage(err: any, allProps: Record<string, any>): string {
	// Try common message fields first
	const messageFields = ["message", "error_description", "error", "errorMessage", "msg", "reason"]
	for (const field of messageFields) {
		if (allProps[field] && typeof allProps[field] === "string" && allProps[field].trim()) {
			return allProps[field].trim()
		}
	}
	
	// Try to stringify the object if it's not empty
	if (Object.keys(allProps).length > 0) {
		try {
			const stringified = JSON.stringify(allProps, null, 2)
			if (stringified && stringified !== "{}") {
				return `Error object: ${stringified}`
			}
		} catch {
			// If stringification fails, continue
		}
	}
	
	// Try toString() method
	if (typeof err?.toString === "function") {
		try {
			const str = err.toString()
			if (str && str !== "[object Object]") {
				return str
			}
		} catch {
			// If toString fails, continue
		}
	}
	
	// Check if it's an empty object
	if (typeof err === "object" && err !== null && Object.keys(err).length === 0) {
		return "Empty error object received - this may indicate a serialization issue or network problem"
	}
	
	// Final fallback
	return "Unknown error occurred - no error message available"
}

export function serializeSupabaseError(err: unknown) {
	// Handle null/undefined
	if (!err) {
		return { 
			message: "Unknown error - no error object provided", 
			type: "unknown",
			timestamp: new Date().toISOString()
		}
	}
	
	const e = err as any
	
	// Handle empty objects - check if error has no enumerable properties
	if (typeof e === "object" && e !== null) {
		const keys = Object.keys(e)
		const hasEnumerableProps = keys.length > 0
		const hasOwnProperty = Object.prototype.hasOwnProperty.call(e, 'message') || 
		                       Object.prototype.hasOwnProperty.call(e, 'code') ||
		                       Object.prototype.hasOwnProperty.call(e, 'details')
		
		// If it's an empty object or has no meaningful properties, try to extract from non-enumerable
		if (!hasEnumerableProps && !hasOwnProperty) {
			// Try to get message, code, details from non-enumerable properties
			try {
				const message = e.message || e.error_description || e.error || undefined
				const code = e.code || undefined
				const details = e.details || undefined
				const hint = e.hint || undefined
				
				if (message || code || details) {
					return {
						message: message || "Empty error object received - may indicate RLS policy issue or table doesn't exist",
						code: code,
						details: details,
						hint: hint,
						type: "empty_object_with_properties",
						raw: String(e),
						timestamp: new Date().toISOString()
					}
				}
			} catch {
				// If we can't access properties, continue with normal flow
			}
		}
	}
	
	// Handle Error objects
	if (err instanceof Error) {
		const allProps = extractAllProperties(err)
		const message = e.message || extractErrorMessage(err, allProps)
		
		return {
			message: message || "Unknown error",
			name: e.name || "Error",
			stack: e.stack || undefined,
			type: "Error",
			code: e.code || allProps.code,
			details: e.details || allProps.details,
			hint: e.hint || allProps.hint,
			status: e.status || allProps.status,
			...allProps,
			timestamp: new Date().toISOString()
		}
	}
	
	// Handle Supabase PostgrestError
	// Check if it looks like a Supabase error (has code and at least one of message/details/hint)
	if (e?.code && (e?.message || e?.details || e?.hint)) {
		const allProps = extractAllProperties(e)
		
		return {
			message: e.message || e.error_description || e.error || "Supabase error",
			code: e.code,
			details: e.details || allProps.details,
			hint: e.hint || allProps.hint,
			status: e.status || allProps.status,
			type: "PostgrestError",
			...allProps,
			timestamp: new Date().toISOString()
		}
	}
	
	// Handle objects
	if (typeof e === "object" && e !== null) {
		const allProps = extractAllProperties(e)
		const message = extractErrorMessage(e, allProps)
		
		// Check if it's an empty object
		if (Object.keys(allProps).length === 0) {
			return {
				message: "Empty error object received - this may indicate a serialization issue, network problem, or malformed error response",
				type: "empty_object",
				raw: e,
				timestamp: new Date().toISOString()
			}
		}
		
		return {
			message: message,
			code: allProps.code || e?.code,
			details: allProps.details || e?.details,
			hint: allProps.hint || e?.hint,
			status: allProps.status || e?.status,
			type: "object",
			...allProps,
			raw: e,
			timestamp: new Date().toISOString()
		}
	}
	
	// Handle primitives
	return {
		message: String(err) || "Unknown error",
		type: typeof err,
		raw: err,
		timestamp: new Date().toISOString()
	}
}




