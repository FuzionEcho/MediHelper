"use server"

/**
 * Creates a Google Calendar event URL that users can click to add an event to their calendar
 */
export async function addAppointmentToCalendar(appointmentData: {
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
}) {
  try {
    // Format dates for Google Calendar URL
    const startDate = appointmentData.startTime.toISOString().replace(/-|:|\.\d+/g, "")
    const endDate = appointmentData.endTime.toISOString().replace(/-|:|\.\d+/g, "")

    // Encode parameters for the URL
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: appointmentData.title,
      details: appointmentData.description,
      location: appointmentData.location,
      dates: `${startDate}/${endDate}`,
    })

    // Create the Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`

    return {
      success: true,
      eventLink: googleCalendarUrl,
    }
  } catch (error: any) {
    console.error("Error creating Google Calendar link:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Simplified version without Auth0
export async function checkGoogleCalendarAccess() {
  return { hasAccess: true }
}
