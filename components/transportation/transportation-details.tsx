"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Car, Navigation, Loader2, AlertCircle } from "lucide-react"
import { format, addMinutes } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { geocodeAddress } from "@/app/actions/geocode-address"
import { generateMapUrl } from "@/app/actions/generate-map-url"

interface TransportationDetailsProps {
  transportation: any
  onClose: () => void
}

export function TransportationDetails({ transportation, onClose }: TransportationDetailsProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Load map for pickup location
  useEffect(() => {
    const loadMap = async () => {
      setMapError(null)

      // Check if Google Maps API key is available
      if (typeof window !== "undefined" && window.googleMapsApiKeyMissing) {
        setMapError("Google Maps API key is not configured. Map preview is unavailable.")
        return
      }

      if (transportation.transportationData.pickupAddress) {
        setIsLoadingMap(true)
        try {
          const result = await geocodeAddress(transportation.transportationData.pickupAddress)
          if (result.success && result.data) {
            const { lat, lng } = result.data.location
            const mapResult = await generateMapUrl(lat, lng, "green")
            if (mapResult.success) {
              setMapUrl(mapResult.mapUrl)
            }
          }
        } catch (error) {
          console.error("Error loading map:", error)
          setMapError("Failed to load map. Please check your internet connection.")
        } finally {
          setIsLoadingMap(false)
        }
      }
    }

    loadMap()
  }, [transportation])

  // Calculate pickup time (45 minutes before appointment)
  const getPickupTime = () => {
    const appointmentDate = new Date(transportation.transportationData.appointmentDate)
    const [time, period] = transportation.transportationData.appointmentTime.split(" ")
    const [hours, minutes] = time.split(":").map(Number)

    let hour24 = hours
    if (period === "PM" && hours < 12) hour24 += 12
    if (period === "AM" && hours === 12) hour24 = 0

    appointmentDate.setHours(hour24, minutes, 0, 0)
    return addMinutes(appointmentDate, -45)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Transportation Details</CardTitle>
          <Badge
            variant="outline"
            className={
              transportation.status === "scheduled"
                ? "bg-blue-100 text-blue-800 border-blue-200"
                : transportation.status === "completed"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {transportation.status.charAt(0).toUpperCase() + transportation.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Appointment</h3>
            <p className="font-medium">{transportation.transportationData.provider}</p>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1 text-red-500" />
              {transportation.transportationData.location}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
            <p className="font-medium">
              {format(new Date(transportation.transportationData.appointmentDate), "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-sm text-gray-500">Appointment: {transportation.transportationData.appointmentTime}</p>
            <p className="text-sm text-teal-600 font-medium">
              Pickup: {format(getPickupTime(), "h:mm a")} (45 min before)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Pickup Details</h3>
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Pickup Address</p>
              <p className="text-gray-600">{transportation.transportationData.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Car className="h-5 w-5 text-teal-600 mt-0.5" />
            <div>
              <p className="font-medium">Transportation Type</p>
              <p className="text-gray-600">{transportation.transportationData.transportType}</p>
            </div>
          </div>
          {transportation.transportationData.specialNeeds && (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Special Needs</p>
                <p className="text-gray-600">{transportation.transportationData.specialNeeds}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Pickup Location Map</h3>

          {mapError ? (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{mapError}</AlertDescription>
            </Alert>
          ) : isLoadingMap ? (
            <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : mapUrl ? (
            <div className="relative">
              <img
                src={mapUrl || "/placeholder.svg"}
                alt="Map showing pickup location"
                className="w-full h-[300px] object-cover rounded-md"
              />
              <div className="absolute bottom-3 right-3">
                <Button asChild size="sm" className="bg-white text-black hover:bg-gray-100 shadow-md">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(transportation.transportationData.pickupAddress)}`}
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

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </CardContent>
    </Card>
  )
}
