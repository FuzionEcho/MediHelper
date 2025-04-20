"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle, Check, Loader2, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { addAppointmentToCalendar } from "@/app/actions/calendar-integration"
import { addMinutes } from "date-fns"

interface CalendarIntegrationProps {
  appointmentData: {
    date: Date
    time: string
    provider: string
    appointmentType: string
    location: string
  }
}

export function CalendarIntegration({ appointmentData }: CalendarIntegrationProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    eventLink?: string
  } | null>(null)

  // Parse time string to get hours and minutes
  const parseTimeString = (timeStr: string) => {
    const [time, period] = timeStr.split(" ")
    const [hours, minutes] = time.split(":").map(Number)

    let hour24 = hours
    if (period === "PM" && hours < 12) hour24 += 12
    if (period === "AM" && hours === 12) hour24 = 0

    return { hours: hour24, minutes }
  }

  // Create a Date object for the appointment time
  const getAppointmentDateTime = () => {
    const { hours, minutes } = parseTimeString(appointmentData.time)
    const appointmentDate = new Date(appointmentData.date)
    appointmentDate.setHours(hours, minutes, 0, 0)
    return appointmentDate
  }

  const handleAddToCalendar = async () => {
    setIsAdding(true)

    try {
      const startTime = getAppointmentDateTime()
      const endTime = addMinutes(startTime, 60) // Assume 1 hour appointment

      // Create appointment title and description
      const title = `Medical Appointment: ${appointmentData.appointmentType}`
      const description = `Appointment at ${appointmentData.provider}\nType: ${appointmentData.appointmentType}`

      // Generate Google Calendar link
      const calendarResult = await addAppointmentToCalendar({
        title,
        description,
        location: appointmentData.location,
        startTime,
        endTime,
      })

      setResult(calendarResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {result?.success ? (
        <div className="space-y-3">
          <Alert variant="success" className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Calendar Link Ready</AlertTitle>
            <AlertDescription>
              Click the button below to add this appointment to your Google Calendar.
              {result.eventLink && (
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <a href={result.eventLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add to Google Calendar
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <Button onClick={handleAddToCalendar} disabled={isAdding} className="w-full">
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Calendar Link...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Add to Calendar
            </>
          )}
        </Button>
      )}

      {result?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
