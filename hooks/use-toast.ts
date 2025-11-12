import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

export const useToast = () => {
  const toastFn = (messageOrOptions: ToastOptions | string, options?: { description?: string; variant?: ToastOptions["variant"] }) => {
    // Handle two-argument form: toast("message", { description, variant })
    if (typeof messageOrOptions === "string" && options) {
      const { description, variant = "default" } = options
      if (variant === "destructive") {
        sonnerToast.error(messageOrOptions, {
          description,
        })
      } else if (variant === "success") {
        sonnerToast.success(messageOrOptions, {
          description,
        })
      } else {
        sonnerToast(messageOrOptions, {
          description,
        })
      }
      return
    }

    // Handle single string: toast("message")
    if (typeof messageOrOptions === "string") {
      sonnerToast(messageOrOptions)
      return
    }

    // Handle object form: toast({ title, description, variant })
    const { title, description, variant = "default" } = messageOrOptions

    if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description,
      })
    } else if (variant === "success") {
      sonnerToast.success(title || "Success", {
        description,
      })
    } else {
      sonnerToast(title || "Notification", {
        description,
      })
    }
  }

  // Attach methods to the toast function
  toastFn.success = (message: string, descriptionOrOptions?: string | { description?: string }) => {
    if (typeof descriptionOrOptions === "string") {
      sonnerToast.success(message, {
        description: descriptionOrOptions,
      })
    } else {
      sonnerToast.success(message, {
        description: descriptionOrOptions?.description,
      })
    }
  }

  toastFn.error = (message: string, descriptionOrOptions?: string | { description?: string }) => {
    if (typeof descriptionOrOptions === "string") {
      sonnerToast.error(message, {
        description: descriptionOrOptions,
      })
    } else {
      sonnerToast.error(message, {
        description: descriptionOrOptions?.description,
      })
    }
  }

  toastFn.warning = (message: string, descriptionOrOptions?: string | { description?: string }) => {
    if (typeof descriptionOrOptions === "string") {
      sonnerToast.warning(message, {
        description: descriptionOrOptions,
      })
    } else {
      sonnerToast.warning(message, {
        description: descriptionOrOptions?.description,
      })
    }
  }

  toastFn.info = (message: string, descriptionOrOptions?: string | { description?: string }) => {
    if (typeof descriptionOrOptions === "string") {
      sonnerToast.info(message, {
        description: descriptionOrOptions,
      })
    } else {
      sonnerToast.info(message, {
        description: descriptionOrOptions?.description,
      })
    }
  }

  toastFn.dismiss = sonnerToast.dismiss

  return {
    toast: toastFn,
    dismiss: sonnerToast.dismiss,
    success: toastFn.success,
    error: toastFn.error,
    warning: toastFn.warning,
    info: toastFn.info,
  }
}
