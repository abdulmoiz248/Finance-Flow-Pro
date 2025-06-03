"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Target, Plus, Edit, Trash2, Trophy, Clock, DollarSign } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Goal {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  category: "emergency" | "vacation" | "house" | "car" | "education" | "retirement" | "other"
  color: string
  createdAt: Date
}

const goalCategories = [
  { value: "emergency", label: "Emergency Fund", icon: "🚨", color: "#ef4444" },
  { value: "vacation", label: "Vacation", icon: "🏖️", color: "#06b6d4" },
  { value: "house", label: "House/Property", icon: "🏠", color: "#22c55e" },
  { value: "car", label: "Vehicle", icon: "🚗", color: "#f59e0b" },
  { value: "education", label: "Education", icon: "🎓", color: "#8b5cf6" },
  { value: "retirement", label: "Retirement", icon: "🏖️", color: "#ec4899" },
  { value: "other", label: "Other", icon: "🎯", color: "#6b7280" },
]

export default function GoalsTracker() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetAmount: "",
    targetDate: undefined as Date | undefined,
    category: "other" as Goal["category"],
  })

  useEffect(() => {
    // Load goals from localStorage
    const saved = localStorage.getItem("financial-goals")
    if (saved) {
      const parsed = JSON.parse(saved)
      setGoals(
        parsed.map((g: any) => ({
          ...g,
          targetDate: new Date(g.targetDate),
          createdAt: new Date(g.createdAt),
        })),
      )
    } else {
      // Default goals
      const defaultGoals: Goal[] = [
        {
          id: "1",
          title: "Emergency Fund",
          description: "6 months of expenses for financial security",
          targetAmount: 300000,
          currentAmount: 125000,
          targetDate: new Date(2024, 11, 31),
          category: "emergency",
          color: "#ef4444",
          createdAt: new Date(),
        },
        {
          id: "2",
          title: "Dream Vacation",
          description: "Trip to Europe with family",
          targetAmount: 150000,
          currentAmount: 45000,
          targetDate: new Date(2024, 6, 15),
          category: "vacation",
          color: "#06b6d4",
          createdAt: new Date(),
        },
      ]
      setGoals(defaultGoals)
      saveGoals(defaultGoals)
    }
  }, [])

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals)
    localStorage.setItem("financial-goals", JSON.stringify(newGoals))
  }

  const addGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      toast.error("Please fill all required fields")
      return
    }

    const categoryData = goalCategories.find((c) => c.value === newGoal.category)
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      targetAmount: Number.parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      targetDate: newGoal.targetDate,
      category: newGoal.category,
      color: categoryData?.color || "#6b7280",
      createdAt: new Date(),
    }

    saveGoals([...goals, goal])
    setNewGoal({
      title: "",
      description: "",
      targetAmount: "",
      targetDate: undefined,
      category: "other",
    })
    setShowAddDialog(false)
    toast.success("Goal created successfully!")
  }

  const updateGoalProgress = (id: string, amount: number) => {
    const updatedGoals = goals.map((goal) =>
      goal.id === id ? { ...goal, currentAmount: Math.max(0, goal.currentAmount + amount) } : goal,
    )
    saveGoals(updatedGoals)
    toast.success(amount > 0 ? "Progress added!" : "Amount deducted!")
  }

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter((g) => g.id !== id))
    toast.success("Goal deleted")
  }

  const getGoalStatus = (goal: Goal) => {
    const percentage = (goal.currentAmount / goal.targetAmount) * 100
    const daysLeft = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    if (percentage >= 100) return { status: "completed", color: "text-green-600", bg: "bg-green-50" }
    if (daysLeft < 0) return { status: "overdue", color: "text-red-600", bg: "bg-red-50" }
    if (daysLeft < 30) return { status: "urgent", color: "text-orange-600", bg: "bg-orange-50" }
    return { status: "on-track", color: "text-blue-600", bg: "bg-blue-50" }
  }

  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-700">{goals.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-700">{completedGoals}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold text-purple-700">
                PKR {totalTargetAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved So Far</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold text-orange-700">
                PKR {totalCurrentAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Goal Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">Financial Goals</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Goal</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a financial target to work towards</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Title *</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Describe your goal..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Amount (PKR) *</Label>
                <Input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newGoal.targetDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newGoal.targetDate ? format(newGoal.targetDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newGoal.targetDate}
                      onSelect={(date) => setNewGoal({ ...newGoal, targetDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {goalCategories.map((category) => (
                    <Button
                      key={category.value}
                      variant={newGoal.category === category.value ? "default" : "outline"}
                      className="justify-start h-auto p-3"
                      onClick={() => setNewGoal({ ...newGoal, category: category.value as Goal["category"] })}
                    >
                      <span className="mr-2">{category.icon}</span>
                      <span className="text-xs">{category.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={addGoal} className="flex-1">
                  Create Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AnimatePresence>
          {goals.map((goal, index) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const status = getGoalStatus(goal)
            const daysLeft = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            const categoryData = goalCategories.find((c) => c.value === goal.category)

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${status.bg} border-l-4`} style={{ borderLeftColor: goal.color }}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{categoryData?.icon}</span>
                          <CardTitle className="text-base sm:text-lg">{goal.title}</CardTitle>
                        </div>
                        {goal.description && <CardDescription className="text-sm">{goal.description}</CardDescription>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={status.color}>PKR {goal.currentAmount.toLocaleString()}</span>
                        <span className="text-gray-600">of PKR {goal.targetAmount.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-3"
                        style={{
                          backgroundColor: `${goal.color}20`,
                        }}
                      />
                      <div className="flex justify-between items-center">
                        <Badge
                          variant={
                            status.status === "completed"
                              ? "default"
                              : status.status === "overdue"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {percentage.toFixed(0)}% complete
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const amount = prompt("Add amount to goal:")
                          if (amount) updateGoalProgress(goal.id, Number.parseFloat(amount))
                        }}
                      >
                        Add Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const amount = prompt("Deduct amount from goal:")
                          if (amount) updateGoalProgress(goal.id, -Number.parseFloat(amount))
                        }}
                      >
                        Deduct
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500">Target: {format(goal.targetDate, "MMM dd, yyyy")}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {goals.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
          <p className="text-gray-600 mb-4">Create your first financial goal to start saving with purpose</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </Card>
      )}
    </div>
  )
}
