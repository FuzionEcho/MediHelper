"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileText, Clock, ChevronRight, CreditCard, Search, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useInView } from "react-intersection-observer"
import { getAllBills } from "@/app/actions/save-bill"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RecentRides } from "@/components/transportation/recent-rides"
import { logEnvironmentInfo } from "@/utils/debug-info"
import styles from "@/styles/dashboard.module.css"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/theme-context"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const { theme } = useTheme()
  const [scrollY, setScrollY] = useState(0)
  const today = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short" })

  const [dateTime, setDateTime] = useState(new Date())
  const [bills, setBills] = useState<any[]>([])
  const [isLoadingBills, setIsLoadingBills] = useState(true)
  const [billsError, setBillsError] = useState<string | null>(null)

  // Animation references
  const [billsRef, billsInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [appointmentsRef, appointmentsInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [transportationRef, transportationInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  // Function to reset appointment state
  const resetAppointments = () => {
    // In a real app, this would reset the appointment state from a context or API
    console.log("Resetting appointment state")
    // For demo purposes, we'll just reload the page
    window.location.reload()
  }

  useEffect(() => {
    // Log environment info for debugging
    logEnvironmentInfo()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)

    const timer = setInterval(() => setDateTime(new Date()), 1000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(timer)
    }
  }, [])

  const router = useRouter()

  // Load bills
  useEffect(() => {
    const loadBills = async () => {
      setIsLoadingBills(true)
      setBillsError(null)

      try {
        // Force a refresh to get the latest data
        router.refresh()

        const result = await getAllBills()

        if (result.success && result.data) {
          setBills(result.data)
        } else {
          setBillsError(result.error || "Failed to load bills")
        }
      } catch (error) {
        console.error("Error loading bills:", error)
        setBillsError("An unexpected error occurred while loading bills")
      } finally {
        setIsLoadingBills(false)
      }
    }

    loadBills()
  }, [router])

  // Calculate total expenses and unpaid bills
  const totalExpenses = bills.reduce((total, bill) => {
    const amount = bill.billData.billing.patientResponsibility || "0"
    return total + Number.parseFloat(amount.replace(/[^0-9.-]+/g, ""))
  }, 0)

  const unpaidBills = bills.filter((bill) => {
    // In a real app, you would have a status field
    // For now, we'll assume all bills are unpaid
    return true
  })

  const unpaidAmount = unpaidBills.reduce((total, bill) => {
    const amount = bill.billData.billing.patientResponsibility || "0"
    return total + Number.parseFloat(amount.replace(/[^0-9.-]+/g, ""))
  }, 0)

  // Stats data
  const stats = [
    {
      icon: FileText,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      title: "Total Medical Expenses",
      value: `$${totalExpenses.toFixed(2)}`,
    },
    {
      icon: CreditCard,
      color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
      title: "Unpaid Bills",
      value: `$${unpaidAmount.toFixed(2)}`,
    },
    {
      icon: FileText,
      color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
      title: "Total Bills",
      value: bills.length.toString(),
    },
    {
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
      title: "Upcoming Appointments",
      value: "0",
    },
  ]

  // Appointments data
  const appointments: {
    id: number
    doctor: string
    specialty: string
    date: string
    time: string
    color: string
  }[] = []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased transition-colors duration-300">
      {/* Sidebar */}
      <></>

      {/* Main content */}
      <div className="w-full">
        {/* Top header */}
        <motion.header
          style={{ opacity: 1 - scrollY * 0.01 }}
          className="sticky top-0 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-20 px-8 py-4 transition-colors duration-300"
        >
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dateTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} ·{" "}
              {dateTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
                />
              </div>

              <NotificationsDropdown />

              <UserMenu />

              <ThemeToggle />
            </div>
          </div>
        </motion.header>

        <main className="px-8 py-8">
          {/* Section title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Welcome to MediHelper. Here's an overview of your healthcare information.
            </p>

            {/* Add a prominent Scan Bill button */}
            <Button
              variant="contrast"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
              asChild
            >
              <Link href="/scan">
                <FileText className="inline-block mr-2 h-4 w-4" />
                Scan a Bill
              </Link>
            </Button>
          </div>

          {/* Stats section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${styles.dashboardContainer} mb-8`}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className={`${styles.statCard} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
                whileHover={{ y: -5 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`${styles.statTitle} text-gray-500 dark:text-gray-400`}>{stat.title}</h3>
                    <p className={`${styles.statValue} text-gray-900 dark:text-white`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bills section */}
          <div ref={billsRef} className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={billsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className={`${styles.recentActivity} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
            >
              <div className={`${styles.activityHeader} border-gray-200 dark:border-gray-700`}>
                <h2 className={`${styles.activityTitle} text-gray-900 dark:text-white`}>Recent Bills</h2>
              </div>

              {isLoadingBills ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-teal-600 dark:border-teal-400 border-t-transparent rounded-full mr-2"></div>
                  <p className="text-gray-700 dark:text-gray-300">Loading bills...</p>
                </div>
              ) : billsError ? (
                <div className="p-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{billsError}</AlertDescription>
                  </Alert>
                </div>
              ) : bills.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No Bills Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Upload your first medical bill to get started</p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700" asChild>
                    <Link href="/scan">
                      <FileText className="inline-block mr-2 h-4 w-4" />
                      Scan a Bill
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className={styles.activityList}>
                  {bills.slice(0, 3).map((bill, index) => (
                    <motion.li
                      key={bill.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={billsInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                      className={`${styles.activityItem} border-gray-100 dark:border-gray-700`}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {bill.imageData ? (
                          <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                              src={bill.imageData || "/placeholder.svg"}
                              alt={`Bill from ${bill.billData.provider.name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`${styles.activityIcon} bg-blue-100 dark:bg-blue-900`}>
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                      <div className={styles.activityContent}>
                        <h4 className={`${styles.activityName} text-gray-900 dark:text-white`}>
                          {bill.billData.provider.name}
                        </h4>
                        <p className={`${styles.activityTime} text-gray-500 dark:text-gray-400`}>
                          {bill.billData.service.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {bill.billData.billing.patientResponsibility}
                        </p>
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                          Unpaid
                        </span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}

              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
                <Link
                  href="/bills"
                  className="text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center w-full justify-center"
                >
                  View All Bills
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Appointments section */}
            <div ref={appointmentsRef} className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={appointmentsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className={`${styles.recentActivity} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-full`}
              >
                <div className={`${styles.activityHeader} border-gray-200 dark:border-gray-700 flex justify-between`}>
                  <h2 className={`${styles.activityTitle} text-gray-900 dark:text-white`}>Upcoming Appointments</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAppointments}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Reset
                  </Button>
                </div>

                <ul className={styles.activityList}>
                  {appointments.length > 0 ? (
                    appointments.map((appointment, index) => (
                      <motion.li
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={appointmentsInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                        className={`${styles.activityItem} border-gray-100 dark:border-gray-700`}
                      >
                        <div className={`${styles.activityIcon} ${appointment.color}`}>
                          <Calendar className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div className={styles.activityContent}>
                          <h4 className={`${styles.activityName} text-gray-900 dark:text-white`}>
                            {appointment.doctor}
                          </h4>
                          <p className={`${styles.activityTime} text-gray-500 dark:text-gray-400`}>
                            {appointment.specialty}
                          </p>
                          <div className="flex items-center mt-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-gray-600 dark:text-gray-400 mr-3">{appointment.date}</span>
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-gray-600 dark:text-gray-400">{appointment.time}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No Upcoming Appointments</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Schedule your next appointment to see it here
                      </p>
                      <Button className="mt-4" variant="contrast" asChild>
                        <Link href="/appointments">
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Appointment
                        </Link>
                      </Button>
                    </div>
                  )}
                </ul>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600 mt-auto">
                  <Link
                    href="/appointments"
                    className="text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center w-full justify-center"
                  >
                    Manage Appointments
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Transportation section */}
            <div ref={transportationRef} className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={transportationInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className={`${styles.recentActivity} h-full`}
              >
                <RecentRides />
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
