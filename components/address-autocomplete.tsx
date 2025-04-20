"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

// Declare google variable
declare global {
  interface Window {
    google?: any
    googleMapsApiKey?: string
    initMap: () => void
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter your address",
  className = "",
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  // Load Google Maps API
  useEffect(() => {
    let isMounted = true

    const loadMaps = async () => {
      if (typeof window === "undefined") return

      // Skip if already loaded
      if (window.google?.maps?.places) {
        setMapsLoaded(true)
        return
      }

      setIsLoading(true)

      try {
        // Use our server-side proxy to load Google Maps API
        const script = document.createElement("script")
        script.src = `/api/maps-proxy?callback=initMap`
        script.async = true
        script.defer = true

        // Define the callback
        window.initMap = () => {
          if (isMounted) {
            setMapsLoaded(true)
            setIsLoading(false)
          }
        }

        // Add error handling for the script
        script.onerror = () => {
          console.error("Failed to load Google Maps API")
          setLoadError(true)
          setIsLoading(false)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("Error loading Google Maps API:", error)
        if (isMounted) {
          setLoadError(true)
          setIsLoading(false)
        }
      }
    }

    loadMaps()

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize autocomplete when Maps API is loaded
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || !window.google?.maps?.places) return

    try {
      // Initialize the autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        fields: ["formatted_address", "address_components", "geometry"],
      })

      // Add listener for place changes
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace()
        if (place?.formatted_address) {
          onChange(place.formatted_address)
        }
      })
    } catch (error) {
      console.error("Error initializing Places Autocomplete:", error)
      setLoadError(true)
    }
  }, [mapsLoaded, onChange])

  // If Maps API failed to load, fall back to basic input
  if (loadError) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <MapPin className="h-5 w-5" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`pl-10 ${isFocused ? "ring-2 ring-teal-500" : ""} ${className}`}
          required={required}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`pl-10 ${isFocused ? "ring-2 ring-teal-500" : ""} ${className}`}
        required={required}
      />
    </div>
  )
}
