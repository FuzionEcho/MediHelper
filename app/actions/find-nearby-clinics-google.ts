"use server"

import { geocodeAddress } from "./geocode-address"

// Define the clinic type
export interface Clinic {
  id: string
  name: string
  address: string
  distance?: number // in miles
  specialties?: string[]
  phone?: string
  availableServices?: string[]
  rating?: number
  totalRatings?: number
  openNow?: boolean
  photoUrl?: string
  placeId: string
  vicinity: string
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Number.parseFloat(distance.toFixed(1)) // Round to 1 decimal place
}

// Map Google Place types to specialties
function mapPlaceTypesToSpecialties(types: string[]): string[] {
  const typeToSpecialty: Record<string, string> = {
    doctor: "General Medicine",
    dentist: "Dental Care",
    physiotherapist: "Physical Therapy",
    hospital: "Hospital Care",
    pharmacy: "Pharmacy Services",
    health: "Healthcare",
    veterinary_care: "Veterinary Medicine",
    beauty_salon: "Cosmetic Services",
    spa: "Wellness Services",
  }

  return types.map((type) => typeToSpecialty[type]).filter((specialty) => specialty !== undefined)
}

// Map Google Place types to available services
function mapPlaceTypesToServices(types: string[]): string[] {
  // Default services based on place types
  const services: string[] = ["Check-ups"]

  if (types.includes("hospital")) {
    services.push("Emergency Care", "Specialized Care")
  }

  if (types.includes("doctor")) {
    services.push("Consultations")
  }

  if (types.includes("pharmacy")) {
    services.push("Medication", "Prescriptions")
  }

  if (types.includes("dentist")) {
    services.push("Dental Exams", "Dental Procedures")
  }

  return services
}

export async function findNearbyClinicsGoogle(userLocation: { lat: number; lng: number } | string) {
  try {
    let userCoordinates: { lat: number; lng: number }

    // If userLocation is a string (address), geocode it to get coordinates
    if (typeof userLocation === "string") {
      const geocodeResult = await geocodeAddress(userLocation)
      if (!geocodeResult.success) {
        throw new Error(geocodeResult.error || "Failed to geocode address")
      }
      userCoordinates = geocodeResult.data.location
    } else {
      userCoordinates = userLocation
    }

    // Check if Google Maps API key is available
    if (typeof process.env.GOOGLE_MAPS_API_KEY !== "string" || !process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key is not configured")
    }

    // Call Google Places API to find nearby healthcare facilities
    const radius = 10000 // 10km radius
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userCoordinates.lat},${userCoordinates.lng}&radius=${radius}&type=health&keyword=clinic,hospital,doctor,medical&key=${process.env.GOOGLE_MAPS_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    // Transform Google Places results to our clinic format
    const clinics: Clinic[] = data.results.map((place: any) => {
      const distance = calculateDistance(
        userCoordinates.lat,
        userCoordinates.lng,
        place.geometry.location.lat,
        place.geometry.location.lng,
      )

      return {
        id: place.place_id,
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        vicinity: place.vicinity,
        distance,
        specialties: mapPlaceTypesToSpecialties(place.types),
        availableServices: mapPlaceTypesToServices(place.types),
        rating: place.rating,
        totalRatings: place.user_ratings_total,
        openNow: place.opening_hours?.open_now,
        photoUrl: place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
          : undefined,
      }
    })

    // Sort by distance (closest first)
    const sortedClinics = clinics.sort((a, b) => a.distance! - b.distance!)

    return {
      success: true,
      clinics: sortedClinics,
    }
  } catch (error) {
    console.error("Error finding nearby clinics:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      clinics: [],
    }
  }
}

// Function to get additional details for a specific place
export async function getClinicDetails(placeId: string) {
  try {
    // Check if Google Maps API key is available
    if (typeof process.env.GOOGLE_MAPS_API_KEY !== "string" || !process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key is not configured")
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,geometry&key=${process.env.GOOGLE_MAPS_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    const place = data.result

    return {
      success: true,
      details: {
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating,
        totalRatings: place.user_ratings_total,
        openingHours: place.opening_hours?.weekday_text,
        location: place.geometry?.location,
      },
    }
  } catch (error) {
    console.error("Error getting clinic details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
