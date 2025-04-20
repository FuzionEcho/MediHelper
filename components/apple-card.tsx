"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"

interface AppleCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
}

export function AppleCard({ children, className = "", hoverEffect = true }: AppleCardProps) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverEffect) return

    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate rotation values based on mouse position
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateXVal = ((y - centerY) / centerY) * -5 // Max 5 degrees
    const rotateYVal = ((x - centerX) / centerX) * 5 // Max 5 degrees

    setRotateX(rotateXVal)
    setRotateY(rotateYVal)
  }

  const handleMouseLeave = () => {
    if (!hoverEffect) return
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: "transform 0.3s ease",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={hoverEffect ? { scale: 1.02 } : {}}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}
