import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/base.css" // Import our base CSS
import "../styles/sidebar-animations.css" // Import our sidebar animations CSS
import ClientLayout from "./ClientLayout"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotificationsProvider } from "@/context/notifications-context"
import { ThemeProvider } from "@/context/theme-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get the sidebar state from cookies
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value !== "false"

  return (
    <html lang="en" className="h-full">
      <head>
        <title>MediHelper - Medical Billing Assistant</title>
        <meta name="description" content="Simplify your medical bills and insurance with MediHelper" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${inter.className} h-full transition-colors duration-300`}>
        <ErrorBoundary>
          <ThemeProvider>
            <NotificationsProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar />
                <ClientLayout>{children}</ClientLayout>
              </SidebarProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
