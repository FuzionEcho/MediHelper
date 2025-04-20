"use server"

import { revalidatePath } from "next/cache"

// Define the TransportationLog interface
interface TransportationLog {
  id: string
  createdAt: Date
  transportationData: TransportationData
  status: "scheduled" | "completed" | "canceled"
}

// This is a mock database for demonstration purposes
const transportationLogs: TransportationLog[] = []

// This is a partial update to the existing file
// We'll only modify the relevant parts to store coordinates

// Update the TransportationData interface
export interface TransportationData {
  appointmentDate: Date
  appointmentTime: string
  provider: string
  location: string
  pickupAddress: string
  transportType: string
  specialNeeds?: string
  pickupCoordinates?: { lat: number; lng: number }
  destinationCoordinates?: { lat: number; lng: number }
}

// Update the saveTransportation function to handle coordinates
export async function saveTransportation(data: TransportationData) {
  try {
    // Validate the request
    if (!data.appointmentDate || !data.appointmentTime || !data.provider || !data.pickupAddress) {
      return {
        success: false,
        error: "Missing required transportation data",
      }
    }

    // If coordinates aren't provided, try to geocode the addresses
    if (!data.pickupCoordinates && data.pickupAddress) {
      try {
        const { geocodeAddress } = await import("./geocode-address")
        const result = await geocodeAddress(data.pickupAddress)
        if (result.success && result.data) {
          data.pickupCoordinates = result.data.location
        }
      } catch (error) {
        console.error("Error geocoding pickup address:", error)
      }
    }

    if (!data.destinationCoordinates && data.location) {
      try {
        const { geocodeAddress } = await import("./geocode-address")
        const result = await geocodeAddress(data.location)
        if (result.success && result.data) {
          data.destinationCoordinates = result.data.location
        }
      } catch (error) {
        console.error("Error geocoding destination address:", error)
      }
    }

    // Generate a unique ID
    const id = `transport_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Create a new transportation log
    const newLog: TransportationLog = {
      id,
      createdAt: new Date(),
      transportationData: data,
      status: "scheduled", // Default status
    }

    // Save the transportation log (in a real app, this would save to a database)
    transportationLogs.push(newLog)

    // Revalidate the relevant pages
    revalidatePath("/dashboard")
    revalidatePath("/transportation")

    return {
      success: true,
      transportationId: id,
    }
  } catch (error) {
    console.error("Error saving transportation log:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets all transportation logs
 */
export async function getAllTransportationLogs() {
  try {
    // Sort transportation logs by creation date (newest first)
    const sortedLogs = [...transportationLogs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return {
      success: true,
      data: sortedLogs,
    }
  } catch (error) {
    console.error("Error getting transportation logs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Updates the status of a transportation log
 */
export async function updateTransportationStatus(id: string, status: "scheduled" | "completed" | "canceled") {
  try {
    const logIndex = transportationLogs.findIndex((log) => log.id === id)

    if (logIndex === -1) {
      return {
        success: false,
        error: "Transportation log not found",
      }
    }

    transportationLogs[logIndex] = {
      ...transportationLogs[logIndex],
      status,
    }

    revalidatePath("/transportation")
    revalidatePath("/dashboard")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error updating transportation status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
