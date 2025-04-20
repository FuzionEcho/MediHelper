"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LazyMotion, domAnimation } from "framer-motion"
import { SectionStyles } from "@/components/section-styles"
import { SidebarInset } from "@/components/ui/sidebar"
import FloatingChatButton from "@/components/chatbot/floating-chat-button"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Apple-style page transition effect
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Mark component as mounted to prevent hydration mismatch
    setIsMounted(true)

    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  // Prevent hydration errors by not rendering until client-side
  if (!isMounted) {
    return null
  }

  return (
    <LazyMotion features={domAnimation}>
      {/* Include the SectionStyles component to dynamically load section-specific CSS */}
      <SectionStyles />

      {isLoading ? (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center animate-pulse">
              <div className="h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-blue-300 dark:bg-blue-700 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                </div>
              </div>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-800 dark:text-gray-100 animate-fade-in-up">MediHelper</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 animate-fade-in-up delay-200">
            Simplifying healthcare management
          </p>
        </div>
      ) : (
        <SidebarInset className="h-screen overflow-auto">{children}</SidebarInset>
      )}
      <FloatingChatButton />
    </LazyMotion>
  )
}
