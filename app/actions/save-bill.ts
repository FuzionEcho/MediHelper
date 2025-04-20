"use server"

import { revalidatePath } from "next/cache"

// Define the bill data structure
export interface BillData {
  provider: {
    name: string
    address: string
    phone: string | null
  }
  patient: {
    name: string
    accountNumber: string
  }

  service: {
    date: string
    items: Array<{
      description: string
      amount: string
    }>
  }
  billing: {
    subtotal: string
    adjustments: string | null
    patientResponsibility: string
    dueDate: string
  }
}

// Define the bill save request structure
export interface SaveBillRequest {
  billData: BillData
  imageData: string
  rawText: string
}

// In-memory storage for bills (in a real app, this would be a database)
type StoredBill = SaveBillRequest & {
  id: string
  createdAt: Date
  status: "paid" | "unpaid"
}

// This would be replaced with a database in a real application
const bills: StoredBill[] = []

/**
 * Saves a bill to storage
 */
export async function saveBill(request: SaveBillRequest) {
  try {
    // Validate the request
    if (!request.billData || !request.imageData) {
      return {
        success: false,
        error: "Missing required bill data or image",
      }
    }

    // Generate a unique ID
    const id = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Create a new bill record
    const newBill: StoredBill = {
      ...request,
      id,
      createdAt: new Date(),
      status: "unpaid", // Default status
    }

    // Save the bill (in a real app, this would save to a database)
    bills.push(newBill)

    // Revalidate the bills page and dashboard to show the new bill
    // Make sure these paths are correct and match your actual routes
    revalidatePath("/dashboard")
    revalidatePath("/bills")
    revalidatePath("/") // Also revalidate the root path

    return {
      success: true,
      billId: id,
    }
  } catch (error) {
    console.error("Error saving bill:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets all saved bills
 */
export async function getAllBills() {
  try {
    // Sort bills by creation date (newest first)
    const sortedBills = [...bills].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return {
      success: true,
      data: sortedBills,
    }
  } catch (error) {
    console.error("Error getting bills:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets a bill by ID
 */
export async function getBillById(id: string) {
  try {
    const bill = bills.find((b) => b.id === id)

    if (!bill) {
      return {
        success: false,
        error: "Bill not found",
      }
    }

    return {
      success: true,
      data: bill,
    }
  } catch (error) {
    console.error("Error getting bill:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
