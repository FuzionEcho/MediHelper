import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const color = searchParams.get("color") || "red"
  const zoom = searchParams.get("zoom") || "15"
  const width = searchParams.get("width") || "600"
  const height = searchParams.get("height") || "300"

  // Validate parameters
  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing required parameters: lat and lng" }, { status: 400 })
  }

  try {
    // Get the API key from server-side environment variables
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 })
    }

    // Construct the Google Maps Static API URL with the server-side API key
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=roadmap&markers=color:${color}%7C${lat},${lng}&key=${apiKey}`

    // Fetch the image from Google Maps API
    const response = await fetch(mapUrl)

    if (!response.ok) {
      throw new Error(`Google Maps API request failed: ${response.statusText}`)
    }

    // Get the image data
    const imageData = await response.arrayBuffer()

    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error("Error fetching map image:", error)
    return NextResponse.json({ error: "Failed to fetch map image" }, { status: 500 })
  }
}
