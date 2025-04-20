"use server"

export async function geocodeAddress(address: string) {
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
