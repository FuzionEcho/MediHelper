/**
 * Utility function to load Google Maps API scripts
 */
export async function loadGoogleMapsApi(callback = "initMap"): Promise<boolean> {
  if (typeof window === "undefined") return false

  // If Google Maps is already loaded, return true
  if (window.google?.maps) {
    return true
  }

  try {
    // Create a script element
    const script = document.createElement("script")
    script.id = "google-maps-script"

    // Use our server-side proxy instead of directly using the API key
    script.src = `/api/maps-proxy?callback=${callback}`
    script.async = true
    script.defer = true
    script.type = "text/javascript"

    // Create a promise that resolves when the script loads
    const loadPromise = new Promise<boolean>((resolve, reject) => {
      script.onload = () => resolve(true)
      script.onerror = (error) => {
        console.error("Error loading Google Maps API:", error)
        window.googleMapsApiKeyMissing = true
        reject(error)
      }
    })

    // Add the script to the document
    document.head.appendChild(script)

    // Wait for the script to load
    return await loadPromise
  } catch (error) {
    console.error("Error loading Google Maps API:", error)
    window.googleMapsApiKeyMissing = true
    return false
  }
}
