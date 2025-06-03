export interface Transaction {
  _id?: string
  type: "income" | "expense"
  amount: number
  category: string
  date: Date
  description: string
  source: string
  createdAt?: Date
  updatedAt?: Date
}

export interface MutualFund {
  _id?: string
  fundName: string
  investmentType: "sip" | "lump sum" | "additional investment"
  fundType: "equity" | "debt" | "hybrid" | "index" | "elss"
  initialInvestment: number
  currentValue: number
  investmentDate: Date
  updateHistory: Array<{
    date: Date
    value: number
    notes?: string
  }>
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserProfile {
  _id?: string
  monthlyIncomeGoal: number
  savingsTarget: number
  preferredCurrency: string
  motivationalQuotesPreference: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface DashboardData {
  monthlyIncome: number
  monthlyExpenses: number
  netSavings: number
  mutualFundValue: number
  savingsGoal: number
  savingsProgress: number
  totalTransactions: number
  totalFunds: number
}
