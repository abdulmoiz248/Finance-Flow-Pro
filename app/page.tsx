"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  Plus,
  Download,
  Moon,
  Sun,
  Quote,
  Loader2,
  Settings,
  AlertTriangle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import TransactionForm from "@/components/transaction-form"
import MutualFundForm from "@/components/mutual-fund-form"
import AnalyticsCharts from "@/components/analytics-charts"
import TransactionList from "@/components/transaction-list"
import MutualFundList from "@/components/mutual-fund-list"
import GoalsTracker from "@/components/goals-tracker"
import InvoiceCreator from "@/components/invoice-creator"
import MobileNav from "@/components/mobile-nav"
import { dashboardAPI, reportsAPI } from "@/lib/api"
import type { DashboardData } from "@/lib/types"
import ErrorBoundary from "@/components/error-boundary"

const motivationalQuotes = [
  "Financial freedom is a journey. Every penny counts! 🚀",
  "Small investments today, big returns tomorrow! 💰",
  "Your future self will thank you for saving today! ⭐",
  "Discipline is the bridge between goals and accomplishment! 🌟",
  "Every rupee saved is a rupee earned! 💪",
  "Invest in yourself, it pays the best interest! 📈",
  "A budget is telling your money where to go! 🎯",
  "The best time to plant a tree was 20 years ago. The second best time is now! 🌱",
]

