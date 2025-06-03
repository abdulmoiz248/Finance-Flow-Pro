import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { type, startDate, endDate } = await request.json()
    const db = await getDatabase()

    // Calculate date range based on type
    const now = new Date()
    let start: Date, end: Date

    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      switch (type) {
        case "yearly":
          start = new Date(now.getFullYear(), 0, 1)
          end = new Date(now.getFullYear(), 11, 31)
          break
        case "quarterly":
          const quarter = Math.floor(now.getMonth() / 3)
          start = new Date(now.getFullYear(), quarter * 3, 1)
          end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
          break
        default: // monthly
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }
    }

    // Fetch data
    const transactions = await db
      .collection("transactions")
      .find({
        date: { $gte: start, $lte: end },
      })
      .sort({ date: -1 })
      .toArray()

    const mutualFunds = await db.collection("mutualFunds").find({}).toArray()

    // Calculate summary
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const netSavings = totalIncome - totalExpenses
    const totalMutualFundValue = mutualFunds.reduce((sum, fund) => sum + fund.currentValue, 0)

    // Category breakdown
    const categoryBreakdown = new Map()
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const category = t.category || "Other"
        categoryBreakdown.set(category, (categoryBreakdown.get(category) || 0) + t.amount)
      })

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinanceFlow Pro - Financial Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .logo {
            font-size: 3em;
            font-weight: 800;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .report-title {
            font-size: 1.8em;
            margin-bottom: 15px;
            opacity: 0.95;
        }
        
        .report-period {
            font-size: 1.1em;
            opacity: 0.9;
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 10px;
        }
        
        .generated-date {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .content {
            padding: 40px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            border-left: 5px solid;
            transition: transform 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .summary-card:hover {
            transform: translateY(-5px);
        }
        
        .income-card { border-left-color: #27ae60; }
        .expense-card { border-left-color: #e74c3c; }
        .savings-card { border-left-color: #3498db; }
        .investment-card { border-left-color: #9b59b6; }
        
        .card-title {
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            opacity: 0.7;
            font-weight: 600;
        }
        
        .card-amount {
            font-size: 2em;
            font-weight: 800;
            margin-bottom: 5px;
        }
        
        .income-card .card-amount { color: #27ae60; }
        .expense-card .card-amount { color: #e74c3c; }
        .savings-card .card-amount { color: #3498db; }
        .investment-card .card-amount { color: #9b59b6; }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #2c3e50;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            width: 30px;
            height: 30px;
            margin-right: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .table-container {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border: 1px solid #e9ecef;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.85em;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #f8f9fa;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        tr:hover {
            background-color: #e3f2fd;
        }
        
        .income-row { color: #27ae60; font-weight: 600; }
        .expense-row { color: #e74c3c; font-weight: 600; }
        
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .category-item {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #e74c3c;
        }
        
        .category-name {
            font-weight: 600;
            margin-bottom: 5px;
            text-transform: capitalize;
        }
        
        .category-amount {
            font-size: 1.2em;
            color: #e74c3c;
            font-weight: 700;
        }
        
        .mutual-fund-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .fund-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 20px;
            border-left: 5px solid #9b59b6;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .fund-name {
            font-size: 1.2em;
            font-weight: 700;
            margin-bottom: 15px;
            color: #2c3e50;
        }
        
        .fund-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .fund-detail {
            text-align: center;
        }
        
        .fund-detail-label {
            font-size: 0.8em;
            opacity: 0.7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .fund-detail-value {
            font-size: 1.1em;
            font-weight: 600;
            margin-top: 2px;
        }
        
        .gain-positive { color: #27ae60; }
        .gain-negative { color: #e74c3c; }
        
        .footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
            font-style: italic;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <div class="logo">💰 FinanceFlow Pro</div>
                <div class="report-title">Financial Report - ${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="report-period">📅 ${start.toLocaleDateString()} to ${end.toLocaleDateString()}</div>
                <div class="generated-date">Generated on ${new Date().toLocaleDateString()}</div>
            </div>
        </div>

        <div class="content">
            <!-- Summary Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📊</span>
                    Financial Summary
                </h2>
                <div class="summary-grid">
                    <div class="summary-card income-card">
                        <div class="card-title">Total Income</div>
                        <div class="card-amount">PKR ${totalIncome.toLocaleString()}</div>
                    </div>
                    <div class="summary-card expense-card">
                        <div class="card-title">Total Expenses</div>
                        <div class="card-amount">PKR ${totalExpenses.toLocaleString()}</div>
                    </div>
                    <div class="summary-card savings-card">
                        <div class="card-title">Net Savings</div>
                        <div class="card-amount">PKR ${netSavings.toLocaleString()}</div>
                    </div>
                    <div class="summary-card investment-card">
                        <div class="card-title">Mutual Fund Value</div>
                        <div class="card-amount">PKR ${totalMutualFundValue.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            ${
              categoryBreakdown.size > 0
                ? `
            <!-- Category Breakdown -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">🏷️</span>
                    Expense Categories
                </h2>
                <div class="category-grid">
                    ${Array.from(categoryBreakdown.entries())
                      .map(
                        ([category, amount]) => `
                        <div class="category-item">
                            <div class="category-name">${category}</div>
                            <div class="category-amount">PKR ${amount.toLocaleString()}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            `
                : ""
            }

            <!-- Transactions Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">💳</span>
                    Transaction Details
                </h2>
                ${
                  transactions.length > 0
                    ? `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions
                              .slice(0, 50)
                              .map(
                                (transaction) => `
                                <tr class="${transaction.type}-row">
                                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                                    <td style="text-transform: capitalize;">${transaction.type}</td>
                                    <td style="text-transform: capitalize;">${transaction.category}</td>
                                    <td>${transaction.description}</td>
                                    <td style="font-weight: 700;">
                                        ${transaction.type === "income" ? "+" : "-"}PKR ${transaction.amount.toLocaleString()}
                                    </td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                ${transactions.length > 50 ? `<p style="text-align: center; margin-top: 15px; color: #7f8c8d;"><em>... and ${transactions.length - 50} more transactions</em></p>` : ""}
                `
                    : '<div class="no-data">No transactions found for this period</div>'
                }
            </div>

            ${
              mutualFunds.length > 0
                ? `
            <!-- Mutual Funds Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📈</span>
                    Mutual Fund Portfolio
                </h2>
                <div class="mutual-fund-grid">
                    ${mutualFunds
                      .map((fund) => {
                        const gainLoss = fund.currentValue - fund.initialInvestment
                        const percentage = (gainLoss / fund.initialInvestment) * 100
                        return `
                        <div class="fund-card">
                            <div class="fund-name">${fund.fundName}</div>
                            <div class="fund-details">
                                <div class="fund-detail">
                                    <div class="fund-detail-label">Investment Type</div>
                                    <div class="fund-detail-value" style="text-transform: capitalize;">${fund.investmentType}</div>
                                </div>
                                <div class="fund-detail">
                                    <div class="fund-detail-label">Fund Category</div>
                                    <div class="fund-detail-value" style="text-transform: capitalize;">${fund.fundType}</div>
                                </div>
                                <div class="fund-detail">
                                    <div class="fund-detail-label">Initial Investment</div>
                                    <div class="fund-detail-value">PKR ${fund.initialInvestment.toLocaleString()}</div>
                                </div>
                                <div class="fund-detail">
                                    <div class="fund-detail-label">Current Value</div>
                                    <div class="fund-detail-value">PKR ${fund.currentValue.toLocaleString()}</div>
                                </div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                                <div class="fund-detail-label">Gain/Loss</div>
                                <div class="fund-detail-value ${gainLoss >= 0 ? "gain-positive" : "gain-negative"}">
                                    ${gainLoss >= 0 ? "+" : ""}PKR ${Math.abs(gainLoss).toLocaleString()}
                                    (${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%)
                                </div>
                            </div>
                        </div>
                        `
                      })
                      .join("")}
                </div>
            </div>
            `
                : ""
            }
        </div>

        <div class="footer">
            <p>📊 Generated by FinanceFlow Pro | Your Personal Finance Management Hub</p>
            <p style="margin-top: 5px; opacity: 0.8;">This report contains confidential financial information</p>
        </div>
    </div>
</body>
</html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="financial-report-${type}-${start.toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
