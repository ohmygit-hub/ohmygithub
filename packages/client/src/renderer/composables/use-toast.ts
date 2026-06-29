import {
  toast,
  type ToastApi,
  type ToastOptions,
} from '@oh-my-github/ui'

export interface UseToastReturn {
  toast: ToastApi
  message: (message: string, options?: ToastOptions) => string
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  dismiss: (id?: string | number) => void
}

export function useToast(): UseToastReturn {
  return {
    toast,
    message: toast.message,
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
    dismiss: toast.dismiss,
  }
}
