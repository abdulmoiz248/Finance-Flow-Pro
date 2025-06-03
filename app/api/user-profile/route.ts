import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    let userProfile = await db.collection("userProfiles").findOne({})

    if (!userProfile) {
      // Create default profile if none exists
      const defaultProfile = {
        monthlyIncomeGoal: 100000,
        savingsTarget: 50000,
        preferredCurrency: "PKR",
        motivationalQuotesPreference: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("userProfiles").insertOne(defaultProfile)
      userProfile = { ...defaultProfile, _id: result.insertedId }
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDatabase()

    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    const result = await db.collection("userProfiles").updateOne({}, { $set: updateData }, { upsert: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
