"use client"
import { Eye, EyeOff, Settings, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { useEyeTracking } from "@/hooks/use-eye-tracking"
import { CalibrationModal } from "@/components/accessibility/calibration-modal"
import { Badge } from "@/components/ui/badge"
import { EyeTrackingWebcam } from "@/components/accessibility/eye-tracking-webcam"

export function EyeTrackingToggle() {
  const {
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
  } = useEyeTracking()

  return (
    <>
      {/* Webcam component - always visible when eye tracking is enabled */}
      <EyeTrackingWebcam isEnabled={isEnabled} calibrationQuality={calibrationQuality} />

      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {isEnabled && (
          <>
            <Badge variant="outline" className="border-teal-200 bg-teal-100 text-teal-800">
              <BarChart className="mr-1 h-3 w-3" />
              {calibrationQuality}% Accuracy
            </Badge>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full bg-white shadow-md">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Eye tracking settings</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Eye Tracking Settings</h4>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-gaze" className="text-sm">
                        Show gaze indicator
                      </Label>
                      <Switch id="show-gaze" checked={showGaze} onCheckedChange={toggleGazeVisualization} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dwell-time" className="text-sm">
                          Dwell time (ms)
                        </Label>
                        <span className="text-xs text-gray-500">{dwellTime}ms</span>
                      </div>
                      <Slider
                        id="dwell-time"
                        min={500}
                        max={3000}
                        step={100}
                        value={[dwellTime]}
                        onValueChange={(value) => setDwellTime(value[0])}
                      />
                      <p className="text-xs text-gray-500">
                        How long you need to look at an element before clicking it
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            calibrationQuality >= 70
                              ? "bg-green-500"
                              : calibrationQuality >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        ></div>
                        <span className="text-sm">Calibration Quality: {calibrationQuality}%</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startCalibration}
                        disabled={isCalibrating}
                        className="w-full"
                      >
                        {isCalibrating ? "Calibrating..." : "Recalibrate"}
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        <Button
          onClick={toggleEyeTracking}
          variant={isEnabled ? "default" : "outline"}
          className={`rounded-full shadow-md ${isEnabled ? "bg-teal-600 hover:bg-teal-700 border border-teal-700" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}
        >
          {isEnabled ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Disable Eye Control
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Enable Eye Control
            </>
          )}
        </Button>
      </div>

      {/* Render the calibration modal when needed */}
      {showCalibrationModal && (
        <CalibrationModal
          onComplete={handleCalibrationComplete}
          onCancel={handleCalibrationCancel}
          calibrationStep={calibrationStep}
          eyeDetected={eyeDetected}
          calibrationPoints={calibrationPoints}
          calibrationPointsCollected={calibrationPointsCollected}
          onCalibrationPointClick={handleCalibrationPointClick}
          calibrationQuality={calibrationQuality}
          calibrationError={calibrationError}
          onCalibrationErrorClear={() => setCalibrationError(null)}
        />
      )}
    </>
  )
}
