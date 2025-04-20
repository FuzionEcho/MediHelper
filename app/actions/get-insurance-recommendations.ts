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

export interface InsuranceFilters {
  zipCode: string
  householdSize: string
  income: number
  insuranceStatus: string
  insuranceType: string
  coveragePriorities: string[]
  monthlyBudget: string
  deductibleRange: string
}

/**
 * Gets personalized insurance recommendations based on user filters
 */
export async function getInsuranceRecommendations(filters: InsuranceFilters) {
  try {
    // Configure the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Format coverage priorities for the prompt
    const prioritiesText =
      filters.coveragePriorities.length > 0
        ? `Coverage priorities: ${filters.coveragePriorities.join(", ")}`
        : "No specific coverage priorities"

    // Parse budget range
    let budgetMin = 0
    let budgetMax = 1000
    if (filters.monthlyBudget.includes("-")) {
      const [min, max] = filters.monthlyBudget.split("-").map((val) => Number.parseInt(val))
      budgetMin = min
      budgetMax = max === undefined ? 1000 : max
    } else if (filters.monthlyBudget.includes("+")) {
      budgetMin = Number.parseInt(filters.monthlyBudget)
      budgetMax = 1000
    }

    // Parse deductible range
    let deductibleMin = 0
    let deductibleMax = 10000
    if (filters.deductibleRange.includes("-")) {
      const [min, max] = filters.deductibleRange.split("-").map((val) => Number.parseInt(val))
      deductibleMin = min
      deductibleMax = max === undefined ? 10000 : max
    } else if (filters.deductibleRange.includes("+")) {
      deductibleMin = Number.parseInt(filters.deductibleRange)
      deductibleMax = 10000
    }

    // Prepare the prompt
    const prompt = `
  I need personalized health insurance recommendations based on the following criteria:
  
  Location: ZIP code ${filters.zipCode}
  Household size: ${filters.householdSize} ${Number.parseInt(filters.householdSize) === 1 ? "person" : "people"}
  Annual household income: $${filters.income.toLocaleString()}
  Current health insurance status: ${filters.insuranceStatus}
  Health insurance type preference: ${filters.insuranceType}
  ${prioritiesText}
  Monthly budget: $${budgetMin} - $${budgetMax}
  Preferred deductible range: $${deductibleMin} - $${deductibleMax}
  
  Please provide 5-7 realistic health insurance plan recommendations that match these criteria.
  For each health plan, include:
  - Plan name (use real health insurance plans that exist in the US)
  - Provider name (use real health insurance companies)
  - Monthly cost (within the budget range)
  - Deductible amount (within the preferred range)
  - Coverage percentage
  - Key health benefits (list 3-5 specific medical benefits)
  - A realistic rating out of 5 stars
  
  Format the response as a JSON array of objects with the following structure:
  [
    {
      "id": 1,
      "name": "Health Plan Name",
      "provider": "Health Insurance Provider Name",
      "monthlyCost": 275,
      "deductible": 2500,
      "coverage": "80%",
      "benefits": ["Medical Benefit 1", "Medical Benefit 2", "Medical Benefit 3"],
      "score": 4.5
    }
  ]
  
  Only return the JSON array, no other text. Do not include markdown formatting or code block markers.
  Ensure all plans are realistic health insurance plans appropriate for the given criteria.
`

    // Generate content with the model
    const result = await model.generateContent(prompt)
    const response = await result.response
    const jsonText = response.text()

    // Extract JSON from the response text (in case it contains markdown formatting)
    const cleanJsonText = extractJsonFromText(jsonText)

    // Parse the JSON response
    const recommendations = JSON.parse(cleanJsonText)

    return {
      success: true,
      data: recommendations,
    }
  } catch (error) {
    console.error("Error getting insurance recommendations:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
