"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Edit, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { mutualFundAPI } from "@/lib/api"
import { toast } from "sonner"
import type { MutualFund } from "@/lib/types"

interface MutualFundEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  fund: MutualFund | null
}

const investmentTypes = ["SIP", "Lump Sum", "Additional Investment"]
const fundTypes = ["Equity", "Debt", "Hybrid", "Index", "ELSS"]

export default function MutualFundEditModal({ open, onOpenChange, onSuccess, fund }: MutualFundEditModalProps) {
  const [fundName, setFundName] = useState("")
  const [investmentType, setInvestmentType] = useState("")
  const [fundType, setFundType] = useState("")
  const [initialInvestment, setInitialInvestment] = useState("")
  const [currentValue, setCurrentValue] = useState("")
  const [investmentDate, setInvestmentDate] = useState<Date>()
  const [notes, setNotes] = useState("")
  const [additionalInvestment, setAdditionalInvestment] = useState("")
  const [showAdditionalInvestment, setShowAdditionalInvestment] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (fund && open) {
      setFundName(fund.fundName || "")
      setInvestmentType(fund.investmentType || "")
      setFundType(fund.fundType || "")
      setInitialInvestment(fund.initialInvestment?.toString() || "")
      setCurrentValue(fund.currentValue?.toString() || "")
      setInvestmentDate(fund.investmentDate ? new Date(fund.investmentDate) : undefined)
      setNotes(fund.notes || "")
      setAdditionalInvestment("")
      setShowAdditionalInvestment(false)
    }
  }, [fund, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fund?._id) return

    setIsLoading(true)
    try {
      let updatedInitialInvestment = Number.parseFloat(initialInvestment)
      let updatedCurrentValue = Number.parseFloat(currentValue)
      let updateHistory = fund.updateHistory || []

      // Handle additional investment
      if (showAdditionalInvestment && additionalInvestment) {
        const additionalAmount = Number.parseFloat(additionalInvestment)
        updatedInitialInvestment += additionalAmount
        updatedCurrentValue += additionalAmount

        // Add to update history
        updateHistory = [
          ...updateHistory,
          {
            date: new Date(),
            value: updatedCurrentValue,
            notes: `Additional investment of PKR ${additionalAmount.toLocaleString()}`,
          },
        ]
      }

      await mutualFundAPI.update(fund._id, {
        fundName,
        investmentType,
        fundType,
        initialInvestment: updatedInitialInvestment,
        currentValue: updatedCurrentValue,
        investmentDate: investmentDate || new Date(),
        notes,
        updateHistory,
      })

      toast.success(
        showAdditionalInvestment && additionalInvestment
          ? "Fund updated with additional investment!"
          : "Fund updated successfully!",
      )
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error("Error updating fund:", error)
      toast.error(error.message || "Failed to update fund")
    } finally {
      setIsLoading(false)
    }
  }

  if (!fund) return null

  const profitLoss =
    currentValue && initialInvestment ? Number.parseFloat(currentValue) - Number.parseFloat(initialInvestment) : 0

  const profitLossPercentage =
    initialInvestment && currentValue
      ? ((Number.parseFloat(currentValue) - Number.parseFloat(initialInvestment)) /
          Number.parseFloat(initialInvestment)) *
        100
      : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-purple-600" />
            Edit Mutual Fund Investment
          </DialogTitle>
          <DialogDescription>Update your mutual fund details or add additional investment.</DialogDescription>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Fund Name */}
          <div className="space-y-2">
            <Label htmlFor="fundName">Fund Name</Label>
            <Input
              id="fundName"
              placeholder="e.g., ABC Equity Fund"
              value={fundName}
              onChange={(e) => setFundName(e.target.value)}
              required
            />
          </div>

          {/* Investment Type and Fund Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="investmentType">Investment Type</Label>
              <Select value={investmentType} onValueChange={setInvestmentType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundType">Fund Category</Label>
              <Select value={fundType} onValueChange={setFundType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {fundTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Investment Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="initialInvestment">Initial Investment (PKR)</Label>
              <Input
                id="initialInvestment"
                type="number"
                placeholder="0.00"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value (PKR)</Label>
              <Input
                id="currentValue"
                type="number"
                placeholder="0.00"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Additional Investment Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Additional Investment</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdditionalInvestment(!showAdditionalInvestment)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {showAdditionalInvestment ? "Cancel" : "Add More"}
              </Button>
            </div>

            {showAdditionalInvestment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Input
                  type="number"
                  placeholder="Additional amount (PKR)"
                  value={additionalInvestment}
                  onChange={(e) => setAdditionalInvestment(e.target.value)}
                />
                <p className="text-sm text-gray-500">This will be added to your initial investment and current value</p>
              </motion.div>
            )}
          </div>

          {/* Profit/Loss Display */}
          {profitLoss !== 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-3 rounded-lg border-2",
                profitLoss >= 0
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{profitLoss >= 0 ? "Profit" : "Loss"}:</span>
                <span className={cn("font-bold", profitLoss >= 0 ? "text-green-600" : "text-red-600")}>
                  PKR {Math.abs(profitLoss).toLocaleString()} ({profitLossPercentage >= 0 ? "+" : ""}
                  {profitLossPercentage.toFixed(2)}%)
                </span>
              </div>
            </motion.div>
          )}

          {/* Investment Date and Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Investment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !investmentDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {investmentDate ? format(investmentDate, "MMM dd, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={investmentDate} onSelect={setInvestmentDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Investment notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? "Updating..." : showAdditionalInvestment ? "Update & Add Investment" : "Update Fund"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
