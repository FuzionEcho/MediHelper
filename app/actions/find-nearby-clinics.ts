"use server"

import { geocodeAddress } from "./geocode-address"

// Define the clinic type
export interface Clinic {
  id: string
  name: string
  address: string
  distance?: number // in miles
  specialties: string[]
  phone: string
  availableServices: string[]
}

// Mock database of clinics with coordinates
const clinicDatabase: (Clinic & { lat: number; lng: number })[] = [
  {
    id: "memorial",
    name: "Memorial Hospital",
    address: "123 Healthcare Ave, Medical City, MC 12345",
    lat: 40.7128,
    lng: -74.006,
    specialties: ["General Medicine", "Cardiology", "Orthopedics"],
    phone: "(555) 123-4567",
    availableServices: ["Check-ups", "Vaccinations", "Lab Tests"],
  },
  {
    id: "community",
    name: "Community Health Center",
    address: "456 Wellness Blvd, Healthville, HV 67890",
    lat: 40.7282,
    lng: -73.9942,
    specialties: ["Family Medicine", "Pediatrics", "Mental Health"],
    phone: "(555) 234-5678",
    availableServices: ["Check-ups", "Counseling", "Preventive Care"],
  },
  {
    id: "family",
    name: "Family Medical Group",
    address: "789 Care Street, Doctortown, DT 54321",
    lat: 40.7023,
    lng: -74.0128,
    specialties: ["Family Medicine", "Internal Medicine", "Geriatrics"],
    phone: "(555) 345-6789",
    availableServices: ["Check-ups", "Chronic Disease Management", "Wellness Exams"],
  },
  {
    id: "urgent",
    name: "Urgent Care Center",
    address: "321 Emergency Road, Quickhelp, QH 98765",
    lat: 40.7389,
    lng: -73.9867,
    specialties: ["Urgent Care", "Minor Injuries", "Illness Treatment"],
    phone: "(555) 456-7890",
    availableServices: ["Walk-in Care", "X-rays", "Minor Procedures"],
  },
  {
    id: "pediatric",
    name: "Children's Wellness Clinic",
    address: "555 Kid's Way, Youngtown, YT 45678",
    lat: 40.7423,
    lng: -74.0231,
    specialties: ["Pediatrics", "Child Development", "Adolescent Medicine"],
    phone: "(555) 567-8901",
    availableServices: ["Well-child Visits", "Vaccinations", "Growth Monitoring"],
  },
  {
    id: "womens",
    name: "Women's Health Center",
    address: "777 Ladies Lane, Femcare, FC 34567",
    lat: 40.6892,
    lng: -73.9821,
    specialties: ["OB/GYN", "Women's Health", "Reproductive Medicine"],
    phone: "(555) 678-9012",
    availableServices: ["Annual Exams", "Prenatal Care", "Mammograms"],
  },
  {
    id: "senior",
    name: "Senior Care Specialists",
    address: "888 Elder Street, Wisetown, WT 23456",
    lat: 40.7531,
    lng: -74.0182,
    specialties: ["Geriatrics", "Chronic Disease Management", "Preventive Care"],
    phone: "(555) 789-0123",
    availableServices: ["Medicare Wellness Visits", "Medication Management", "Chronic Care"],
  },
  {
    id: "specialty",
    name: "Specialty Medical Center",
    address: "999 Expert Avenue, Specialville, SV 12345",
    lat: 40.7182,
    lng: -73.9568,
    specialties: ["Cardiology", "Neurology", "Endocrinology", "Dermatology"],
    phone: "(555) 890-1234",
    availableServices: ["Specialist Consultations", "Advanced Diagnostics", "Treatment Plans"],
  },
]

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Number.parseFloat(distance.toFixed(1)) // Round to 1 decimal place
}

export async function findNearbyClinics(userLocation: { lat: number; lng: number } | string) {
  try {
    let userCoordinates: { lat: number; lng: number }

    // If userLocation is a string (address), geocode it to get coordinates
    if (typeof userLocation === "string") {
      const geocodeResult = await geocodeAddress(userLocation)
      if (!geocodeResult.success) {
        throw new Error(geocodeResult.error || "Failed to geocode address")
      }
      userCoordinates = geocodeResult.data.location
    } else {
      userCoordinates = userLocation
    }

    // Calculate distance for each clinic and sort by proximity
    const clinicsWithDistance = clinicDatabase.map((clinic) => {
      const distance = calculateDistance(userCoordinates.lat, userCoordinates.lng, clinic.lat, clinic.lng)

      // Return clinic with distance but without lat/lng (don't expose coordinates to client)
      const { lat, lng, ...clinicWithoutCoords } = clinic
      return {
        ...clinicWithoutCoords,
        distance,
      }
    })

    // Sort by distance (closest first)
    const sortedClinics = clinicsWithDistance.sort((a, b) => a.distance! - b.distance!)

    return {
      success: true,
      clinics: sortedClinics,
    }
  } catch (error) {
    console.error("Error finding nearby clinics:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      clinics: [],
    }
  }
}
