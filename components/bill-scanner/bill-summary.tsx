import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, DollarSign, FileText, Info, Lightbulb } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BillSummaryProps {
  data: {
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
    summary?: {
      totalBilled: string
      insuranceCovered: string
      outOfPocket: string
      status: string
    }
    insights?: string[]
  }
}

export function BillSummary({ data }: BillSummaryProps) {
  // Helper function to safely check if status is "paid"
  const isPaid = () => {
    return data.summary?.status?.toLowerCase() === "paid"
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
          Bill Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-teal-700 dark:text-teal-300 mb-2">Provider</h4>
                <p className="font-medium">{data.provider.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{data.provider.address}</p>
                {data.provider.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{data.provider.phone}</p>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-teal-700 dark:text-teal-300 mb-2">Patient</h4>
                <p className="font-medium">{data.patient.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Account #: {data.patient.accountNumber}</p>
              </div>
            </div>

            {data.summary && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Financial Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Billed</p>
                    <p className="font-medium">{data.summary.totalBilled}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Insurance Covered</p>
                    <p className="font-medium text-green-600 dark:text-green-400">{data.summary.insuranceCovered}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Responsibility</p>
                    <p className="font-bold text-teal-700 dark:text-teal-300">{data.summary.outOfPocket}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p
                      className={`font-medium ${isPaid() ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {data.summary.status || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-teal-700 dark:text-teal-300">Payment Information</h4>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    isPaid()
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }`}
                >
                  {data.summary?.status || "Unpaid"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Service Date</p>
                  <p className="font-medium">{data.service.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment Due</p>
                  <p className="font-medium">{data.billing.dueDate}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-teal-700 dark:text-teal-300 mb-2">Services & Charges</h4>
              <div className="mt-2 rounded-md bg-white dark:bg-gray-800 p-3">
                <div className="mb-2 flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
                  <span>Service</span>
                  <span>Amount</span>
                </div>
                <div className="space-y-1">
                  {data.service.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-1 last:border-0"
                    >
                      <span>{item.description}</span>
                      <span>{item.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t pt-2 border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>{data.billing.subtotal}</span>
                  </div>
                  {data.billing.adjustments && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Adjustments</span>
                      <span>{data.billing.adjustments}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-teal-700 dark:text-teal-300">
                    <span>Patient Responsibility</span>
                    <span>{data.billing.patientResponsibility}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {data.insights && data.insights.length > 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Bill Insights
                </h4>
                <ul className="space-y-2">
                  {data.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No insights available</AlertTitle>
                <AlertDescription>
                  We couldn't generate insights for this bill. This might be due to limited information in the bill or
                  the format of the document.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
