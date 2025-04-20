"use client"

import { useNotifications } from "@/context/notifications-context"

// Helper function to create appointment notifications
export function createAppointmentNotification(appointmentData: any) {
  const { addNotification } = useNotifications()

  addNotification({
    title: "Appointment Scheduled",
    message: `You have scheduled an appointment on ${appointmentData.date.toLocaleDateString()} at ${appointmentData.time}`,
    type: "appointment",
    link: "/appointments",
  })
}

// Helper function to create bill notifications
export function createBillNotification(billData: any) {
  const { addNotification } = useNotifications()

  addNotification({
    title: "Bill Saved",
    message: `A medical bill from ${billData.provider.name} for ${billData.billing.patientResponsibility} has been saved`,
    type: "bill",
    link: "/bills",
  })
}

// Helper function to create transportation notifications
export function createTransportationNotification(transportData: any) {
  const { addNotification } = useNotifications()

  addNotification({
    title: "Transportation Arranged",
    message: `Transportation has been arranged for your appointment on ${transportData.appointmentDate.toLocaleDateString()}`,
    type: "transportation",
    link: "/transportation",
  })
}

// Helper function to create insurance notifications
export function createInsuranceNotification(insuranceData: any) {
  const { addNotification } = useNotifications()

  addNotification({
    title: "Insurance Update",
    message: `There's an update regarding your insurance coverage`,
    type: "insurance",
    link: "/insurance",
  })
}

// This function can be called from server components
export const addNotification = (notification: any) => {
  // Instead of using hooks directly, we'll use a custom event to communicate with the NotificationsProvider
  if (typeof window !== "undefined") {
    // Create a custom event with the notification data
    const event = new CustomEvent("add-notification", {
      detail: notification,
    })

    // Dispatch the event for the NotificationsProvider to handle
    window.dispatchEvent(event)
  }
}
