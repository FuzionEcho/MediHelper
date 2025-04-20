"use client"

import { useNotifications } from "@/context/notifications-context"
import { formatDistanceToNow } from "date-fns"
import { Bell, Calendar, FileText, Car, Heart, Info, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RecentNotifications() {
  const { notifications, markAsRead, clearNotification } = useNotifications()

  // Get only the 3 most recent notifications
  const recentNotifications = notifications.slice(0, 3)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "bill":
        return <FileText className="h-4 w-4 text-red-500" />
      case "transportation":
        return <Car className="h-4 w-4 text-green-500" />
      case "insurance":
        return <Heart className="h-4 w-4 text-purple-500" />
      case "reminder":
        return <Calendar className="h-4 w-4 text-yellow-500" />
      case "system":
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Recent Notifications</h2>
        <Link href="/notifications" className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>

      {recentNotifications.length === 0 ? (
        <div className="p-6 text-center">
          <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <ul className="divide-y">
          {recentNotifications.map((notification) => (
            <li key={notification.id} className={`p-4 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}>
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className={`text-sm font-medium ${!notification.read ? "text-blue-600" : ""}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                  <div className="flex gap-2 mt-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark read
                      </Button>
                    )}
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="inline-flex items-center h-6 px-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!notification.read) {
                            markAsRead(notification.id)
                          }
                        }}
                      >
                        View details
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                      onClick={() => clearNotification(notification.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="p-3 bg-gray-50 border-t">
        <Link href="/notifications" className="block text-center text-sm text-blue-600 hover:text-blue-700 py-1">
          See all notifications
        </Link>
      </div>
    </div>
  )
}
