import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()

    // Test database connection
    await db.admin().ping()

    // Get collection stats
    const transactionCount = await db.collection("transactions").countDocuments()
    const mutualFundCount = await db.collection("mutualFunds").countDocuments()

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      collections: {
        transactions: transactionCount,
        mutualFunds: mutualFundCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
