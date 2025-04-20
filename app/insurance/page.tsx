"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, AlertCircle, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MapView } from "@/components/insurance/map-view"
import { AgentList } from "@/components/insurance/agent-list"
import { AgentDetails } from "@/components/insurance/agent-details"
import { useGeolocation } from "@/hooks/use-geolocation"
import { findInsuranceAgents, geocodeAddress } from "@/app/actions/find-insurance-agents"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { PageHeader } from "@/components/page-header"
import { loadGoogleMapsApi } from "@/utils/load-google-maps"

export default function InsurancePage() {
  // State for search
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insuranceAgents, setInsuranceAgents] = useState<any[] | null>(null)
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number
    lng: number
    address?: string
  } | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined)
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null)
  const [showAgentDetails, setShowAgentDetails] = useState(false)
  const [activeView, setActiveView] = useState<"map" | "list">("map")
  const [searchRadius, setSearchRadius] = useState(5000) // 5km default
  const [googleMapsAvailable, setGoogleMapsAvailable] = useState(true)

  // Geolocation
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const { loading: geoLoading, error: geoError, location, getLocation } = useGeolocation()

  // Add this useEffect right after your state declarations
  useEffect(() => {
    // Define the initMap function on the window object
    window.initMap = () => {
      // This is just a placeholder function
      console.log("Maps API loaded successfully")
    }

    // Load the Google Maps API
    loadGoogleMapsApi("initMap").catch((error) => {
      console.error("Failed to load Google Maps:", error)
      setGoogleMapsAvailable(false)
    })
  }, [])

  // Handle geolocation
  useEffect(() => {
    if (location) {
      setIsGettingLocation(true)
      setLocationError(null)

      // Use the coordinates directly
      const userLocation = {
        lat: location.latitude,
        lng: location.longitude,
      }

      setSearchedLocation(userLocation)
      searchForAgents(userLocation)
      setIsGettingLocation(false)
    }
  }, [location])

  // Handle geolocation errors
  useEffect(() => {
    if (geoError) {
      setLocationError(geoError)
      setIsGettingLocation(false)
    }
  }, [geoError])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setError("Please enter a location or use your current location")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Geocode the address
      const result = await geocodeAddress(searchQuery)

      if (result.success && result.data) {
        setSearchedLocation({
          ...result.data.location,
          address: result.data.formattedAddress,
        })

        // Search for agents at this location
        await searchForAgents(result.data.location)
      } else {
        setError(result.error || "Failed to find location")
        setInsuranceAgents(null)
      }
    } catch (err) {
      console.error("Error searching for location:", err)
      setError("An unexpected error occurred. Please try again.")
      setInsuranceAgents(null)
    } finally {
      setIsLoading(false)
    }
  }

  const searchForAgents = async (location: { lat: number; lng: number }) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await findInsuranceAgents(location, searchRadius)

      if (result.success && result.data) {
        setInsuranceAgents(result.data)
      } else {
        setError(result.error || "Failed to find insurance agents")
        setInsuranceAgents([])
      }
    } catch (err) {
      console.error("Error searching for insurance agents:", err)
      setError("An unexpected error occurred. Please try again.")
      setInsuranceAgents([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseCurrentLocation = () => {
    getLocation()
  }

  const handleAgentSelect = (agent: any) => {
    setSelectedAgentId(agent.id)
    setSelectedAgent(agent)
    setShowAgentDetails(true)
  }

  const handleRadiusChange = (value: string) => {
    const radius = Number.parseInt(value)
    setSearchRadius(radius)

    // If we already have a location, search again with new radius
    if (searchedLocation) {
      searchForAgents(searchedLocation)
    }
  }

  // Common tab content style for consistency
  const renderTabContent = (children: React.ReactNode) => (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">{children}</div>
  )

  // Handle view toggle when map fails to load
  const handleViewToggle = (value: string) => {
    if (value === "map" && window.googleMapsApiKeyMissing) {
      // If trying to switch to map view but Google Maps API key is missing
      setActiveView("list")
      // Show a notification or alert here if needed
    } else {
      setActiveView(value as "map" | "list")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      {/* Force list view if Google Maps API key is missing */}
      {useEffect(() => {
        if (window.googleMapsApiKeyMissing && activeView === "map") {
          setActiveView("list")
        }
      }, [activeView])}
      <PageHeader title="Insurance" showBackButton={true} />
      <div className="container max-w-6xl py-8 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Find Health Insurance Agents</h1>
          <p className="mt-2 text-gray-500">
            Search for health insurance companies and medical coverage specialists in your area
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Search for Insurance Agents</CardTitle>
            <CardDescription>
              Enter your location or use your current location to find insurance agents near you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationError && (
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Location Error</AlertTitle>
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex-1">
                    <AddressAutocomplete
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Enter address, city, or ZIP code"
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={geoLoading || isGettingLocation}
                  >
                    {geoLoading || isGettingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Locating...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Use My Location
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="w-full sm:w-48">
                    <Label htmlFor="search-radius" className="text-sm">
                      Search Radius
                    </Label>
                    <Select value={searchRadius.toString()} onValueChange={handleRadiusChange}>
                      <SelectTrigger id="search-radius">
                        <SelectValue placeholder="Select radius" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">1 km</SelectItem>
                        <SelectItem value="2000">2 km</SelectItem>
                        <SelectItem value="5000">5 km</SelectItem>
                        <SelectItem value="10000">10 km</SelectItem>
                        <SelectItem value="20000">20 km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 sm:mt-6">
                    <Button type="submit" disabled={isLoading} className="w-full" variant="contrast">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Find Insurance Agents
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !insuranceAgents && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p className="text-gray-500">
              Searching for insurance agents
              {searchQuery ? ` near ${searchQuery}` : " near your location"}...
            </p>
          </div>
        )}

        {insuranceAgents && searchedLocation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Insurance Agents{" "}
                  {searchedLocation.address ? `near ${searchedLocation.address}` : "near your location"}
                </h2>
                {insuranceAgents.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Found {insuranceAgents.length} insurance {insuranceAgents.length === 1 ? "agent" : "agents"} within{" "}
                    {searchRadius / 1000} km
                  </p>
                )}
              </div>

              {insuranceAgents.length > 0 && (
                <div className="flex items-center">
                  <Tabs value={activeView} onValueChange={handleViewToggle} className="hidden sm:block">
                    <TabsList>
                      <TabsTrigger value="map" disabled={window.googleMapsApiKeyMissing}>
                        Map View
                      </TabsTrigger>
                      <TabsTrigger value="list">List View</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>

            {insuranceAgents.length === 0 ? (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>No Results Found</AlertTitle>
                <AlertDescription>
                  We couldn't find any insurance agents in this area. Try expanding your search radius or searching in a
                  different location.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`md:col-span-2 ${activeView === "list" ? "hidden md:block" : ""}`}>
                  {renderTabContent(
                    <MapView
                      agents={insuranceAgents}
                      center={searchedLocation}
                      onAgentSelect={handleAgentSelect}
                      selectedAgentId={selectedAgentId}
                    />,
                  )}
                </div>

                <div className={`${activeView === "map" ? "hidden md:block" : ""}`}>
                  {renderTabContent(
                    <AgentList
                      agents={insuranceAgents}
                      onAgentSelect={handleAgentSelect}
                      selectedAgentId={selectedAgentId}
                    />,
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agent Details Sheet */}
        {selectedAgent && (
          <Sheet open={showAgentDetails} onOpenChange={setShowAgentDetails}>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Agent Details</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <AgentDetails agent={selectedAgent} onClose={() => setShowAgentDetails(false)} />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  )
}
