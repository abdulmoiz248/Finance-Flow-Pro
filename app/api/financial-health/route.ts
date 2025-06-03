import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import nodemailer from "nodemailer"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const now = new Date()

    // Get last month's data for health score calculation
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

    // Get mutual funds value
    const mutualFunds = await db.collection("mutualFunds").find({}).toArray()
    const totalInvestments = mutualFunds.reduce((sum, fund) => sum + (fund.currentValue || 0), 0)

    // Calculate Financial Health Score (0-100)
    let healthScore = 0
    const metrics = {
      incomeToExpenseRatio: 0,
      savingsRate: 0,
      investmentRatio: 0,
      expenseVariability: 0,
    }

    // 1. Income to Expense Ratio (25 points)
    if (income > 0) {
      metrics.incomeToExpenseRatio = expenses / income
      if (metrics.incomeToExpenseRatio <= 0.5)
        healthScore += 25 // Excellent
      else if (metrics.incomeToExpenseRatio <= 0.7)
        healthScore += 20 // Good
      else if (metrics.incomeToExpenseRatio <= 0.9)
        healthScore += 15 // Fair
      else if (metrics.incomeToExpenseRatio <= 1.0) healthScore += 10 // Poor
      // Above 1.0 = 0 points (spending more than earning)
    }

    // 2. Savings Rate (30 points)
    if (income > 0) {
      metrics.savingsRate = (savings / income) * 100
      if (metrics.savingsRate >= 20)
        healthScore += 30 // Excellent
      else if (metrics.savingsRate >= 15)
        healthScore += 25 // Very Good
      else if (metrics.savingsRate >= 10)
        healthScore += 20 // Good
      else if (metrics.savingsRate >= 5)
        healthScore += 15 // Fair
      else if (metrics.savingsRate >= 0) healthScore += 10 // Poor
      // Negative savings = 0 points
    }

    // 3. Investment Ratio (25 points)
    if (income > 0) {
      const monthlyInvestmentEquivalent = totalInvestments / 12 // Rough monthly equivalent
      metrics.investmentRatio = (monthlyInvestmentEquivalent / income) * 100
      if (metrics.investmentRatio >= 15)
        healthScore += 25 // Excellent
      else if (metrics.investmentRatio >= 10)
        healthScore += 20 // Good
      else if (metrics.investmentRatio >= 5)
        healthScore += 15 // Fair
      else if (metrics.investmentRatio >= 1)
        healthScore += 10 // Poor
      // Below 1% = 5 points
      else healthScore += 5
    }

    // 4. Expense Consistency (20 points)
    // Get last 3 months expenses for variability calculation
    const last3MonthsExpenses = []
    for (let i = 1; i <= 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date)
        return (
          tDate.getMonth() === monthStart.getMonth() &&
          tDate.getFullYear() === monthStart.getFullYear() &&
          t.type === "expense"
        )
      })
      const monthExpenses = monthTransactions.reduce((sum, t) => sum + t.amount, 0)
      last3MonthsExpenses.push(monthExpenses)
    }

    if (last3MonthsExpenses.length >= 2) {
      const avgExpenses = last3MonthsExpenses.reduce((sum, exp) => sum + exp, 0) / last3MonthsExpenses.length
      const variance =
        last3MonthsExpenses.reduce((sum, exp) => sum + Math.pow(exp - avgExpenses, 2), 0) / last3MonthsExpenses.length
      const standardDeviation = Math.sqrt(variance)
      const coefficientOfVariation = avgExpenses > 0 ? (standardDeviation / avgExpenses) * 100 : 100

      if (coefficientOfVariation <= 10)
        healthScore += 20 // Very consistent
      else if (coefficientOfVariation <= 20)
        healthScore += 15 // Consistent
      else if (coefficientOfVariation <= 30)
        healthScore += 10 // Moderately consistent
      else if (coefficientOfVariation <= 50) healthScore += 5 // Inconsistent
      // Above 50% = 0 points (very inconsistent)
    }

    // Determine health grade
    let grade = "F"
    let status = "Critical"
    let color = "#ef4444"

    if (healthScore >= 90) {
      grade = "A+"
      status = "Excellent"
      color = "#22c55e"
    } else if (healthScore >= 80) {
      grade = "A"
      status = "Very Good"
      color = "#16a34a"
    } else if (healthScore >= 70) {
      grade = "B"
      status = "Good"
      color = "#65a30d"
    } else if (healthScore >= 60) {
      grade = "C"
      status = "Fair"
      color = "#ca8a04"
    } else if (healthScore >= 50) {
      grade = "D"
      status = "Poor"
      color = "#ea580c"
    }

    const healthData = {
      score: Math.round(healthScore),
      grade,
      status,
      color,
      month: lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      metrics: {
        income,
        expenses,
        savings,
        totalInvestments,
        incomeToExpenseRatio: metrics.incomeToExpenseRatio,
        savingsRate: metrics.savingsRate,
        investmentRatio: metrics.investmentRatio,
      },
      recommendations: generateRecommendations(healthScore, metrics),
    }

    return NextResponse.json(healthData)
  } catch (error) {
    console.error("Error calculating financial health:", error)
    return NextResponse.json({ error: "Failed to calculate financial health" }, { status: 500 })
  }
}

