import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get the API key from environment variables (server-side only)
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return new NextResponse(
      `console.warn("Google Maps API key is not configured");
     window.googleMapsApiKeyMissing = true;
     if (typeof window.mapsCallback === 'function') {
       try { window.mapsCallback(); } catch(e) { console.error(e); }
     }`,
      {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  }

  // Get the callback parameter
  const { searchParams } = new URL(request.url)
  const callback = searchParams.get("callback") || "mapsCallback"

  // Fetch the Google Maps script with our API key
  try {
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callback}&v=weekly`
    const response = await fetch(googleMapsUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Maps API: ${response.statusText}`)
    }

    const scriptContent = await response.text()

    return new NextResponse(scriptContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error fetching Google Maps API:", error)
    return new NextResponse(
      `console.error("Failed to load Google Maps API");
     window.googleMapsApiKeyMissing = true;
     if (typeof window.${callback} === 'function') {
       try { window.${callback}(); } catch(e) { console.error(e); }
     }`,
      {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  }
}
