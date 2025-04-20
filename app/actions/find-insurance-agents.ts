"use server"

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

interface FindInsuranceAgentsResult {
  success: boolean
  data?: InsuranceAgent[]
  error?: string
}

// Update the findInsuranceAgents function to specifically target health insurance
export async function findInsuranceAgents(
  location: { lat: number; lng: number } | string,
  radius = 5000,
): Promise<FindInsuranceAgentsResult> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      throw new Error("Google Maps API key is not configured")
    }

    // Determine if location is coordinates or a string (address/zip)
    let searchLocation: string
    if (typeof location === "string") {
      // If location is a string (address or zip), use it directly
      searchLocation = `&location=${encodeURIComponent(location)}`
    } else {
      // If location is coordinates, format as lat,lng
      searchLocation = `&location=${location.lat},${location.lng}`
    }

    // Build the Places API URL - modified to specifically target health insurance
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchLocation}&radius=${radius}&type=insurance_agency&keyword=health+insurance+medical+coverage&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Google Maps API request failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`)
    }

    // Transform the results into our InsuranceAgent format
    const agents: InsuranceAgent[] = data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      openNow: place.opening_hours?.open_now,
      location: place.geometry.location,
      photoUrl: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : undefined,
      types: place.types,
      // We'll calculate distance later if needed
    }))

    // Additional filtering to ensure we only get health insurance providers
    const healthInsuranceAgents = agents.filter((agent) => {
      const nameLC = agent.name.toLowerCase()
      const isHealthInsurance =
        nameLC.includes("health") ||
        nameLC.includes("medical") ||
        nameLC.includes("medicare") ||
        nameLC.includes("medicaid") ||
        nameLC.includes("blue cross") ||
        nameLC.includes("blue shield") ||
        nameLC.includes("aetna") ||
        nameLC.includes("cigna") ||
        nameLC.includes("humana") ||
        nameLC.includes("united health") ||
        nameLC.includes("kaiser") ||
        nameLC.includes("anthem")

      // Filter out known non-health insurance companies
      const isNotOtherInsurance =
        !nameLC.includes("auto") &&
        !nameLC.includes("car") &&
        !nameLC.includes("vehicle") &&
        !nameLC.includes("home") &&
        !nameLC.includes("property") &&
        !nameLC.includes("life") &&
        !nameLC.includes("casualty")

      return isHealthInsurance || isNotOtherInsurance
    })

    return {
      success: true,
      data: healthInsuranceAgents,
    }
  } catch (error) {
    console.error("Error finding insurance agents:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getPlaceDetails(placeId: string): Promise<any> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      throw new Error("Google Maps API key is not configured")
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,url&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Google Maps API request failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`)
    }

    return {
      success: true,
      data: data.result,
    }
  } catch (error) {
    console.error("Error getting place details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function geocodeAddress(address: string): Promise<any> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      throw new Error("Google Maps API key is not configured")
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Google Maps API request failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`)
    }

    return {
      success: true,
      data: {
        location: data.results[0].geometry.location,
        formattedAddress: data.results[0].formatted_address,
      },
    }
  } catch (error) {
    console.error("Error geocoding address:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
