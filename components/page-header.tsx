"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Search, Plus } from "lucide-react"
import { usePathname } from "next/navigation"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface PageHeaderProps {
  title?: string
  showBackButton?: boolean
  backUrl?: string
}

export function PageHeader({ title, showBackButton = false, backUrl = "/dashboard" }: PageHeaderProps) {
  const [dateTime, setDateTime] = useState(new Date())
  const { scrollYProgress } = useScroll()
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8])
  const pathname = usePathname()

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Determine page title if not provided
  const getPageTitle = () => {
    if (title) return title

    if (pathname.includes("/dashboard")) return "Dashboard"
    if (pathname.includes("/scan")) return "Bills & Payments"
    if (pathname.includes("/appointments")) return "Appointments"
    if (pathname.includes("/insurance")) return "Insurance"
    if (pathname.includes("/insurance-finder")) return "Find Insurance"
    if (pathname.includes("/notifications")) return "Notifications"
    if (pathname.includes("/settings")) return "Settings"

    return "ClaimCare"
  }

  return (
    <motion.header
      style={{ opacity: headerOpacity }}
      className="sticky top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-20 px-8 py-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <SidebarTrigger className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{getPageTitle()}</h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dateTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {" · "}
              {dateTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
            />
          </div>

          <NotificationsDropdown />

          <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
            <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
