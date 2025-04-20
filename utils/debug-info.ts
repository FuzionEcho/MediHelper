"use client"

export function logEnvironmentInfo() {
  if (typeof window === "undefined") return

  console.log("Environment Info:")
  console.log("- Next.js Environment:", process.env.NODE_ENV)
  console.log("- Window Location:", window.location.href)
  console.log("- User Agent:", navigator.userAgent)
  console.log("- Google Maps API Available:", !!window.google?.maps)
  console.log("- Public API Keys Configured:", {
    googleMaps: !!window.google?.maps,
  })

  // Check for common browser features
  console.log("- Browser Features:", {
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    geolocation: !!navigator.geolocation,
    camera: !!navigator.mediaDevices?.getUserMedia,
  })
}
