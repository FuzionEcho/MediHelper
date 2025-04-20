"use client"

import { useState, useEffect } from "react"
import { Car, AlertCircle, Loader2, Calendar, Clock, MapPin, CheckCircle, XCircle, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageHeader } from "@/components/page-header"
import { getAllTransportationLogs, updateTransportationStatus } from "@/app/actions/save-transportation"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { TransportationDetails } from "@/components/transportation/transportation-details"

export default function TransportationPage() {
  const { toast } = useToast()
  const [transportationLogs, setTransportationLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedTransportation, setSelectedTransportation] = useState<any | null>(null)

  // Load transportation logs
  useEffect(() => {
    const loadTransportationLogs = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getAllTransportationLogs()

        if (result.success && result.data) {
          setTransportationLogs(result.data)
        } else {
          setError(result.error || "Failed to load transportation history")
        }
      } catch (error) {
        console.error("Error loading transportation logs:", error)
        setError("An unexpected error occurred while loading transportation history")
      } finally {
        setIsLoading(false)
      }
    }

    loadTransportationLogs()
  }, [])

  // Handle status update
  const handleStatusUpdate = async (id: string, status: "scheduled" | "completed" | "canceled") => {
    setUpdatingId(id)

    try {
      const result = await updateTransportationStatus(id, status)

      if (result.success) {
        // Update the local state
        setTransportationLogs((prev) => prev.map((log) => (log.id === id ? { ...log, status } : log)))

        toast({
          title: "Status Updated",
          description: `Transportation status updated to ${status}`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating status",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock3 className="mr-1 h-3 w-3" />
            Scheduled
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case "canceled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Canceled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Add this function to handle viewing transportation details
  const handleViewDetails = (transportation: any) => {
    setSelectedTransportation(transportation)
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <PageHeader title="Transportation" showBackButton={true} backUrl="/dashboard" />
      <div className="container max-w-6xl py-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Transportation History</h1>
          <p className="mt-2 text-gray-500">View and manage your medical transportation</p>
        </div>

        {/* Transportation summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Rides</p>
                <p className="text-2xl font-bold">{transportationLogs.length}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <Car className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Rides</p>
                <p className="text-2xl font-bold">
                  {transportationLogs.filter((log) => log.status === "scheduled").length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <Calendar className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Rides</p>
                <p className="text-2xl font-bold">
                  {transportationLogs.filter((log) => log.status === "completed").length}
                </p>
              </div>
              <div className="rounded-full bg-teal-100 p-3 text-teal-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transportation list */}
        <Card>
          <CardHeader>
            <CardTitle>Transportation History</CardTitle>
            <CardDescription>
              {transportationLogs.length} {transportationLogs.length === 1 ? "ride" : "rides"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600 mr-2" />
                <p>Loading transportation history...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : transportationLogs.length === 0 ? (
              <div className="p-8 text-center">
                <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700">No Transportation History</h3>
                <p className="text-gray-500 mt-1">You haven't scheduled any transportation yet</p>
                <Button className="mt-4 mx-auto" variant="contrast" asChild>
                  <Link href="/appointments">Schedule an Appointment with Transportation</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transportationLogs.map((log) => (
                  <Card key={log.id} className="overflow-hidden">
                    <div className="border-l-4 border-teal-500">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <h3 className="font-medium">{log.transportationData.provider}</h3>
                              <div className="ml-3">{getStatusBadge(log.status)}</div>
                            </div>

                            <div className="flex flex-col space-y-1 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>
                                  {format(new Date(log.transportationData.appointmentDate), "EEEE, MMMM d, yyyy")}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{log.transportationData.appointmentTime}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{log.transportationData.location}</span>
                              </div>
                            </div>

                            <div className="mt-2 text-sm">
                              <div className="font-medium">Transportation Details</div>
                              <div className="text-gray-500">
                                <div>Pickup: {log.transportationData.pickupAddress}</div>
                                <div>Type: {log.transportationData.transportType}</div>
                                {log.transportationData.specialNeeds && (
                                  <div>Special Needs: {log.transportationData.specialNeeds}</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {log.status === "scheduled" && (
                            <div className="flex space-x-2 mt-4 md:mt-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500 text-green-600 hover:bg-green-50"
                                onClick={() => handleStatusUpdate(log.id, "completed")}
                                disabled={updatingId === log.id}
                              >
                                {updatingId === log.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Mark Completed
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                onClick={() => handleStatusUpdate(log.id, "canceled")}
                                disabled={updatingId === log.id}
                              >
                                {updatingId === log.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(log)}
                                className="ml-2"
                              >
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedTransportation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl">
            <TransportationDetails
              transportation={selectedTransportation}
              onClose={() => setSelectedTransportation(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
