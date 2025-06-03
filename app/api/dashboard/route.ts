import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("Dashboard API called")
    const db = await getDatabase()

    // Get current month's start and end dates - FIXED
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    console.log("Fetching transactions for current month:", startOfMonth, "to", endOfMonth)

    // Get monthly income and expenses - FIXED DATE FILTERING
    const transactions = await db.collection("transactions").find({}).toArray()

    // Filter transactions for current month using proper date comparison
    const currentMonthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date)
      const transactionMonth = tDate.getMonth()
      const transactionYear = tDate.getFullYear()

      return transactionMonth === now.getMonth() && transactionYear === now.getFullYear()
    })

    console.log(`Found ${currentMonthTransactions.length} transactions for current month`)

    const monthlyIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    const monthlyExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)
    const netSavings = monthlyIncome - monthlyExpenses

    console.log("Fetching mutual funds...")
    // Get mutual fund total value - FIX: Sum all funds properly
    const mutualFunds = await db.collection("mutualFunds").find({}).toArray()
    console.log(`Found ${mutualFunds.length} mutual funds`)

    // Calculate total mutual fund value by summing all current values
    const mutualFundValue = mutualFunds.reduce((sum, fund) => {
      const currentValue = fund.currentValue || 0
      console.log(`Fund ${fund.fundName}: ${currentValue}`)
      return sum + currentValue
    }, 0)

    console.log(`Total mutual fund value: ${mutualFundValue}`)

    // Get user profile for savings goal
    const userProfile = await db.collection("userProfiles").findOne({})
    const savingsGoal = userProfile?.savingsTarget || 50000

    // Calculate savings progress
    const savingsProgress = savingsGoal > 0 ? Math.min((netSavings / savingsGoal) * 100, 100) : 0

    // Get total counts
    const totalTransactions = await db.collection("transactions").countDocuments()
    const totalFunds = await db.collection("mutualFunds").countDocuments()

    const dashboardData = {
      monthlyIncome,
      monthlyExpenses,
      netSavings,
      mutualFundValue,
      savingsGoal,
      savingsProgress,
      totalTransactions,
      totalFunds,
    }

    console.log("Dashboard data prepared:", dashboardData)
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
