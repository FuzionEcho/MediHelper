"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, AlertCircle, Loader2, MapPin, Phone, ExternalLink, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AgentDetails } from "@/components/insurance/agent-details"
import { useGeolocation } from "@/hooks/use-geolocation"
import { findInsuranceAgents, geocodeAddress } from "@/app/actions/find-insurance-agents"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

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
  const [searchRadius, setSearchRadius] = useState(5000) // 5km default

  // Geolocation
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const { loading: geoLoading, error: geoError, location, getLocation } = useGeolocation()

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

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <PageHeader title="Insurance" showBackButton={true} backUrl="/dashboard" />
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
              <div className="space-y-4">
                {insuranceAgents.map((agent) => (
                  <Card key={agent.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {agent.photoUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={agent.photoUrl || "/placeholder.svg"}
                              alt={agent.name}
                              className="w-full md:w-32 h-32 object-cover rounded-md"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                              <span className="text-gray-700">{agent.address}</span>
                            </div>

                            {agent.phoneNumber && (
                              <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-gray-500 mt-1" />
                                <a href={`tel:${agent.phoneNumber}`} className="text-blue-600 hover:underline">
                                  {agent.phoneNumber}
                                </a>
                              </div>
                            )}

                            {agent.rating !== undefined && (
                              <div className="flex items-center">
                                <div className="flex text-yellow-400">
                                  {[...Array(Math.floor(agent.rating))].map((_, i) => (
                                    <span key={i} className="text-yellow-400">
                                      ★
                                    </span>
                                  ))}
                                  {[...Array(5 - Math.floor(agent.rating))].map((_, i) => (
                                    <span key={i} className="text-gray-300">
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                  {agent.rating.toFixed(1)} ({agent.totalRatings || 0} reviews)
                                </span>
                              </div>
                            )}

                            {agent.openNow !== undefined && (
                              <Badge
                                variant="outline"
                                className={
                                  agent.openNow
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                {agent.openNow ? "Open Now" : "Closed"}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${agent.location.lat},${agent.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <MapPin className="mr-2 h-4 w-4" />
                                Get Directions
                              </a>
                            </Button>

                            {agent.website && (
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={agent.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center"
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Website
                                </a>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAgentSelect(agent)}
                              className="flex items-center"
                            >
                              <Info className="mr-2 h-4 w-4" />
                              More Details
                            </Button>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <Badge className="mb-2 bg-blue-100 text-blue-800 border-blue-200">
                            {agent.distance} mi away
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
