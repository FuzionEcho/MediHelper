"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

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
 * Validates if the API key is properly formatted
 */
function validateApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) return false

  // Basic validation for Google API key format (typically starts with "AIza")
  return apiKey.trim().startsWith("AIza") && apiKey.length > 20
}

/**
 * Extracts structured data from the OCR text using Google Gemini API
 * This is a server-side function that should not be called directly from client components
 */
export async function extractStructuredData(ocrText: string) {
  try {
    // Check if the API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error: "Google Gemini API key is not configured. Please add it to your environment variables.",
        apiKeyMissing: true,
      }
    }

    if (!validateApiKey(apiKey)) {
      return {
        success: false,
        error: "Google Gemini API key appears to be invalid. Please check the format and ensure it's correct.",
        apiKeyInvalid: true,
      }
    }

    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey)

    // Configure the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Create the prompt for structured data extraction
    const prompt = `
      You are a medical billing assistant. I have a medical bill with the following text content:
      
      ${ocrText}
      
      Please extract the key information from this bill and format it as a JSON object with the following structure:
      
      {
        "provider": {
          "name": "Provider name",
          "address": "Full address",
          "phone": "Phone number or null if not available"
        },
        "patient": {
          "name": "Patient name",
          "accountNumber": "Account or patient ID number"
        },
        "service": {
          "date": "Service date(s)",
          "items": [
            {
              "description": "Service description",
              "amount": "Amount with currency symbol"
            }
          ]
        },
        "billing": {
          "subtotal": "Subtotal amount with currency symbol",
          "adjustments": "Insurance adjustments with currency symbol or null if not applicable",
          "patientResponsibility": "Amount patient owes with currency symbol",
          "dueDate": "Payment due date"
        },
        "summary": {
          "totalBilled": "Total amount billed with currency symbol",
          "insuranceCovered": "Amount covered by insurance with currency symbol",
          "outOfPocket": "Out-of-pocket expenses with currency symbol",
          "status": "Paid, Unpaid, or Partially Paid"
        },
        "insights": [
          "Insight 1 about the bill",
          "Insight 2 about the bill",
          "Insight 3 about the bill"
        ]
      }
      
      If any information is not available in the bill, use null for that field. For the insights, provide 3-5 helpful observations about the bill, such as potential savings, unusual charges, or important deadlines.
      
      Return ONLY the JSON object without any additional text or explanation.
    `

    // Generate content with the model
    const result = await model.generateContent(prompt)
    const response = await result.response
    const jsonText = response.text()

    // Extract JSON from the response text (in case it contains markdown formatting)
    const cleanJsonText = extractJsonFromText(jsonText)

    try {
      // Parse the JSON response
      const structuredData = JSON.parse(cleanJsonText)
      return {
        success: true,
        data: structuredData,
      }
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError)
      return {
        success: false,
        error: "Failed to parse the structured data. The response format was invalid.",
      }
    }
  } catch (error) {
    console.error("Error extracting structured data:", error)

    // Check if it's an API key error
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const isApiKeyError =
      errorMessage.includes("API key not valid") ||
      errorMessage.includes("API_KEY_INVALID") ||
      errorMessage.includes("authentication")

    return {
      success: false,
      error: isApiKeyError ? "Invalid Google Gemini API key. Please check your API key configuration." : errorMessage,
      apiKeyError: isApiKeyError,
    }
  }
}
