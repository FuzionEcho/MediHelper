"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, AlertCircle, Check, Eye, Crosshair } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CalibrationModalProps {
  onComplete: () => void
  onCancel: () => void
  calibrationStep: number
  eyeDetected: boolean
  calibrationPoints: { x: number; y: number }[]
  calibrationPointsCollected: number
  onCalibrationPointClick: (x: number, y: number) => void
  calibrationQuality: number
  calibrationError: string | null
  onCalibrationErrorClear: () => void
}

export function CalibrationModal({
  onComplete,
  onCancel,
  calibrationStep,
  eyeDetected,
  calibrationPoints,
  calibrationPointsCollected,
  onCalibrationPointClick,
  calibrationQuality,
  calibrationError,
  onCalibrationErrorClear,
}: CalibrationModalProps) {
  const [currentPoint, setCurrentPoint] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const targetRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoFeedRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [calibrationComplete, setCalibrationComplete] = useState(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Move WebGazer video feed into our container
  useEffect(() => {
    if (!videoFeedRef.current) return

    // Find the WebGazer video element
    const webgazerVideo = document.getElementById("webgazerVideoContainer")

    if (webgazerVideo) {
      // Style the WebGazer video container
      webgazerVideo.style.position = "relative"
      webgazerVideo.style.top = "0"
      webgazerVideo.style.left = "0"
      webgazerVideo.style.zIndex = "1"
      webgazerVideo.style.display = "block"

      // Find the actual video element
      const videoElement = webgazerVideo.querySelector("video")
      if (videoElement) {
        videoElement.style.borderRadius = "8px"
        videoElement.style.width = "100%"
        videoElement.style.height = "auto"
        videoElement.style.maxHeight = "200px"
        videoElement.style.objectFit = "cover"
      }

      // Move it into our container
      videoFeedRef.current.appendChild(webgazerVideo)
    }

    return () => {
      // Move the video back to body when modal is closed
      if (webgazerVideo && document.body) {
        try {
          // Only move it back if it's still in our container
          if (videoFeedRef.current && videoFeedRef.current.contains(webgazerVideo)) {
            document.body.appendChild(webgazerVideo)
            webgazerVideo.style.display = "none"
          }
        } catch (error) {
          console.error("Error moving WebGazer video:", error)
        }
      }
    }
  }, [])

  // Handle calibration step changes
  useEffect(() => {
    if (calibrationStep === 0) {
      // Face detection step
      setShowInstructions(true)
    } else if (calibrationStep === 1 && showInstructions) {
      // Start countdown after instructions are dismissed
      setCountdown(null)
    }
  }, [calibrationStep, showInstructions])

  // Handle calibration point collection
  useEffect(() => {
    if (!isMountedRef.current || calibrationStep !== 1 || showInstructions) return

    // If we've collected all points
    if (calibrationPointsCollected >= calibrationPoints.length) {
      setCalibrationComplete(true)
      return
    }

    // Update current point
    setCurrentPoint(calibrationPointsCollected)

    // Start animation to new point
    if (targetRef.current && containerRef.current && calibrationPoints[calibrationPointsCollected]) {
      const point = calibrationPoints[calibrationPointsCollected]

      setIsAnimating(true)

      // Position the target at the calibration point
      targetRef.current.style.left = `${point.x}px`
      targetRef.current.style.top = `${point.y}px`

      // Wait for animation to complete
      const animationTimer = setTimeout(() => {
        if (!isMountedRef.current) return
        setIsAnimating(false)

        // Start countdown for this point
        setCountdown(3)
      }, 1000)

      return () => clearTimeout(animationTimer)
    }
  }, [calibrationStep, calibrationPointsCollected, calibrationPoints, showInstructions])

  // Handle countdown
  useEffect(() => {
    if (countdown === null || !isMountedRef.current) return

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      // Collect data for this point
      if (calibrationPoints[currentPoint] && targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        // Add calibration point
        onCalibrationPointClick(centerX, centerY)

        // Reset countdown
        setCountdown(null)
      }
    }
  }, [countdown, currentPoint, calibrationPoints, onCalibrationPointClick])

  // Handle calibration completion
  useEffect(() => {
    if (calibrationComplete && !isMountedRef.current) return

    if (calibrationComplete) {
      const timer = setTimeout(() => {
        onComplete()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [calibrationComplete, onComplete])

  // Calculate progress percentage
  const progressPercentage =
    calibrationStep === 0
      ? eyeDetected
        ? 10
        : 0
      : calibrationStep === 1
        ? 10 + (calibrationPointsCollected / calibrationPoints.length) * 80
        : calibrationComplete
          ? 100
          : 90

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/10">
          <X className="h-6 w-6" />
          <span className="sr-only">Cancel calibration</span>
        </Button>
      </div>

      <div className="w-full max-w-3xl px-4">
        {calibrationError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Calibration Error</AlertTitle>
            <AlertDescription>{calibrationError}</AlertDescription>
            <Button variant="outline" size="sm" onClick={onCalibrationErrorClear} className="mt-2">
              Try Again
            </Button>
          </Alert>
        ) : (
          <>
            <div className="mb-6 text-center text-white">
              <h2 className="text-2xl font-bold mb-2">Eye Tracking Calibration</h2>

              {/* Camera feed container */}
              <div
                ref={videoFeedRef}
                className="mx-auto mb-4 w-full max-w-xs rounded-lg overflow-hidden bg-gray-800/50"
              ></div>

              {calibrationStep === 0 && (
                <p className="text-lg mb-4">
                  {eyeDetected
                    ? "Face detected! Ready to start calibration."
                    : "Positioning your face... Please look directly at the camera"}
                </p>
              )}

              {calibrationStep === 1 && showInstructions && (
                <div className="text-left bg-gray-800/50 p-4 rounded-lg mb-4">
                  <h3 className="text-xl font-semibold mb-2">Calibration Instructions</h3>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>You'll see a series of 9 targets appear on screen</li>
                    <li>Focus your gaze on each target until it turns green</li>
                    <li>Try not to move your head during calibration</li>
                    <li>Keep your face centered and visible to the camera</li>
                    <li>The more accurate your gaze, the better the tracking will be</li>
                  </ul>
                  <Button className="mt-4 bg-teal-600 hover:bg-teal-700" onClick={() => setShowInstructions(false)}>
                    Start Calibration
                  </Button>
                </div>
              )}

              {calibrationStep === 1 && !showInstructions && !calibrationComplete && (
                <p className="text-lg mb-4">
                  Focus on the target {countdown !== null ? `for ${countdown} seconds` : ""}
                </p>
              )}

              {calibrationComplete && (
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-2">
                    <Check className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Calibration Complete!</h3>
                  <p className="text-lg">Calibration quality: {calibrationQuality}%</p>
                  <p className="text-sm text-gray-300 mt-2">
                    {calibrationQuality >= 70
                      ? "Great! You should have good eye tracking accuracy."
                      : calibrationQuality >= 50
                        ? "Acceptable. You may need to recalibrate for better accuracy."
                        : "Low accuracy. Consider recalibrating in better lighting conditions."}
                  </p>
                </div>
              )}

              <div className="w-full mb-4">
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between mt-2 text-sm text-gray-300">
                  <span>Face Detection</span>
                  <span>Calibration</span>
                  <span>Complete</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {calibrationStep === 0 && !eyeDetected ? (
                <div className="flex justify-center">
                  <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-500 flex items-center justify-center animate-pulse">
                    <div className="text-white text-center">
                      <Eye className="h-12 w-12 mb-2 mx-auto text-gray-400" />
                      <p>Detecting your eyes...</p>
                      <p className="text-sm mt-2">Please ensure your face is visible and well-lit</p>
                    </div>
                  </div>
                </div>
              ) : calibrationStep === 0 && eyeDetected ? (
                <div className="flex justify-center">
                  <div className="w-64 h-64 rounded-full border-4 border-green-500 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Check className="h-12 w-12 mb-2 mx-auto text-green-500" />
                      <p className="text-lg font-medium">Face Detected!</p>
                      <p className="text-sm mt-2">Ready to start calibration</p>
                    </div>
                  </div>
                </div>
              ) : calibrationStep === 1 && !showInstructions && !calibrationComplete ? (
                <div ref={containerRef} className="relative w-full h-[60vh] bg-transparent">
                  <div
                    ref={targetRef}
                    className={`absolute w-12 h-12 rounded-full bg-teal-500 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out ${
                      isAnimating ? "" : countdown !== null ? "animate-pulse" : "shadow-glow"
                    }`}
                    style={{ left: "50%", top: "50%" }}
                  >
                    <Crosshair className="w-full h-full p-2 text-white" />
                  </div>

                  {/* Progress indicator */}
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                    <p>
                      Point {calibrationPointsCollected + 1} of {calibrationPoints.length}
                    </p>
                  </div>
                </div>
              ) : (
                calibrationComplete && (
                  <div className="flex justify-center">
                    <div className="w-full max-w-md bg-gray-800/50 rounded-lg p-6">
                      <div className="flex items-center justify-center mb-4">
                        <div
                          className={`w-24 h-24 rounded-full flex items-center justify-center ${
                            calibrationQuality >= 70
                              ? "bg-green-100"
                              : calibrationQuality >= 50
                                ? "bg-yellow-100"
                                : "bg-red-100"
                          }`}
                        >
                          <div
                            className={`text-2xl font-bold ${
                              calibrationQuality >= 70
                                ? "text-green-600"
                                : calibrationQuality >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {calibrationQuality}%
                          </div>
                        </div>
                      </div>

                      <p className="text-center text-white mb-4">
                        {calibrationQuality >= 70
                          ? "Excellent calibration! You're ready to use eye tracking."
                          : calibrationQuality >= 50
                            ? "Good calibration. You can recalibrate later if needed."
                            : "Basic calibration complete. Consider recalibrating for better accuracy."}
                      </p>

                      <div className="text-center">
                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={onComplete}>
                          Start Using Eye Tracking
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .shadow-glow {
          box-shadow: 0 0 0 8px rgba(20, 184, 166, 0.3);
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7);
          }
          
          70% {
            transform: translate(-50%, -50%) scale(1.1);
            box-shadow: 0 0 0 10px rgba(20, 184, 166, 0);
          }
          
          100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
          }
        }
      `}</style>
    </div>
  )
}
