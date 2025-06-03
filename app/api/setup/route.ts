import { NextResponse } from "next/server"
import { setupDatabase, testConnection } from "@/lib/db-setup"

export async function POST() {
  try {
    // Test connection first
    const connectionTest = await testConnection()
    if (!connectionTest) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: "Please check your MongoDB connection string and network connectivity",
        },
        { status: 500 },
      )
    }

    // Setup database
    await setupDatabase()

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      {
        error: "Database setup failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const connectionTest = await testConnection()

    return NextResponse.json({
      connected: connectionTest,
      message: connectionTest ? "Database connection successful" : "Database connection failed",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
