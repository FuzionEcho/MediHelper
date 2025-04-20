"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, Home, FileText, Calendar, Heart, Car, Settings, Mic, MicOff } from "lucide-react"
import { processChatMessage } from "@/app/actions/process-chat-message"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { debounce } from "@/utils/debounce"

interface Message {
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface QuickLink {
  text: string
  icon: React.ElementType
  href: string
}

export default function ChatbotInterface() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hi! I'm MediHelper, your medical assistant. How can I help you navigate ClaimCare today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice input states
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState("")
  const [isProcessingCommand, setIsProcessingCommand] = useState(false)
  const [isStartingOrStopping, setIsStartingOrStopping] = useState(false) // Prevent concurrency issues
  const recognitionRef = useRef<any>(null)

  // Quick navigation links
  const quickLinks: QuickLink[] = [
    { text: "Dashboard", icon: Home, href: "/dashboard" },
    { text: "Bills", icon: FileText, href: "/scan" },
    { text: "Appointments", icon: Calendar, href: "/appointments" },
    { text: "Insurance", icon: Heart, href: "/insurance" },
    { text: "Transportation", icon: Car, href: "/transportation" },
    { text: "Settings", icon: Settings, href: "/settings" },
  ]

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if browser supports SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition()
          const recognition = recognitionRef.current

          recognition.continuous = false
          recognition.interimResults = true
          recognition.lang = "en-US"

          recognition.onstart = () => {
            setIsListening(true)
            setVoiceError(null)
          }

          recognition.onresult = (event: any) => {
            const current = event.resultIndex
            const currentTranscript = event.results[current][0].transcript
            setTranscript(currentTranscript)

            // If this is a final result
            if (event.results[current].isFinal) {
              setInput(currentTranscript)

              // Auto-submit after voice input if it's a command
              if (isCommandPhrase(currentTranscript)) {
                setIsProcessingCommand(true)
                setTimeout(() => {
                  handleSendMessage(new Event("submit") as any, currentTranscript)
                }, 500)
              }
            }
          }

          recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error)

            // Handle specific error types
            if (event.error === "aborted") {
              setVoiceError("Speech recognition was aborted. Please try again.")
            } else if (event.error === "not-allowed") {
              setVoiceError("Microphone permission denied. Please allow microphone access to use voice input.")
            } else if (event.error === "network") {
              setVoiceError("Network error occurred. Please check your connection and try again.")
            } else {
              setVoiceError(`Error: ${event.error}`)
            }

            setIsListening(false)

            // Ensure we clean up properly
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop()
              } catch (e) {
                console.log("Error stopping recognition after error:", e)
              }
            }
          }

          recognition.onend = () => {
            setIsListening(false)
            setIsProcessingCommand(false)

            // If we have a transcript but didn't process it as a command
            if (transcript && !isProcessingCommand) {
              setInput(transcript)
            }

            setTranscript("")
          }
        } catch (error) {
          console.error("Error initializing speech recognition:", error)
          setVoiceSupported(false)
          setVoiceError("Failed to initialize speech recognition. This feature may not be supported in your browser.")
        }
      } else {
        setVoiceSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
          recognitionRef.current.stop()
        } catch (error) {
          console.log("Error cleaning up speech recognition:", error)
        }
      }
    }
  }, [transcript, isProcessingCommand])

  // Check if the phrase is likely a command
  const isCommandPhrase = (phrase: string): boolean => {
    const commandPhrases = [
      "go to",
      "take me to",
      "navigate to",
      "open",
      "show me",
      "find",
      "search for",
      "dashboard",
      "bills",
      "appointments",
      "insurance",
      "transportation",
      "settings",
      "scan",
      "bill",
      "payment",
      "schedule",
      "appointment",
    ]

    const lowerPhrase = phrase.toLowerCase()
    return commandPhrases.some((cmd) => lowerPhrase.includes(cmd))
  }

  const handleSendMessage = async (e: React.FormEvent, voiceInput?: string) => {
    e.preventDefault()

    const messageText = voiceInput || input
    if (!messageText.trim()) return

    // Add user message
    const userMessage: Message = {
      content: messageText,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsProcessingCommand(false)

    try {
      // Process message with our chatbot model
      const response = await processChatMessage(messageText)

      // Check if the message is a navigation request
      const navigationResult = handleNavigationRequest(messageText, response)

      // Add assistant response
      const assistantMessage: Message = {
        content: navigationResult.message || response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // If navigation is needed, redirect after a short delay
      if (navigationResult.shouldNavigate && navigationResult.destination) {
        // Add a message indicating navigation
        setMessages((prev) => [
          ...prev,
          {
            content: `Navigating to ${navigationResult.destination}...`,
            role: "assistant",
            timestamp: new Date(),
          },
        ])

        setTimeout(() => {
          router.push(navigationResult.destination as string)
        }, 1500)
      }
    } catch (error) {
      console.error("Error processing message:", error)

      // Add error message
      const errorMessage: Message = {
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle navigation requests
  const handleNavigationRequest = (userInput: string, aiResponse: string) => {
    const userInputLower = userInput.toLowerCase()
    const result = {
      shouldNavigate: false,
      destination: null,
      message: aiResponse,
    }

    // Check for navigation intents in user input
    const dashboardKeywords = ["dashboard", "home", "main page", "overview"]
    const billsKeywords = ["bill", "bills", "scan", "payment", "pay"]
    const appointmentsKeywords = ["appointment", "schedule", "doctor", "visit"]
    const insuranceKeywords = ["insurance", "coverage", "plan"]
    const transportationKeywords = ["transport", "ride", "car", "pickup"]
    const settingsKeywords = ["settings", "account", "profile", "preferences"]

    // Check if AI response suggests navigation
    const suggestsNavigation =
      aiResponse.includes("navigate to") ||
      aiResponse.includes("go to") ||
      aiResponse.includes("can find that in") ||
      aiResponse.includes("check the") ||
      aiResponse.includes("visit the")

    // Determine destination based on keywords
    if (
      dashboardKeywords.some((keyword) => userInputLower.includes(keyword)) ||
      aiResponse.toLowerCase().includes("dashboard")
    ) {
      result.shouldNavigate = true
      result.destination = "/dashboard"
      result.message = "I'll take you to the Dashboard where you can see an overview of your healthcare information."
    } else if (
      billsKeywords.some((keyword) => userInputLower.includes(keyword)) ||
      aiResponse.toLowerCase().includes("bills") ||
      aiResponse.toLowerCase().includes("scan")
    ) {
      result.shouldNavigate = true
      result.destination = "/scan"
      result.message = "I'll take you to the Bills & Payments section where you can scan and manage your medical bills."
    } else if (
      appointmentsKeywords.some((keyword) => userInputLower.includes(keyword)) ||
      aiResponse.toLowerCase().includes("appointment")
    ) {
      result.shouldNavigate = true
      result.destination = "/appointments"
      result.message =
        "I'll take you to the Appointments section where you can schedule and manage your medical appointments."
    } else if (
      insuranceKeywords.some((keyword) => userInputLower.includes(keyword)) ||
      aiResponse.toLowerCase().includes("insurance")
    ) {
      result.shouldNavigate = true
      result.destination = "/insurance"
      result.message =
        "I'll take you to the Insurance section where you can find and manage your insurance information."
    } else if (
      transportationKeywords.some((keyword) => userInputLower.includes(keyword)) ||
      aiResponse.toLowerCase().includes("transportation")
    ) {
      result.shouldNavigate = true
      result.destination = "/transportation"
      result.message =
        "I'll take you to the Transportation section where you can arrange rides to your medical appointments."
    } else if (
      settingsKeywords.some((keyword) => userInputLower.includes(keyword)) ||
      aiResponse.toLowerCase().includes("settings")
    ) {
      result.shouldNavigate = true
      result.destination = "/settings"
      result.message = "I'll take you to the Settings section where you can configure your account preferences."
    } else if (suggestsNavigation) {
      // If AI suggests navigation but we couldn't determine where, use the default response
      result.message = aiResponse
    }

    return result
  }

  // Debounced function to toggle voice input
  const debouncedToggleVoiceInput = useCallback(
    debounce(() => {
      if (!isStartingOrStopping) {
        setIsStartingOrStopping(true)
        if (isListening) {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop()
            } catch (error) {
              console.error("Error stopping speech recognition:", error)
            }
          }
          setIsListening(false)
          setTranscript("")
        } else {
          setVoiceError(null)
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (error) {
              console.error("Error starting speech recognition:", error)
              setVoiceError("Failed to start speech recognition. Please try again or use text input instead.")
              setIsListening(false)
            }
          }
        }
        setIsStartingOrStopping(false)
      }
    }, 300),
    [isListening, isStartingOrStopping],
  )

  return (
    <Card className="w-full h-full flex flex-col border-0 rounded-none">
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"
                  } p-3 rounded-lg`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
            {isListening && (
              <div className="flex justify-start">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-6 bg-blue-600 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-8 bg-blue-600 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-4 bg-blue-600 rounded-full animate-pulse delay-300"></div>
                    <div className="w-2 h-5 bg-blue-600 rounded-full animate-pulse delay-450"></div>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Listening... {transcript ? `"${transcript}"` : ""}
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Voice input error message */}
      {voiceError && (
        <Alert variant="destructive" className="mx-4 mb-2">
          <AlertDescription>{voiceError}</AlertDescription>
        </Alert>
      )}

      {/* Quick navigation links */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 mb-2">Quick Navigation:</p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex items-center gap-1 bg-gray-50 dark:bg-gray-800"
              >
                <link.icon className="h-3 w-3" />
                {link.text}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder={isListening ? "Listening..." : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isListening}
            className="flex-1"
          />

          {/* Voice input button */}
          {voiceSupported && (
            <Button
              type="button"
              size="icon"
              onClick={debouncedToggleVoiceInput}
              disabled={isLoading || isStartingOrStopping}
              className={`${isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"} text-white`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Button
            type="submit"
            size="icon"
            disabled={isLoading || (!input.trim() && !isListening)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
