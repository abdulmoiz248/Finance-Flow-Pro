"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Target, Plus, Edit, Trash2, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface Budget {
  id: string
  category: string
  limit: number
  spent: number
  period: "monthly" | "weekly" | "yearly"
  color: string
}

const categories = [
  "Groceries",
  "Transportation",
  "Entertainment",
  "Healthcare",
  "Education",
  "Utilities",
  "Rent",
  "Shopping",
  "Dining",
  "Other",
]

const colors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
]

export default function BudgetTracker() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: "",
    limit: "",
    period: "monthly" as const,
  })

  useEffect(() => {
    // Load budgets from localStorage
    const saved = localStorage.getItem("budgets")
    if (saved) {
      setBudgets(JSON.parse(saved))
    } else {
      // Default budgets
      const defaultBudgets: Budget[] = [
        { id: "1", category: "Groceries", limit: 15000, spent: 8500, period: "monthly", color: "#22c55e" },
        { id: "2", category: "Transportation", limit: 5000, spent: 6200, period: "monthly", color: "#ef4444" },
        { id: "3", category: "Entertainment", limit: 8000, spent: 3200, period: "monthly", color: "#8b5cf6" },
      ]
      setBudgets(defaultBudgets)
      localStorage.setItem("budgets", JSON.stringify(defaultBudgets))
    }
  }, [])

  const saveBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets)
    localStorage.setItem("budgets", JSON.stringify(newBudgets))
  }

  const addBudget = () => {
    if (!newBudget.category || !newBudget.limit) {
      toast.error("Please fill all fields")
      return
    }

    const budget: Budget = {
      id: Date.now().toString(),
      category: newBudget.category,
      limit: Number.parseFloat(newBudget.limit),
      spent: 0,
      period: newBudget.period,
      color: colors[budgets.length % colors.length],
    }

    saveBudgets([...budgets, budget])
    setNewBudget({ category: "", limit: "", period: "monthly" })
    setShowAddDialog(false)
    toast.success("Budget added successfully!")
  }

  const deleteBudget = (id: string) => {
    saveBudgets(budgets.filter((b) => b.id !== id))
    toast.success("Budget deleted")
  }

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.limit) * 100
    if (percentage >= 100) return { status: "exceeded", color: "text-red-600", bg: "bg-red-50" }
    if (percentage >= 80) return { status: "warning", color: "text-orange-600", bg: "bg-orange-50" }
    return { status: "good", color: "text-green-600", bg: "bg-green-50" }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-700">PKR {totalBudget.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-700">PKR {totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                PKR {(totalBudget - totalSpent).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-700">{overBudgetCount} Categories</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Budget Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">Budget Categories</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Budget</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Budget</DialogTitle>
              <DialogDescription>Set a spending limit for a category</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newBudget.category}
                  onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget Limit (PKR)</Label>
                <Input
                  type="number"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={(value: "monthly" | "weekly" | "yearly") =>
                    setNewBudget({ ...newBudget, period: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={addBudget} className="flex-1">
                  Add Budget
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence>
          {budgets.map((budget, index) => {
            const percentage = Math.min((budget.spent / budget.limit) * 100, 100)
            const status = getBudgetStatus(budget)

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${status.bg} border-l-4`} style={{ borderLeftColor: budget.color }}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base sm:text-lg">{budget.category}</CardTitle>
                        <CardDescription className="capitalize">{budget.period} budget</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => deleteBudget(budget.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className={status.color}>PKR {budget.spent.toLocaleString()} spent</span>
                      <span className="text-gray-600">of PKR {budget.limit.toLocaleString()}</span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={{
                        backgroundColor: `${budget.color}20`,
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <Badge
                        variant={
                          status.status === "exceeded"
                            ? "destructive"
                            : status.status === "warning"
                              ? "secondary"
                              : "default"
                        }
                        className="text-xs"
                      >
                        {percentage.toFixed(0)}% used
                      </Badge>
                      <span className="text-xs text-gray-500">
                        PKR {(budget.limit - budget.spent).toLocaleString()} left
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {budgets.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Budgets Set</h3>
          <p className="text-gray-600 mb-4">Start by creating your first budget to track spending</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </Card>
      )}
    </div>
  )
}
