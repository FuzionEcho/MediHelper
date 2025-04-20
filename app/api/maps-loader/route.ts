import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Get the API key from environment variables
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  // Get the callback parameter from the URL
  const url = new URL(request.url)
  const callback = url.searchParams.get("callback") || "initMap"

  // If no API key, return a JavaScript error instead of redirecting
  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    return new NextResponse(
      `console.warn("Google Maps API key is not configured");
      window.googleMapsApiKeyMissing = true;
      // Try to call the callback function to prevent hanging UI
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

  // Create the Google Maps URL
  const googleMapsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callback}&v=weekly`

  // Instead of redirecting, fetch the script content and return it
  try {
    // Return a script that will load the Google Maps API
    return new NextResponse(
      `(function() {
        const script = document.createElement('script');
        script.src = "${googleMapsUrl}";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      })();`,
      {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("Error loading Google Maps API:", error)
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
