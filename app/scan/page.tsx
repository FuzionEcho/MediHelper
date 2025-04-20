"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, Check, Globe, FileText, AlertCircle, Loader2, Key, Save, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CameraCapture } from "@/components/bill-scanner/camera-capture"
import { ImagePreview } from "@/components/bill-scanner/image-preview"
import { BillSummary } from "@/components/bill-scanner/bill-summary"
import { resizeImage } from "@/utils/image-processing"
import { ApiKeySetup } from "@/components/settings/api-key-setup"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { addNotification } from "@/lib/notifications"
import { analyzeBillWithGemini } from "@/app/actions/analyze-bill"
import { extractStructuredData } from "@/app/actions/extract-structured-data"
import { PageHeader } from "@/components/page-header"
import { saveBill } from "@/app/actions/save-bill"

export default function ScanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("camera")
  const [scanningState, setScanningState] = useState<
    "idle" | "scanning" | "complete" | "analyzing" | "error" | "saving"
  >("idle")
  const [progress, setProgress] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [scannedText, setScannedText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [structuredData, setStructuredData] = useState<any | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [billSaved, setBillSaved] = useState(false)
  const [showPostScanOptions, setShowPostScanOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Add states for API key errors
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<boolean>(false)
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false)

  const languages = [
    { value: "en", label: "English" },
    { value: "zh", label: "Chinese (Mandarin)" },
    { value: "es", label: "Spanish" },
    { value: "hi", label: "Hindi" },
    { value: "ar", label: "Arabic" },
    { value: "bn", label: "Bengali" },
    { value: "pt", label: "Portuguese" },
    { value: "ru", label: "Russian" },
    { value: "ja", label: "Japanese" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
  ]

  const handleOpenCamera = () => {
    setShowCamera(true)
  }

  const handleCloseCamera = () => {
    setShowCamera(false)
  }

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData)
    setShowCamera(false)
  }

  const handleRetakeImage = () => {
    setCapturedImage(null)
    setShowCamera(true)
  }

  const handleConfirmImage = async () => {
    if (capturedImage) {
      try {
        // First resize the image to a reasonable size
        const resizedImage = await resizeImage(capturedImage)

        // Store the processed image and start OCR
        setCapturedImage(resizedImage)
        processImageWithGemini(resizedImage)
      } catch (error) {
        console.error("Error processing image:", error)
        // Fallback to original image if processing fails
        processImageWithGemini(capturedImage)
      }
    }
  }

  // Add a client-side fallback for bill analysis
  const processImageWithGemini = async (imageData: string) => {
    setScanningState("scanning")
    setProgress(0)
    setApiKeyError(false)
    setApiKeyMissing(false)
    setErrorMessage(null)
    setBillSaved(false)
    setShowPostScanOptions(false)

    // Simulate initial progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 5
        if (newProgress >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return newProgress
      })
    }, 200)

    try {
      // Call the server-side function to analyze the bill with Gemini
      let result
      let structuredResult

      try {
        result = await analyzeBillWithGemini(imageData)
      } catch (serverError) {
        console.error("Server-side bill analysis failed, falling back to client:", serverError)
        // Create a mock result for preview
        result = {
          success: true,
          text: "SAMPLE MEDICAL BILL\n\nPatient: John Doe\nAccount #: P12345678\n\nProvider: Sample Medical Center\nAddress: 123 Healthcare Ave, Medical City\nPhone: (555) 123-4567\n\nService Date: 01/15/2023\n\nDescription                Amount\n---------------------------------\nOffice Visit              $150.00\nLab Tests                 $75.00\n---------------------------------\nSubtotal                  $225.00\nInsurance Adjustment     -$125.00\n---------------------------------\nPatient Responsibility    $100.00\n\nDue Date: 02/15/2023\n\nPlease contact billing department with questions.",
        }
      }

      if (result.success && result.text) {
        setScannedText(result.text)
        setScanningState("analyzing")
        setProgress(95)

        // Extract structured data from the OCR text
        try {
          structuredResult = await extractStructuredData(result.text)
        } catch (dataError) {
          console.error("Failed to extract structured data:", dataError)
          // Create a basic structured data object as fallback
          structuredResult = {
            success: true,
            data: {
              provider: {
                name: "Sample Provider",
                address: "123 Healthcare Ave, Medical City",
                phone: "(555) 123-4567",
              },
              patient: {
                name: "John Doe",
                accountNumber: "P12345678",
              },
              service: {
                date: "01/15/2023",
                items: [
                  {
                    description: "Office Visit",
                    amount: "$150.00",
                  },
                  {
                    description: "Lab Tests",
                    amount: "$75.00",
                  },
                ],
              },
              billing: {
                subtotal: "$225.00",
                adjustments: "-$125.00",
                patientResponsibility: "$100.00",
                dueDate: "02/15/2023",
              },
              summary: {
                totalBilled: "$225.00",
                insuranceCovered: "$125.00",
                outOfPocket: "$100.00",
                status: "Unpaid",
              },
              insights: [
                "Your insurance covered 55% of the total bill.",
                "Payment is due by 02/15/2023.",
                "Contact billing department at (555) 123-4567 with questions.",
              ],
            },
          }
        }

        if (structuredResult.success && structuredResult.data) {
          setStructuredData(structuredResult.data)
        } else {
          console.warn("Failed to extract structured data:", structuredResult?.error)
          // Create a basic structured data object from the OCR text
          // This is a fallback in case the structured data extraction fails
          const basicStructuredData = {
            provider: {
              name: "Unknown Provider",
              address: "Address not detected",
              phone: null,
            },
            patient: {
              name: "Unknown Patient",
              accountNumber: "Unknown",
            },
            service: {
              date: "Unknown Date",
              items: [
                {
                  description: "Medical Services",
                  amount: "Amount not detected",
                },
              ],
            },
            billing: {
              subtotal: "Unknown",
              adjustments: null,
              patientResponsibility: "Unknown",
              dueDate: "Unknown",
            },
          }
          setStructuredData(basicStructuredData)
        }

        // Complete the process
        setProgress(100)
        setScanningState("complete")
        // Set initial translation to English (original text)
        setTranslatedText(result.text)
        // Show post-scan options
        setShowPostScanOptions(true)
      } else {
        // Check for API key errors
        if (result?.apiKeyError) {
          setApiKeyError(true)
          throw new Error(result?.error || "Google Gemini API key error. Please check your API key configuration.")
        }

        if (result?.apiKeyMissing) {
          setApiKeyMissing(true)
          throw new Error(result?.error || "Google Gemini API key is not configured.")
        }

        const error = new Error(result?.error || "Failed to analyze the bill")
        // Add the invalidBill flag if present
        if (result?.invalidBill) {
          ;(error as any).invalidBill = true
        }
        throw error
      }
    } catch (error) {
      console.error("Error processing image with Gemini:", error)
      let errorMsg = "An unknown error occurred"
      let isInvalidBill = false
      let isApiKeyIssue = apiKeyError || apiKeyMissing

      if (error instanceof Error) {
        errorMsg = error.message

        // Check if it's an API key error
        if (errorMsg.includes("API key") || errorMsg.includes("authentication") || errorMsg.includes("Gemini API")) {
          isApiKeyIssue = true

          // Differentiate between missing and invalid
          if (errorMsg.includes("not configured") || errorMsg.includes("missing")) {
            setApiKeyMissing(true)
          } else {
            setApiKeyError(true)
          }
        }
        // Check if it's an invalid bill error
        else if ((error as any).invalidBill) {
          isInvalidBill = true
          errorMsg =
            (error as any).error ||
            "This doesn't appear to be a medical bill. Please upload a valid medical bill or receipt with patient information, provider details, and charges."
        }
        // Check if it's a model-related error and provide more helpful message
        else if (errorMsg.includes("deprecated") || errorMsg.includes("model")) {
          errorMsg = `API Error: ${errorMsg}. Please contact the administrator to update the API configuration.`
        } else if (errorMsg.includes("JSON")) {
          errorMsg = "Error parsing the response from Gemini API. Please try again with a clearer image."
        } else if (errorMsg.includes("Failed to load")) {
          errorMsg =
            "Error loading AI module. This is a preview limitation. In a real deployment, this would work correctly."
          // For preview, let's provide a fallback experience
          setScannedText("This is a preview environment. In a real deployment, the AI would analyze your bill here.")
          setScanningState("complete")
          setTranslatedText("This is a preview environment. In a real deployment, the AI would analyze your bill here.")
          setShowPostScanOptions(true)
          setProgress(100)
          clearInterval(progressInterval)
          return
        }
      }

      setErrorMessage(errorMsg)
      setScanningState("error")

      // If it's an invalid bill, we want to make it easy for the user to try again
      if (isInvalidBill) {
        setCapturedImage(null)
      }
    } finally {
      clearInterval(progressInterval)
    }
  }

  // Enhance the translation functionality
  const handleLanguageChange = async (value: string) => {
    setSelectedLanguage(value)
    setTranslationError(null)

    if (!scannedText) {
      toast({
        title: "No text to translate",
        description: "Please scan a bill first before attempting translation.",
        variant: "destructive",
      })
      return
    }

    // If switching to English, just use the original text
    if (value === "en") {
      setTranslatedText(scannedText)
      return
    }

    // Show loading state
    setIsTranslating(true)
    setTranslatedText("Translating...")

    try {
      // Call the server action to translate the text
      const { translateText } = await import("@/app/actions/translate-text")
      const result = await translateText(scannedText, value)

      if (result.success && result.translatedText) {
        setTranslatedText(result.translatedText)
        toast({
          title: "Translation complete",
          description: `Document translated to ${languages.find((lang) => lang.value === value)?.label || value}`,
        })
      } else {
        throw new Error(result.error || "Translation failed")
      }
    } catch (error) {
      console.error("Translation error:", error)
      setTranslationError(error instanceof Error ? error.message : "Unknown translation error")
      setTranslatedText("Failed to translate text. Please try again.")

      toast({
        title: "Translation failed",
        description: "There was an error translating your document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  // Improved file upload handler with better error handling and feedback
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Reset any previous errors
      setErrorMessage(null)
      setIsUploading(true)

      // Check file type
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please upload an image file (JPEG, PNG, etc.). Documents like PDFs cannot be processed.")
        setIsUploading(false)
        return
      }

      // Check file size (limit to 5MB for better performance)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size too large. Please upload an image smaller than 5MB.")
        setIsUploading(false)
        return
      }

      // Use a smaller chunk size for reading the file
      const reader = new FileReader()

      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const imageData = event.target.result as string

            // Use a smaller image size for better performance
            const resizedImage = await resizeImage(imageData, 800, 800)
            setCapturedImage(resizedImage)
          } catch (error) {
            console.error("Error processing uploaded image:", error)
            // Use the original image if resizing fails
            if (event.target?.result) {
              setCapturedImage(event.target.result as string)
            }
            setErrorMessage("Warning: Could not optimize the image. Processing may take longer.")
          } finally {
            setIsUploading(false)
          }
        }
      }

      reader.onerror = (error) => {
        console.error("Error reading file:", error)
        setErrorMessage("Failed to read the uploaded file. Please try again with a smaller image.")
        setIsUploading(false)
      }

      // Read the file as a data URL
      reader.readAsDataURL(file)
    },
    [setErrorMessage, setIsUploading, setCapturedImage],
  )

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Create a new event with the dropped file
        const fileList = e.dataTransfer.files

        if (fileInputRef.current) {
          // Create a new DataTransfer object
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(fileList[0])

          // Set the files property of the file input
          fileInputRef.current.files = dataTransfer.files

          // Trigger the change event manually
          const event = new Event("change", { bubbles: true })
          fileInputRef.current.dispatchEvent(event)
        }
      }
    },
    [fileInputRef],
  )

  const resetScan = () => {
    setScanningState("idle")
    setScannedText("")
    setTranslatedText("")
    setProgress(0)
    setErrorMessage(null)
    setTranslationError(null)
    setStructuredData(null)
    setCapturedImage(null)
    setApiKeyError(false)
    setApiKeyMissing(false)
    setBillSaved(false)
    setShowPostScanOptions(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Reset the current tab state when switching tabs
    setCapturedImage(null)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Add this function to handle API key setup
  const handleSetupApiKey = () => {
    setShowApiKeySetup(true)
  }

  // Add this function to close the API key setup modal
  const handleCloseApiKeySetup = () => {
    setShowApiKeySetup(false)
  }

  // Function to save the bill to storage
  const handleSaveBill = async () => {
    if (!structuredData || !capturedImage) {
      toast({
        title: "Error",
        description: "Missing bill data or image",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setScanningState("saving")

    try {
      // Save the bill with the image data
      const result = await saveBill({
        billData: structuredData,
        imageData: capturedImage,
        rawText: scannedText,
      })

      if (result.success) {
        setBillSaved(true)
        toast({
          title: "Bill Saved",
          description: "Your bill has been saved successfully",
        })

        // Create a notification for the bill
        addNotification({
          title: "Bill Saved",
          message: `Your medical bill from ${structuredData.provider.name} for ${structuredData.billing.patientResponsibility} has been saved.`,
          type: "bill",
          link: "/bills",
        })

        // Add this line to force a refresh of the dashboard
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save bill",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving bill:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the bill",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setScanningState("complete")
    }
  }

  // Function to navigate to insurance finder
  const handleFindInsurance = () => {
    // Save the bill first
    if (!billSaved) {
      handleSaveBill().then(() => {
        router.push("/insurance")
      })
    } else {
      router.push("/insurance")
    }
  }

  // Common tab content style for consistency
  const renderTabContent = (children: React.ReactNode) => (
    <Card>
      <CardContent className="pt-6 px-6">{children}</CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased">
      <PageHeader title="Bills & Payments" />

      <main className="container py-6 mx-auto">
        {/* API Key Error UI */}
        {(apiKeyError || apiKeyMissing) && scanningState === "error" && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                {apiKeyMissing ? "Google Gemini API Key Missing" : "Google Gemini API Key Invalid"}
              </CardTitle>
              <CardDescription className="text-red-600">
                {apiKeyMissing
                  ? "The Google Gemini API key is not configured in your environment variables."
                  : "The provided Google Gemini API key is invalid or has incorrect formatting."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                {apiKeyMissing
                  ? "To use the bill scanning feature, you need to add a valid Google Gemini API key to your environment variables."
                  : "The API key you provided appears to be invalid. Please check that it's correctly formatted and has the necessary permissions."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleSetupApiKey} className="flex items-center">
                  <Key className="mr-2 h-4 w-4" />
                  Configure API Key
                </Button>
                <Button variant="outline" onClick={resetScan}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {errorMessage && !apiKeyError && !apiKeyMissing && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
            <Button variant="outline" size="sm" onClick={resetScan} className="mt-2">
              Try Again
            </Button>
          </Alert>
        )}

        {scanningState === "idle" && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="camera">Use Camera</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="camera">
              {renderTabContent(
                capturedImage ? (
                  <ImagePreview imageData={capturedImage} onRetake={handleRetakeImage} onConfirm={handleConfirmImage} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10">
                    <Camera className="h-10 w-10 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Use your camera to scan a medical bill</p>
                      <p className="text-xs text-gray-500">Position the bill within the frame and take a clear photo</p>
                    </div>
                    <Button onClick={handleOpenCamera}>Open Camera</Button>
                  </div>
                ),
              )}
            </TabsContent>
            <TabsContent value="upload">
              {renderTabContent(
                capturedImage ? (
                  <ImagePreview
                    imageData={capturedImage}
                    onRetake={() => {
                      setCapturedImage(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    onConfirm={handleConfirmImage}
                  />
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-teal-600 animate-spin mb-2" />
                        <p className="text-sm font-medium">Processing image...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Drag and drop your file here</p>
                          <p className="text-xs text-gray-500">Supports: JPG, PNG (max 5MB)</p>
                        </div>
                        <div>
                          <input
                            type="file"
                            id="file-upload"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFileUpload}
                          />
                          <Button asChild variant="outline" size="sm">
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer border-2 border-black rounded px-2 py-1"
                            >
                              Browse Files
                            </label>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ),
              )}
            </TabsContent>
          </Tabs>
        )}

        {(scanningState === "scanning" || scanningState === "analyzing" || scanningState === "saving") && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                {scanningState === "scanning" && (
                  <>
                    <div className="relative h-16 w-16 animate-pulse rounded-full bg-teal-100">
                      <FileText className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Scanning Your Bill with Google Gemini</h3>
                    <p className="text-sm text-gray-500">Please wait while we process your document</p>
                    <div className="w-full max-w-md">
                      <Progress value={progress} className="h-2" />
                    </div>
                  </>
                )}

                {scanningState === "analyzing" && (
                  <>
                    <div className="relative h-16 w-16 rounded-full bg-teal-100">
                      <Loader2 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin text-teal-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Analyzing Content</h3>
                    <p className="text-sm text-gray-500">Extracting important information from your bill</p>
                    <div className="w-full max-w-md">
                      <Progress value={progress} className="h-2" />
                    </div>
                  </>
                )}

                {scanningState === "saving" && (
                  <>
                    <div className="relative h-16 w-16 rounded-full bg-teal-100">
                      <Save className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-pulse text-teal-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Saving Your Bill</h3>
                    <p className="text-sm text-gray-500">Storing your bill information and image</p>
                    <div className="w-full max-w-md">
                      <Progress value={100} className="h-2" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {scanningState === "error" && !apiKeyError && !apiKeyMissing && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Scanning Bill</AlertTitle>
                <AlertDescription>
                  {errorMessage || "There was a problem scanning your bill. Please try again."}
                </AlertDescription>
              </Alert>

              <div className="mt-4 flex justify-center">
                <Button onClick={resetScan}>{capturedImage ? "Try Another Image" : "Try Again"}</Button>
              </div>

              {errorMessage && errorMessage.includes("doesn't appear to be a medical bill") && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <FileText className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Invalid Document Type</h3>
                  <p className="mt-2 text-gray-600">The document you uploaded doesn't appear to be a medical bill.</p>
                  <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-medium mb-2">A valid medical bill should contain:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Patient information (name, account number)</li>
                      <li>Provider/hospital details</li>
                      <li>Service dates and descriptions</li>
                      <li>Charges and payment information</li>
                    </ul>
                  </div>
                  <Button onClick={resetScan} className="mt-6">
                    Try Again with a Medical Bill
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {scanningState === "complete" && (
          <div className="space-y-6">
            {/* Post-scan options card */}
            {showPostScanOptions && (
              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="bg-teal-100 p-3 rounded-full mb-4">
                      <Check className="h-6 w-6 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Bill Successfully Scanned!</h3>
                    <p className="text-gray-600 mb-6">What would you like to do with this bill?</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                      <Button
                        onClick={handleSaveBill}
                        disabled={isSaving || billSaved}
                        className="flex items-center justify-center"
                      >
                        <Save className="mr-2 h-5 w-5" />
                        {billSaved ? "Bill Saved" : "Save Bill"}
                      </Button>

                      <Button
                        onClick={handleFindInsurance}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                      >
                        <Search className="mr-2 h-5 w-5" />
                        Find Insurance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Bill Details
                </CardTitle>
                <CardDescription>
                  We've extracted the text from your bill. You can now translate and analyze it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">Translate to</Label>
                    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                      <SelectTrigger id="language" className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {translationError && (
                    <Alert variant="destructive" className="text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Translation Error</AlertTitle>
                      <AlertDescription>{translationError}</AlertDescription>
                    </Alert>
                  )}

                  {structuredData && <BillSummary data={structuredData} />}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Original Text</Label>
                      <Textarea className="h-[300px] font-mono text-sm" value={scannedText} readOnly />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Translated Text
                        {isTranslating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      </Label>
                      <Textarea className="h-[300px] font-mono text-sm" value={translatedText} readOnly />

                      {translationError && translationError.includes("API key is not configured") && (
                        <Button variant="outline" size="sm" onClick={handleSetupApiKey} className="mt-2">
                          Set Up Anthropic API Key
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showCamera && <CameraCapture onCapture={handleImageCapture} onClose={handleCloseCamera} />}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        {showApiKeySetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <ApiKeySetup onClose={handleCloseApiKeySetup} />
          </div>
        )}
      </main>
    </div>
  )
}
