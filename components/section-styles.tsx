"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// This component dynamically loads section-specific CSS based on the current path
export function SectionStyles() {
  const pathname = usePathname()

  useEffect(() => {
    // Determine which section we're in based on the pathname
    let section = "dashboard" // Default section

    if (pathname.includes("/dashboard")) {
      section = "dashboard"
    } else if (pathname.includes("/insurance")) {
      section = "insurance"
    } else if (pathname.includes("/bills") || pathname.includes("/scan")) {
      section = "bills"
    } else if (pathname.includes("/appointments")) {
      section = "appointments"
    } else if (pathname.includes("/transportation")) {
      section = "transportation"
    } else if (pathname.includes("/settings")) {
      section = "settings"
    }

    // Instead of dynamically importing CSS modules (which causes issues),
    // we'll use a different approach by adding a data attribute to the body
    document.body.setAttribute("data-section", section)
  }, [pathname])

  return null // This component doesn't render anything
}
