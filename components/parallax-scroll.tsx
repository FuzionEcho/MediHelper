"use client"

import { type ReactNode, useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface ParallaxProps {
  children: ReactNode
  offset?: number
  className?: string
}

export function ParallaxScroll({ children, offset = 50, className = "" }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [elementTop, setElementTop] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)

  const { scrollY } = useScroll()

  // Initialize necessary values upon mounting
  useEffect(() => {
    if (!ref.current) return

    const setValues = () => {
      setElementTop(ref.current?.getBoundingClientRect().top + window.scrollY || 0)
      setClientHeight(window.innerHeight)
    }

    setValues()
    window.addEventListener("resize", setValues)

    return () => window.removeEventListener("resize", setValues)
  }, [])

  const y = useTransform(scrollY, [elementTop - clientHeight, elementTop + offset], [0, -offset], { clamp: false })

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={`relative ${className}`}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}
