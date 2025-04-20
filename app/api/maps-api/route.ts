import { NextResponse } from "next/server"

export async function GET() {
  // We no longer expose the API key to the client
  // Instead, we just indicate whether Maps functionality is available

  // Check if the API key exists on the server
  const apiKeyConfigured = !!process.env.GOOGLE_MAPS_API_KEY

  if (!apiKeyConfigured) {
    // Return a JavaScript error instead of HTML
    return new NextResponse(
      `console.warn("Google Maps API key is not configured");
     window.googleMapsApiKeyMissing = true;`,
      {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store, max-age=0",
        },
        status: 200, // Return 200 even for missing key to avoid fetch errors
      },
    )
  }

  // Return a script that indicates Google Maps is available
  return new NextResponse(
    `window.googleMapsApiKeyMissing = false;
   console.log("Google Maps API is available");`,
    {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}
