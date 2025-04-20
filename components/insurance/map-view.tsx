"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { loadGoogleMapsApi } from "@/utils/load-google-maps"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// Define types for Google Maps objects
declare global {
  interface Window {
    google: any
    initMap: () => void
    googleMapsApiKey: string
    googleMapsApiKeyMissing: boolean
  }
}

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

interface MapViewProps {
  agents: InsuranceAgent[]
  center: Location
  onAgentSelect: (agent: InsuranceAgent) => void
  selectedAgentId?: string
}

export function MapView({ agents, center, onAgentSelect, selectedAgentId }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [infoWindow, setInfoWindow] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Define the initMap function on the window object
    window.initMap = () => {
      setScriptLoaded(true)
      setIsLoading(false)
    }

    // Load the Google Maps API
    loadGoogleMapsApi("initMap").catch((error) => {
      console.error("Failed to load Google Maps:", error)
      setError("Failed to load map. Please try again later.")
      setIsLoading(false)
    })

    return () => {
      // Clean up
      if (window.initMap) {
        // Keep the function but make it do nothing
        window.initMap = () => {
          console.log("initMap called after component unmounted")
        }
      }
    }
  }, [])

  // Initialize map when the script is loaded
  useEffect(() => {
    if (scriptLoaded && mapRef.current && !map && window.google?.maps) {
      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP,
          },
        })

        const infoWindowInstance = new window.google.maps.InfoWindow()

        setMap(mapInstance)
        setInfoWindow(infoWindowInstance)
        setMapLoaded(true)
      } catch (error) {
        console.error("Error initializing Google Maps:", error)
        setError("Error initializing map. Please try again later.")
      }
    }
  }, [scriptLoaded, center, map])

  // Add markers when map and agents are loaded
  useEffect(() => {
    if (map && agents.length > 0 && window.google?.maps) {
      // Clear existing markers
      markers.forEach((marker) => marker.setMap(null))

      // Create new markers
      const newMarkers = agents.map((agent) => {
        const marker = new window.google.maps.Marker({
          position: agent.location,
          map,
          title: agent.name,
          animation: agent.id === selectedAgentId ? window.google.maps.Animation.BOUNCE : undefined,
        })

        // Create info window content
        const content = `
         <div class="p-2 max-w-xs bg-white shadow-md rounded-md border border-gray-200">
           <h3 class="font-semibold text-base">${agent.name}</h3>
           <p class="text-sm text-gray-600">${agent.address}</p>
           ${
             agent.rating
               ? `<div class="flex items-center mt-1">
                   <span class="text-yellow-500">★</span>
                   <span class="text-sm ml-1">${agent.rating} (${agent.totalRatings || 0})</span>
                 </div>`
               : ""
           }
         </div>
       `

        // Add click event to marker
        marker.addListener("click", () => {
          if (infoWindow) {
            infoWindow.setContent(content)
            infoWindow.open(map, marker)
          }
          onAgentSelect(agent)
        })

        return marker
      })

      setMarkers(newMarkers)

      // Fit bounds to show all markers
      if (newMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        agents.forEach((agent) => {
          bounds.extend(agent.location)
        })
        map.fitBounds(bounds)

        // Don't zoom in too far
        const listener = window.google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom() > 16) map.setZoom(16)
          window.google.maps.event.removeListener(listener)
        })
      }
    }
  }, [map, agents, infoWindow, selectedAgentId, onAgentSelect, markers])

  // Update marker animation when selected agent changes
  useEffect(() => {
    if (markers.length > 0 && selectedAgentId && window.google?.maps) {
      markers.forEach((marker, index) => {
        if (agents[index].id === selectedAgentId) {
          marker.setAnimation(window.google.maps.Animation.BOUNCE)

          // Center map on selected marker
          if (map) {
            map.panTo(marker.getPosition())
          }

          // Open info window for selected marker
          if (infoWindow) {
            const agent = agents[index]
            const content = `
             <div class="p-2 max-w-xs bg-white shadow-md rounded-md border border-gray-200">
               <h3 class="font-semibold text-base">${agent.name}</h3>
               <p class="text-sm text-gray-600">${agent.address}</p>
               ${
                 agent.rating
                   ? `<div class="flex items-center mt-1">
                       <span class="text-yellow-500">★</span>
                       <span class="text-sm ml-1">${agent.rating} (${agent.totalRatings || 0})</span>
                     </div>`
                   : ""
               }
             </div>
           `
            infoWindow.setContent(content)
            infoWindow.open(map, marker)
          }
        } else {
          marker.setAnimation(null)
        }
      })
    }
  }, [selectedAgentId, markers, agents, map, infoWindow])

  // Function to retry loading the map
  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setRetryCount((prev) => prev + 1)
  }

  // Fallback UI when Google Maps API key is missing
  const renderMissingApiKeyFallback = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
      <Alert variant="warning" className="w-full max-w-md mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Google Maps API Key Missing</AlertTitle>
        <AlertDescription>
          The Google Maps API key is not configured. You can still view the list of insurance agents, but the map view
          is unavailable.
        </AlertDescription>
      </Alert>
      <div className="text-center">
        <p className="mb-4 text-gray-600">Please switch to the list view to see available insurance agents.</p>
      </div>
    </div>
  )

  return (
    <div className="relative h-[400px] md:h-[600px] w-full rounded-lg overflow-hidden border">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
          <Alert variant="destructive" className="w-full max-w-md mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="mt-4">
            Retry Loading Map
          </Button>
        </div>
      ) : window.googleMapsApiKeyMissing ? (
        renderMissingApiKeyFallback()
      ) : !mapLoaded && isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : null}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
