"use client"

import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImagePreviewProps {
  imageData: string
  onRetake: () => void
  onConfirm: () => void
  isPotentialBill?: boolean
}

export function ImagePreview({ imageData, onRetake, onConfirm, isPotentialBill = true }: ImagePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border">
        <img src={imageData || "/placeholder.svg"} alt="Captured bill" className="h-full w-full object-contain" />
      </div>

      {!isPotentialBill && (
        <Alert variant="warning" className="my-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This image may not be a medical bill. Please ensure you're uploading a clear image of a medical bill.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between gap-4">
        <Button variant="outline" className="flex-1 border border-gray-300 dark:border-gray-600" onClick={onRetake}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retake
        </Button>

        <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700 border border-blue-700" onClick={onConfirm}>
          <Check className="mr-2 h-4 w-4" />
          Use This Image
        </Button>
      </div>
    </div>
  )
}
