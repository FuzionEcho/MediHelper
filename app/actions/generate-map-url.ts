"use server"

/**
 * Generates a Google Maps static map URL without exposing the API key to the client
 */
export async function generateMapUrl(
  latitude: number,
  longitude: number,
  markerColor = "red",
  zoom = 15,
  width = 600,
  height = 300,
) {
  try {
    // Get the API key from server-side environment variables
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error: "Google Maps API key is not configured",
      }
    }

    // Create a proxy URL that doesn't expose the API key
    // This URL will be returned to the client
    const proxyUrl = `/api/maps-image?lat=${latitude}&lng=${longitude}&color=${markerColor}&zoom=${zoom}&width=${width}&height=${height}`

    return {
      success: true,
      mapUrl: proxyUrl,
    }
  } catch (error) {
    console.error("Error generating map URL:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
