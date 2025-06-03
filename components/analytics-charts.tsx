"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { dashboardAPI } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChartIcon } from "lucide-react"

interface AnalyticsData {
  income: number
  expenses: number
  savings: number
  month: string
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface MutualFundData {
  month: string
  value: number
}

interface NetWorthData {
  month: string
  cash: number
  investments: number
  total: number
}

interface AnalyticsChartsProps {
  onDataUpdate?: (data: any) => void
}

export default function AnalyticsCharts({ onDataUpdate }: AnalyticsChartsProps) {
  const [monthlyData, setMonthlyData] = useState<AnalyticsData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [mutualFundData, setMutualFundData] = useState<MutualFundData[]>([])
  const [netWorthData, setNetWorthData] = useState<NetWorthData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  const [allTransactions, setAllTransactions] = useState<any[]>([]) // Assuming transaction type

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("Fetching analytics for period:", period)
      const response = await dashboardAPI.getAnalytics(period)
      console.log("Analytics response:", response.data)

      // Safely set data with fallbacks
      setMonthlyData(Array.isArray(response.data.monthlyData) ? response.data.monthlyData : [])
      setCategoryData(Array.isArray(response.data.categoryData) ? response.data.categoryData : [])
      setMutualFundData(Array.isArray(response.data.mutualFundData) ? response.data.mutualFundData : [])
      setNetWorthData(Array.isArray(response.data.netWorthData) ? response.data.netWorthData : [])
      setAllTransactions(Array.isArray(response.data.allTransactions) ? response.data.allTransactions : [])

      onDataUpdate?.(response.data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch analytics")
      console.error("Error fetching analytics:", err)

      // Set empty arrays on error
      setMonthlyData([])
      setCategoryData([])
      setMutualFundData([])
      setNetWorthData([])
      setAllTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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

  // Calculate summary stats
  const totalIncome = monthlyData.reduce((sum, data) => sum + data.income, 0)
  const totalExpenses = monthlyData.reduce((sum, data) => sum + data.expenses, 0)
  const avgMonthlySavings =
    monthlyData.length > 0 ? monthlyData.reduce((sum, data) => sum + data.savings, 0) / monthlyData.length : 0
  const currentMutualFundValue = mutualFundData.length > 0 ? mutualFundData[mutualFundData.length - 1].value : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period Selector and Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as "monthly" | "quarterly" | "yearly")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Last 6 Months</SelectItem>
              <SelectItem value="quarterly">Last 6 Months</SelectItem>
              <SelectItem value="yearly">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {error && (
          <div className="text-red-500 text-sm">
            {error} -{" "}
            <button onClick={fetchAnalytics} className="underline">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div variants={itemVariants}>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Total Income</p>
                <p className="text-sm sm:text-lg font-bold text-green-600">PKR {totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-600">Total Expenses</p>
                <p className="text-sm sm:text-lg font-bold text-red-600">PKR {totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Avg Savings</p>
                <p className="text-sm sm:text-lg font-bold text-blue-600">PKR {avgMonthlySavings.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Investments</p>
                <p className="text-sm sm:text-lg font-bold text-purple-600">
                  PKR {currentMutualFundValue.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6"
      >
        {/* Income vs Expenses */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-blue-700 dark:text-blue-300">
                Income vs Expenses
              </CardTitle>
              <CardDescription className="text-sm">Monthly comparison over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px]" />
              ) : error ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <Button onClick={fetchAnalytics} size="sm">
                      Retry
                    </Button>
                  </div>
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No transaction data available</p>
                    <p className="text-sm text-gray-400">Add some transactions to see analytics</p>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    income: {
                      label: "Income",
                      color: "#10b981",
                    },
                    expenses: {
                      label: "Expenses",
                      color: "#ef4444",
                    },
                    savings: {
                      label: "Savings",
                      color: "#3b82f6",
                    },
                  }}
                  className="h-[200px] sm:h-[250px] md:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={12} tick={{ fontSize: 12 }} />
                      <YAxis
                        fontSize={12}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, ""]}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" name="Income" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="savings"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Net Savings"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-purple-700 dark:text-purple-300">
                Expense Categories
              </CardTitle>
              <CardDescription className="text-sm">Breakdown of spending by category this month</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px]" />
              ) : error ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <Button onClick={fetchAnalytics} size="sm">
                      Retry
                    </Button>
                  </div>
                </div>
              ) : allTransactions.length === 0 ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No expense data available</p>
                    <p className="text-sm text-gray-400">Add some expense transactions to see category breakdown</p>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const now = new Date()

                    const currentMonthTransactions = allTransactions.filter((t: any) => {
                      const tDate = new Date(t.date)
                      const transactionMonth = tDate.getMonth()
                      const transactionYear = tDate.getFullYear()

                      return (
                        transactionMonth === now.getMonth() &&
                        transactionYear === now.getFullYear() &&
                        t.type === "expense" &&
                        t.amount > 0
                      ) // Ensure we only include transactions with positive amounts
                    })

                    console.log("Current month expense transactions:", currentMonthTransactions.length)

                    // Aggregate category data
                    const aggregatedCategoryData: { [key: string]: number } = {}
                    currentMonthTransactions.forEach((t: any) => {
                      if (t.category) {
                        aggregatedCategoryData[t.category] = (aggregatedCategoryData[t.category] || 0) + t.amount
                      }
                    })

                    // Convert aggregated data to the format required by the chart
                    const formattedCategoryData = Object.entries(aggregatedCategoryData).map(
                      ([name, value]: [string, number], index: number) => ({
                        name,
                        value,
                        color: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"][index % 5], // Cycle through colors
                      }),
                    )

                    if (formattedCategoryData.length === 0) {
                      return (
                        <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-gray-500 mb-2">No expense data available for this month</p>
                            <p className="text-sm text-gray-400">
                              Add some expense transactions to see category breakdown
                            </p>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <ChartContainer
                        config={{
                          value: {
                            label: "Amount (PKR)",
                          },
                        }}
                        className="h-[200px] sm:h-[250px] md:h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={formattedCategoryData}
                              cx="50%"
                              cy="50%"
                              outerRadius={window.innerWidth < 640 ? 50 : window.innerWidth < 768 ? 70 : 80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) =>
                                window.innerWidth >= 640
                                  ? `${name} ${(percent * 100).toFixed(0)}%`
                                  : `${(percent * 100).toFixed(0)}%`
                              }
                              labelLine={false}
                            >
                              {formattedCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, ""]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Mutual Fund Growth */}
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-green-700 dark:text-green-300">
                Mutual Fund Growth
              </CardTitle>
              <CardDescription className="text-sm">Portfolio value over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px]" />
              ) : error ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <Button onClick={fetchAnalytics} size="sm">
                      Retry
                    </Button>
                  </div>
                </div>
              ) : mutualFundData.length === 0 || mutualFundData.every((d) => d.value === 0) ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No mutual fund data available</p>
                    <p className="text-sm text-gray-400">Add some mutual fund investments to see growth</p>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    value: {
                      label: "Value (PKR)",
                      color: "#8b5cf6",
                    },
                  }}
                  className="h-[200px] sm:h-[250px] md:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mutualFundData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={12} tick={{ fontSize: 12 }} />
                      <YAxis
                        fontSize={12}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, ""]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="url(#colorGradient)"
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Worth Timeline */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-orange-700 dark:text-orange-300">
                Net Worth Timeline
              </CardTitle>
              <CardDescription className="text-sm">Cash + Investments over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px]" />
              ) : error ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <Button onClick={fetchAnalytics} size="sm">
                      Retry
                    </Button>
                  </div>
                </div>
              ) : netWorthData.length === 0 ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No net worth data available</p>
                    <p className="text-sm text-gray-400">Add transactions and investments to see net worth</p>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    cash: {
                      label: "Cash",
                      color: "#06b6d4",
                    },
                    investments: {
                      label: "Investments",
                      color: "#8b5cf6",
                    },
                    total: {
                      label: "Total",
                      color: "#f59e0b",
                    },
                  }}
                  className="h-[200px] sm:h-[250px] md:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={netWorthData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={12} tick={{ fontSize: 12 }} />
                      <YAxis
                        fontSize={12}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, ""]}
                      />
                      <Legend />
                      <Bar dataKey="cash" stackId="a" fill="#06b6d4" name="Cash" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="investments" stackId="a" fill="#8b5cf6" name="Investments" radius={[2, 2, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        name="Total Net Worth"
                        dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
