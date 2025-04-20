"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ApiKeySetupProps {
  onClose: () => void
}

export function ApiKeySetup({ onClose }: ApiKeySetupProps) {
  const [activeTab, setActiveTab] = useState("gemini")
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [anthropicApiKey, setAnthropicApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const apiKey = activeTab === "gemini" ? geminiApiKey : anthropicApiKey
    if (!apiKey.trim()) {
      setError(`Please enter a valid ${activeTab === "gemini" ? "Google Gemini" : "Anthropic"} API key`)
      return
    }

    // Basic validation for Google Gemini API key format
    if (activeTab === "gemini" && !apiKey.startsWith("AIza")) {
      setError("Google Gemini API keys typically start with 'AIza'. Please check your API key.")
      return
    }

    // Basic validation for Anthropic API key format
    if (activeTab === "anthropic" && !apiKey.startsWith("sk-ant-")) {
      setError("Anthropic API keys typically start with 'sk-ant-'. Please check your API key.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // In a real app, you would save this to a secure backend
      // For demo purposes, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      setSuccess(true)

      // In a real app, you would need to restart the server or update environment variables
      // This is just a placeholder for demonstration
    } catch (err) {
      setError("Failed to save API key. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Common tab content style for consistency
  const renderTabContent = (
    title: string,
    description: string,
    steps: string[],
    keyId: string,
    keyValue: string,
    setKeyValue: (value: string) => void,
    placeholder: string,
  ) => (
    <div className="space-y-4">
      <p className="text-sm">{description}</p>
      <ol className="list-decimal pl-5 space-y-2 text-sm">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>

      {error && activeTab === (keyId === "gemini-api-key" ? "gemini" : "anthropic") && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={keyId}>{title}</Label>
        <Input
          id={keyId}
          type="password"
          placeholder={placeholder}
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
        />
        <p className="text-xs text-gray-500">Your API key will be stored securely in your environment variables.</p>
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set Up API Keys</CardTitle>
        <CardDescription>Configure API keys for the application's AI features</CardDescription>
      </CardHeader>
      <CardContent>
        {!success ? (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="gemini">Google Gemini</TabsTrigger>
                <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
              </TabsList>

              <TabsContent value="gemini">
                {renderTabContent(
                  "Google Gemini API Key",
                  "The Google Gemini API key is required for bill scanning and analysis features. Follow these steps:",
                  [
                    "Visit the Google AI Studio",
                    "Create an account or sign in with your Google account",
                    "Navigate to the API Keys section",
                    "Generate a new API key",
                    "Copy the API key and paste it below",
                  ],
                  "gemini-api-key",
                  geminiApiKey,
                  setGeminiApiKey,
                  "Enter your Google Gemini API key",
                )}
              </TabsContent>

              <TabsContent value="anthropic">
                {renderTabContent(
                  "Anthropic API Key",
                  "The Anthropic API key is required for translation features. Follow these steps:",
                  [
                    "Visit the Anthropic Platform",
                    "Create an account or sign in",
                    "Navigate to API Keys section",
                    "Generate a new API key",
                    "Copy the API key and paste it below",
                  ],
                  "anthropic-api-key",
                  anthropicApiKey,
                  setAnthropicApiKey,
                  "Enter your Anthropic API key",
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>API Key Saved</AlertTitle>
            <AlertDescription>
              Your API key has been saved. To complete the setup, you need to:
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
                <li>
                  Add the API key to your .env.local file as{" "}
                  {activeTab === "gemini" ? "GOOGLE_GEMINI_API_KEY" : "ANTHROPIC_API_KEY"}
                </li>
                <li>Restart your application</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {!success && (
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || (activeTab === "gemini" ? !geminiApiKey.trim() : !anthropicApiKey.trim())}
            variant="contrast"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
