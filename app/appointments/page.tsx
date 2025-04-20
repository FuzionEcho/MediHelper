"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  CalendarIcon,
  Clock,
  MapPin,
  Navigation,
  Star,
  ExternalLink,
  Phone,
  Info,
  Search,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { AppointmentConfirmation } from "@/components/appointments/confirmation"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { PageHeader } from "@/components/page-header"
import { saveTransportation } from "@/app/actions/save-transportation"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/context/notifications-context"
import { findNearbyClinicsGoogle, getClinicDetails, type Clinic } from "@/app/actions/find-nearby-clinics-google"
import { useCurrentLocation } from "@/hooks/use-current-location"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
// Import the debounce utility at the top of the file
import { debounce } from "@/utils/debounce"
import { geocodeAddress } from "@/app/actions/geocode-address"

export default function AppointmentsPage() {
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState<string>("10:00 AM")
  const [step, setStep] = useState(1)
  const [transportNeeded, setTransportNeeded] = useState(false)
  const [appointmentType, setAppointmentType] = useState("follow-up")
  const [provider, setProvider] = useState("")
  const [reason, setReason] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [transportType, setTransportType] = useState("standard")
  const [specialNeeds, setSpecialNeeds] = useState("")
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false)
  const [isSavingTransportation, setIsSavingTransportation] = useState(false)
  const [googleMapsAvailable, setGoogleMapsAvailable] = useState(true)
  const [nearbyClinics, setNearbyClinics] = useState<Clinic[]>([])
  const [isLoadingClinics, setIsLoadingClinics] = useState(false)
  const [userAddress, setUserAddress] = useState("")
  const [selectedClinicDetails, setSelectedClinicDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [searchRadius, setSearchRadius] = useState(10) // Default 10 miles
  const [showRadiusSelector, setShowRadiusSelector] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { location, loading: locationLoading, error: locationError } = useCurrentLocation()
  const [currentPage, setCurrentPage] = useState(1) // Pagination state
  // Add a new state for appointment data
  const [appointmentData, setAppointmentData] = useState<any>(null)

  // Memoize the clinic list to prevent unnecessary re-renders
  const memoizedClinics = useMemo(() => nearbyClinics, [nearbyClinics])

  // Time slots
  const timeSlots = [
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
  ]

  // Check if Google Maps API is available
  useEffect(() => {
    if (typeof window !== "undefined" && window.googleMapsApiKeyMissing) {
      setGoogleMapsAvailable(false)
      console.warn("Google Maps API is not available. Address autocomplete will be disabled.")
    }
  }, [])

  // Fetch additional details for a clinic
  const fetchClinicDetails = async (placeId: string) => {
    setIsLoadingDetails(true)
    try {
      const result = await getClinicDetails(placeId)
      if (result.success) {
        setSelectedClinicDetails(result.details)
      } else {
        console.error("Error fetching clinic details:", result.error)
      }
    } catch (error) {
      console.error("Error fetching clinic details:", error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Fetch nearby clinics when location is available
  useEffect(() => {
    const fetchNearbyClinics = async () => {
      if (location) {
        setIsLoadingClinics(true)
        try {
          const result = await findNearbyClinicsGoogle(location)
          if (result.success) {
            setNearbyClinics(result.clinics)
            // Only set the default provider if none is selected yet
            if (result.clinics.length > 0 && !provider) {
              setProvider(result.clinics[0].id)
              // Fetch details for the first clinic
              fetchClinicDetails(result.clinics[0].placeId)
            }
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to find nearby clinics",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error fetching nearby clinics:", error)
        } finally {
          setIsLoadingClinics(false)
        }
      }
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (location && !nearbyClinics.length) {
      // Only fetch if we don't already have clinics
      // Add a small delay to prevent multiple rapid searches
      searchTimeoutRef.current = setTimeout(() => {
        fetchNearbyClinics()
      }, 300)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [location, toast, provider, nearbyClinics.length]) // Add nearbyClinics.length to dependencies

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce(async (address: string) => {
      if (!address) {
        toast({
          title: "Address Required",
          description: "Please enter an address to find nearby clinics",
          variant: "destructive",
        })
        return
      }

      setIsLoadingClinics(true)
      try {
        const result = await findNearbyClinicsGoogle(address)
        if (result.success) {
          setNearbyClinics(result.clinics)
          // Only set the default provider if none is selected
          if (result.clinics.length > 0 && !provider) {
            setProvider(result.clinics[0].id)
            // Fetch details for the first clinic
            fetchClinicDetails(result.clinics[0].placeId)
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to find nearby clinics",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error searching clinics by address:", error)
      } finally {
        setIsLoadingClinics(false)
      }
    }, 500), // 500ms debounce time
    [toast],
  )

  // Replace the searchClinicsByAddress function with:
  const searchClinicsByAddress = () => {
    debouncedSearch(userAddress)
  }

  // Handle clinic selection
  const handleClinicSelect = (clinicId: string) => {
    setProvider(clinicId)
    const clinic = nearbyClinics.find((c) => c.id === clinicId)
    if (clinic) {
      fetchClinicDetails(clinic.placeId)
    }
  }

  // Inside the handleSubmit function, update the geocoding to get coordinates for both locations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      if (!provider) {
        toast({
          title: "Provider Required",
          description: "Please select a healthcare provider",
          variant: "destructive",
        })
        return
      }
      setStep(2)
    } else if (step === 2) {
      // Find the selected clinic
      const selectedClinic = nearbyClinics.find((clinic) => clinic.id === provider)

      if (!selectedClinic) {
        toast({
          title: "Error",
          description: "Selected clinic not found",
          variant: "destructive",
        })
        return
      }

      // Get coordinates for the destination (clinic)
      let destinationCoordinates = null
      if (selectedClinic.location) {
        destinationCoordinates = selectedClinic.location
      }

      // Get coordinates for the pickup address if transportation is needed
      let pickupCoordinates = null
      if (transportNeeded && pickupAddress) {
        try {
          const result = await geocodeAddress(pickupAddress)
          if (result.success && result.data) {
            pickupCoordinates = result.data.location
          }
        } catch (error) {
          console.error("Error geocoding pickup address:", error)
        }
      }

      // If transportation is needed, save the transportation data
      if (transportNeeded) {
        setIsSavingTransportation(true)
        try {
          const result = await saveTransportation({
            appointmentDate: date,
            appointmentTime: time,
            provider: selectedClinic.name,
            location: selectedClinic.address,
            pickupAddress,
            transportType:
              transportType === "standard"
                ? "Standard (Car/Van)"
                : transportType === "wheelchair"
                  ? "Wheelchair Accessible"
                  : "Medical Transport",
            specialNeeds: specialNeeds || undefined,
          })

          if (!result.success) {
            toast({
              title: "Error",
              description: result.error || "Failed to save transportation details",
              variant: "destructive",
            })
          } else {
            // Create a notification for the transportation
            addNotification({
              title: "Transportation Scheduled",
              message: `Transportation to ${selectedClinic.name} on ${format(date, "MMMM d, yyyy")} at ${time} has been scheduled.`,
              type: "transportation",
              link: "/transportation",
            })
          }
        } catch (error) {
          console.error("Error saving transportation:", error)
          toast({
            title: "Error",
            description: "An unexpected error occurred while saving transportation details",
            variant: "destructive",
          })
        } finally {
          setIsSavingTransportation(false)
        }
      }

      // Create a notification for the appointment
      addNotification({
        title: "Appointment Scheduled",
        message: `Your ${appointmentType === "follow-up" ? "follow-up visit" : appointmentType} at ${
          selectedClinic.name
        } on ${format(date, "MMMM d, yyyy")} at ${time} has been scheduled.`,
        type: "appointment",
        link: "/appointments",
      })

      setAppointmentConfirmed(true)
      setStep(3)

      // Pass the coordinates to the confirmation component
      setAppointmentData({
        date,
        time,
        appointmentType,
        provider: selectedClinic.name,
        location: selectedClinic.address || selectedClinic.vicinity,
        destinationCoordinates,
        transportNeeded,
        transportDetails: transportNeeded
          ? {
              pickupAddress,
              transportType:
                transportType === "standard"
                  ? "Standard (Car/Van)"
                  : transportType === "wheelchair"
                    ? "Wheelchair Accessible"
                    : "Medical Transport",
              pickupCoordinates,
            }
          : undefined,
      })
    }
  }

  const handleTimeSelect = (selectedTime: string) => {
    setTime(selectedTime)
  }

  const resetAppointment = () => {
    setDate(new Date())
    setTime("10:00 AM")
    setStep(1)
    setTransportNeeded(false)
    setAppointmentType("follow-up")
    setProvider("")
    setReason("")
    setPickupAddress("")
    setTransportType("standard")
    setSpecialNeeds("")
    setAppointmentConfirmed(false)
    setSelectedClinicDetails(null)
  }

  // Reset search when user wants to search again
  const resetSearch = () => {
    setIsLoadingClinics(false)
    setNearbyClinics([])
    setProvider("")
    setSelectedClinicDetails(null)
  }

  // Get the selected clinic
  const selectedClinic = nearbyClinics.find((clinic) => clinic.id === provider)

  // Update the step 3 rendering to use the appointmentData state
  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <PageHeader title="Appointments" showBackButton={true} />
      <div className="container max-w-4xl py-8 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Schedule an Appointment</h1>
          <p className="mt-2 text-gray-500">Book your next medical appointment and arrange transportation if needed</p>
        </div>

        {!googleMapsAvailable && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Google Maps API Key Missing</h3>
                  <div className="mt-2 text-sm">
                    <p>The Google Maps API key is not configured. Location features will be limited.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Find Nearby Clinics</CardTitle>
              <CardDescription>We'll show you healthcare providers near your location</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Location search section */}
                <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-teal-600" />
                      <h3 className="font-medium">Find Clinics Near You</h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRadiusSelector(!showRadiusSelector)}
                      className="flex items-center gap-1"
                    >
                      <span>Search Options</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {showRadiusSelector && (
                    <div className="p-3 border rounded-md bg-white">
                      <Label htmlFor="search-radius" className="text-sm font-medium mb-2 block">
                        Search Radius: {searchRadius} miles
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="search-radius"
                          min={1}
                          max={50}
                          step={1}
                          value={[searchRadius]}
                          onValueChange={(value) => setSearchRadius(value[0])}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={searchRadius}
                          onChange={(e) => setSearchRadius(Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  )}

                  {locationLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Clock className="h-5 w-5 animate-spin mr-2" />
                      <p>Getting your location...</p>
                    </div>
                  ) : locationError ? (
                    <div>
                      <p className="text-sm text-red-500 mb-2">{locationError}</p>
                      <p className="text-sm mb-3">Enter your address to find nearby clinics:</p>
                      <div className="flex gap-2">
                        {googleMapsAvailable ? (
                          <AddressAutocomplete
                            value={userAddress}
                            onChange={setUserAddress}
                            placeholder="Enter your address"
                            className="flex-1"
                          />
                        ) : (
                          <Textarea
                            placeholder="Enter your address"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            className="flex-1"
                          />
                        )}
                        <Button
                          type="button"
                          onClick={searchClinicsByAddress}
                          disabled={isLoadingClinics || !userAddress}
                        >
                          {isLoadingClinics ? (
                            <Clock className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Search className="h-4 w-4 mr-2" />
                          )}
                          Search
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-green-600 mb-3">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Location found! Showing clinics near you.
                        </span>
                      </p>
                      <div className="flex gap-2">
                        {googleMapsAvailable ? (
                          <AddressAutocomplete
                            value={userAddress}
                            onChange={setUserAddress}
                            placeholder="Search for clinics near a different address"
                            className="flex-1"
                          />
                        ) : (
                          <Textarea
                            placeholder="Search for clinics near a different address"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            className="flex-1"
                          />
                        )}
                        <Button
                          type="button"
                          onClick={() => {
                            resetSearch()
                            searchClinicsByAddress()
                          }}
                          disabled={isLoadingClinics || !userAddress}
                        >
                          {isLoadingClinics ? (
                            <Clock className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Search className="h-4 w-4 mr-2" />
                          )}
                          Search
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nearby clinics section */}
                <div className="space-y-2">
                  <Label htmlFor="provider">Select a Healthcare Provider</Label>
                  {isLoadingClinics ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-md p-3">
                          <div className="flex justify-between">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                          <Skeleton className="h-4 w-full mt-2" />
                          <Skeleton className="h-4 w-3/4 mt-1" />
                          <div className="flex gap-1 mt-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : nearbyClinics.length === 0 ? (
                    <div className="text-center p-4 border rounded-md">
                      <p className="text-gray-500">
                        No clinics found. Please try a different location or increase your search radius.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Add pagination state */}
                      {(() => {
                        // Pagination logic
                        const itemsPerPage = 3
                        const totalPages = Math.ceil(memoizedClinics.length / itemsPerPage)

                        // Get current items
                        const indexOfLastItem = currentPage * itemsPerPage
                        const indexOfFirstItem = indexOfLastItem - itemsPerPage
                        const currentClinics = memoizedClinics.slice(indexOfFirstItem, indexOfLastItem)

                        // Change page
                        const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

                        return (
                          <>
                            <div className="grid grid-cols-1 gap-3">
                              {currentClinics.map((clinic) => (
                                <div
                                  key={clinic.id}
                                  className={`border rounded-md p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                                    provider === clinic.id ? "ring-2 ring-teal-500 border-teal-500 bg-teal-50/30" : ""
                                  }`}
                                  onClick={() => handleClinicSelect(clinic.id)}
                                >
                                  {/* Existing clinic card content */}
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium">{clinic.name}</h3>
                                      <p className="text-sm text-gray-500 mt-1">{clinic.vicinity || clinic.address}</p>
                                      {clinic.rating && (
                                        <div className="flex items-center mt-1">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          <span className="text-sm ml-1">
                                            {clinic.rating} ({clinic.totalRatings || 0})
                                          </span>
                                          {clinic.openNow !== undefined && (
                                            <span
                                              className={`ml-2 text-xs ${clinic.openNow ? "text-green-600" : "text-red-500"}`}
                                            >
                                              {clinic.openNow ? "Open now" : "Closed"}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm text-teal-600 font-medium">
                                        {clinic.distance} mi away
                                      </span>
                                      <Sheet>
                                        <SheetTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              fetchClinicDetails(clinic.placeId)
                                            }}
                                          >
                                            <Info className="h-4 w-4 mr-1" />
                                            Details
                                          </Button>
                                        </SheetTrigger>
                                        <SheetContent>
                                          <SheetHeader>
                                            <SheetTitle>{clinic.name}</SheetTitle>
                                            <SheetDescription>Healthcare provider details</SheetDescription>
                                          </SheetHeader>
                                          <div className="mt-6 space-y-4">
                                            {isLoadingDetails ? (
                                              <div className="space-y-3">
                                                <Skeleton className="h-5 w-full" />
                                                <Skeleton className="h-5 w-full" />
                                                <Skeleton className="h-5 w-3/4" />
                                              </div>
                                            ) : selectedClinicDetails ? (
                                              <>
                                                <div>
                                                  <h4 className="text-sm font-medium mb-1">Address</h4>
                                                  <p className="text-sm">{selectedClinicDetails.address}</p>
                                                </div>

                                                {selectedClinicDetails.phone && (
                                                  <div>
                                                    <h4 className="text-sm font-medium mb-1">Phone</h4>
                                                    <p className="text-sm flex items-center">
                                                      <Phone className="h-3 w-3 mr-1" />
                                                      <a
                                                        href={`tel:${selectedClinicDetails.phone}`}
                                                        className="text-blue-600 hover:underline"
                                                      >
                                                        {selectedClinicDetails.phone}
                                                      </a>
                                                    </p>
                                                  </div>
                                                )}

                                                {selectedClinicDetails.website && (
                                                  <div>
                                                    <h4 className="text-sm font-medium mb-1">Website</h4>
                                                    <p className="text-sm flex items-center">
                                                      <ExternalLink className="h-3 w-3 mr-1" />
                                                      <a
                                                        href={selectedClinicDetails.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                      >
                                                        Visit website
                                                      </a>
                                                    </p>
                                                  </div>
                                                )}

                                                {selectedClinicDetails.openingHours && (
                                                  <div>
                                                    <h4 className="text-sm font-medium mb-1">Opening Hours</h4>
                                                    <ul className="text-sm space-y-1">
                                                      {selectedClinicDetails.openingHours.map(
                                                        (hours: string, index: number) => (
                                                          <li key={index}>{hours}</li>
                                                        ),
                                                      )}
                                                    </ul>
                                                  </div>
                                                )}

                                                {selectedClinicDetails.rating && (
                                                  <div>
                                                    <h4 className="text-sm font-medium mb-1">Rating</h4>
                                                    <p className="flex items-center">
                                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                      <span className="ml-1">
                                                        {selectedClinicDetails.rating} (
                                                        {selectedClinicDetails.totalRatings || 0} reviews)
                                                      </span>
                                                    </p>
                                                  </div>
                                                )}
                                              </>
                                            ) : (
                                              <p className="text-sm text-gray-500">No additional details available</p>
                                            )}
                                          </div>
                                        </SheetContent>
                                      </Sheet>
                                    </div>
                                  </div>

                                  {clinic.availableServices && clinic.availableServices.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {clinic.availableServices.slice(0, 3).map((service, index) => (
                                        <Badge
                                          key={index}
                                          variant="outline"
                                          className="bg-teal-50 text-teal-700 border-teal-200"
                                        >
                                          {service}
                                        </Badge>
                                      ))}
                                      {clinic.availableServices.length > 3 && (
                                        <Badge variant="outline" className="bg-gray-50">
                                          +{clinic.availableServices.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {clinic.photoUrl && (
                                    <div className="mt-3">
                                      <img
                                        src={clinic.photoUrl || "/placeholder.svg"}
                                        alt={clinic.name}
                                        className="w-full h-32 object-cover rounded-md"
                                      />
                                    </div>
                                  )}

                                  <div className="mt-3 flex justify-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={provider === clinic.id ? "default" : "outline"}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleClinicSelect(clinic.id)
                                      }}
                                    >
                                      {provider === clinic.id ? "Selected" : "Select This Clinic"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pagination controls */}
                            {totalPages > 1 && (
                              <div className="flex justify-center mt-4 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paginate(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                  {[...Array(totalPages)].map((_, i) => (
                                    <Button
                                      key={i}
                                      variant={currentPage === i + 1 ? "default" : "outline"}
                                      size="sm"
                                      className="w-8 h-8 p-0"
                                      onClick={() => paginate(i + 1)}
                                    >
                                      {i + 1}
                                    </Button>
                                  ))}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paginate(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-type">Appointment Type</Label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger id="appointment-type">
                      <SelectValue placeholder="Select appointment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="follow-up">Follow-up Visit</SelectItem>
                      <SelectItem value="new">New Patient Consultation</SelectItem>
                      <SelectItem value="specialist">Specialist Referral</SelectItem>
                      <SelectItem value="procedure">Medical Procedure</SelectItem>
                      <SelectItem value="test">Medical Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                        disabled={(date) => {
                          // Disable weekends and past dates
                          const day = date.getDay()
                          const isPastDate = date < new Date()
                          return day === 0 || day === 6 || isPastDate
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Reason for Visit</Label>
                  <Textarea
                    placeholder="Briefly describe the reason for your appointment"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Do you need transportation to your appointment?</Label>
                  <RadioGroup
                    value={transportNeeded ? "yes" : "no"}
                    onValueChange={(value) => setTransportNeeded(value === "yes")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="transport-yes" />
                      <Label htmlFor="transport-yes">Yes, I need transportation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="transport-no" />
                      <Label htmlFor="transport-no">No, I can arrange my own transportation</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!date || !provider || isLoadingClinics} variant="contrast">
                  Continue
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Select a Time Slot</CardTitle>
              <CardDescription>
                Available time slots for {date && format(date, "EEEE, MMMM d, yyyy")} at {selectedClinic?.name}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {timeSlots.map((timeSlot) => (
                    <Button
                      key={timeSlot}
                      type="button"
                      variant={time === timeSlot ? "default" : "outline"}
                      className={`h-auto py-4 ${time === timeSlot ? "ring-2 ring-blue-300 border-blue-700" : ""}`}
                      onClick={() => handleTimeSelect(timeSlot)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {timeSlot}
                    </Button>
                  ))}
                </div>

                {transportNeeded && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-teal-600" />
                      <h3 className="font-medium">Transportation Details</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pickup-address">Pickup Address</Label>
                      {googleMapsAvailable ? (
                        <AddressAutocomplete
                          value={pickupAddress}
                          onChange={setPickupAddress}
                          placeholder="Enter your pickup address"
                          required={transportNeeded}
                        />
                      ) : (
                        <Textarea
                          id="pickup-address"
                          placeholder="Enter your pickup address"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          required={transportNeeded}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transport-type">Transportation Type</Label>
                      <Select value={transportType} onValueChange={setTransportType}>
                        <SelectTrigger id="transport-type">
                          <SelectValue placeholder="Select transportation type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (Car/Van)</SelectItem>
                          <SelectItem value="wheelchair">Wheelchair Accessible</SelectItem>
                          <SelectItem value="medical">Medical Transport</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="special-needs">Special Needs or Instructions</Label>
                      <Textarea
                        id="special-needs"
                        placeholder="Any special requirements for your transportation"
                        value={specialNeeds}
                        onChange={(e) => setSpecialNeeds(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setStep(1)} className="mr-auto">
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!time || (transportNeeded && !pickupAddress) || isSavingTransportation}
                  variant="contrast"
                >
                  {isSavingTransportation ? "Saving..." : "Confirm Appointment"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {step === 3 && appointmentConfirmed && appointmentData && (
          <AppointmentConfirmation appointmentData={appointmentData} onReset={resetAppointment} />
        )}
      </div>
    </div>
  )
}
