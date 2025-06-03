"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Plus, Trash2, Download, CalendarIcon, DollarSign, CheckCircle, XCircle, Mail } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { toast } from "sonner"
import axios from "axios"

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
}

interface Invoice {
  _id?: string
  invoiceNumber?: string
  fromName: string
  fromEmail: string
  fromAddress: string
  fromPhone: string
  toName: string
  toEmail: string
  toAddress: string
  toPhone: string
  date: Date
  dueDate?: Date
  items: InvoiceItem[]
  taxRate: number
  notes: string
  status: "draft" | "sent" | "paid" | "cancelled"
  createdAt?: Date
}

export default function InvoiceCreator() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAddToTransactionDialog, setShowAddToTransactionDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [newInvoice, setNewInvoice] = useState<Invoice>({
    fromName: "",
    fromEmail: "",
    fromAddress: "",
    fromPhone: "",
    toName: "",
    toEmail: "",
    toAddress: "",
    toPhone: "",
    date: new Date(),
    dueDate: undefined,
    items: [{ description: "", quantity: 1, rate: 0 }],
    taxRate: 0,
    notes: "",
    status: "draft",
  })

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [invoiceToEmail, setInvoiceToEmail] = useState<Invoice | null>(null)
  const [emailData, setEmailData] = useState({
    recipientEmail: "",
    subject: "",
    message: "",
  })
  const [emailLoading, setEmailLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/invoices")
      setInvoices(response.data || [])
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast.error("Failed to fetch invoices")
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: "", quantity: 1, rate: 0 }],
    })
  }

  const removeItem = (index: number) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = newInvoice.items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setNewInvoice({ ...newInvoice, items: updatedItems })
  }

  const calculateSubtotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  }

  const calculateTotal = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = calculateSubtotal(items)
    const tax = (subtotal * taxRate) / 100
    return subtotal + tax
  }

  const createInvoice = async () => {
    try {
      if (!newInvoice.fromName || !newInvoice.toName || newInvoice.items.length === 0) {
        toast.error("Please fill in required fields")
        return
      }

      const response = await axios.post("/api/invoices", newInvoice)
      setInvoices([response.data, ...invoices])
      setShowCreateDialog(false)
      setNewInvoice({
        fromName: "",
        fromEmail: "",
        fromAddress: "",
        fromPhone: "",
        toName: "",
        toEmail: "",
        toAddress: "",
        toPhone: "",
        date: new Date(),
        dueDate: undefined,
        items: [{ description: "", quantity: 1, rate: 0 }],
        taxRate: 0,
        notes: "",
        status: "draft",
      })
      toast.success("Invoice created successfully!")
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast.error("Failed to create invoice")
    }
  }

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      setPdfLoading(invoice._id || null)
      toast.loading("Generating PDF... This may take a moment.", { id: "pdf-generation" })

      const response = await axios.get(`/api/invoices/${invoice._id}/pdf`, {
        responseType: "blob",
        timeout: 60000, // 60 second timeout
        headers: {
          Accept: "application/pdf",
        },
        onDownloadProgress: (progressEvent) => {
          console.log("Download progress:", progressEvent)
        },
      })

      console.log("PDF response received, size:", response.data.size)
      toast.dismiss("pdf-generation")

      // Ensure we have a valid blob
      if (!response.data || response.data.size === 0) {
        throw new Error("Empty PDF response")
      }

      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      // Get filename from response headers or use default
      const contentDisposition = response.headers["content-disposition"]
      let filename = `invoice-${invoice.invoiceNumber}.pdf`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Invoice downloaded successfully!")
    } catch (error: any) {
      console.error("Error downloading invoice:", error)
      toast.dismiss("pdf-generation")

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        toast.error("PDF generation timed out. The server might be busy. Please try again in a moment.")
      } else if (error.response?.status === 404) {
        toast.error("Invoice not found")
      } else if (error.response?.status === 504) {
        toast.error("Server timeout. Please try again or contact support if the issue persists.")
      } else {
        toast.error(`Failed to download invoice: ${error.message || "Unknown error"}`)
      }
    } finally {
      setPdfLoading(null)
    }
  }

  const addInvoiceToTransaction = async (type: "income" | "expense") => {
    if (!selectedInvoice) return

    try {
      const total = calculateTotal(selectedInvoice.items, selectedInvoice.taxRate)

      const transaction = {
        type,
        amount: total,
        category: type === "income" ? "invoice payment" : "invoice expense",
        date: new Date(),
        description: `Invoice ${selectedInvoice.invoiceNumber} - ${selectedInvoice.toName}`,
        source: "invoice",
      }

      await axios.post("/api/transactions", transaction)
      setShowAddToTransactionDialog(false)
      setSelectedInvoice(null)
      toast.success(`Invoice amount added as ${type}!`)
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast.error("Failed to add transaction")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const deleteInvoice = async () => {
    if (!invoiceToDelete) return

    try {
      setDeleteLoading(true)
      await axios.delete(`/api/invoices/${invoiceToDelete._id}`)
      setInvoices(invoices.filter((inv) => inv._id !== invoiceToDelete._id))
      setShowDeleteDialog(false)
      setInvoiceToDelete(null)
      toast.success("Invoice deleted successfully!")
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast.error("Failed to delete invoice")
    } finally {
      setDeleteLoading(false)
    }
  }

  const sendInvoiceEmail = async () => {
    if (!invoiceToEmail) return

    try {
      setEmailLoading(true)
      await axios.post(`/api/invoices/${invoiceToEmail._id}/send-email`, emailData)

      // Update invoice status in local state
      setInvoices(invoices.map((inv) => (inv._id === invoiceToEmail._id ? { ...inv, status: "sent" as const } : inv)))

      setShowEmailDialog(false)
      setInvoiceToEmail(null)
      setEmailData({ recipientEmail: "", subject: "", message: "" })
      toast.success("Invoice sent successfully!")
    } catch (error) {
      console.error("Error sending invoice:", error)
      toast.error("Failed to send invoice")
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Invoice Management
          </h2>
          <p className="text-gray-600">Create, manage and track your invoices</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Fill in the details to create a professional invoice</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* From/To Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">From (Your Details)</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newInvoice.fromName}
                        onChange={(e) => setNewInvoice({ ...newInvoice, fromName: e.target.value })}
                        placeholder="Your company name"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newInvoice.fromEmail}
                        onChange={(e) => setNewInvoice({ ...newInvoice, fromEmail: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Textarea
                        value={newInvoice.fromAddress}
                        onChange={(e) => setNewInvoice({ ...newInvoice, fromAddress: e.target.value })}
                        placeholder="Your address"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={newInvoice.fromPhone}
                        onChange={(e) => setNewInvoice({ ...newInvoice, fromPhone: e.target.value })}
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">To (Client Details)</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newInvoice.toName}
                        onChange={(e) => setNewInvoice({ ...newInvoice, toName: e.target.value })}
                        placeholder="Client name"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newInvoice.toEmail}
                        onChange={(e) => setNewInvoice({ ...newInvoice, toEmail: e.target.value })}
                        placeholder="client@email.com"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Textarea
                        value={newInvoice.toAddress}
                        onChange={(e) => setNewInvoice({ ...newInvoice, toAddress: e.target.value })}
                        placeholder="Client address"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={newInvoice.toPhone}
                        onChange={(e) => setNewInvoice({ ...newInvoice, toPhone: e.target.value })}
                        placeholder="Client phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newInvoice.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newInvoice.date}
                        onSelect={(date) => setNewInvoice({ ...newInvoice, date: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newInvoice.dueDate ? format(newInvoice.dueDate, "PPP") : "Select due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newInvoice.dueDate}
                        onSelect={(date) => setNewInvoice({ ...newInvoice, dueDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Invoice Items</h3>
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Rate (PKR)</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(index, "rate", Number(e.target.value))}
                          min="0"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label>Amount</Label>
                        <p className="text-sm font-medium py-2">PKR {(item.quantity * item.rate).toLocaleString()}</p>
                      </div>
                      <div className="col-span-1">
                        {newInvoice.items.length > 1 && (
                          <Button onClick={() => removeItem(index)} size="sm" variant="ghost" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>PKR {calculateSubtotal(newInvoice.items).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Tax:</span>
                        <Input
                          type="number"
                          value={newInvoice.taxRate}
                          onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) })}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                        <span>%</span>
                      </div>
                      <span>
                        PKR {((calculateSubtotal(newInvoice.items) * newInvoice.taxRate) / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>PKR {calculateTotal(newInvoice.items, newInvoice.taxRate).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  placeholder="Additional notes or terms..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={createInvoice}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  Create Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices List */}
      <Card className="border border-pink-100 dark:border-pink-900 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
          <CardTitle className="text-pink-700 dark:text-pink-300">Your Invoices</CardTitle>
          <CardDescription>Manage and track all your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-pink-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
              <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {invoices.map((invoice, index) => (
                      <motion.tr
                        key={invoice._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-pink-50 dark:hover:bg-pink-900/10"
                      >
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.toName}</TableCell>
                        <TableCell>{format(new Date(invoice.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>PKR {calculateTotal(invoice.items, invoice.taxRate).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadInvoicePDF(invoice)}
                              disabled={pdfLoading === invoice._id}
                              className="text-pink-600 hover:text-pink-700 hover:bg-pink-100"
                              title="Download PDF"
                            >
                              {pdfLoading === invoice._id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setInvoiceToEmail(invoice)
                                setEmailData({
                                  recipientEmail: invoice.toEmail || "",
                                  subject: `Invoice ${invoice.invoiceNumber} from ${invoice.fromName}`,
                                  message: "",
                                })
                                setShowEmailDialog(true)
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setShowAddToTransactionDialog(true)
                              }}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                              title="Add to Transactions"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setInvoiceToDelete(invoice)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Transaction Dialog */}
      <Dialog open={showAddToTransactionDialog} onOpenChange={setShowAddToTransactionDialog}>
        <DialogContent className="bg-gradient-to-br from-white to-pink-50 dark:from-gray-900 dark:to-pink-900/20 border border-pink-100 dark:border-pink-800">
          <DialogHeader>
            <DialogTitle className="text-pink-700 dark:text-pink-300">Add Invoice to Transactions</DialogTitle>
            <DialogDescription>Add this invoice amount to your transactions as income or expense</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                <h4 className="font-semibold text-pink-600 dark:text-pink-400 mb-2">Invoice Details</h4>
                <p>
                  <span className="font-medium">Invoice:</span> {selectedInvoice.invoiceNumber}
                </p>
                <p>
                  <span className="font-medium">Client:</span> {selectedInvoice.toName}
                </p>
                <p>
                  <span className="font-medium">Amount:</span> PKR{" "}
                  {calculateTotal(selectedInvoice.items, selectedInvoice.taxRate).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => addInvoiceToTransaction("income")}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add as Income
                </Button>
                <Button
                  onClick={() => addInvoiceToTransaction("expense")}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Add as Expense
                </Button>
              </div>

              <Button
                onClick={() => setShowAddToTransactionDialog(false)}
                variant="outline"
                className="w-full border-pink-200 dark:border-pink-800"
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gradient-to-br from-white to-red-50 dark:from-gray-900 dark:to-red-900/20 border border-red-100 dark:border-red-800">
          <DialogHeader>
            <DialogTitle className="text-red-700 dark:text-red-300">Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {invoiceToDelete && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Invoice Details</h4>
                <p>
                  <span className="font-medium">Invoice:</span> {invoiceToDelete.invoiceNumber}
                </p>
                <p>
                  <span className="font-medium">Client:</span> {invoiceToDelete.toName}
                </p>
                <p>
                  <span className="font-medium">Amount:</span> PKR{" "}
                  {calculateTotal(invoiceToDelete.items, invoiceToDelete.taxRate).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteDialog(false)}
                  variant="outline"
                  className="flex-1 border-red-200 dark:border-red-800"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={deleteInvoice}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Invoice Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20 border border-blue-100 dark:border-blue-800">
          <DialogHeader>
            <DialogTitle className="text-blue-700 dark:text-blue-300">Send Invoice via Email</DialogTitle>
            <DialogDescription>Send this invoice as a PDF attachment to the specified email address</DialogDescription>
          </DialogHeader>

          {invoiceToEmail && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Invoice Details</h4>
                <p>
                  <span className="font-medium">Invoice:</span> {invoiceToEmail.invoiceNumber}
                </p>
                <p>
                  <span className="font-medium">Client:</span> {invoiceToEmail.toName}
                </p>
                <p>
                  <span className="font-medium">Amount:</span> PKR{" "}
                  {calculateTotal(invoiceToEmail.items, invoiceToEmail.taxRate).toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Recipient Email *</Label>
                  <Input
                    type="email"
                    value={emailData.recipientEmail}
                    onChange={(e) => setEmailData({ ...emailData, recipientEmail: e.target.value })}
                    placeholder="client@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder="Invoice subject line"
                  />
                </div>

                <div>
                  <Label>Message (Optional)</Label>
                  <Textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                    placeholder="Additional message to include in the email..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowEmailDialog(false)}
                  variant="outline"
                  className="flex-1 border-blue-200 dark:border-blue-800"
                  disabled={emailLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendInvoiceEmail}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  disabled={emailLoading || !emailData.recipientEmail}
                >
                  {emailLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Named export for deployment compatibility
export { InvoiceCreator }
