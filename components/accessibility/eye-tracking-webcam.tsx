"use client"

import { useEffect, useRef } from "react"
import { Eye } from "lucide-react"

interface EyeTrackingWebcamProps {
  isEnabled: boolean
  calibrationQuality: number
}

export function EyeTrackingWebcam({ isEnabled, calibrationQuality }: EyeTrackingWebcamProps) {
  const webcamContainerRef = useRef<HTMLDivElement>(null)

  // Move WebGazer video feed into our container
  useEffect(() => {
    if (!webcamContainerRef.current) return

    // Find the WebGazer video element
    const webgazerVideo = document.getElementById("webgazerVideoContainer")

    if (webgazerVideo && isEnabled) {
      // Style the WebGazer video container
      webgazerVideo.style.position = "relative"
      webgazerVideo.style.top = "0"
      webgazerVideo.style.left = "0"
      webgazerVideo.style.zIndex = "1"
      webgazerVideo.style.display = "block"
      webgazerVideo.style.width = "100%"
      webgazerVideo.style.height = "auto"

      // Find the actual video element
      const videoElement = webgazerVideo.querySelector("video")
      if (videoElement) {
        videoElement.style.borderRadius = "8px"
        videoElement.style.width = "100%"
        videoElement.style.height = "auto"
        videoElement.style.maxHeight = "100%"
        videoElement.style.objectFit = "cover"
      }

      // Find the face overlay canvas
      const faceOverlay = webgazerVideo.querySelector("canvas")
      if (faceOverlay) {
        faceOverlay.style.position = "absolute"
        faceOverlay.style.top = "0"
        faceOverlay.style.left = "0"
        faceOverlay.style.width = "100%"
        faceOverlay.style.height = "100%"
      }

      // Move it into our container
      webcamContainerRef.current.appendChild(webgazerVideo)
    }

    return () => {
      // Don't remove the video when component unmounts
      // We want it to persist
    }
  }, [isEnabled])

  if (!isEnabled) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      <div className="relative">
        <div ref={webcamContainerRef} className="h-36 bg-gray-100">
          {/* WebGazer video will be placed here */}
          <div className="flex h-full items-center justify-center">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">Eye Tracking</span>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
              {calibrationQuality}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
