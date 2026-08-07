import SwiftUI
import Shared

struct FeesView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = FeesViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()

                if viewModel.isLoading && viewModel.installments.isEmpty {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    ScrollView {
                        VStack(spacing: AppTheme.Spacing.md) {
                            // Total Outstanding Card
                            let unpaid = viewModel.installments.filter { $0.status.lowercased() != "paid" }
                            let totalUnpaid = unpaid.reduce(0.0) { $0 + $1.amount }

                            VSCard {
                                VStack(spacing: 8) {
                                    Text("TOTAL OUTSTANDING")
                                        .font(AppTheme.Font.caption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                    Text("₹\(String(format: "%.2f", totalUnpaid))")
                                        .font(.system(size: 36, weight: .bold))
                                        .foregroundColor(.white)
                                    Text("\(unpaid.count) pending installments")
                                        .font(AppTheme.Font.caption2)
                                        .foregroundColor(unpaid.count > 0 ? AppTheme.Color.warning : AppTheme.Color.success)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                            }

                            // Notification / Status messages
                            if let error = viewModel.errorMessage {
                                Text(error)
                                    .font(AppTheme.Font.subheadline)
                                    .foregroundColor(.white)
                                    .padding()
                                    .frame(maxWidth: .infinity)
                                    .background(AppTheme.Color.destructive.opacity(0.2))
                                    .cornerRadius(8)
                            }

                            if let success = viewModel.paymentSuccessMessage {
                                Text(success)
                                    .font(AppTheme.Font.subheadline)
                                    .foregroundColor(.white)
                                    .padding()
                                    .frame(maxWidth: .infinity)
                                    .background(AppTheme.Color.success.opacity(0.2))
                                    .cornerRadius(8)
                            }

                            // Installment List
                            ForEach(viewModel.installments, id: \.id) { inst in
                                InstallmentRow(installment: inst, isProcessing: viewModel.isProcessingPayment == inst.id) {
                                    viewModel.payFee(installment: inst)
                                }
                            }
                        }
                        .padding(AppTheme.Spacing.md)
                    }
                }
            }
            .navigationTitle("My Fees")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { viewModel.fetchFees() }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.white)
                    }
                }
            }
            .onAppear {
                viewModel.fetchFees()
            }
            .sheet(item: $viewModel.activeReceiptData) { data in
                PaymentSuccessView(
                    amount: data.amount,
                    receiptNo: data.receiptNo,
                    installmentTitle: data.title,
                    paymentMethod: "Razorpay / UPI"
                )
            }
        }
    }
}

private struct InstallmentRow: View {
    let installment: FeeInstallment
    let isProcessing: Bool
    let onPay: () -> Void

    private var isPaid: Bool {
        return installment.status.lowercased() == "paid"
    }

    var body: some View {
        VSCard {
            HStack(spacing: AppTheme.Spacing.md) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("\(installment.month.capitalized) \(installment.year)")
                        .font(AppTheme.Font.headline)
                        .foregroundColor(.white)
                    Text("₹\(String(format: "%.2f", installment.amount))")
                        .font(AppTheme.Font.subheadline)
                        .foregroundColor(.white.opacity(0.8))

                    if let due = installment.dueDate {
                        Text("Due: \(due)")
                            .font(AppTheme.Font.caption)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }

                    if isPaid {
                        VStack(alignment: .leading, spacing: 2) {
                            if let receipt = installment.receiptNo {
                                Text("Receipt: \(receipt)")
                                    .font(AppTheme.Font.caption2)
                                    .foregroundColor(AppTheme.Color.success)
                            }
                            if let method = installment.paymentMethod {
                                Text("Via: \(method)")
                                    .font(AppTheme.Font.caption2)
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                            }
                        }
                        .padding(.top, 4)
                    }
                }

                Spacer()

                VStack {
                    if isPaid {
                        Text("PAID")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(AppTheme.Color.success)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(AppTheme.Color.success.opacity(0.15))
                            .cornerRadius(6)
                    } else {
                        Button(action: onPay) {
                            HStack {
                                if isProcessing {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                        .scaleEffect(0.7)
                                } else {
                                    Text("Pay Now")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(AppTheme.Color.darkBackground)
                                }
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(AppTheme.Color.warning)
                            .cornerRadius(8)
                        }
                        .disabled(isProcessing)
                    }
                }
            }
        }
    }
}
