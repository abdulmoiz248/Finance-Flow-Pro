import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const mutualFunds = await db.collection("mutualFunds").find({}).sort({ investmentDate: -1 }).toArray()

    return NextResponse.json(mutualFunds)
  } catch (error) {
    console.error("Error fetching mutual funds:", error)
    return NextResponse.json({ error: "Failed to fetch mutual funds" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDatabase()

    const mutualFund = {
      ...body,
      investmentDate: new Date(body.investmentDate),
      updateHistory: body.updateHistory?.map((update: any) => ({
        ...update,
        date: new Date(update.date),
      })) || [
        {
          date: new Date(body.investmentDate),
          value: body.currentValue,
          notes: "Initial investment",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("mutualFunds").insertOne(mutualFund)

    return NextResponse.json({
      ...mutualFund,
      _id: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating mutual fund:", error)
    return NextResponse.json({ error: "Failed to create mutual fund" }, { status: 500 })
  }
}
