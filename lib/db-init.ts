import { getDatabase } from "./mongodb"

export async function initializeDatabase() {
  try {
    const db = await getDatabase()

    // Create indexes for better performance
    await db.collection("transactions").createIndex({ date: -1 })
    await db.collection("transactions").createIndex({ type: 1 })
    await db.collection("transactions").createIndex({ category: 1 })

    await db.collection("mutualFunds").createIndex({ investmentDate: -1 })
    await db.collection("mutualFunds").createIndex({ fundType: 1 })

    console.log("Database indexes created successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}
