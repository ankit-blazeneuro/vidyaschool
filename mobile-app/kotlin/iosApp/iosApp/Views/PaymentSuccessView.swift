import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// PaymentSuccessView — Dedicated Payment Confirmation Screen (iOS equivalent of Android PaymentSuccessScreen)
// ---------------------------------------------------------------------------

struct PaymentSuccessView: View {
    @Environment(\.dismiss) private var dismiss
    let amount: Double
    let receiptNo: String
    let installmentTitle: String
    let paymentMethod: String

    @State private var showReceiptSheet: Bool = false

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        // Animated Success Circle
                        ZStack {
                            Circle()
                                .fill(AppTheme.Color.success.opacity(0.15))
                                .frame(width: 100, height: 100)

                            Circle()
                                .fill(AppTheme.Color.success.opacity(0.25))
                                .frame(width: 80, height: 80)

                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 60))
                                .foregroundColor(AppTheme.Color.success)
                        }
                        .padding(.top, AppTheme.Spacing.md)

                        VStack(spacing: 6) {
                            Text("Payment Successful!")
                                .font(AppTheme.Font.title2)
                                .foregroundColor(.white)

                            Text("Your fee installment has been officially received.")
                                .font(AppTheme.Font.subheadline)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                        }

                        // Amount Card
                        GlassCard {
                            VStack(spacing: 4) {
                                Text("AMOUNT PAID")
                                    .font(AppTheme.Font.caption2)
                                    .fontWeight(.semibold)
                                    .foregroundColor(AppTheme.Color.darkSecondary)

                                Text("₹\(String(format: "%.2f", amount))")
                                    .font(.system(size: 38, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                        }

                        // Details Breakdown List
                        GlassCard {
                            VStack(spacing: 12) {
                                DetailRow(title: "Receipt Number", value: receiptNo, isHighlighted: true)
                                Divider().background(Color.white.opacity(0.1))
                                DetailRow(title: "Installment", value: installmentTitle)
                                Divider().background(Color.white.opacity(0.1))
                                DetailRow(title: "Payment Method", value: paymentMethod)
                                Divider().background(Color.white.opacity(0.1))
                                DetailRow(title: "Date & Time", value: currentDateTimeString())
                                Divider().background(Color.white.opacity(0.1))
                                DetailRow(title: "Status", value: "CLEARED", valueColor: AppTheme.Color.success)
                            }
                        }

                        // Action Buttons
                        VStack(spacing: AppTheme.Spacing.sm) {
                            VSButton(title: "View & Download Receipt") {
                                showReceiptSheet = true
                            }

                            Button(action: { dismiss() }) {
                                Text("Back to Fees Dashboard")
                                    .font(AppTheme.Font.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showReceiptSheet) {
                FeeReceiptView(
                    receiptNo: receiptNo,
                    amount: amount,
                    installmentTitle: installmentTitle,
                    paymentMethod: paymentMethod
                )
            }
        }
    }

    private func currentDateTimeString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM dd, yyyy • hh:mm a"
        return formatter.string(from: Date())
    }
}

private struct DetailRow: View {
    let title: String
    let value: String
    var isHighlighted: Bool = false
    var valueColor: Color = .white

    var body: some View {
        HStack {
            Text(title)
                .font(AppTheme.Font.footnote)
                .foregroundColor(AppTheme.Color.darkSecondary)
            Spacer()
            Text(value)
                .font(AppTheme.Font.footnote)
                .fontWeight(isHighlighted ? .bold : .medium)
                .foregroundColor(valueColor)
        }
    }
}

// ---------------------------------------------------------------------------
// FeeReceiptView — Official Printable Digital Fee Receipt View
// ---------------------------------------------------------------------------

struct FeeReceiptView: View {
    @Environment(\.dismiss) private var dismiss
    let receiptNo: String
    let amount: Double
    let installmentTitle: String
    let paymentMethod: String

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Official Receipt Glass Card
                        GlassCard {
                            VStack(alignment: .leading, spacing: 16) {
                                // Header
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("VIDYASCHOOL ACADEMY")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundColor(.white)
                                        Text("Official Fee Payment Receipt")
                                            .font(AppTheme.Font.caption)
                                            .foregroundColor(AppTheme.Color.accent)
                                    }
                                    Spacer()
                                    Image(systemName: "doc.text.fill")
                                        .font(.system(size: 28))
                                        .foregroundColor(AppTheme.Color.accent)
                                }

                                Divider().background(Color.white.opacity(0.1))

                                // Receipt Metadata Grid
                                Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 8) {
                                    GridRow {
                                        Text("Receipt No:").font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                                        Text(receiptNo).font(AppTheme.Font.caption).fontWeight(.bold).foregroundColor(.white)
                                    }
                                    GridRow {
                                        Text("Payment Date:").font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                                        Text(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .none)).font(AppTheme.Font.caption).foregroundColor(.white)
                                    }
                                    GridRow {
                                        Text("Mode:").font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                                        Text(paymentMethod).font(AppTheme.Font.caption).foregroundColor(.white)
                                    }
                                }

                                Divider().background(Color.white.opacity(0.1))

                                // Fee Itemized Breakdown
                                VStack(spacing: 8) {
                                    HStack {
                                        Text("Description").font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                                        Spacer()
                                        Text("Amount (₹)").font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                                    }

                                    HStack {
                                        Text(installmentTitle).font(AppTheme.Font.subheadline).foregroundColor(.white)
                                        Spacer()
                                        Text("₹\(String(format: "%.2f", amount * 0.85))").font(AppTheme.Font.subheadline).foregroundColor(.white)
                                    }

                                    HStack {
                                        Text("Development & IT Charge").font(AppTheme.Font.subheadline).foregroundColor(.white)
                                        Spacer()
                                        Text("₹\(String(format: "%.2f", amount * 0.15))").font(AppTheme.Font.subheadline).foregroundColor(.white)
                                    }
                                }
                                .padding(12)
                                .background(Color.white.opacity(0.04))
                                .cornerRadius(10)

                                Divider().background(Color.white.opacity(0.1))

                                // Total
                                HStack {
                                    Text("TOTAL PAID")
                                        .font(AppTheme.Font.headline)
                                        .foregroundColor(.white)
                                    Spacer()
                                    Text("₹\(String(format: "%.2f", amount))")
                                        .font(AppTheme.Font.title3)
                                        .fontWeight(.bold)
                                        .foregroundColor(AppTheme.Color.success)
                                }

                                // Official Verified Stamp Badge
                                HStack {
                                    Image(systemName: "checkmark.seal.fill")
                                        .foregroundColor(AppTheme.Color.success)
                                    Text("DIGITALLY SIGNED & VERIFIED BY ACCOUNTS")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(AppTheme.Color.success)
                                }
                                .padding(8)
                                .frame(maxWidth: .infinity)
                                .background(AppTheme.Color.success.opacity(0.15))
                                .cornerRadius(8)
                            }
                        }

                        // Print / Share Button
                        VSButton(title: "Print / Export Receipt PDF") {
                            // Print action
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Fee Receipt")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.white)
                }
            }
        }
    }
}

