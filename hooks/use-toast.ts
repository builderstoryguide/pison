import { toast } from "sonner"

export const useToast = () => {
  return {
    toast,
    dismiss: toast.dismiss,
    success: (message: string, description?: string) => {
      toast.success(message, {
        description,
      })
    },
    error: (message: string, description?: string) => {
      toast.error(message, {
        description,
      })
    },
    warning: (message: string, description?: string) => {
      toast.warning(message, {
        description,
      })
    },
    info: (message: string, description?: string) => {
      toast.info(message, {
        description,
      })
    },
  }
}
