"use client"

import { useState } from "react"
import { FileText, Download, Printer, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface BillDetailViewProps {
  bill: any
  onClose: () => void
}

export function BillDetailView({ bill, onClose }: BillDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"details" | "image">("details")

  if (!bill) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle className="text-xl">Bill Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </CardHeader>

        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "details" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Bill Details
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "image" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("image")}
          >
            Bill Image
          </button>
        </div>

        <CardContent className="flex-1 overflow-auto p-0">
          {activeTab === "details" ? (
            <div className="p-6 space-y-6" style={{ display: "block" }}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <p className="font-medium">{bill.billData.provider.name}</p>
                  <p className="text-sm text-gray-600">{bill.billData.provider.address}</p>
                  {bill.billData.provider.phone && (
                    <p className="text-sm text-gray-600">{bill.billData.provider.phone}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Patient</p>
                  <p className="font-medium">{bill.billData.patient.name}</p>
                  <p className="text-sm text-gray-600">Account #: {bill.billData.patient.accountNumber}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Service Date</p>
                <p>{bill.billData.service.date}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Services</p>
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bill.billData.service.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">Subtotal</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {bill.billData.billing.subtotal}
                        </td>
                      </tr>
                      {bill.billData.billing.adjustments && (
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Adjustments</td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">
                            {bill.billData.billing.adjustments}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">Patient Responsibility</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {bill.billData.billing.patientResponsibility}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Payment Status</p>
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                    Unpaid
                  </Badge>
                  <span className="ml-2 text-sm text-gray-600">Due: {bill.billData.billing.dueDate}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center">
              {bill.imageData ? (
                <div className="max-w-full max-h-[60vh] overflow-auto">
                  <img
                    src={bill.imageData || "/placeholder.svg"}
                    alt={`Bill from ${bill.billData.provider.name}`}
                    className="max-w-full h-auto object-contain border rounded-md"
                  />
                </div>
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No image available for this bill</p>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t p-4 bg-gray-50 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Added on {format(new Date(bill.createdAt), "MMM d, yyyy")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
