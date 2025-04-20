"use client"

import type React from "react"

import { Heart, FileText, Calendar, Car, Settings, MessageCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { toggleSidebar, state } = useSidebar()

  // Navigation items
  const navItems = [
    { name: "Dashboard", icon: Heart, href: "/dashboard", current: pathname === "/dashboard" },
    {
      name: "Bills & Payments",
      icon: FileText,
      href: "/scan",
      current: pathname.includes("/scan") || pathname.includes("/bills"),
    },
    { name: "Appointments", icon: Calendar, href: "/appointments", current: pathname.includes("/appointments") },
    { name: "Insurance", icon: Heart, href: "/insurance", current: pathname.includes("/insurance") },
    { name: "Transportation", icon: Car, href: "/transportation", current: pathname.includes("/transportation") },
    { name: "Settings", icon: Settings, href: "/settings", current: pathname.includes("/settings") },
    {
      title: "Chatbot",
      href: "/chatbot",
      icon: MessageCircle,
      name: "Chatbot",
    },
  ]

  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-700" {...props}>
      <SidebarHeader className="flex items-center p-4">
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">MEDIHELPER</h1>
        </motion.div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <AnimatePresence>
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={item.current}>
                        <Link href={item.href} className="flex items-center px-3 py-2 relative group">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="mr-2"
                          >
                            <item.icon className="h-4 w-4" />
                          </motion.div>
                          <span>{item.name}</span>
                          {item.current && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-md -z-10"
                              initial={{ borderRadius: 8 }}
                              animate={{ borderRadius: 8 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <motion.div
          className="p-4 bg-gray-900 dark:bg-gray-700 text-white rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="flex items-center mb-3">
            <motion.div
              className="w-10 h-10 bg-gray-700 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="h-5 w-5" />
            </motion.div>
            <div>
              <p className="font-medium">My Account</p>
              <p className="text-xs text-gray-400">Manage your profile</p>
            </div>
          </div>
          <Link href="/settings">
            <motion.button
              className="w-full flex items-center text-sm text-gray-300 mt-2 py-1.5 hover:text-white transition-colors"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </motion.button>
          </Link>
        </motion.div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
