"use client"

import { useState, useEffect } from "react"
import { Car, Calendar, Clock, MapPin, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAllTransportationLogs } from "@/app/actions/save-transportation"
import { format } from "date-fns"
import Link from "next/link"

export function RecentRides() {
  const [transportationLogs, setTransportationLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
          >
            Scheduled
          </Badge>
        )
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
          >
            Completed
          </Badge>
        )
      case "canceled":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800"
          >
            Canceled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-gray-900 dark:text-white">Recent Transportation</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto p-0">
        {isLoading ? (
          <div className="flex justify-center items-center p-8 h-full">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400 mr-2" />
            <p className="text-gray-700 dark:text-gray-300">Loading transportation history...</p>
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : transportationLogs.length === 0 ? (
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <Car className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">No Transportation History</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              You haven't scheduled any transportation yet
            </p>
            <Button className="mt-3 mx-auto" size="sm" asChild>
              <Link href="/appointments">Schedule Transportation</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
            {transportationLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-start p-4">
                <div className="mr-3 mt-1">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
                    <Car className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                      {log.transportationData.provider}
                    </h4>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{format(new Date(log.transportationData.appointmentDate), "MMM d, yyyy")}</span>
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{log.transportationData.appointmentTime}</span>
                    </div>
                    <div className="flex items-center mt-0.5">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{log.transportationData.pickupAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600 mt-auto">
        <Link
          href="/transportation"
          className="text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium block"
        >
          View All Transportation
        </Link>
      </div>
    </Card>
  )
}
