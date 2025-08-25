"use client"

import { useState } from 'react'
import { 
  Receipt, 
  Download, 
  Printer, 
  X, 
  User, 
  Calendar, 
  CreditCard, 
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface Payment {
  id: string
  studentName: string
  studentNumber: string
  receiptNumber: string
  amount: number
  paymentMethodName: string
  paymentDate: string
  status: string
  description?: string
  referenceNumber?: string
  notes?: string
  collectorName?: string
  createdAt: string
}

interface PaymentDetailsDialogProps {
  payment: Payment | null
  isOpen: boolean
  onClose: () => void
}

export function PaymentDetailsDialog({ payment, isOpen, onClose }: PaymentDetailsDialogProps) {
  const { toast } = useToast()
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  if (!payment) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handlePrintReceipt = async () => {
    setIsPrinting(true)
    try {
      // Generate receipt content
      const receiptContent = generateReceiptContent(payment)
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(receiptContent)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
        toast.success("Receipt printed successfully")
      }
    } catch (error) {
      toast.error("Failed to print receipt")
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadReceipt = async () => {
    setIsDownloading(true)
    try {
      // Generate receipt content
      const receiptContent = generateReceiptContent(payment)
      
      // Create and download PDF
      const blob = new Blob([receiptContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `receipt-${payment.receiptNumber}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success("Receipt downloaded successfully")
    } catch (error) {
      toast.error("Failed to download receipt")
    } finally {
      setIsDownloading(false)
    }
  }

  const generateReceiptContent = (payment: Payment) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${payment.receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .receipt-number { font-size: 18px; font-weight: bold; color: #333; }
          .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SCHOOL MANAGEMENT SYSTEM</h1>
          <div class="receipt-number">Receipt #${payment.receiptNumber}</div>
        </div>
        
        <div class="amount">
          Amount: ${formatCurrency(payment.amount)}
        </div>
        
        <div class="details">
          <div class="detail-row">
            <span class="label">Student:</span>
            <span>${payment.studentName} (${payment.studentNumber})</span>
          </div>
          <div class="detail-row">
            <span class="label">Payment Method:</span>
            <span>${payment.paymentMethodName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Payment Date:</span>
            <span>${new Date(payment.paymentDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="label">Status:</span>
            <span>${payment.status.toUpperCase()}</span>
          </div>
          ${payment.description ? `
          <div class="detail-row">
            <span class="label">Description:</span>
            <span>${payment.description}</span>
          </div>
          ` : ''}
          ${payment.referenceNumber ? `
          <div class="detail-row">
            <span class="label">Reference:</span>
            <span>${payment.referenceNumber}</span>
          </div>
          ` : ''}
          ${payment.collectorName ? `
          <div class="detail-row">
            <span class="label">Collected By:</span>
            <span>${payment.collectorName}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>This is an official receipt from the School Management System</p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Receipt Header */}
          <div className="text-center border-b pb-4">
            <div className="text-2xl font-bold text-blue-600">{payment.receiptNumber}</div>
            <div className="text-3xl font-bold mt-2">{formatCurrency(payment.amount)}</div>
            <div className="mt-2">{getStatusBadge(payment.status)}</div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{payment.studentName}</div>
                  <div className="text-sm text-muted-foreground">{payment.studentNumber}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Payment Method</div>
                  <div className="text-sm text-muted-foreground">{payment.paymentMethodName}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Payment Date</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Amount</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(payment.amount)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {(payment.description || payment.referenceNumber || payment.notes || payment.collectorName) && (
            <>
              <Separator />
              <div className="space-y-3">
                {payment.description && (
                  <div>
                    <div className="font-medium">Description</div>
                    <div className="text-sm text-muted-foreground">{payment.description}</div>
                  </div>
                )}
                
                {payment.referenceNumber && (
                  <div>
                    <div className="font-medium">Reference Number</div>
                    <div className="text-sm text-muted-foreground">{payment.referenceNumber}</div>
                  </div>
                )}
                
                {payment.collectorName && (
                  <div>
                    <div className="font-medium">Collected By</div>
                    <div className="text-sm text-muted-foreground">{payment.collectorName}</div>
                  </div>
                )}
                
                {payment.notes && (
                  <div>
                    <div className="font-medium">Notes</div>
                    <div className="text-sm text-muted-foreground">{payment.notes}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handlePrintReceipt} 
              disabled={isPrinting}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </Button>
            <Button 
              onClick={handleDownloadReceipt} 
              disabled={isDownloading}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Receipt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

