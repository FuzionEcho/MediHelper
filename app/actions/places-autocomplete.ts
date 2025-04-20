"use server"

export async function getPlacePredictions(input: string) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      throw new Error("Google Maps API key is not configured")
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Google Maps API request failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`)
    }

    return {
      success: true,
      predictions: data.predictions.map((prediction: any) => ({
        placeId: prediction.place_id,
        description: prediction.description,
      })),
    }
  } catch (error) {
    console.error("Error getting place predictions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
