import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()

    // Get all data
    const transactions = await db.collection("transactions").find({}).toArray()
    const mutualFunds = await db.collection("mutualFunds").find({}).toArray()
    const userProfiles = await db.collection("userProfiles").find({}).toArray()

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        transactions,
        mutualFunds,
        userProfiles,
      },
      metadata: {
        transactionCount: transactions.length,
        mutualFundCount: mutualFunds.length,
        userProfileCount: userProfiles.length,
      },
    }

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="financeflow-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const backupData = await request.json()
    const db = await getDatabase()

    // Validate backup data structure
    if (!backupData.data || !backupData.data.transactions || !backupData.data.mutualFunds) {
      return NextResponse.json({ error: "Invalid backup data format" }, { status: 400 })
    }

    // Clear existing data (optional - you might want to merge instead)
    await db.collection("transactions").deleteMany({})
    await db.collection("mutualFunds").deleteMany({})
    await db.collection("userProfiles").deleteMany({})

    // Restore data
    if (backupData.data.transactions.length > 0) {
      await db.collection("transactions").insertMany(backupData.data.transactions)
    }
    if (backupData.data.mutualFunds.length > 0) {
      await db.collection("mutualFunds").insertMany(backupData.data.mutualFunds)
    }
    if (backupData.data.userProfiles.length > 0) {
      await db.collection("userProfiles").insertMany(backupData.data.userProfiles)
    }

    return NextResponse.json({
      success: true,
      message: "Data restored successfully",
      restored: {
        transactions: backupData.data.transactions.length,
        mutualFunds: backupData.data.mutualFunds.length,
        userProfiles: backupData.data.userProfiles.length,
      },
    })
  } catch (error) {
    console.error("Error restoring backup:", error)
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 })
  }
}
