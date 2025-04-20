import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get the API key from environment variables (server-side only)
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return new NextResponse(
      `console.warn("Google Maps API key is not configured");
     window.googleMapsApiKeyMissing = true;
     if (typeof window.initMap === 'function') {
       try { window.initMap(); } catch(e) { console.error(e); }
     }`,
      {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  }

  // Get the callback parameter and other query parameters
  const { searchParams } = new URL(request.url)
  const callback = searchParams.get("callback") || "initMap"

  // Create a client-side script that will load Google Maps without exposing the API key
  const script = `
   (function() {
     window.mapsCallback = function() {
       if (typeof window.${callback} === 'function') {
         try { 
           window.${callback}(); 
         } catch(e) { 
           console.error("Error in maps callback:", e); 
         }
       }
     };
     
     const script = document.createElement('script');
     script.src = "/api/maps-script?callback=mapsCallback";
     script.async = true;
     script.defer = true;
     document.head.appendChild(script);
     
     window.googleMapsLoaded = true;
   })();
 `

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
