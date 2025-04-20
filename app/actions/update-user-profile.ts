"use server"

import { revalidatePath } from "next/cache"

// Define the user profile data structure
interface UserProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

// In-memory storage for user profile (in a real app, this would be a database)
let userProfile: UserProfileData = {
  firstName: "Mark",
  lastName: "Johnson",
  email: "mark.johnson@example.com",
  phone: "(555) 123-4567",
}

/**
 * Updates the user profile information
 */
export async function updateUserProfile(data: UserProfileData) {
  try {
    // Validate the request
    if (!data.firstName || !data.lastName || !data.email) {
      return {
        success: false,
        error: "Missing required profile information",
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: "Invalid email address format",
      }
    }

    // Update the user profile (in a real app, this would update a database)
    userProfile = {
      ...userProfile,
      ...data,
    }

    // Revalidate the settings page to show the updated profile
    revalidatePath("/settings")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets the user profile information
 */
export async function getUserProfile() {
  try {
    return {
      success: true,
      data: userProfile,
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
