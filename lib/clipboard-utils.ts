// Clipboard utility functions with fallback support

export interface ClipboardResult {
  success: boolean
  error?: string
}

/**
 * Copy text to clipboard with fallback support for older browsers and non-secure contexts
 * @param text - The text to copy to clipboard
 * @returns Promise<ClipboardResult> - Result of the copy operation
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  try {
    // Check if modern clipboard API is available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return { success: true }
    } else {
      // Fallback method for older browsers or non-secure contexts
      return await fallbackCopyToClipboard(text)
    }
  } catch (err) {
    console.error('Clipboard API failed, trying fallback:', err)
    return await fallbackCopyToClipboard(text)
  }
}

/**
 * Fallback copy method using document.execCommand
 * @param text - The text to copy to clipboard
 * @returns Promise<ClipboardResult> - Result of the copy operation
 */
async function fallbackCopyToClipboard(text: string): Promise<ClipboardResult> {
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.setAttribute('readonly', '')
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, text.length)
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (successful) {
      return { success: true }
    } else {
      return { 
        success: false, 
        error: 'Fallback copy command failed' 
      }
    }
  } catch (err) {
    console.error('Fallback copy failed:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }
  }
}

/**
 * Copy text to clipboard with user feedback
 * @param text - The text to copy to clipboard
 * @param onSuccess - Callback for successful copy
 * @param onError - Callback for failed copy
 */
export async function copyToClipboardWithFeedback(
  text: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  const result = await copyToClipboard(text)
  
  if (result.success) {
    onSuccess?.()
  } else {
    const errorMessage = result.error || 'Failed to copy to clipboard'
    onError?.(errorMessage)
    
    // Show password in alert as last resort
    if (text.length > 0) {
      alert(`Password: ${text}\n\nPlease copy this password manually.`)
    }
  }
}

/**
 * Check if clipboard API is available
 * @returns boolean - True if clipboard API is available
 */
export function isClipboardAPIAvailable(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText)
}

/**
 * Check if we're in a secure context (HTTPS or localhost)
 * @returns boolean - True if in secure context
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}
