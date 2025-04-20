"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// Define a global type for the webgazer library
declare global {
  interface Window {
    webgazer: any
  }
}

export function useEyeTracking() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationQuality, setCalibrationQuality] = useState(0) // 0-100%
  const [showGaze, setShowGaze] = useState(true)
  const [dwellTime, setDwellTime] = useState(1000) // Default dwell time in ms
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [calibrationStep, setCalibrationStep] = useState(0)
  const [eyeDetected, setEyeDetected] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([])
  const [calibrationPointsCollected, setCalibrationPointsCollected] = useState(0)
  const [calibrationError, setCalibrationError] = useState<string | null>(null)

  // Refs to track gaze data
  const gazeRef = useRef<{ x: number; y: number } | null>(null)
  const lastElementRef = useRef<Element | null>(null)
  const dwellStartTimeRef = useRef<number | null>(null)
  const gazeIndicatorRef = useRef<HTMLDivElement | null>(null)
  const isCleanedUpRef = useRef(false)
  const calibrationAccuracyRef = useRef<number[]>([])
  const webgazerInitializedRef = useRef(false)
  const eyeGridRef = useRef<HTMLDivElement | null>(null)

  // Load webgazer script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.webgazer && !document.getElementById("webgazer-script")) {
      const script = document.createElement("script")
      script.id = "webgazer-script"
      script.src = "https://webgazer.cs.brown.edu/webgazer.js"
      script.async = true
      script.onload = () => {
        console.log("WebGazer script loaded")
        initializeWebGazer()
      }
      document.body.appendChild(script)
    } else if (typeof window !== "undefined" && window.webgazer) {
      initializeWebGazer()
    }

    return () => {
      // Clean up webgazer when component unmounts
      if (typeof window !== "undefined" && window.webgazer && webgazerInitializedRef.current) {
        try {
          window.webgazer.end()
          window.webgazer.clearData()
        } catch (error) {
          console.error("Error ending webgazer:", error)
        }
      }
      isCleanedUpRef.current = true
    }
  }, [])

  // Initialize WebGazer with optimal settings
  const initializeWebGazer = useCallback(() => {
    if (!window.webgazer || webgazerInitializedRef.current) return

    try {
      // Configure WebGazer with optimal settings
      // First check if the API structure exists before setting properties
      if (window.webgazer.params) {
        // Set basic parameters - show video but hide other elements
        window.webgazer.params.showVideo = true // Always show video
        window.webgazer.params.showFaceOverlay = true // Show face overlay for better feedback
        window.webgazer.params.showFaceFeedbackBox = true // Show feedback box
        window.webgazer.params.showGazeDot = false // Don't show the gaze dot

        // Set camera constraints if supported
        if (window.webgazer.params.camConstraints) {
          window.webgazer.params.camConstraints = {
            video: {
              width: { min: 320, ideal: 640, max: 1280 },
              height: { min: 240, ideal: 480, max: 720 },
              facingMode: "user",
            },
          }
        }

        // The FACE_TRACKING_SCALE property might not exist in the current version
        // Only try to set it if sizeConstants exists
        if (window.webgazer.params.sizeConstants) {
          try {
            window.webgazer.params.sizeConstants.FACE_TRACKING_SCALE = 1.5
          } catch (e) {
            console.warn("Could not set FACE_TRACKING_SCALE, continuing without it:", e)
          }
        }
      }

      // Set regression model to ridge regression for better accuracy
      // Check if the method exists before calling it
      if (typeof window.webgazer.setRegression === "function") {
        window.webgazer.setRegression("ridge")
      }

      // Initialize WebGazer
      window.webgazer.begin()

      // Initially hide the video container until eye tracking is enabled
      const videoContainer = document.getElementById("webgazerVideoContainer")
      if (videoContainer) {
        videoContainer.style.display = "none"
      }

      // Temporarily pause tracking until calibration
      if (typeof window.webgazer.pause === "function") {
        window.webgazer.pause()
      }

      webgazerInitializedRef.current = true
      setIsInitialized(true)

      console.log("WebGazer initialized with optimal settings")
    } catch (error) {
      console.error("Error initializing WebGazer:", error)
      setCalibrationError("Failed to initialize eye tracking. Please ensure camera permissions are granted.")
    }
  }, [])

  // Initialize gaze indicator
  useEffect(() => {
    let indicator: HTMLDivElement | null = null

    if (typeof document !== "undefined" && !gazeIndicatorRef.current && !isCleanedUpRef.current) {
      indicator = document.createElement("div")
      indicator.id = "gaze-indicator"
      indicator.style.position = "fixed"
      indicator.style.width = "20px"
      indicator.style.height = "20px"
      indicator.style.borderRadius = "50%"
      indicator.style.backgroundColor = "rgba(0, 128, 128, 0.5)"
      indicator.style.border = "2px solid rgba(0, 128, 128, 0.8)"
      indicator.style.transform = "translate(-50%, -50%)"
      indicator.style.pointerEvents = "none"
      indicator.style.zIndex = "9999"
      indicator.style.display = "none"
      indicator.style.transition = "opacity 0.3s ease"
      document.body.appendChild(indicator)
      gazeIndicatorRef.current = indicator
    }

    return () => {
      // Only try to remove if the indicator exists and is still in the document
      if (indicator && document.body.contains(indicator) && !isCleanedUpRef.current) {
        try {
          document.body.removeChild(indicator)
        } catch (error) {
          console.error("Error removing gaze indicator:", error)
        }
      }
      // Clear the ref to prevent further access attempts
      gazeIndicatorRef.current = null
    }
  }, [])

  // Create eye tracking grid
  useEffect(() => {
    if (!isEnabled || isCleanedUpRef.current) return

    // Create grid container if it doesn't exist
    if (!eyeGridRef.current) {
      const grid = document.createElement("div")
      grid.id = "eye-tracking-grid"
      grid.style.position = "fixed"
      grid.style.top = "0"
      grid.style.left = "0"
      grid.style.width = "100%"
      grid.style.height = "100%"
      grid.style.pointerEvents = "none"
      grid.style.zIndex = "9990"
      grid.style.display = "grid"
      grid.style.gridTemplateColumns = "repeat(3, 1fr)"
      grid.style.gridTemplateRows = "repeat(3, 1fr)"
      grid.style.opacity = "0.1"
      grid.style.border = "1px solid rgba(0, 128, 128, 0.3)"

      // Create grid cells
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div")
        cell.style.border = "1px solid rgba(0, 128, 128, 0.3)"
        cell.dataset.gridIndex = i.toString()
        grid.appendChild(cell)
      }

      document.body.appendChild(grid)
      eyeGridRef.current = grid
    }

    return () => {
      // Remove grid when eye tracking is disabled
      if (eyeGridRef.current && document.body.contains(eyeGridRef.current)) {
        try {
          document.body.removeChild(eyeGridRef.current)
          eyeGridRef.current = null
        } catch (error) {
          console.error("Error removing eye tracking grid:", error)
        }
      }
    }
  }, [isEnabled])

  // Toggle gaze visualization
  const toggleGazeVisualization = useCallback(() => {
    setShowGaze((prev) => !prev)
  }, [])

  // Generate calibration points based on screen size with safe boundaries
  const generateCalibrationPoints = useCallback(() => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // Create a 3x3 grid of points covering the screen
    const points = []

    // Use a larger padding to keep points away from edges
    const padding = 0.15 // 15% padding from edges

    // Define the grid positions (3x3 grid)
    const positions = [
      { x: padding, y: padding }, // Top-left
      { x: 0.5, y: padding }, // Top-center
      { x: 1 - padding, y: padding }, // Top-right
      { x: padding, y: 0.5 }, // Middle-left
      { x: 0.5, y: 0.5 }, // Center
      { x: 1 - padding, y: 0.5 }, // Middle-right
      { x: padding, y: 1 - padding }, // Bottom-left
      { x: 0.5, y: 1 - padding }, // Bottom-center
      { x: 1 - padding, y: 1 - padding }, // Bottom-right
    ]

    // Convert relative positions to absolute pixel positions
    // and ensure they stay within safe boundaries
    positions.forEach((pos) => {
      // Calculate raw position
      const x = Math.round(pos.x * screenWidth)
      const y = Math.round(pos.y * screenHeight)

      // Apply boundary checks
      const safeX = Math.max(Math.min(x, screenWidth - 50), 50)
      const safeY = Math.max(Math.min(y, screenHeight - 50), 50)

      points.push({
        x: safeX,
        y: safeY,
      })
    })

    setCalibrationPoints(points)
    return points
  }, [])

  // Check if face is detected
  const checkFaceDetection = useCallback(() => {
    if (!window.webgazer || isCleanedUpRef.current) return

    try {
      // Resume WebGazer temporarily to check face detection
      if (typeof window.webgazer.resume === "function") {
        window.webgazer.resume()
      }

      // Set up a temporary listener to check if face is detected
      const checkFaceInterval = setInterval(() => {
        if (isCleanedUpRef.current) {
          clearInterval(checkFaceInterval)
          return
        }

        // Check if getCurrentPrediction method exists
        if (typeof window.webgazer.getCurrentPrediction === "function") {
          const currentGaze = window.webgazer.getCurrentPrediction()
          if (currentGaze && currentGaze.x !== null && currentGaze.y !== null) {
            // Face detected
            setEyeDetected(true)
            clearInterval(checkFaceInterval)

            // Move to calibration step
            setCalibrationStep(1)
          }
        } else {
          // If getCurrentPrediction doesn't exist, try getTracker
          if (typeof window.webgazer.getTracker === "function") {
            const tracker = window.webgazer.getTracker()
            if (tracker && tracker.getPositions && tracker.getPositions().length > 0) {
              // Face detected
              setEyeDetected(true)
              clearInterval(checkFaceInterval)

              // Move to calibration step
              setCalibrationStep(1)
            }
          } else {
            // If neither method exists, assume face is detected after a delay
            // This is a fallback for compatibility
            setTimeout(() => {
              if (!isCleanedUpRef.current) {
                setEyeDetected(true)
                clearInterval(checkFaceInterval)
                setCalibrationStep(1)
              }
            }, 3000)
          }
        }
      }, 500)

      // Timeout after 10 seconds if face not detected
      setTimeout(() => {
        if (!eyeDetected && !isCleanedUpRef.current) {
          clearInterval(checkFaceInterval)
          setCalibrationError("Could not detect your face. Please ensure good lighting and that your face is visible.")
        }
      }, 10000)
    } catch (error) {
      console.error("Error checking face detection:", error)
      setCalibrationError("Error detecting face. Please ensure camera permissions are granted.")
    }
  }, [eyeDetected])

  // Start calibration process
  const startCalibration = useCallback(() => {
    if (!isInitialized || !window.webgazer || !webgazerInitializedRef.current) {
      setCalibrationError("Eye tracking not initialized. Please refresh and try again.")
      return
    }

    try {
      // Reset calibration data
      if (typeof window.webgazer.clearData === "function") {
        window.webgazer.clearData()
      }

      // Show the video feed for calibration
      if (window.webgazer.params) {
        window.webgazer.params.showVideo = true
        window.webgazer.params.showFaceOverlay = true
        window.webgazer.params.showFaceFeedbackBox = true
      }

      // Make sure video container is visible
      const videoContainer = document.getElementById("webgazerVideoContainer")
      if (videoContainer) {
        videoContainer.style.display = "block"
      }

      // Reset calibration state
      setCalibrationStep(0)
      setCalibrationPointsCollected(0)
      setCalibrationQuality(0)
      calibrationAccuracyRef.current = []

      // Generate calibration points
      generateCalibrationPoints()

      // Show the calibration modal
      setIsCalibrating(true)
      setShowCalibrationModal(true)

      // Start face detection check
      checkFaceDetection()
    } catch (error) {
      console.error("Error starting calibration:", error)
      setCalibrationError("Failed to start calibration. Please try again.")
      setIsCalibrating(false)
      setShowCalibrationModal(false)
    }
  }, [isInitialized, generateCalibrationPoints, checkFaceDetection])

  // Handle calibration point click
  const handleCalibrationPointClick = useCallback(
    (x: number, y: number) => {
      if (!window.webgazer || isCleanedUpRef.current) return

      try {
        // Check if recordScreenPosition method exists
        if (typeof window.webgazer.recordScreenPosition === "function") {
          // Add click data to train the model
          window.webgazer.recordScreenPosition(x, y, "click")

          // Collect multiple samples at this point for better accuracy
          for (let i = 0; i < 5; i++) {
            window.webgazer.recordScreenPosition(x + Math.random() * 6 - 3, y + Math.random() * 6 - 3, "click")
          }
        } else {
          // Alternative method for newer versions
          if (typeof window.webgazer.addMouseEventListeners === "function") {
            // Simulate mouse events at the calibration point
            const mockEvent = new MouseEvent("click", {
              clientX: x,
              clientY: y,
              bubbles: true,
              cancelable: true,
              view: window,
            })

            // Dispatch the event to let WebGazer capture it
            document.dispatchEvent(mockEvent)
          }
        }

        // Update calibration progress
        setCalibrationPointsCollected((prev) => prev + 1)

        // Check accuracy after each point
        if (typeof window.webgazer.getCurrentPrediction === "function") {
          const prediction = window.webgazer.getCurrentPrediction()
          if (prediction && prediction.x !== null && prediction.y !== null) {
            const distance = Math.sqrt(Math.pow(prediction.x - x, 2) + Math.pow(prediction.y - y, 2))

            // Calculate accuracy as percentage (closer is better)
            const maxDistance = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2))

            const accuracy = Math.max(0, 100 - (distance / maxDistance) * 100)
            calibrationAccuracyRef.current.push(accuracy)

            // Update overall calibration quality
            const avgAccuracy =
              calibrationAccuracyRef.current.reduce((a, b) => a + b, 0) / calibrationAccuracyRef.current.length
            setCalibrationQuality(Math.round(avgAccuracy))
          }
        } else {
          // If we can't measure accuracy, use a simulated increasing value
          const simulatedAccuracy = 50 + (calibrationPointsCollected / calibrationPoints.length) * 40
          setCalibrationQuality(Math.round(simulatedAccuracy))
        }
      } catch (error) {
        console.error("Error during calibration point click:", error)
      }
    },
    [calibrationPoints.length],
  )

  // Add functions to handle calibration completion and cancellation
  const handleCalibrationComplete = useCallback(() => {
    if (!window.webgazer || isCleanedUpRef.current) return

    try {
      // Resume WebGazer with the trained model
      if (typeof window.webgazer.resume === "function") {
        window.webgazer.resume()
      }

      // Keep the video feed visible but hide overlays
      if (window.webgazer.params) {
        window.webgazer.params.showVideo = true // Keep video visible
        window.webgazer.params.showFaceOverlay = true // Keep face overlay
        window.webgazer.params.showFaceFeedbackBox = false // Hide feedback box
      }

      // Set up the gaze listener if the method exists
      if (typeof window.webgazer.setGazeListener === "function") {
        window.webgazer.setGazeListener((data: any) => {
          if (data == null || isCleanedUpRef.current) return

          // Apply smoothing to reduce jitter
          if (gazeRef.current) {
            // Simple exponential smoothing
            const alpha = 0.3 // Smoothing factor (0-1)
            data.x = alpha * data.x + (1 - alpha) * gazeRef.current.x
            data.y = alpha * data.y + (1 - alpha) * gazeRef.current.y
          }

          // Update gaze position
          gazeRef.current = { x: data.x, y: data.y }

          // Update gaze indicator position
          if (gazeIndicatorRef.current && showGaze) {
            gazeIndicatorRef.current.style.display = "block"
            gazeIndicatorRef.current.style.left = `${data.x}px`
            gazeIndicatorRef.current.style.top = `${data.y}px`

            // Adjust opacity based on prediction confidence
            const confidence = data.confidence || 0.5
            gazeIndicatorRef.current.style.opacity = `${Math.min(confidence + 0.3, 1)}`
          }

          // Highlight the grid cell being looked at
          if (eyeGridRef.current) {
            // Calculate which grid cell the gaze is in
            const gridIndex = getGridCellFromCoordinates(data.x, data.y)

            // Reset all cells
            Array.from(eyeGridRef.current.children).forEach((cell: Element) => {
              ;(cell as HTMLElement).style.backgroundColor = "transparent"
            })

            // Highlight the current cell
            if (gridIndex >= 0 && gridIndex < eyeGridRef.current.children.length) {
              const cell = eyeGridRef.current.children[gridIndex] as HTMLElement
              cell.style.backgroundColor = "rgba(0, 128, 128, 0.2)"
            }
          }
        })
      } else {
        // Alternative approach for newer versions
        // Set up a polling mechanism to get gaze data
        const gazePollingInterval = setInterval(() => {
          if (isCleanedUpRef.current) {
            clearInterval(gazePollingInterval)
            return
          }

          if (typeof window.webgazer.getCurrentPrediction === "function") {
            const prediction = window.webgazer.getCurrentPrediction()
            if (prediction && prediction.x !== null && prediction.y !== null) {
              // Apply smoothing to reduce jitter
              if (gazeRef.current) {
                // Simple exponential smoothing
                const alpha = 0.3 // Smoothing factor (0-1)
                prediction.x = alpha * prediction.x + (1 - alpha) * gazeRef.current.x
                prediction.y = alpha * prediction.y + (1 - alpha) * gazeRef.current.y
              }

              // Update gaze position
              gazeRef.current = { x: prediction.x, y: prediction.y }

              // Update gaze indicator position
              if (gazeIndicatorRef.current && showGaze) {
                gazeIndicatorRef.current.style.display = "block"
                gazeIndicatorRef.current.style.left = `${prediction.x}px`
                gazeIndicatorRef.current.style.top = `${prediction.y}px`
              }

              // Highlight the grid cell being looked at
              if (eyeGridRef.current) {
                // Calculate which grid cell the gaze is in
                const gridIndex = getGridCellFromCoordinates(prediction.x, prediction.y)

                // Reset all cells
                Array.from(eyeGridRef.current.children).forEach((cell: Element) => {
                  ;(cell as HTMLElement).style.backgroundColor = "transparent"
                })

                // Highlight the current cell
                if (gridIndex >= 0 && gridIndex < eyeGridRef.current.children.length) {
                  const cell = eyeGridRef.current.children[gridIndex] as HTMLElement
                  cell.style.backgroundColor = "rgba(0, 128, 128, 0.2)"
                }
              }
            }
          }
        }, 50) // Poll every 50ms for smooth updates
      }

      // Close calibration modal
      setIsCalibrating(false)
      setShowCalibrationModal(false)

      // Enable eye tracking
      setIsEnabled(true)

      console.log("Calibration complete with quality:", calibrationQuality)
    } catch (error) {
      console.error("Error completing calibration:", error)
      setCalibrationError("Error completing calibration. Please try again.")
      setIsCalibrating(false)
      setShowCalibrationModal(false)
    }
  }, [calibrationQuality, showGaze])

  // Helper function to determine which grid cell the gaze is in
  const getGridCellFromCoordinates = (x: number, y: number): number => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // Calculate the column (0, 1, or 2)
    const col = Math.min(Math.floor(x / (screenWidth / 3)), 2)

    // Calculate the row (0, 1, or 2)
    const row = Math.min(Math.floor(y / (screenHeight / 3)), 2)

    // Convert to grid index (0-8)
    return row * 3 + col
  }

  const handleCalibrationCancel = useCallback(() => {
    if (window.webgazer) {
      try {
        if (typeof window.webgazer.pause === "function") {
          window.webgazer.pause()
        }
      } catch (error) {
        console.error("Error pausing webgazer:", error)
      }
    }

    setIsCalibrating(false)
    setShowCalibrationModal(false)
    setCalibrationError(null)

    // If this was the initial calibration, disable eye tracking
    if (!isEnabled) {
      setIsEnabled(false)
    }
  }, [isEnabled])

  // Toggle eye tracking
  const toggleEyeTracking = useCallback(() => {
    if (!isInitialized || !window.webgazer || !webgazerInitializedRef.current) {
      console.error("WebGazer not initialized")
      return
    }

    if (!isEnabled) {
      // Start calibration to enable eye tracking
      startCalibration()
    } else {
      try {
        // Disable eye tracking
        if (typeof window.webgazer.pause === "function") {
          window.webgazer.pause()
        }

        // Hide gaze indicator
        if (gazeIndicatorRef.current) {
          gazeIndicatorRef.current.style.display = "none"
        }

        setIsEnabled(false)
      } catch (error) {
        console.error("Error disabling eye tracking:", error)
      }
    }
  }, [isInitialized, isEnabled, startCalibration])

  // Effect to handle dwell-based clicking
  useEffect(() => {
    if (!isEnabled) return

    const checkGazeTarget = () => {
      if (!gazeRef.current || isCleanedUpRef.current) return

      // Get element at current gaze position
      const { x, y } = gazeRef.current
      const element = document.elementFromPoint(x, y)

      // Check if element is clickable
      const isClickable =
        element &&
        (element.tagName === "BUTTON" ||
          element.tagName === "A" ||
          element.closest("button") ||
          element.closest("a") ||
          element.getAttribute("role") === "button" ||
          element.classList.contains("clickable"))

      if (isClickable) {
        // Add visual feedback for hovering on clickable element
        if (element !== lastElementRef.current) {
          // Looking at a new element
          lastElementRef.current = element
          dwellStartTimeRef.current = Date.now()

          // Add hover effect
          try {
            element.classList.add("eye-tracking-hover")
          } catch (error) {
            // Ignore errors for elements that don't support classList
          }
        } else {
          // Still looking at the same element
          if (dwellStartTimeRef.current === null) {
            dwellStartTimeRef.current = Date.now()
          }
          // If we've been looking long enough
          else if (Date.now() - dwellStartTimeRef.current >= dwellTime) {
            // Click the element
            element.click()

            // Add visual feedback
            try {
              const feedback = document.createElement("div")
              feedback.style.position = "fixed"
              feedback.style.left = `${x}px`
              feedback.style.top = `${y}px`
              feedback.style.width = "50px"
              feedback.style.height = "50px"
              feedback.style.borderRadius = "50%"
              feedback.style.backgroundColor = "rgba(0, 128, 128, 0.3)"
              feedback.style.transform = "translate(-50%, -50%) scale(0)"
              feedback.style.transition = "transform 0.3s ease-out"
              feedback.style.zIndex = "9998"
              document.body.appendChild(feedback)

              // Animate and remove
              setTimeout(() => {
                feedback.style.transform = "translate(-50%, -50%) scale(1)"
                setTimeout(() => {
                  // Check if the element is still in the document before removing
                  if (document.body.contains(feedback) && !isCleanedUpRef.current) {
                    document.body.removeChild(feedback)
                  }
                }, 300)
              }, 10)
            } catch (error) {
              console.error("Error with click feedback:", error)
            }

            // Reset dwell timer
            dwellStartTimeRef.current = null
          }
        }
      } else {
        // Remove hover effect from previous element
        if (lastElementRef.current) {
          try {
            lastElementRef.current.classList.remove("eye-tracking-hover")
          } catch (error) {
            // Ignore errors for elements that don't support classList
          }
        }

        // Not looking at a clickable element
        lastElementRef.current = null
        dwellStartTimeRef.current = null
      }
    }

    // Check gaze target every 100ms
    const intervalId = setInterval(checkGazeTarget, 100)

    // Add global styles for eye tracking hover effect
    const styleElement = document.createElement("style")
    styleElement.textContent = `
      .eye-tracking-hover {
        outline: 2px solid rgba(20, 184, 166, 0.6) !important;
        box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.3) !important;
        transition: all 0.2s ease !important;
      }
    `
    document.head.appendChild(styleElement)

    return () => {
      clearInterval(intervalId)
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement)
      }
    }
  }, [isEnabled, dwellTime])

  // Update gaze indicator visibility when showGaze changes
  useEffect(() => {
    if (gazeIndicatorRef.current && !isCleanedUpRef.current) {
      gazeIndicatorRef.current.style.display = isEnabled && showGaze ? "block" : "none"
    }
  }, [isEnabled, showGaze])

  return {
    isEnabled,
    toggleEyeTracking,
    isCalibrating,
    startCalibration,
    dwellTime,
    setDwellTime,
    showGaze,
    toggleGazeVisualization,
    showCalibrationModal,
    handleCalibrationComplete,
    handleCalibrationCancel,
    calibrationStep,
    eyeDetected,
    calibrationPoints,
    calibrationPointsCollected,
    handleCalibrationPointClick,
    calibrationQuality,
    calibrationError,
    setCalibrationError,
  }
}
