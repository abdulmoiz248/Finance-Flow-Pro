import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "monthly"

    const db = await getDatabase()
    const now = new Date()

    let startDate: Date
    let monthsBack: number

    switch (period) {
      case "yearly":
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        monthsBack = 12
        break
      case "quarterly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        monthsBack = 6
        break
      default: // monthly
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        monthsBack = 6
    }

    console.log("Analytics API - Start date:", startDate, "Period:", period)

    // Get all transactions from start date
    const allTransactions = await db
      .collection("transactions")
      .find({
        date: { $gte: startDate },
      })
      .sort({ date: 1 })
      .toArray()

    console.log("Found transactions:", allTransactions.length)

    // FIXED: Generate monthly data with proper date handling
    const monthlyData = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)

      console.log(`Month ${i}: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`)

      // FIXED: Better date filtering that includes transactions on the 1st
      const monthTransactions = allTransactions.filter((t) => {
        const tDate = new Date(t.date)
        // Reset time to start of day for comparison
        const transactionDate = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate())
        const monthStartDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate())
        const monthEndDate = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate())

        return transactionDate >= monthStartDate && transactionDate <= monthEndDate
      })

      console.log(`Month ${i} transactions:`, monthTransactions.length)
      console.log(
        `Sample transactions for month ${i}:`,
        monthTransactions.slice(0, 3).map((t) => ({
          date: t.date,
          type: t.type,
          amount: t.amount,
          category: t.category,
        })),
      )

      const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0)

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      console.log(`Month ${i} - Income: ${income}, Expenses: ${expenses}`)

      monthlyData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        income,
        expenses,
        savings: income - expenses,
      })
    }

    // FIXED: Category breakdown for current month with better date handling
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    console.log("Current month start:", currentMonthStart.toISOString())
    console.log("Current month end:", currentMonthEnd.toISOString())

    const currentMonthTransactions = allTransactions.filter((t) => {
      const tDate = new Date(t.date)
      const transactionDate = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate())
      const monthStartDate = new Date(
        currentMonthStart.getFullYear(),
        currentMonthStart.getMonth(),
        currentMonthStart.getDate(),
      )
      const monthEndDate = new Date(
        currentMonthEnd.getFullYear(),
        currentMonthEnd.getMonth(),
        currentMonthEnd.getDate(),
      )

      return transactionDate >= monthStartDate && transactionDate <= monthEndDate && t.type === "expense"
    })

    console.log("Current month expense transactions:", currentMonthTransactions.length)

    // Validate and log transaction data
    currentMonthTransactions.forEach((t, index) => {
      console.log(`Transaction ${index}:`, {
        date: t.date,
        category: t.category,
        amount: t.amount,
        type: t.type,
      })
    })

    const categoryMap = new Map()
    currentMonthTransactions.forEach((t) => {
      const category = t.category || "Other"
      const amount = t.amount || 0
      if (amount > 0) {
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
      }
    })

    console.log("Category map:", Array.from(categoryMap.entries()))

    // Ensure we always have some data to display
    if (categoryMap.size === 0) {
      categoryMap.set("No Expenses", 0)
    }

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
    ]

    const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[index % colors.length],
    }))

    // Mutual fund growth data - IMPROVED CALCULATION
    const mutualFunds = await db.collection("mutualFunds").find({}).toArray()
    const mutualFundData = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      let totalValue = 0

      if (Array.isArray(mutualFunds)) {
        mutualFunds.forEach((fund) => {
          if (fund.updateHistory && Array.isArray(fund.updateHistory)) {
            // Find the most recent update before or on this date
            const relevantUpdates = fund.updateHistory
              .filter((update: any) => new Date(update.date) <= date)
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

            if (relevantUpdates.length > 0) {
              totalValue += relevantUpdates[0].value || 0
            } else if (new Date(fund.investmentDate) <= date) {
              // If no updates but investment was made before this date
              totalValue += fund.initialInvestment || 0
            }
          } else if (new Date(fund.investmentDate) <= date) {
            // Fallback to current value if no update history
            totalValue += fund.currentValue || fund.initialInvestment || 0
          }
        })
      }

      mutualFundData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        value: totalValue,
      })
    }

    // Net worth data - IMPROVED CALCULATION
    const netWorthData = monthlyData.map((item, index) => {
      const cashSavings = Math.max(0, item.savings) // Only positive savings count as cash
      const investments = mutualFundData[index]?.value || 0

      return {
        month: item.month,
        cash: cashSavings,
        investments: investments,
        total: cashSavings + investments,
      }
    })

    const response = {
      monthlyData,
      categoryData,
      mutualFundData,
      netWorthData,
    }

    console.log("Analytics response:", {
      monthlyDataLength: monthlyData.length,
      categoryDataLength: categoryData.length,
      mutualFundDataLength: mutualFundData.length,
      netWorthDataLength: netWorthData.length,
      sampleMonthlyData: monthlyData.slice(0, 2),
      sampleCategoryData: categoryData.slice(0, 3),
      sampleMutualFundData: mutualFundData.slice(0, 2),
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        monthlyData: [],
        categoryData: [],
        mutualFundData: [],
        netWorthData: [],
      },
      { status: 500 },
    )
  }
}
