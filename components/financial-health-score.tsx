"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, PieChart, RefreshCw, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { toast } from "sonner"

interface HealthMetrics {
  income: number
  expenses: number
  savings: number
  totalInvestments: number
  incomeToExpenseRatio: number
  savingsRate: number
  investmentRatio: number
}

interface HealthData {
  score: number
  grade: string
  status: string
  color: string
  month: string
  metrics: HealthMetrics
  recommendations: string[]
}

export default function FinancialHealthScore() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")

  useEffect(() => {
    fetchHealthScore()
  }, [])

  const fetchHealthScore = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/financial-health")
      setHealthData(response.data)
    } catch (error) {
      console.error("Error fetching health score:", error)
      toast.error("Failed to fetch financial health score")
    } finally {
      setLoading(false)
    }
  }

  const sendHealthEmail = async () => {
    if (!emailAddress) {
      toast.error("Please enter an email address")
      return
    }

    try {
      setEmailLoading(true)
      await axios.post("/api/financial-health", {
        action: "monthly-health-email",
        email: emailAddress,
      })
      toast.success("Health score email sent successfully!")
    } catch (error) {
      console.error("Error sending health email:", error)
      toast.error("Failed to send health email")
    } finally {
      setEmailLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    if (score >= 60) return "text-orange-500"
    if (score >= 50) return "text-red-500"
    return "text-red-600"
  }

  const getGradeIcon = (grade: string) => {
    if (grade.startsWith("A")) return "🏆"
    if (grade === "B") return "🥈"
    if (grade === "C") return "🥉"
    if (grade === "D") return "⚠️"
    return "🚨"
  }

  if (loading) {
    return (
      <Card className="border border-blue-100 dark:border-blue-900 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Calculating your financial health score...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!healthData) {
    return (
      <Card className="border border-red-100 dark:border-red-900 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Failed to load financial health data</p>
            <Button onClick={fetchHealthScore} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Health Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Financial Health Score
            </CardTitle>
            <CardDescription>For {healthData.month}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="text-7xl font-bold mb-2" style={{ color: healthData.color }}>
                  {healthData.score}
                </div>
                <div className="absolute -top-2 -right-2 text-4xl">{getGradeIcon(healthData.grade)}</div>
              </div>
              <div className="space-y-2">
                <Badge className="text-lg px-4 py-2" style={{ backgroundColor: healthData.color, color: "white" }}>
                  Grade {healthData.grade}
                </Badge>
                <p className="text-lg font-semibold" style={{ color: healthData.color }}>
                  {healthData.status}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Health Score</span>
                <span>{healthData.score}/100</span>
              </div>
              <Progress
                value={healthData.score}
                className="h-3"
                style={
                  {
                    backgroundColor: `${healthData.color}20`,
                    "--progress-background": healthData.color,
                  } as React.CSSProperties
                }
              />
            </div>

            {/* Email Form */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Send Health Report to Email
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={sendHealthEmail}
                  disabled={emailLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {emailLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Monthly reports are automatically sent on the 1st of each month
              </p>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={fetchHealthScore}
              variant="outline"
              className="w-full border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Score
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border border-blue-100 dark:border-blue-900 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Income vs Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {(healthData.metrics.incomeToExpenseRatio * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Expense ratio</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border border-green-100 dark:border-green-900 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50 dark:bg-green-900/20">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Savings Rate</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {healthData.metrics.savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Of income saved</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border border-purple-100 dark:border-purple-900 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50 dark:bg-purple-900/20">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Investment Ratio
              </CardTitle>
              <PieChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {healthData.metrics.investmentRatio.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Monthly investment rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border border-orange-100 dark:border-orange-900 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50 dark:bg-orange-900/20">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Net Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                PKR {healthData.metrics.savings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Monthly savings</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border border-blue-100 dark:border-blue-900 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardTitle className="text-blue-700 dark:text-blue-300">Recommendations</CardTitle>
            <CardDescription>Personalized suggestions to improve your financial health</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {healthData.recommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4"
                  style={{ borderLeftColor: healthData.color }}
                >
                  {recommendation}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
