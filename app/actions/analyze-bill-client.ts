/**
 * Client-safe version of the bill analysis function
 * This is used as a fallback when the server-side function fails in the preview environment
 */
export async function analyzeBillWithGeminiClient(imageDataUrl: string) {
  try {
    // In a real app, this would call the server action
    // For the preview environment, we'll simulate the analysis

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Return a mock successful response
    return {
      success: true,
      text: "SAMPLE MEDICAL CENTER\n123 Healthcare Ave\nMedical City, MC 12345\nPhone: (555) 123-4567\n\nPATIENT: John Doe\nACCOUNT #: P12345678\nDATE OF SERVICE: 01/15/2023\n\nSERVICES:\n- Office Visit: $150.00\n- Lab Tests: $75.00\n\nSUBTOTAL: $225.00\nINSURANCE ADJUSTMENT: -$125.00\nPATIENT RESPONSIBILITY: $100.00\n\nDUE DATE: 02/15/2023\n\nPlease remit payment by the due date. For questions about your bill, please call our billing department at (555) 123-4567.",
    }
  } catch (error) {
    console.error("Error in client-side bill analysis:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
