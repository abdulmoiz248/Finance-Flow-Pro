import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Starting PDF generation for invoice:", params.id)

    const db = await getDatabase()
    const invoice = await db.collection("invoices").findOne({ _id: new ObjectId(params.id) })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Invoice found, generating PDF...")

    // Calculate totals
    const subtotal = invoice.items?.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0) || 0
    const taxAmount = (subtotal * (invoice.taxRate || 0)) / 100
    const total = subtotal + taxAmount

    // Create a simple HTML response that can be printed as PDF by the browser
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            background: #667eea;
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .invoice-title {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 1.2em;
        }
        
        .content {
            padding: 0 20px;
        }
        
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .detail-section {
            flex: 1;
            margin-right: 20px;
        }
        
        .detail-section:last-child {
            margin-right: 0;
        }
        
        .detail-section h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.1em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
        }
        
        .detail-section p {
            margin-bottom: 5px;
            font-size: 0.9em;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border: 1px solid #ddd;
        }
        
        .items-table th {
            background: #667eea;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9em;
        }
        
        .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
            font-size: 0.9em;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .totals {
            margin-left: auto;
            width: 300px;
            background: #f8f9fa;
            padding: 20px;
            border: 1px solid #ddd;
            margin-bottom: 30px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        
        .total-row.final {
            border-top: 2px solid #667eea;
            padding-top: 10px;
            margin-top: 10px;
            font-weight: bold;
            font-size: 1.2em;
            color: #667eea;
        }
        
        .footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 20px;
            margin-top: 30px;
        }
        
        .notes {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }
        
        .notes h4 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #5a6fd8;
        }
    </style>
    <script>
        window.onload = function() {
            // Auto-trigger print dialog
            setTimeout(function() {
                window.print();
            }, 500);
        }
        
        function downloadPDF() {
            window.print();
        }
    </script>
</head>
<body>
    <button class="print-button no-print" onclick="downloadPDF()">Download PDF</button>
    
    <div class="container">
        <div class="header">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#${invoice.invoiceNumber}</div>
        </div>

        <div class="content">
            <div class="invoice-details">
                <div class="detail-section">
                    <h3>From</h3>
                    <p><strong>${invoice.fromName || "Your Company"}</strong></p>
                    ${invoice.fromEmail ? `<p>${invoice.fromEmail}</p>` : ""}
                    ${invoice.fromAddress ? `<p>${invoice.fromAddress.replace(/\n/g, "<br>")}</p>` : ""}
                    ${invoice.fromPhone ? `<p>${invoice.fromPhone}</p>` : ""}
                </div>
                
                <div class="detail-section">
                    <h3>To</h3>
                    <p><strong>${invoice.toName || ""}</strong></p>
                    ${invoice.toEmail ? `<p>${invoice.toEmail}</p>` : ""}
                    ${invoice.toAddress ? `<p>${invoice.toAddress.replace(/\n/g, "<br>")}</p>` : ""}
                    ${invoice.toPhone ? `<p>${invoice.toPhone}</p>` : ""}
                </div>
            </div>

            <div class="invoice-details">
                <div class="detail-section">
                    <h3>Invoice Details</h3>
                    <p><strong>Date:</strong> ${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> ${
                      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"
                    }</p>
                </div>
                
                <div class="detail-section">
                    <h3>Payment Info</h3>
                    <p><strong>Status:</strong> ${(invoice.status || "Draft").toUpperCase()}</p>
                    <p><strong>Terms:</strong> ${invoice.terms || "Net 30 Days"}</p>
                </div>
            </div>

            ${
              invoice.items && invoice.items.length > 0
                ? `
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 45%;">Description</th>
                        <th style="width: 15%;">Quantity</th>
                        <th style="width: 20%;">Rate (PKR)</th>
                        <th style="width: 20%;">Amount (PKR)</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items
                      .map(
                        (item: any) => `
                        <tr>
                            <td>${item.description || ""}</td>
                            <td style="text-align: center;">${item.quantity || 0}</td>
                            <td style="text-align: right;">PKR ${(item.rate || 0).toLocaleString()}</td>
                            <td style="text-align: right;">PKR ${((item.quantity || 0) * (item.rate || 0)).toLocaleString()}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            `
                : ""
            }

            <div class="totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>PKR ${subtotal.toLocaleString()}</span>
                </div>
                ${
                  invoice.taxRate
                    ? `
                <div class="total-row">
                    <span>Tax (${invoice.taxRate}%):</span>
                    <span>PKR ${taxAmount.toLocaleString()}</span>
                </div>
                `
                    : ""
                }
                <div class="total-row final">
                    <span>Total Amount:</span>
                    <span>PKR ${total.toLocaleString()}</span>
                </div>
            </div>

            ${
              invoice.notes
                ? `
            <div class="notes">
                <h4>Additional Notes</h4>
                <p>${invoice.notes.replace(/\n/g, "<br>")}</p>
            </div>
            `
                : ""
            }
        </div>

        <div class="footer">
            <p><strong>Generated by FinanceFlow Pro</strong></p>
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
    `

    console.log("HTML content generated successfully")

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error generating invoice PDF:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error details:", errorMessage)

    return NextResponse.json(
      {
        error: "Failed to generate invoice PDF",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
