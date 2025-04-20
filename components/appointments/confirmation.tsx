"use client"

import { useState } from "react"
import { Check, CalendarIcon, Car, MapPin, Loader2, AlertCircle, ExternalLink, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format, addMinutes } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { addAppointmentToCalendar } from "@/app/actions/calendar-integration"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { geocodeAddress } from "@/app/actions/geocode-address"
import { generateMapUrl } from "@/app/actions/generate-map-url"
import { useEffect } from "react"

interface TransportDetails {
  pickupAddress: string
  transportType: string
  pickupCoordinates?: { lat: number; lng: number }
}

interface AppointmentData {
  date: Date
  time: string
  appointmentType: string
  provider: string
  location: string
  destinationCoordinates?: { lat: number; lng: number }
  transportNeeded: boolean
  transportDetails?: TransportDetails
}

interface AppointmentConfirmationProps {
  appointmentData: AppointmentData
  onReset: () => void
}

export function AppointmentConfirmation({ appointmentData, onReset }: AppointmentConfirmationProps) {
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false)
  const [calendarResult, setCalendarResult] = useState<{
    success: boolean
    error?: string
    eventLink?: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [isLoadingPickupMap, setIsLoadingPickupMap] = useState(false)
  const [isLoadingDestinationMap, setIsLoadingDestinationMap] = useState(false)
  const [pickupMapUrl, setPickupMapUrl] = useState<string | null>(null)
  const [destinationMapUrl, setDestinationMapUrl] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  // Format appointment type for display
  const getAppointmentTypeDisplay = (type: string) => {
    switch (type) {
      case "follow-up":
        return "Follow-up Visit"
      case "new":
        return "New Patient Consultation"
      case "specialist":
        return "Specialist Referral"
      case "procedure":
        return "Medical Procedure"
      case "test":
        return "Medical Test"
      default:
        return type
    }
  }

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

  // Load maps for pickup and destination locations
  useEffect(() => {
    const loadMaps = async () => {
      setMapError(null)

      // Check if Google Maps API key is available
      if (typeof window !== "undefined" && window.googleMapsApiKeyMissing) {
        setMapError("Google Maps API key is not configured. Map previews are unavailable.")
        return
      }

      // Load destination map
      if (appointmentData.location) {
        setIsLoadingDestinationMap(true)
        try {
          // If we already have coordinates, use them
          if (appointmentData.destinationCoordinates) {
            const { lat, lng } = appointmentData.destinationCoordinates
            const result = await generateMapUrl(lat, lng, "red")
            if (result.success) {
              setDestinationMapUrl(result.mapUrl)
            }
          } else {
            // Otherwise geocode the address
            const result = await geocodeAddress(appointmentData.location)
            if (result.success && result.data) {
              const { lat, lng } = result.data.location
              const mapResult = await generateMapUrl(lat, lng, "red")
              if (mapResult.success) {
                setDestinationMapUrl(mapResult.mapUrl)
              }
            }
          }
        } catch (error) {
          console.error("Error loading destination map:", error)
        } finally {
          setIsLoadingDestinationMap(false)
        }
      }

      // Load pickup map if transportation is needed
      if (appointmentData.transportNeeded && appointmentData.transportDetails?.pickupAddress) {
        setIsLoadingPickupMap(true)
        try {
          // If we already have coordinates, use them
          if (appointmentData.transportDetails.pickupCoordinates) {
            const { lat, lng } = appointmentData.transportDetails.pickupCoordinates
            const result = await generateMapUrl(lat, lng, "green")
            if (result.success) {
              setPickupMapUrl(result.mapUrl)
            }
          } else {
            // Otherwise geocode the address
            const result = await geocodeAddress(appointmentData.transportDetails.pickupAddress)
            if (result.success && result.data) {
              const { lat, lng } = result.data.location
              const mapResult = await generateMapUrl(lat, lng, "green")
              if (mapResult.success) {
                setPickupMapUrl(mapResult.mapUrl)
              }
            }
          }
        } catch (error) {
          console.error("Error loading pickup map:", error)
        } finally {
          setIsLoadingPickupMap(false)
        }
      }
    }

    loadMaps()
  }, [appointmentData])

  // Generate Google Calendar link
  const handleAddToCalendar = async () => {
    setIsAddingToCalendar(true)
    setCalendarResult(null)

    try {
      const startTime = getAppointmentDateTime()
      const endTime = addMinutes(startTime, 60) // Assume 1 hour appointment

      // Create appointment title and description
      const title = `Medical Appointment: ${getAppointmentTypeDisplay(appointmentData.appointmentType)}`
      let description = `Appointment at ${appointmentData.provider}
`
      description += `Type: ${getAppointmentTypeDisplay(appointmentData.appointmentType)}
`

      if (appointmentData.transportNeeded && appointmentData.transportDetails) {
        description += `
Transportation Details:
`
        description += `Pickup Address: ${appointmentData.transportDetails.pickupAddress}
`
        description += `Transport Type: ${appointmentData.transportDetails.transportType}
`
      }

      // Call the server action to generate a Google Calendar link
      const result = await addAppointmentToCalendar({
        title,
        description,
        location: appointmentData.location,
        startTime,
        endTime,
      })

      setCalendarResult({
        success: result.success,
        error: result.error,
        eventLink: result.eventLink,
      })
    } catch (error) {
      setCalendarResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsAddingToCalendar(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle>Appointment Confirmed!</CardTitle>
        <CardDescription>Your appointment has been successfully scheduled</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            {appointmentData.transportNeeded && <TabsTrigger value="transportation">Transportation</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {format(appointmentData.date, "EEEE, MMMM d, yyyy")} at {appointmentData.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Appointment Type</p>
                  <p className="font-medium">{getAppointmentTypeDisplay(appointmentData.appointmentType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <p className="font-medium">{appointmentData.provider}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p>{appointmentData.location}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-blue-50">
              <h3 className="mb-2 font-medium">Appointment Reminders</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-blue-200 text-center text-xs font-bold text-blue-700">
                    !
                  </span>
                  <span>Please arrive 15 minutes before your scheduled appointment time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-blue-200 text-center text-xs font-bold text-blue-700">
                    !
                  </span>
                  <span>Bring your insurance card and a valid photo ID.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-blue-200 text-center text-xs font-bold text-blue-700">
                    !
                  </span>
                  <span>Bring a list of current medications and any relevant medical records.</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4 pt-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-medium flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-500" />
                Appointment Location
              </h3>
              <p className="mb-3">{appointmentData.location}</p>

              {mapError ? (
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{mapError}</AlertDescription>
                </Alert>
              ) : isLoadingDestinationMap ? (
                <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : destinationMapUrl ? (
                <div className="relative">
                  <img
                    src={destinationMapUrl || "/placeholder.svg"}
                    alt="Map showing appointment location"
                    className="w-full h-[300px] object-cover rounded-md"
                  />
                  <div className="absolute bottom-3 right-3">
                    <Button asChild size="sm" className="bg-white text-black hover:bg-gray-100 shadow-md">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointmentData.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        Get Directions
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Map preview not available</p>
                </div>
              )}
            </div>
          </TabsContent>

          {appointmentData.transportNeeded && appointmentData.transportDetails && (
            <TabsContent value="transportation" className="space-y-4 pt-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  <Car className="h-5 w-5 text-teal-600" />
                  Transportation Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pickup Time</p>
                    <p className="font-medium">
                      {format(addMinutes(getAppointmentDateTime(), -45), "h:mm a")} (45 minutes before appointment)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Transportation Type</p>
                    <p className="font-medium">{appointmentData.transportDetails.transportType}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Pickup Address</p>
                    <p className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-green-500" />
                      {appointmentData.transportDetails.pickupAddress}
                    </p>
                  </div>
                </div>

                {mapError ? (
                  <Alert variant="warning" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{mapError}</AlertDescription>
                  </Alert>
                ) : isLoadingPickupMap ? (
                  <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : pickupMapUrl ? (
                  <div className="relative">
                    <img
                      src={pickupMapUrl || "/placeholder.svg"}
                      alt="Map showing pickup location"
                      className="w-full h-[300px] object-cover rounded-md"
                    />
                    <div className="absolute bottom-3 right-3">
                      <Button asChild size="sm" className="bg-white text-black hover:bg-gray-100 shadow-md">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointmentData.transportDetails.pickupAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          View on Map
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">Map preview not available</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {calendarResult && (
          <Alert
            variant={calendarResult.success ? "default" : "destructive"}
            className={calendarResult.success ? "bg-green-50 border-green-200" : ""}
          >
            <div className="flex items-center gap-2">
              {calendarResult.success ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{calendarResult.success ? "Calendar Link Ready" : "Calendar Error"}</AlertTitle>
            </div>
            <AlertDescription>
              {calendarResult.success
                ? "Click the button below to add this appointment to your Google Calendar."
                : calendarResult.error || "Failed to create calendar link."}

              {calendarResult.eventLink && (
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={calendarResult.eventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Add to Google Calendar
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 sm:flex-row">
        {!calendarResult?.success && (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleAddToCalendar}
            disabled={isAddingToCalendar}
          >
            {isAddingToCalendar ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Calendar Link...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Add to Google Calendar
              </>
            )}
          </Button>
        )}
        <Button className="w-full sm:w-auto" onClick={onReset}>
          Schedule Another Appointment
        </Button>
      </CardFooter>
    </Card>
  )
}
