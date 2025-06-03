import { getDatabase, testConnection } from "./mongodb"

export async function setupDatabase() {
  try {
    console.log("🔧 Setting up database...")
    const db = await getDatabase()

    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    // Create transactions collection
    if (!collectionNames.includes("transactions")) {
      await db.createCollection("transactions")
      console.log("✅ Created transactions collection")
    }

    // Create mutualFunds collection
    if (!collectionNames.includes("mutualFunds")) {
      await db.createCollection("mutualFunds")
      console.log("✅ Created mutualFunds collection")
    }

    // Create userProfiles collection
    if (!collectionNames.includes("userProfiles")) {
      await db.createCollection("userProfiles")
      console.log("✅ Created userProfiles collection")
    }

    // Create indexes for better performance
    await createIndexes(db)

    // Insert sample data if collections are empty
    await insertSampleData(db)

    console.log("🎉 Database setup completed successfully!")
    return true
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    throw error
  }
}

async function createIndexes(db: any) {
  try {
    // Transactions indexes
    await db.collection("transactions").createIndex({ date: -1 })
    await db.collection("transactions").createIndex({ type: 1 })
    await db.collection("transactions").createIndex({ category: 1 })
    await db.collection("transactions").createIndex({ createdAt: -1 })

    // Mutual funds indexes
    await db.collection("mutualFunds").createIndex({ investmentDate: -1 })
    await db.collection("mutualFunds").createIndex({ fundType: 1 })
    await db.collection("mutualFunds").createIndex({ createdAt: -1 })

    console.log("✅ Database indexes created")
  } catch (error) {
    console.error("❌ Error creating indexes:", error)
  }
}

async function insertSampleData(db: any) {
  try {
    // Check if we already have data
    const transactionCount = await db.collection("transactions").countDocuments()
    const mutualFundCount = await db.collection("mutualFunds").countDocuments()
    const userProfileCount = await db.collection("userProfiles").countDocuments()

    // Insert sample transactions if none exist
    if (transactionCount === 0) {
      const sampleTransactions = [
        {
          type: "income",
          amount: 75000,
          category: "salary",
          date: new Date("2024-01-15"),
          description: "Monthly salary",
          source: "bank transfer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: "expense",
          amount: 25000,
          category: "rent",
          date: new Date("2024-01-01"),
          description: "Monthly rent payment",
          source: "bank transfer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: "expense",
          amount: 8000,
          category: "groceries",
          date: new Date("2024-01-10"),
          description: "Weekly grocery shopping",
          source: "debit card",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: "expense",
          amount: 3000,
          category: "utilities",
          date: new Date("2024-01-05"),
          description: "Electricity bill",
          source: "bank transfer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: "income",
          amount: 15000,
          category: "freelance",
          date: new Date("2024-01-20"),
          description: "Web development project",
          source: "digital wallet",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await db.collection("transactions").insertMany(sampleTransactions)
      console.log("✅ Sample transactions inserted")
    }

    // Insert sample mutual funds if none exist
    if (mutualFundCount === 0) {
      const sampleMutualFunds = [
        {
          fundName: "ABC Equity Growth Fund",
          investmentType: "sip",
          fundType: "equity",
          initialInvestment: 50000,
          currentValue: 55000,
          investmentDate: new Date("2023-06-01"),
          updateHistory: [
            {
              date: new Date("2023-06-01"),
              value: 50000,
              notes: "Initial investment",
            },
            {
              date: new Date("2023-12-01"),
              value: 52000,
              notes: "6-month update",
            },
            {
              date: new Date("2024-01-01"),
              value: 55000,
              notes: "New year update",
            },
          ],
          notes: "Long-term equity investment for wealth creation",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          fundName: "XYZ Debt Fund",
          investmentType: "lump sum",
          fundType: "debt",
          initialInvestment: 100000,
          currentValue: 105000,
          investmentDate: new Date("2023-08-15"),
          updateHistory: [
            {
              date: new Date("2023-08-15"),
              value: 100000,
              notes: "Initial lump sum investment",
            },
            {
              date: new Date("2024-01-15"),
              value: 105000,
              notes: "5-month growth",
            },
          ],
          notes: "Conservative debt fund for stable returns",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await db.collection("mutualFunds").insertMany(sampleMutualFunds)
      console.log("✅ Sample mutual funds inserted")
    }

    // Insert default user profile if none exists
    if (userProfileCount === 0) {
      const defaultProfile = {
        monthlyIncomeGoal: 100000,
        savingsTarget: 50000,
        preferredCurrency: "PKR",
        motivationalQuotesPreference: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection("userProfiles").insertOne(defaultProfile)
      console.log("✅ Default user profile created")
    }
  } catch (error) {
    console.error("❌ Error inserting sample data:", error)
  }
}

export { testConnection }
