"use client"

import { useState } from "react"
import { useNotifications, type Notification } from "@/context/notifications-context"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Car, Heart, Info, Check, Trash2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications()
  const [filter, setFilter] = useState<Notification["type"] | "all">("all")

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((notification) => notification.type === filter)

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "bill":
        return <FileText className="h-5 w-5 text-red-500" />
      case "transportation":
        return <Car className="h-5 w-5 text-green-500" />
      case "insurance":
        return <Heart className="h-5 w-5 text-purple-500" />
      case "reminder":
        return <Calendar className="h-5 w-5 text-yellow-500" />
      case "system":
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <PageHeader title="Notifications" showBackButton={true} backUrl="/dashboard" />
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-2 text-gray-500">View and manage your notifications</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {filteredNotifications.length} {filteredNotifications.length === 1 ? "notification" : "notifications"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllNotifications}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={setFilter as any} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="appointment">Appointments</TabsTrigger>
                <TabsTrigger value="bill">Bills</TabsTrigger>
                <TabsTrigger value="insurance">Insurance</TabsTrigger>
                <TabsTrigger value="transportation">Transportation</TabsTrigger>
                <TabsTrigger value="reminder">Reminders</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No notifications</h3>
                <p className="text-gray-500 mt-1">
                  {filter === "all"
                    ? "You don't have any notifications yet"
                    : `You don't have any ${filter} notifications`}
                </p>
                {filter !== "all" && (
                  <Button variant="outline" className="mt-4" onClick={() => setFilter("all")}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Show all notifications
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`overflow-hidden ${!notification.read ? "border-blue-200 bg-blue-50" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className={`font-medium ${!notification.read ? "text-blue-600" : ""}`}>
                              {notification.title}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {format(notification.timestamp, "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                          <div className="flex gap-2 mt-4">
                            {notification.link && (
                              <Button size="sm" asChild>
                                <Link href={notification.link}>View Details</Link>
                              </Button>
                            )}
                            {!notification.read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log(`Marking notification ${notification.id} as read from notifications page`)
                                  markAsRead(notification.id)
                                }}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark as read
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => clearNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