function generateRecommendations(score: number, metrics: any): string[] {
  const recommendations = []

  if (metrics.savingsRate < 10) {
    recommendations.push("💰 Try to save at least 10% of your income each month")
  }

  if (metrics.incomeToExpenseRatio > 0.8) {
    recommendations.push("📉 Consider reducing unnecessary expenses to improve your financial cushion")
  }

  if (metrics.investmentRatio < 5) {
    recommendations.push("📈 Consider investing in mutual funds or other investment vehicles for long-term growth")
  }

  if (score < 60) {
    recommendations.push("📋 Create a detailed budget to track and control your spending")
    recommendations.push("🎯 Set specific financial goals to improve your financial health")
  }

  if (score >= 80) {
    recommendations.push("🎉 Great job! Keep maintaining your excellent financial habits")
    recommendations.push("🚀 Consider exploring advanced investment strategies")
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint will be called by a cron job on the 1st of every month
    const { action, email } = await request.json()

    if (action === "monthly-health-email") {
      // Get health score
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/financial-health`)
      const healthData = await healthResponse.json()

      // Send email using Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 5px 5px; }
            .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; color: ${healthData.color}; }
            .grade { display: inline-block; padding: 5px 15px; background: ${healthData.color}; color: white; border-radius: 20px; font-weight: bold; }
            .metric { margin-bottom: 15px; }
            .metric-title { font-weight: bold; margin-bottom: 5px; }
            .recommendation { padding: 10px; background: #e9f5ff; margin-bottom: 10px; border-left: 4px solid #3b82f6; border-radius: 3px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Monthly Financial Health Report</h1>
              <p>For ${healthData.month}</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Here's your monthly financial health score and insights:</p>
              
              <div class="score">${healthData.score}<span style="font-size: 24px;">/100</span></div>
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="grade">Grade ${healthData.grade}</span>
                <p style="color: ${healthData.color}; font-weight: bold;">${healthData.status}</p>
              </div>
              
              <h2>Key Metrics</h2>
              
              <div class="metric">
                <div class="metric-title">Income to Expense Ratio</div>
                <p>You're spending ${(healthData.metrics.incomeToExpenseRatio * 100).toFixed(1)}% of your income</p>
              </div>
              
              <div class="metric">
                <div class="metric-title">Savings Rate</div>
                <p>You're saving ${healthData.metrics.savingsRate.toFixed(1)}% of your income</p>
              </div>
              
              <div class="metric">
                <div class="metric-title">Investment Ratio</div>
                <p>Your investments represent ${healthData.metrics.investmentRatio.toFixed(1)}% of monthly income</p>
              </div>
              
              <h2>Recommendations</h2>
              ${healthData.recommendations.map((rec) => `<div class="recommendation">${rec}</div>`).join("")}
              
              <p>Log in to your FinanceFlow Pro dashboard for more detailed insights and to take action on these recommendations.</p>
              
              <p>Best regards,<br>FinanceFlow Pro Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email from FinanceFlow Pro. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"FinanceFlow Pro" <noreply@financeflow.pro>',
        to: email || process.env.EMAIL_TO,
        subject: `Your Financial Health Score: ${healthData.grade} (${healthData.score}/100) - ${healthData.month}`,
        html: emailHtml,
      })

      return NextResponse.json({
        success: true,
        message: "Health score email sent",
        data: healthData,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in financial health POST:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
