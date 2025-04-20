"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, AlertCircle, Loader2, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InsuranceCompanyCard } from "@/components/insurance/company-card"
import { findInsuranceByZipCode, getLocationFromCoordinates } from "@/app/actions/find-insurance"
import { useGeolocation } from "@/hooks/use-geolocation"
import { Badge } from "@/components/ui/badge"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { PageHeader } from "@/components/page-header"

export default function InsuranceFinderPage() {
  const [zipCode, setZipCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[] | null>(null)
  const [searchedLocation, setSearchedLocation] = useState<{
    zipCode?: string
    city?: string
    state?: string
  } | null>(null)
  const [detectedLocation, setDetectedLocation] = useState<{
    zipCode?: string
    city?: string
    state?: string
    formattedAddress?: string
  } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const { loading: geoLoading, error: geoError, location, getLocation } = useGeolocation()

  // When geolocation coordinates are obtained, get the address details
  useEffect(() => {
    if (location) {
      setIsGettingLocation(true)
      setLocationError(null)

      getLocationFromCoordinates(location.latitude, location.longitude)
        .then((result) => {
          if (result.success && result.data) {
            setDetectedLocation(result.data)
            // Auto-fill the zip code field
            if (result.data.zipCode) {
              setZipCode(result.data.zipCode)
            }
          } else {
            setLocationError(result.error || "Failed to get your location details")
          }
        })
        .catch((err) => {
          console.error("Error getting location details:", err)
          setLocationError("Failed to get your location details")
        })
        .finally(() => {
          setIsGettingLocation(false)
        })
    }
  }, [location])

  // Handle geolocation errors
  useEffect(() => {
    if (geoError) {
      setLocationError(geoError)
    }
  }, [geoError])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!zipCode.trim() && !detectedLocation) {
      setError("Please enter a zip code or use your current location")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use either the entered zip code or the detected location
      const result = await findInsuranceByZipCode(
        zipCode || detectedLocation?.zipCode || "",
        detectedLocation?.city,
        detectedLocation?.state,
      )

      if (result.success && result.data) {
        setInsuranceCompanies(result.data)
        setSearchedLocation(result.location)
      } else {
        setError(result.error || "Failed to find insurance companies")
        setInsuranceCompanies(null)
      }
    } catch (err) {
      console.error("Error searching for insurance companies:", err)
      setError("An unexpected error occurred. Please try again.")
      setInsuranceCompanies(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseCurrentLocation = () => {
    getLocation()
  }

  const handleClearLocation = () => {
    setDetectedLocation(null)
    setLocationError(null)
  }

  const getLocationDisplay = () => {
    if (!searchedLocation) return null

    const parts = []
    if (searchedLocation.city) parts.push(searchedLocation.city)
    if (searchedLocation.state) parts.push(searchedLocation.state)
    if (searchedLocation.zipCode) parts.push(searchedLocation.zipCode)

    return parts.join(", ")
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <PageHeader title="Find Insurance" showBackButton={true} />
      <div className="container max-w-4xl py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Find Health Insurance Companies</h1>
          <p className="mt-2 text-gray-500">
            Search for health insurance providers that offer medical coverage in your area
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search by Location</CardTitle>
            <CardDescription>
              Enter your ZIP code or use your current location to find insurance companies in your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detectedLocation && (
                <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-md">
                  <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Using your current location</p>
                    <p className="text-xs text-gray-500">{detectedLocation.formattedAddress}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearLocation} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear location</span>
                  </Button>
                </div>
              )}

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
                      value={zipCode}
                      onChange={setZipCode}
                      placeholder="Enter ZIP code (e.g., 90210)"
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
                <Button type="submit" disabled={isLoading} className="w-full" variant="contrast">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find Insurance Companies
                    </>
                  )}
                </Button>
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

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p className="text-gray-500">
              Searching for insurance companies
              {zipCode ? ` in ${zipCode}` : detectedLocation ? " in your area" : ""}...
            </p>
          </div>
        )}

        {insuranceCompanies && insuranceCompanies.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Insurance Companies {getLocationDisplay() ? `in ${getLocationDisplay()}` : ""}
              </h2>
              <Badge variant="outline" className="bg-teal-50">
                {insuranceCompanies.length} companies found
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {insuranceCompanies.map((company, index) => (
                <InsuranceCompanyCard key={index} company={company} />
              ))}
            </div>
          </div>
        )}

        {insuranceCompanies && insuranceCompanies.length === 0 && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle>No Results Found</AlertTitle>
            <AlertDescription>
              We couldn't find any insurance companies for {getLocationDisplay() || "your location"}. Please try another
              ZIP code or contact your state's insurance department for assistance.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
