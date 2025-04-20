/**
 * Client-safe version of the structured data extraction function
 * This is used as a fallback when the server-side function fails in the preview environment
 */
export async function extractStructuredDataClient(ocrText: string) {
  try {
    // In a real app, this would call the server action
    // For the preview environment, we'll simulate the extraction

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Return a mock successful response with sample structured data
    return {
      success: true,
      data: {
        provider: {
          name: "Sample Medical Center",
          address: "123 Healthcare Ave, Medical City, MC 12345",
          phone: "(555) 123-4567",
        },
        patient: {
          name: "John Doe",
          accountNumber: "P12345678",
        },
        service: {
          date: "01/15/2023",
          items: [
            {
              description: "Office Visit",
              amount: "$150.00",
            },
            {
              description: "Lab Tests",
              amount: "$75.00",
            },
          ],
        },
        billing: {
          subtotal: "$225.00",
          adjustments: "-$125.00",
          patientResponsibility: "$100.00",
          dueDate: "02/15/2023",
        },
        summary: {
          totalBilled: "$225.00",
          insuranceCovered: "$125.00",
          outOfPocket: "$100.00",
          status: "Unpaid",
        },
        insights: [
          "Your insurance covered 55% of the total bill.",
          "Payment is due by 02/15/2023.",
          "Contact billing department at (555) 123-4567 with questions.",
        ],
      },
    }
  } catch (error) {
    console.error("Error in client-side structured data extraction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
