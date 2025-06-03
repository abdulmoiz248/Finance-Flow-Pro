import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { value, notes } = await request.json()
    const db = await getDatabase()

    const updateEntry = {
      date: new Date(),
      value: Number.parseFloat(value),
      notes: notes || "",
    }

    const result = await db.collection("mutualFunds").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          currentValue: Number.parseFloat(value),
          updatedAt: new Date(),
        },
        $push: {
          updateHistory: updateEntry,
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Mutual fund not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating mutual fund value:", error)
    return NextResponse.json({ error: "Failed to update mutual fund value" }, { status: 500 })
  }
}
