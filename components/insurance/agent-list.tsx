"use client"

import { Star, ExternalLink, Phone, MapPin, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Location {
  lat: number
  lng: number
}

interface InsuranceAgent {
  id: string
  name: string
  address: string
  rating?: number
  totalRatings?: number
  phoneNumber?: string
  website?: string
  openNow?: boolean
  location: Location
  photoUrl?: string
  types: string[]
  distance?: number
}

interface AgentListProps {
  agents: InsuranceAgent[]
  onAgentSelect: (agent: InsuranceAgent) => void
  selectedAgentId?: string
}

export function AgentList({ agents, onAgentSelect, selectedAgentId }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No insurance agents found in this area.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className={`cursor-pointer transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
            selectedAgentId === agent.id
              ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          onClick={() => onAgentSelect(agent)}
        >
          <CardContent className="p-4">
            <div className="flex gap-3">
              {agent.photoUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={agent.photoUrl || "/placeholder.svg"}
                    alt={agent.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span className="truncate">{agent.address}</span>
                </div>

                {agent.rating !== undefined && (
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">{agent.rating}</span>
                    {agent.totalRatings !== undefined && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">({agent.totalRatings})</span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.openNow !== undefined && (
                    <Badge
                      variant={agent.openNow ? "default" : "outline"}
                      className={
                        agent.openNow
                          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                          : ""
                      }
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {agent.openNow ? "Open Now" : "Closed"}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {agent.phoneNumber && (
                    <Button size="sm" variant="outline" asChild className="bg-white dark:bg-gray-800">
                      <a href={`tel:${agent.phoneNumber}`}>
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}
                  {agent.website && (
                    <Button size="sm" variant="outline" asChild className="bg-white dark:bg-gray-800">
                      <a href={agent.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Website
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild className="bg-white dark:bg-gray-800">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${agent.location.lat},${agent.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      Directions
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
