import type React from "react"
import { Loader2 } from "lucide-react"

interface LoadingErrorProps {
  loading: boolean
  error: string | null
  loadingText?: string
  errorText?: string
  children: React.ReactNode
}

export function LoadingError({ loading, error, loadingText = "Загрузка...", errorText, children }: LoadingErrorProps) {
  if (loading) {
    return (
      <div className="text-center py-4 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>{loadingText}</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{errorText || error}</div>
  }

  return <>{children}</>
}
