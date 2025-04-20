"use server"

import { revalidatePath } from "next/cache"

// Define the transportation data structure
export interface TransportationData {
  appointmentDate: Date
  appointmentTime: string
  provider: string
  location: string
  pickupAddress: string
  transportType: string
  specialNeeds?: string
}

// Define the transportation log structure
export interface TransportationLog {
  id: string
  createdAt: Date
  transportationData: TransportationData
  status: "scheduled" | "completed" | "canceled"
}

// In-memory storage for transportation logs (in a real app, this would be a database)
const transportationLogs: TransportationLog[] = []

/**
 * Saves a transportation log
 */
export async function saveTransportation(data: TransportationData) {
  try {
    // Validate the request
    if (!data.appointmentDate || !data.appointmentTime || !data.provider || !data.pickupAddress) {
      return {
        success: false,
        error: "Missing required transportation data",
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
    // Sort logs by appointment date (newest first)
    const sortedLogs = [...transportationLogs].sort(
      (a, b) =>
        new Date(b.transportationData.appointmentDate).getTime() -
        new Date(a.transportationData.appointmentDate).getTime(),
    )

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
 * Gets a transportation log by ID
 */
export async function getTransportationById(id: string) {
  try {
    const log = transportationLogs.find((l) => l.id === id)

    if (!log) {
      return {
        success: false,
        error: "Transportation log not found",
      }
    }

    return {
      success: true,
      data: log,
    }
  } catch (error) {
    console.error("Error getting transportation log:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Updates a transportation log status
 */
export async function updateTransportationStatus(id: string, status: "scheduled" | "completed" | "canceled") {
  try {
    const logIndex = transportationLogs.findIndex((l) => l.id === id)

    if (logIndex === -1) {
      return {
        success: false,
        error: "Transportation log not found",
      }
    }

    // Update the status
    transportationLogs[logIndex].status = status

    // Revalidate the relevant pages
    revalidatePath("/dashboard")
    revalidatePath("/transportation")

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
