"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, RefreshCw, X, ZapOff, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize camera
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      if (videoRef.current) {
        setError(null)
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        videoRef.current.srcObject = stream
        setIsCameraActive(true)

        // Check if flash is available
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities()
        setHasFlash(capabilities.torch !== undefined && capabilities.torch === true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Could not access camera. Please ensure camera permissions are granted.")
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const toggleFlash = async () => {
    if (!streamRef.current) return

    const track = streamRef.current.getVideoTracks()[0]
    const newFlashState = !flashOn

    try {
      await track.applyConstraints({
        advanced: [{ torch: newFlashState }],
      })
      setFlashOn(newFlashState)
    } catch (err) {
      console.error("Error toggling flash:", err)
    }
  }

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the video frame to the canvas
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL
        const imageData = canvas.toDataURL("image/jpeg")
        onCapture(imageData)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1">
        {error ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-white">
            <X className="mb-4 h-12 w-12 text-red-500" />
            <p className="text-center">{error}</p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent text-white hover:bg-white/10 hover:text-white border border-white/50"
              onClick={startCamera}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
            onLoadedMetadata={() => videoRef.current?.play()}
          />
        )}

        {/* Camera controls */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6">
          {isCameraActive && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/50"
                onClick={switchCamera}
              >
                <RefreshCw className="h-6 w-6 text-white" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full bg-white hover:bg-white/90 border border-white/50"
                onClick={captureImage}
              >
                <Camera className="h-8 w-8 text-black" />
              </Button>

              {hasFlash && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/50"
                  onClick={toggleFlash}
                >
                  {flashOn ? <Zap className="h-6 w-6 text-yellow-300" /> : <ZapOff className="h-6 w-6 text-white" />}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
