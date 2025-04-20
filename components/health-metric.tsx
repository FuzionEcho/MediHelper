"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface HealthMetricProps {
  name: string
  value: number
  maxValue: number
  color: string
}

export function HealthMetric({ name, value, maxValue, color }: HealthMetricProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  const percentage = (value / maxValue) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm text-gray-500">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: isVisible ? `${percentage}%` : 0 }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  )
}
