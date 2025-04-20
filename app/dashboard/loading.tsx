import { Heart } from "lucide-react"

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <Heart className="h-16 w-16 text-blue-600" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-800 animate-fade-in-up">ClaimCare</h1>
      <p className="mt-2 text-gray-500 animate-fade-in-up delay-200">Loading your health dashboard...</p>
    </div>
  )
}
