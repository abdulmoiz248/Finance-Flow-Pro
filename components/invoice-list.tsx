"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Plus, Send, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InvoiceCreator } from "./invoice-creator"

interface Invoice {
  _id: string
  invoiceNumber: string
  fromName: string
  toName: string
  toEmail: string
  date: string
  dueDate?: string
  status: "draft" | "sent" | "paid" | "cancelled"
  items: Array<{
    description: string
    quantity: number
    rate: number
  }>
  taxRate?: number
  notes?: string
  total: number
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [emailData, setEmailData] = useState({
    recipientEmail: "",
    subject: "",
    message: "",
  })
  const [emailSending, setEmailSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      toast({
        title: "Opening Invoice",
        description: "Opening invoice in a new window for download...",
      })

      // Open the PDF route in a new window
      const url = `/api/invoices/${invoiceId}/pdf`
      window.open(url, "_blank", "width=800,height=600,scrollbars=yes,resizable=yes")

      toast({
        title: "Success",
        description: "Invoice opened! Use your browser's print function to save as PDF.",
      })
    } catch (error) {
      console.error("Error opening PDF:", error)
      toast({
        title: "Error",
        description: "Failed to open invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSendEmail = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setEmailData({
      recipientEmail: invoice.toEmail || "",
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.fromName}`,
      message: `Dear ${invoice.toName},

Please find attached invoice ${invoice.invoiceNumber} for your review and payment.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Date: ${new Date(invoice.date).toLocaleDateString()}
- Amount: PKR ${invoice.total.toLocaleString()}
- Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}

${invoice.notes ? `Notes: ${invoice.notes}` : ""}

Thank you for your business!

Best regards,
${invoice.fromName}`,
    })
    setShowEmailModal(true)
  }

  const handleEmailSubmit = async () => {
    if (!selectedInvoice || !emailData.recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      })
      return
    }

    setEmailSending(true)
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice._id}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: `Invoice sent successfully to ${emailData.recipientEmail}`,
        })
        setShowEmailModal(false)
        fetchInvoices() // Refresh to update status
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Email Error",
        description: error instanceof Error ? error.message : "Failed to send invoice email",
        variant: "destructive",
      })
    } finally {
      setEmailSending(false)
    }
  }

  const handleAddToTransactions = async (invoice: Invoice) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "income",
          amount: invoice.total,
          category: "invoice",
          description: `Invoice ${invoice.invoiceNumber} - ${invoice.toName}`,
          date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice added to transactions as income",
        })
      } else {
        throw new Error("Failed to add to transactions")
      }
    } catch (error) {
      console.error("Error adding to transactions:", error)
      toast({
        title: "Error",
        description: "Failed to add invoice to transactions",
        variant: "destructive",
      })
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Invoices...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📄 Invoice Management</CardTitle>
              <CardDescription>Create, manage, and send professional invoices</CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No invoices created yet</p>
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">#{invoice.invoiceNumber}</h3>
                        <Badge className={getStatusColor(invoice.status)}>{invoice.status.toUpperCase()}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">To:</span> {invoice.toName}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(invoice.date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> PKR {invoice.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPDF(invoice._id, invoice.invoiceNumber)}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(invoice)}
                        className="flex items-center gap-1"
                      >
                        <Send className="h-4 w-4" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToTransactions(invoice)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Transactions
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Fill in the details to create a professional invoice</DialogDescription>
          </DialogHeader>
          <InvoiceCreator
            onSuccess={() => {
              setShowCreateModal(false)
              fetchInvoices()
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>📧 Send Invoice via Email</DialogTitle>
            <DialogDescription>
              Send invoice {selectedInvoice?.invoiceNumber} to your client via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={emailData.recipientEmail}
                onChange={(e) => setEmailData({ ...emailData, recipientEmail: e.target.value })}
                placeholder="client@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Invoice subject line"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Email message body"
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailSubmit} disabled={emailSending} className="flex items-center gap-2">
              {emailSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
