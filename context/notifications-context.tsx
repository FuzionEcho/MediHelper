"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  type: "appointment" | "bill" | "insurance" | "transportation" | "system" | "reminder"
  link?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Load notifications from localStorage on mount (only once)
  useEffect(() => {
    if (!hasInitialized) {
      const savedNotifications = localStorage.getItem("notifications")
      if (savedNotifications) {
        try {
          const parsedNotifications = JSON.parse(savedNotifications).map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))
          setNotifications(parsedNotifications)
        } catch (error) {
          console.error("Failed to parse saved notifications:", error)
        }
      }

      // Add a sample notification if none exist
      if (!savedNotifications || JSON.parse(savedNotifications).length === 0) {
        const sampleNotification: Notification = {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: "Welcome to ClaimCare",
          message: "Your medical billing assistant is ready to help you manage your healthcare expenses.",
          timestamp: new Date(),
          read: false,
          type: "system",
        }
        setNotifications([sampleNotification])
      }

      setHasInitialized(true)
    }
  }, [hasInitialized])

  // Add event listener for custom notification events
  useEffect(() => {
    const handleAddNotification = (event: any) => {
      if (event.detail) {
        addNotification(event.detail)
      }
    }

    window.addEventListener("add-notification", handleAddNotification)

    return () => {
      window.removeEventListener("add-notification", handleAddNotification)
    }
  }, [])

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (hasInitialized) {
      localStorage.setItem("notifications", JSON.stringify(notifications))
      // Update unread count whenever notifications change
      setUnreadCount(notifications.filter((n) => !n.read).length)
    }
  }, [notifications, hasInitialized])

  // Remove the separate useEffect for unread count since we're now handling it in the above effect:
  // Delete or comment out this useEffect:
  // useEffect(() => {
  //   setUnreadCount(notifications.filter((n) => !n.read).length)
  // }, [notifications])

  // Check for upcoming appointments and create reminders - using a ref to avoid dependency issues
  useEffect(() => {
    if (!hasInitialized) return

    const checkUpcomingAppointments = () => {
      // This would typically fetch from a real database
      // For demo purposes, we'll use a mock appointment
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Example: Create a reminder for an appointment tomorrow if we don't already have one
      const hasReminder = notifications.some(
        (n) =>
          n.type === "reminder" &&
          n.title.includes("Upcoming Appointment") &&
          new Date().getTime() - n.timestamp.getTime() < 24 * 60 * 60 * 1000, // Created in last 24 hours
      )

      if (!hasReminder) {
        const newNotification: Notification = {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: "Upcoming Appointment",
          message: "You have an appointment tomorrow at Memorial Hospital at 10:00 AM",
          timestamp: new Date(),
          read: false,
          type: "reminder",
          link: "/appointments",
        }

        setNotifications((prev) => [newNotification, ...prev])
      }
    }

    // Only check once on mount, not on every render
    const timeoutId = setTimeout(checkUpcomingAppointments, 5000) // Check after 5 seconds

    return () => clearTimeout(timeoutId)
  }, [hasInitialized]) // Only depend on hasInitialized, not notifications

  // Define these functions with useCallback to prevent unnecessary re-renders
  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show browser notification if supported
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    console.log(`Marking notification as read: ${id}`)
    setNotifications((prev) => {
      const updated = prev.map((notification) => {
        const shouldUpdate = notification.id === id
        console.log(`Notification ${notification.id}: ${shouldUpdate ? "updating" : "not changing"}`)
        return shouldUpdate ? { ...notification, read: true } : notification
      })
      return updated
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    localStorage.removeItem("notifications")
  }, [])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