export default function Dashboard() {
  const [currentQuote, setCurrentQuote] = useState(0)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showMutualFundForm, setShowMutualFundForm] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkDatabaseConnection = async () => {
    try {
      setLoading(true)
      const response = await dashboardAPI.getData()
      setDashboardData(response.data)
      setConnectionError(false)
    } catch (error: any) {
      console.error("Dashboard data error:", error)
      if (error.response?.status === 500 || error.code === "NETWORK_ERROR") {
        setConnectionError(true)
      } else {
        toast.error("Failed to load dashboard data")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getData()
      setDashboardData(response.data)
      setConnectionError(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    }
  }

  const handleExportPDF = async (type: "monthly" | "quarterly" | "yearly") => {
    try {
      setPdfLoading(true)
      const response = await reportsAPI.generatePDF(type)

      const blob = new Blob([response.data], { type: "text/html" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `financial-report-${type}-${new Date().toISOString().split("T")[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully!`)
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report")
    } finally {
      setPdfLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  // Show database setup page if connection failed
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Database Connection Error</CardTitle>
            <CardDescription>
              Unable to connect to MongoDB. Please check your connection and set up the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => (window.location.href = "/setup")} className="w-full">
              Go to Database Setup
            </Button>
            <Button onClick={checkDatabaseConnection} variant="outline" className="w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500">
        <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
          {/* Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FinanceFlow Pro
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
                  Your Personal Finance Management Hub
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveTab("settings")}
                className="hover:scale-110 transition-transform"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:scale-110 transition-transform"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="relative hidden sm:block">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  onClick={() => handleExportPDF("monthly")}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden lg:inline">Export PDF</span>
                  <span className="lg:hidden">PDF</span>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Motivational Quote - Only show on dashboard */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuote}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <Quote className="h-5 w-5 sm:h-6 sm:w-6" />
                    <p className="text-sm sm:text-lg font-medium">{motivationalQuotes[currentQuote]}</p>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Cards - Only show on dashboard */}
          {dashboardData && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-green-200 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                      Monthly Income
                    </CardTitle>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">
                      PKR {dashboardData.monthlyIncome.toLocaleString()}
                    </div>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
                    >
                      {dashboardData.totalTransactions} transactions
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-red-200 dark:border-red-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                      Monthly Expenses
                    </CardTitle>
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-300">
                      PKR {dashboardData.monthlyExpenses.toLocaleString()}
                    </div>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs"
                    >
                      This month
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-blue-200 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                      Net Savings
                    </CardTitle>
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                      PKR {dashboardData.netSavings.toLocaleString()}
                    </div>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs"
                    >
                      {dashboardData.netSavings >= 0 ? "Positive" : "Negative"} flow
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-purple-200 dark:border-purple-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                      Mutual Funds
                    </CardTitle>
                    <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                      PKR {dashboardData.mutualFundValue.toLocaleString()}
                    </div>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs"
                    >
                      {dashboardData.totalFunds} active funds
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Savings Goal Progress - Only show on dashboard */}
          {dashboardData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-base sm:text-lg">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                    Savings Goal Progress
                  </CardTitle>
                  <CardDescription className="text-sm">
                    You're {dashboardData.savingsProgress.toFixed(1)}% towards your PKR{" "}
                    {dashboardData.savingsGoal.toLocaleString()} goal!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        PKR {((dashboardData.savingsGoal * dashboardData.savingsProgress) / 100).toLocaleString()}
                      </span>
                      <span>PKR {dashboardData.savingsGoal.toLocaleString()}</span>
                    </div>
                    <Progress value={dashboardData.savingsProgress} className="h-3 bg-orange-100 dark:bg-orange-900" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Desktop Tabs */}
            <div className="hidden lg:block">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-white dark:bg-gray-800 shadow-md">
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm"
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-xs sm:text-sm"
                  >
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-xs sm:text-sm"
                  >
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger
                    value="mutual-funds"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs sm:text-sm"
                  >
                    Investments
                  </TabsTrigger>
                  <TabsTrigger
                    value="goals"
                    className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-xs sm:text-sm"
                  >
                    Goals
                  </TabsTrigger>
                  <TabsTrigger
                    value="invoices"
                    className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-xs sm:text-sm"
                  >
                    Invoices
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6">
                  <AnalyticsCharts onDataUpdate={fetchDashboardData} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <AnalyticsCharts onDataUpdate={fetchDashboardData} />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold">Transaction Management</h2>
                    <Button
                      onClick={() => setShowTransactionForm(true)}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>
                  </div>
                  <TransactionList onDataUpdate={fetchDashboardData} />
                </TabsContent>

                <TabsContent value="mutual-funds" className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold">Investment Tracker</h2>
                    <Button
                      onClick={() => setShowMutualFundForm(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Investment
                    </Button>
                  </div>
                  <MutualFundList onDataUpdate={fetchDashboardData} />
                </TabsContent>

                <TabsContent value="goals" className="space-y-6">
                  <GoalsTracker />
                </TabsContent>

                <TabsContent value="invoices" className="space-y-6">
                  <InvoiceCreator />
                </TabsContent>
              </Tabs>
            </div>

            {/* Mobile Content */}
            <div className="lg:hidden">
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                
                  <AnalyticsCharts onDataUpdate={fetchDashboardData} />
                </div>
              )}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Analytics</h2>
                  <AnalyticsCharts onDataUpdate={fetchDashboardData} />
                </div>
              )}
              {activeTab === "transactions" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Transactions</h2>
                    <Button
                      onClick={() => setShowTransactionForm(true)}
                      className="bg-gradient-to-r from-green-500 to-blue-500"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <TransactionList onDataUpdate={fetchDashboardData} />
                </div>
              )}
              {activeTab === "mutual-funds" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Investments</h2>
                    <Button
                      onClick={() => setShowMutualFundForm(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <MutualFundList onDataUpdate={fetchDashboardData} />
                </div>
              )}
              {activeTab === "goals" && <GoalsTracker />}
              {activeTab === "invoices" && <InvoiceCreator />}
              {activeTab === "settings" && (
                <Card className="p-8 text-center">
                  <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Settings</h3>
                  <p className="text-gray-600">Configure your preferences and account settings.</p>
                  <Button onClick={() => (window.location.href = "/settings")} className="mt-4">
                    Go to Settings
                  </Button>
                </Card>
              )}
            </div>
          </motion.div>
        </div>

        {/* Modals */}
        <TransactionForm
          open={showTransactionForm}
          onOpenChange={setShowTransactionForm}
          onSuccess={fetchDashboardData}
        />
        <MutualFundForm open={showMutualFundForm} onOpenChange={setShowMutualFundForm} onSuccess={fetchDashboardData} />
      </div>
    </ErrorBoundary>
  )
}
