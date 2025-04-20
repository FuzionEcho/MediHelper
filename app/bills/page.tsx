"use client"

import { useState, useEffect } from "react"
import { FileText, AlertCircle, Loader2, Plus, Search, Filter, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageHeader } from "@/components/page-header"
import { getAllBills } from "@/app/actions/save-bill"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { BillDetailView } from "@/components/bills/bill-detail-view"

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([])
  const [isLoadingBills, setIsLoadingBills] = useState(true)
  const [billsError, setBillsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  // Add state for viewing bill details
  const [selectedBill, setSelectedBill] = useState<any | null>(null)

  // Load bills
  useEffect(() => {
    const loadBills = async () => {
      setIsLoadingBills(true)
      setBillsError(null)

      try {
        const result = await getAllBills()

        if (result.success && result.data) {
          setBills(result.data)
        } else {
          setBillsError(result.error || "Failed to load bills")
        }
      } catch (error) {
        console.error("Error loading bills:", error)
        setBillsError("An unexpected error occurred while loading bills")
      } finally {
        setIsLoadingBills(false)
      }
    }

    loadBills()
  }, [])

  // Filter and search bills
  const filteredBills = bills.filter((bill) => {
    // Filter by status
    if (filterStatus !== "all") {
      // In a real app, you would check the actual status
      // For now, we'll assume all bills are unpaid
      if (filterStatus === "paid") {
        return false
      }
    }

    // Search by provider name or patient name
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        bill.billData.provider.name.toLowerCase().includes(query) ||
        bill.billData.patient.name.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Calculate total expenses
  const totalAmount = filteredBills.reduce((total, bill) => {
    const amount = bill.billData.billing.patientResponsibility || "0"
    return total + Number.parseFloat(amount.replace(/[^0-9.-]+/g, ""))
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <PageHeader title="All Bills" showBackButton={true} backUrl="/dashboard" />
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Medical Bills</h1>
          <p className="mt-2 text-gray-500">View and manage all your medical bills in one place</p>
        </div>

        {/* Filters and search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search bills by provider or patient name"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Status</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bills</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="contrast" asChild>
            <Link href="/scan">
              <Plus className="mr-2 h-4 w-4" />
              Scan New Bill
            </Link>
          </Button>
        </div>

        {/* Bills summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bills</p>
                <p className="text-2xl font-bold">{filteredBills.length}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <Download className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Unpaid Bills</p>
                <p className="text-2xl font-bold">{filteredBills.length}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bills list */}
        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
            <CardDescription>
              {filteredBills.length} {filteredBills.length === 1 ? "bill" : "bills"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBills ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600 mr-2" />
                <p>Loading bills...</p>
              </div>
            ) : billsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{billsError}</AlertDescription>
              </Alert>
            ) : filteredBills.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700">No Bills Found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload your first medical bill to get started"}
                </p>
                {!searchQuery && filterStatus === "all" && (
                  <Button className="mt-4" asChild>
                    <Link href="/scan">
                      <Plus className="mr-2 h-4 w-4" />
                      Scan a Bill
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Bill Image</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Provider</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Service Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map((bill) => (
                      <tr key={bill.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="h-16 w-16 rounded-md overflow-hidden border bg-gray-50">
                            {bill.imageData ? (
                              <img
                                src={bill.imageData || "/placeholder.svg"}
                                alt={`Bill from ${bill.billData.provider.name}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                <FileText className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{bill.billData.provider.name}</p>
                            <p className="text-sm text-gray-500">Patient: {bill.billData.patient.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p>{bill.billData.service.date}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{bill.billData.billing.patientResponsibility}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            Unpaid
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedBill(bill)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Bill</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download Bill</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedBill && <BillDetailView bill={selectedBill} onClose={() => setSelectedBill(null)} />}
    </div>
  )
}
