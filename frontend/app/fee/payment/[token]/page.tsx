import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react"

interface ReceiptData {
  receipt_no: string
  student_name: string
  admission_number: string | null
  class: string | null
  section: string | null
  month: string
  year: string
  amount: number
  paid_date: string | null
  payment_method: string | null
  status: string
}

async function getReceipt(token: string): Promise<ReceiptData | null> {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:8000"}/api/fees/receipt/${token}`,
      { cache: "no-store" }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function FeePaymentVerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const receipt = await getReceipt(token)

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full rounded-xl border border-destructive/30 bg-card p-8 text-center space-y-4 shadow-lg">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Receipt Not Found</h1>
          <p className="text-sm text-muted-foreground">This payment link is invalid or the receipt does not exist.</p>
        </div>
      </div>
    )
  }

  const classLabel = receipt.class
    ? `${receipt.class === "Nursery" || receipt.class === "KG" ? receipt.class : `Class ${receipt.class}`}${receipt.section ? ` - ${receipt.section}` : ""}`
    : "N/A"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-5 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Payment Verified</h1>
            <p className="text-xs text-muted-foreground">Vidya School — Official Fee Receipt</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[
              ["Receipt No.", receipt.receipt_no],
              ["Student Name", receipt.student_name],
              ["Admission No.", receipt.admission_number ?? "N/A"],
              ["Class", classLabel],
              ["Month", `${receipt.month} ${receipt.year}`],
              ["Amount Paid", `₹${receipt.amount.toLocaleString("en-IN")}`],
              ["Paid On", receipt.paid_date ? new Date(receipt.paid_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"],
              ["Payment Mode", receipt.payment_method ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-muted-foreground text-xs block">{label}</span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 mt-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>This receipt has been verified against the Vidya School database. No physical signature required.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
