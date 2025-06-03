import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const db = await getDatabase()
    const now = new Date()

    if (action === "monthly-savings-rollover") {
      // Get last month's data
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

      // Get all transactions for last month
      const transactions = await db.collection("transactions").find({}).toArray()

      const lastMonthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date)
        const transactionMonth = tDate.getMonth()
        const transactionYear = tDate.getFullYear()

        return transactionMonth === lastMonth.getMonth() && transactionYear === lastMonth.getFullYear()
      })

      const income = lastMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      const expenses = lastMonthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
      const savings = income - expenses

      // Only add savings if positive
      if (savings > 0) {
        const savingsTransaction = {
          type: "income",
          amount: savings,
          category: "savings rollover",
          date: new Date(now.getFullYear(), now.getMonth(), 1), // 1st of current month
          description: `Previous month savings rollover from ${lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          source: "automatic rollover",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection("transactions").insertOne(savingsTransaction)

        return NextResponse.json({
          success: true,
          message: `Added PKR ${savings.toLocaleString()} savings rollover`,
          amount: savings,
        })
      } else {
        return NextResponse.json({
          success: true,
          message: "No positive savings to rollover",
          amount: 0,
        })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in monthly automation:", error)
    return NextResponse.json({ error: "Failed to process automation" }, { status: 500 })
  }
}
