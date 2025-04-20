"use client"

import { useState, useEffect } from "react"
import { Star, ExternalLink, Phone, MapPin, Clock, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPlaceDetails } from "@/app/actions/find-insurance-agents"

interface Location {
  lat: number
  lng: number
}

interface InsuranceAgent {
  id: string
  name: string
  address: string
  rating?: number
  totalRatings?: number
  phoneNumber?: string
  website?: string
  openNow?: boolean
  location: Location
  photoUrl?: string
  types: string[]
  distance?: number
}

interface AgentDetailsProps {
  agent: InsuranceAgent
  onClose: () => void
}

export function AgentDetails({ agent, onClose }: AgentDetailsProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getPlaceDetails(agent.id)

        if (result.success && result.data) {
          setDetails(result.data)
        } else {
          setError(result.error || "Failed to load details")
        }
      } catch (err) {
        console.error("Error fetching agent details:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [agent.id])

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-xl">{agent.name}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : (
          <>
            {agent.photoUrl && (
              <div className="w-full">
                <img
                  src={agent.photoUrl || "/placeholder.svg"}
                  alt={agent.name}
                  className="w-full h-48 object-cover rounded-md"
                />
              </div>
            )}

            <div className="space-y-3 bg-white dark:bg-gray-800">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p className="text-gray-600 dark:text-gray-300">{details?.formatted_address || agent.address}</p>
                </div>
              </div>

              {agent.rating !== undefined && (
                <div className="flex items-start gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Rating</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {agent.rating} out of 5{agent.totalRatings !== undefined && ` (${agent.totalRatings} reviews)`}
                    </p>
                  </div>
                </div>
              )}

              {(details?.formatted_phone_number || agent.phoneNumber) && (
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {details?.formatted_phone_number || agent.phoneNumber}
                    </p>
                  </div>
                </div>
              )}

              {(details?.website || agent.website) && (
                <div className="flex items-start gap-2">
                  <ExternalLink className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Website</h3>
                    <a
                      href={details?.website || agent.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:underline break-all"
                    >
                      {details?.website || agent.website}
                    </a>
                  </div>
                </div>
              )}

              {details?.opening_hours?.weekday_text && (
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Hours</h3>
                    <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
                      {details.opening_hours.weekday_text.map((day: string, index: number) => (
                        <li key={index}>{day}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
        {(details?.formatted_phone_number || agent.phoneNumber) && (
          <Button variant="outline" asChild className="bg-white dark:bg-gray-800">
            <a href={`tel:${details?.formatted_phone_number || agent.phoneNumber}`}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </a>
          </Button>
        )}

        {(details?.website || agent.website) && (
          <Button variant="outline" asChild className="bg-white dark:bg-gray-800">
            <a href={details?.website || agent.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Website
            </a>
          </Button>
        )}

        <Button asChild>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${agent.location.lat},${agent.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Get Directions
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
