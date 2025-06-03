import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { recipientEmail, subject, message } = body

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 })
    }

    console.log("Fetching invoice from database...")
    const db = await getDatabase()
    const invoice = await db.collection("invoices").findOne({ _id: new ObjectId(params.id) })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Creating email transporter...")

    // Create email transporter with correct method name
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verify transporter configuration
    try {
      await transporter.verify()
      console.log("Email transporter verified successfully")
    } catch (verifyError) {
      console.error("Email transporter verification failed:", verifyError)
      return NextResponse.json({ error: "Email configuration error" }, { status: 500 })
    }

    // Calculate totals
    const subtotal = invoice.items?.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0) || 0
    const taxAmount = (subtotal * (invoice.taxRate || 0)) / 100
    const total = subtotal + taxAmount

    // Create email content
    const emailSubject = subject || `Invoice ${invoice.invoiceNumber} from ${invoice.fromName || "FinanceFlow Pro"}`
    const emailText =
      message ||
      `
Dear ${invoice.toName || "Valued Customer"},

Please find the details of invoice ${invoice.invoiceNumber} below:

Invoice Number: ${invoice.invoiceNumber}
Date: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}
Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}
Total Amount: PKR ${total.toLocaleString()}

${invoice.notes ? `Notes: ${invoice.notes}` : ""}

Thank you for your business!

Best regards,
${invoice.fromName || "FinanceFlow Pro"}
    `

    // Create HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 20px; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
        }
        .content { 
            padding: 30px; 
        }
        .invoice-details { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 5px 0; 
        }
        .detail-label { 
            font-weight: bold; 
            color: #555; 
        }
        .total-row { 
            border-top: 2px solid #667eea; 
            padding-top: 10px; 
            margin-top: 15px; 
            font-size: 18px; 
            font-weight: bold; 
            color: #667eea; 
        }
        .footer { 
            background: #2c3e50; 
            color: white; 
            padding: 20px; 
            text-align: center; 
        }
        .notes { 
            background: #e3f2fd; 
            padding: 15px; 
            border-left: 4px solid #2196f3; 
            margin: 20px 0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Invoice ${invoice.invoiceNumber}</h1>
            <p>From ${invoice.fromName || "FinanceFlow Pro"}</p>
        </div>
        
        <div class="content">
            <p>Dear ${invoice.toName || "Valued Customer"},</p>
            <p>Please find the details of your invoice below:</p>
            
            <div class="invoice-details">
                <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span>${invoice.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span>${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span>${invoice.status || "Draft"}</span>
                </div>
                ${
                  subtotal > 0
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Subtotal:</span>
                    <span>PKR ${subtotal.toLocaleString()}</span>
                </div>
                `
                    : ""
                }
                ${
                  invoice.taxRate
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Tax (${invoice.taxRate}%):</span>
                    <span>PKR ${taxAmount.toLocaleString()}</span>
                </div>
                `
                    : ""
                }
                <div class="detail-row total-row">
                    <span class="detail-label">Total Amount:</span>
                    <span>PKR ${total.toLocaleString()}</span>
                </div>
            </div>
            
            ${
              invoice.notes
                ? `
            <div class="notes">
                <strong>Notes:</strong><br>
                ${invoice.notes}
            </div>
            `
                : ""
            }
            
            <p>Thank you for your business!</p>
            <p>Best regards,<br>${invoice.fromName || "FinanceFlow Pro"}</p>
        </div>
        
        <div class="footer">
            <p>Generated by FinanceFlow Pro - Your Personal Finance Management Hub</p>
        </div>
    </div>
</body>
</html>
    `

    console.log("Sending email...")

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipientEmail,
      subject: emailSubject,
      text: emailText,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)

    console.log("Email sent successfully, updating invoice status...")

    // Update invoice status to sent
    await db.collection("invoices").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: "sent",
          sentAt: new Date(),
          sentTo: recipientEmail,
        },
      },
    )

    console.log("Invoice status updated successfully")

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully via email",
    })
  } catch (error) {
    console.error("Error sending invoice email:", error)
    return NextResponse.json(
      {
        error: "Failed to send invoice email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
