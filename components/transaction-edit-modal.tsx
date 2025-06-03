"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Edit } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { transactionAPI } from "@/lib/api"
import { toast } from "sonner"
import type { Transaction } from "@/lib/types"

interface TransactionEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  transaction: Transaction | null
}

const categories = {
  income: ["Salary", "Bonus", "Freelance", "Investment Returns", "Other Income"],
  expense: ["Rent", "Groceries", "Utilities", "Transportation", "Entertainment", "Healthcare", "Education", "Other"],
}

const sources = ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet"]

export default function TransactionEditModal({
  open,
  onOpenChange,
  onSuccess,
  transaction,
}: TransactionEditModalProps) {
  const [type, setType] = useState<"income" | "expense">("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState<Date>()
  const [description, setDescription] = useState("")
  const [source, setSource] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (transaction && open) {
      setType(transaction.type)
      setAmount(transaction.amount?.toString() || "")
      setCategory(transaction.category || "")
      setDate(transaction.date ? new Date(transaction.date) : undefined)
      setDescription(transaction.description || "")
      setSource(transaction.source || "")
    }
  }, [transaction, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction?._id) return

    setIsLoading(true)
    try {
      await transactionAPI.update(transaction._id, {
        type,
        amount: Number.parseFloat(amount),
        category,
        date: date || new Date(),
        description,
        source,
      })
      toast.success("Transaction updated successfully!")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error("Error updating transaction:", error)
      toast.error(error.message || "Failed to update transaction")
    } finally {
      setIsLoading(false)
    }
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Transaction
          </DialogTitle>
          <DialogDescription>Update your transaction details.</DialogDescription>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transaction Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as "income" | "expense")}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="text-green-600 font-medium">
                  Income
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="text-red-600 font-medium">
                  Expense
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount and Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories[type].map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Source Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM dd") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Payment Source</Label>
              <Select value={source} onValueChange={setSource} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((src) => (
                    <SelectItem key={src} value={src.toLowerCase()}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                "flex-1",
                type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
              )}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Transaction"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
