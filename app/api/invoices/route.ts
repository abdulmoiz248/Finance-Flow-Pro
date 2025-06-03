import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const invoices = await db.collection("invoices").find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDatabase()

    const invoice = {
      ...body,
      invoiceNumber: `INV-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft",
    }

    const result = await db.collection("invoices").insertOne(invoice)

    return NextResponse.json({
      ...invoice,
      _id: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
