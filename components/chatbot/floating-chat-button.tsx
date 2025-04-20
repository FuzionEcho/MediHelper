"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Mic } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ChatbotInterface from "./chatbot-interface"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const pathname = usePathname()

  // Show welcome message after a delay if user hasn't interacted
  useEffect(() => {
    if (!hasInteracted) {
      const timer = setTimeout(() => {
        setShowWelcome(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [hasInteracted])

  // Hide welcome message when changing pages
  useEffect(() => {
    setShowWelcome(false)
  }, [pathname])

  const handleButtonClick = () => {
    setHasInteracted(true)
    setShowWelcome(false)
    setIsOpen(!isOpen)
  }

  const handleWelcomeClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHasInteracted(true)
    setShowWelcome(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute bottom-16 right-0 mb-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-64"
          >
            <button
              onClick={handleWelcomeClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Need help navigating?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  I'm MediHelper! Click to ask me about bills, appointments, or insurance. You can also use voice
                  commands!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              onClick={handleButtonClick}
              className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        </SheetTrigger>
        <SheetContent className="sm:max-w-md p-0" side="right">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">MediHelper</h2>
                <div className="bg-blue-500 text-xs px-2 py-0.5 rounded-full flex items-center">
                  <Mic className="h-3 w-3 mr-1" />
                  Voice Enabled
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatbotInterface />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
