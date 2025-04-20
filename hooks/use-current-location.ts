"use client"

import { useState, useEffect } from "react"

interface LocationState {
  loading: boolean
  error: string | null
  location: { lat: number; lng: number } | null
}

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    loading: true,
    error: null,
    location: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: "Geolocation is not supported by your browser",
        location: null,
      })
      return
    }

    const successHandler = (position: GeolocationPosition) => {
      setState({
        loading: false,
        error: null,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      })
    }

    const errorHandler = (error: GeolocationPositionError) => {
      setState({
        loading: false,
        error: error.message,
        location: null,
      })
    }

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })
  }, [])

  return state
}
