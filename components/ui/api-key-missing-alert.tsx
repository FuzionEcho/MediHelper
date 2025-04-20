import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ApiKeyMissingAlertProps {
  service: string
  className?: string
}

export function ApiKeyMissingAlert({ service, className = "" }: ApiKeyMissingAlertProps) {
  return (
    <Alert variant="warning" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{service} API Key Missing</AlertTitle>
      <AlertDescription>
        The {service} API key is not configured. Some features may be limited or unavailable. Please add the API key to
        your environment variables to enable full functionality.
      </AlertDescription>
    </Alert>
  )
}
