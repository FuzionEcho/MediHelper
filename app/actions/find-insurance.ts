"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

/**
 * Extracts JSON from a string that might contain markdown formatting
 */
function extractJsonFromText(text: string): string {
  // Check if the text contains markdown code block markers
  if (text.includes("```json") || text.includes("```")) {
    // Extract content between code block markers
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim()
    }
  }

  // If no code block markers or extraction failed, return the original text
  return text.trim()
}

/**
 * Finds insurance companies based on zip code using Google Gemini
 */
export async function findInsuranceByZipCode(zipCode: string, city?: string, state?: string) {
  try {
    // Validate zip code format if provided
    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return {
        success: false,
        error: "Please enter a valid 5-digit US zip code",
      }
    }

    // Configure the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Create location context based on available information
    let locationContext = ""
    if (zipCode) {
      locationContext += `ZIP code ${zipCode}`
    }
    if (city && state) {
      locationContext += zipCode ? ` (${city}, ${state})` : `${city}, ${state}`
    } else if (city) {
      locationContext += zipCode ? ` (${city})` : city
    } else if (state) {
      locationContext += zipCode ? ` (${state})` : state
    }

    // Prepare the prompt
    const prompt = `
  I need information about health insurance companies that serve ${locationContext}.
  
  Please provide a list of 5-7 health insurance companies that likely operate in this area.
  For each company, include:
  - Company name (use real health insurance companies that operate in the US)
  - Brief description (1-2 sentences about their medical coverage)
  - Types of health plans they typically offer (like HMO, PPO, etc.)
  - A realistic rating out of 5 stars
  - Whether they likely accept Medicaid/Medicare
  
  Format the response as a JSON array of objects with the following structure:
  [
    {
      "name": "Health Insurance Company Name",
      "description": "Brief description of the health insurance company",
      "planTypes": ["Health Plan Type 1", "Health Plan Type 2"],
      "rating": 4.2,
      "acceptsMedicaid": true,
      "acceptsMedicare": true
    }
  ]
  
  Only return the JSON array, no other text. Do not include markdown formatting or code block markers.
`

    // Generate content with the model
    const result = await model.generateContent(prompt)
    const response = await result.response
    const jsonText = response.text()

    // Extract JSON from the response text (in case it contains markdown formatting)
    const cleanJsonText = extractJsonFromText(jsonText)

    // Parse the JSON response
    const insuranceCompanies = JSON.parse(cleanJsonText)

    return {
      success: true,
      data: insuranceCompanies,
      location: {
        zipCode,
        city,
        state,
      },
    }
  } catch (error) {
    console.error("Error finding insurance companies:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets location information from coordinates using reverse geocoding
 */
export async function getLocationFromCoordinates(latitude: number, longitude: number) {
  try {
    // Use a free geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "MediBill Assistant Application",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch location data")
    }

    const data = await response.json()

    // Extract relevant information
    const address = data.address
    const zipCode = address.postcode
    const city = address.city || address.town || address.village
    const state = address.state

    return {
      success: true,
      data: {
        zipCode,
        city,
        state,
        formattedAddress: data.display_name,
      },
    }
  } catch (error) {
    console.error("Error getting location from coordinates:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
