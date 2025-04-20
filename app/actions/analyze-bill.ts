"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

/**
 * Converts a base64 data URL to a base64 string without the prefix
 */
function removeBase64Prefix(base64DataUrl: string): string {
  // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64String = base64DataUrl.split(",")[1]
  return base64String
}

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

// Enhance the validateMedicalBill function to be more strict and provide better feedback

function validateMedicalBill(text: string): { isValid: boolean; reason?: string } {
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase()

  // Define keywords that are commonly found in medical bills
  const billKeywords = [
    "patient",
    "hospital",
    "clinic",
    "medical",
    "health",
    "doctor",
    "invoice",
    "bill",
    "statement",
    "amount",
    "payment",
    "due",
    "insurance",
    "service",
    "procedure",
    "diagnosis",
    "treatment",
    "charge",
    "fee",
    "balance",
    "account",
    "date of service",
  ]

  // Count how many bill-related keywords are found
  const keywordMatches = billKeywords.filter((keyword) => lowerText.includes(keyword)).length

  // Check if it's completely blank or has very little text
  if (text.trim().length < 50) {
    return {
      isValid: false,
      reason: "The image contains very little text. Please ensure the bill is clearly visible and try again.",
    }
  }

  // If we find at least 3 keywords, it's likely a medical bill
  if (keywordMatches >= 3) {
    return { isValid: true }
  }

  // If we don't find enough medical bill keywords
  return {
    isValid: false,
    reason:
      "This doesn't appear to be a medical bill or receipt. Please upload a valid medical bill that contains patient information, provider details, and charges.",
  }
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
 * Analyzes a medical bill image using Google Gemini API
 * This is a server-side function that should not be called directly from client components
 */
export async function analyzeBillWithGemini(imageDataUrl: string) {
  try {
    // Check if the API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    // Validate API key exists and has correct format
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

    // Remove the data URL prefix to get the base64 string
    const base64Image = removeBase64Prefix(imageDataUrl)

    // Create the prompt for OCR and text extraction
    const prompt = `
      You are a medical billing assistant. Please analyze this medical bill image and extract all the text content.
      Focus on capturing all important details such as:
      - Provider/hospital name and contact information
      - Patient information
      - Service dates
      - Procedure codes and descriptions
      - Charges and amounts
      - Insurance information
      - Payment due dates
      
      Return the complete text content of the bill, preserving the formatting as much as possible.
    `

    // Create the image part for the model
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]

    // Generate content with the model
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()

    // Validate if the extracted text appears to be from a medical bill
    const validation = validateMedicalBill(text)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.reason,
        invalidBill: true,
      }
    }

    return {
      success: true,
      text,
    }
  } catch (error) {
    console.error("Error analyzing bill with Gemini:", error)

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
