"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Edit, Trash2, Plus, Eye, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { mutualFundAPI } from "@/lib/api"
import type { MutualFund } from "@/lib/types"
import { toast } from "sonner"
import LoadingSpinner from "@/components/loading-spinner"
import MutualFundEditModal from "@/components/mutual-fund-edit-modal"

interface MutualFundListProps {
  onDataUpdate: () => void
}

export default function MutualFundList({ onDataUpdate }: MutualFundListProps) {
  const [funds, setFunds] = useState<MutualFund[]>([])
  const [selectedFund, setSelectedFund] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingFundId, setUpdatingFundId] = useState<string | null>(null)
  const [editingFund, setEditingFund] = useState<MutualFund | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const fetchFunds = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await mutualFundAPI.getAll()
        const data = response.data || []
        setFunds(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setError(err.message || "Failed to fetch mutual funds")
        toast.error(err.message || "Failed to fetch mutual funds")
        setFunds([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFunds()
  }, [])

  const totalInvestment = Array.isArray(funds) ? funds.reduce((sum, fund) => sum + (fund.initialInvestment || 0), 0) : 0

  const totalCurrentValue = Array.isArray(funds) ? funds.reduce((sum, fund) => sum + (fund.currentValue || 0), 0) : 0

  const totalGainLoss = totalCurrentValue - totalInvestment
  const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0

  const calculateGainLoss = (fund: MutualFund) => {
    const initial = fund.initialInvestment || 0
    const current = fund.currentValue || 0
    const gainLoss = current - initial
    const percentage = initial > 0 ? (gainLoss / initial) * 100 : 0
    return { gainLoss, percentage }
  }

  const handleDeleteFund = async (id: string) => {
    try {
      await mutualFundAPI.delete(id)
      setFunds(funds.filter((fund) => fund._id !== id))
      toast.success("Fund deleted successfully")
      onDataUpdate()
    } catch (error: any) {
      console.error("Error deleting fund:", error)
      toast.error(error.message || "Failed to delete fund")
    }
  }

  const handleEditFund = (fund: MutualFund) => {
    setEditingFund(fund)
    setShowEditModal(true)
  }

  const handleUpdateValue = async (id: string, newValue: number) => {
    setUpdatingFundId(id)
    try {
      await mutualFundAPI.updateValue(id, newValue)
      setFunds(funds.map((fund) => (fund._id === id ? { ...fund, currentValue: newValue } : fund)))
      toast.success("Fund value updated successfully")
      onDataUpdate()
    } catch (error: any) {
      console.error("Error updating fund value:", error)
      toast.error(error.message || "Failed to update fund value")
    } finally {
      setUpdatingFundId(null)
    }
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading mutual funds..." className="h-64" />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Total Invested</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">PKR {totalInvestment.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">Current Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">PKR {totalCurrentValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            className={`border-2 ${totalGainLoss >= 0 ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                Total {totalGainLoss >= 0 ? "Gain" : "Loss"}
              </CardTitle>
              {totalGainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-700" : "text-red-700"}`}>
                {totalGainLoss >= 0 ? "+" : ""}PKR {Math.abs(totalGainLoss).toLocaleString()}
              </div>
              <p className={`text-sm ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalGainLossPercentage >= 0 ? "+" : ""}
                {totalGainLossPercentage.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">Active Funds</CardTitle>
              <Plus className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{funds.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mutual Funds Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Mutual Fund Portfolio</CardTitle>
            <CardDescription>Track your mutual fund investments and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            {funds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No mutual funds found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Investment Date</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {funds.map((fund, index) => {
                        const { gainLoss, percentage } = calculateGainLoss(fund)
                        return (
                          <motion.tr
                            key={fund._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <TableCell className="font-medium">
                              <div>
                                <p className="font-semibold">{fund.fundName || "N/A"}</p>
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">{fund.notes || ""}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {fund.investmentType || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`capitalize ${
                                  fund.fundType === "equity"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : fund.fundType === "debt"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                }`}
                              >
                                {fund.fundType || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {fund.investmentDate ? format(new Date(fund.investmentDate), "MMM dd, yyyy") : "N/A"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              PKR {(fund.initialInvestment || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-bold text-purple-600">
                              PKR {(fund.currentValue || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`font-bold ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {gainLoss >= 0 ? "+" : ""}PKR {Math.abs(gainLoss).toLocaleString()}
                              </div>
                              <div className={`text-sm ${gainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {percentage >= 0 ? "+" : ""}
                                {percentage.toFixed(2)}%
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setSelectedFund(selectedFund === fund._id ? null : fund._id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditFund(fund)}
                                  disabled={updatingFundId === fund._id}
                                >
                                  {updatingFundId === fund._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Edit className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteFund(fund._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Fund Details */}
      <AnimatePresence>
        {selectedFund && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {funds
              .filter((fund) => fund._id === selectedFund)
              .map((fund) => (
                <Card key={fund._id} className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      {fund.fundName} - Performance History
                    </CardTitle>
                    <CardDescription>Track the NAV updates and performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Performance Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Performance Progress</span>
                          <span className={calculateGainLoss(fund).gainLoss >= 0 ? "text-green-600" : "text-red-600"}>
                            {calculateGainLoss(fund).percentage >= 0 ? "+" : ""}
                            {calculateGainLoss(fund).percentage.toFixed(2)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(Math.abs(calculateGainLoss(fund).percentage), 100)}
                          className={`h-2 ${calculateGainLoss(fund).gainLoss >= 0 ? "bg-green-100" : "bg-red-100"}`}
                        />
                      </div>

                      {/* Update History */}
                      <div>
                        <h4 className="font-semibold mb-3">NAV Update History</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {(fund.updateHistory || []).map((update, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.1 }}
                              className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {update.date ? format(new Date(update.date), "MMM dd, yyyy") : "N/A"}
                              </div>
                              <div className="font-bold text-lg">PKR {(update.value || 0).toLocaleString()}</div>
                              {index > 0 && fund.updateHistory && fund.updateHistory[index - 1] && (
                                <div
                                  className={`text-sm ${
                                    (update.value || 0) > (fund.updateHistory[index - 1].value || 0)
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {(update.value || 0) > (fund.updateHistory[index - 1].value || 0) ? "+" : ""}
                                  {(
                                    (((update.value || 0) - (fund.updateHistory[index - 1].value || 0)) /
                                      (fund.updateHistory[index - 1].value || 1)) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <MutualFundEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={onDataUpdate}
        fund={editingFund}
      />
    </div>
  )
}
