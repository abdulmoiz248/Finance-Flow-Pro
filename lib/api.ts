import axios from "axios"
import type { Transaction, MutualFund, UserProfile, DashboardData } from "./types"

const api = axios.create({
  baseURL: "/api",
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout")
    }
    return Promise.reject(error)
  },
)

// Transaction API
export const transactionAPI = {
  getAll: () => api.get<Transaction[]>("/transactions"),
  create: (data: Omit<Transaction, "_id" | "createdAt" | "updatedAt">) => api.post<Transaction>("/transactions", data),
  update: (id: string, data: Partial<Transaction>) => api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  getByDateRange: (startDate: string, endDate: string) =>
    api.get<Transaction[]>(`/transactions/range?start=${startDate}&end=${endDate}`),
  getByCategory: (category: string) => api.get<Transaction[]>(`/transactions/category/${category}`),
}

// Mutual Fund API
export const mutualFundAPI = {
  getAll: () => api.get<MutualFund[]>("/mutual-funds"),
  create: (data: Omit<MutualFund, "_id" | "createdAt" | "updatedAt">) => api.post<MutualFund>("/mutual-funds", data),
  update: (id: string, data: Partial<MutualFund>) => api.put<MutualFund>(`/mutual-funds/${id}`, data),
  delete: (id: string) => api.delete(`/mutual-funds/${id}`),
  updateValue: (id: string, value: number, notes?: string) =>
    api.post(`/mutual-funds/${id}/update-value`, { value, notes }),
}

// Dashboard API
export const dashboardAPI = {
  getData: () => api.get<DashboardData>("/dashboard"),
  getAnalytics: (period: "monthly" | "quarterly" | "yearly") => api.get(`/dashboard/analytics?period=${period}`),
}

// Reports API
export const reportsAPI = {
  generatePDF: (type: "monthly" | "quarterly" | "yearly", startDate?: string, endDate?: string) =>
    api.post("/reports/pdf", { type, startDate, endDate }, { responseType: "text" }),
  getTransactionReport: (startDate: string, endDate: string) =>
    api.get(`/reports/transactions?start=${startDate}&end=${endDate}`),
  getMutualFundReport: () => api.get("/reports/mutual-funds"),
}

// User Profile API
export const userProfileAPI = {
  get: () => api.get<UserProfile>("/user-profile"),
  update: (data: Partial<UserProfile>) => api.put<UserProfile>("/user-profile", data),
}

// Health Check API
export const healthAPI = {
  check: () => api.get("/health"),
}

// Backup API
export const backupAPI = {
  create: () => api.get("/backup", { responseType: "blob" }),
  restore: (data: any) => api.post("/backup", data),
}

export default api
