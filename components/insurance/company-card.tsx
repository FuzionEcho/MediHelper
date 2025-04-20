import { Star, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface InsuranceCompanyProps {
  company: {
    name: string
    description: string
    planTypes: string[]
    rating: number
    acceptsMedicaid: boolean
    acceptsMedicare: boolean
  }
}

export function InsuranceCompanyCard({ company }: InsuranceCompanyProps) {
  // Generate star rating display
  const fullStars = Math.floor(company.rating)
  const hasHalfStar = company.rating - fullStars >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{company.name}</CardTitle>
          <div className="flex text-yellow-400">
            {[...Array(fullStars)].map((_, i) => (
              <Star key={`full-${i}`} className="h-4 w-4 fill-current" />
            ))}
            {hasHalfStar && (
              <span className="relative">
                <Star className="h-4 w-4 text-gray-300" />
                <Star
                  className="absolute top-0 left-0 h-4 w-4 fill-current overflow-hidden"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              </span>
            )}
            {[...Array(emptyStars)].map((_, i) => (
              <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
            ))}
            <span className="ml-1 text-xs text-gray-600">{company.rating.toFixed(1)}</span>
          </div>
        </div>
        <CardDescription>{company.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Plan Types</h4>
            <div className="flex flex-wrap gap-1">
              {company.planTypes.map((plan, index) => (
                <Badge key={index} variant="outline" className="bg-teal-50">
                  {plan}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={`p-1 rounded-full ${company.acceptsMedicaid ? "bg-green-100" : "bg-red-100"}`}>
                {company.acceptsMedicaid ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
              </div>
              <span>Medicaid</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`p-1 rounded-full ${company.acceptsMedicare ? "bg-green-100" : "bg-red-100"}`}>
                {company.acceptsMedicare ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
              </div>
              <span>Medicare</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
