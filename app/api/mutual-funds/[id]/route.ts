import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const db = await getDatabase()

    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    if (body.investmentDate) {
      updateData.investmentDate = new Date(body.investmentDate)
    }

    if (body.updateHistory) {
      updateData.updateHistory = body.updateHistory.map((update: any) => ({
        ...update,
        date: new Date(update.date),
      }))
    }

    const result = await db.collection("mutualFunds").updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Mutual fund not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating mutual fund:", error)
    return NextResponse.json({ error: "Failed to update mutual fund" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()

    const result = await db.collection("mutualFunds").deleteOne({
      _id: new ObjectId(params.id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Mutual fund not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting mutual fund:", error)
    return NextResponse.json({ error: "Failed to delete mutual fund" }, { status: 500 })
  }
}
