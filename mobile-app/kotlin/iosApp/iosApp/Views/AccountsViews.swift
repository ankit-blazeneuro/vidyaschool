import SwiftUI
import Shared

struct ReceiptVerificationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AccountsViewModel()
    @State private var receiptNo: String = ""

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Info Header
                        VSCard {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Receipt Audit Desk")
                                    .font(AppTheme.Font.headline)
                                    .foregroundColor(.white)
                                Text("Instantly check validation status of cash or online transaction receipts using receipt numbers.")
                                    .font(AppTheme.Font.caption)
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                            }
                        }

                        // Form card
                        VSCard {
                            VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                                Text("Audit Verification")
                                    .font(AppTheme.Font.title3)
                                    .foregroundColor(.white)

                                VSTextField(label: "Receipt Number", text: $receiptNo, placeholder: "e.g. REC-77169")
                                    .textInputAutocapitalization(.characters)
                                    .disableAutocorrection(true)

                                if let error = viewModel.errorMessage {
                                    HStack {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .foregroundColor(AppTheme.Color.destructive)
                                        Text(error)
                                            .font(AppTheme.Font.footnote)
                                            .foregroundColor(.white)
                                    }
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(AppTheme.Color.destructive.opacity(0.15))
                                    .cornerRadius(8)
                                }

                                if let result = viewModel.verificationResult {
                                    HStack {
                                        Image(systemName: "checkmark.seal.fill")
                                            .foregroundColor(AppTheme.Color.success)
                                        Text(result)
                                            .font(AppTheme.Font.footnote)
                                            .foregroundColor(.white)
                                    }
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(AppTheme.Color.success.opacity(0.15))
                                    .cornerRadius(8)
                                }

                                VSButton(title: "Verify Receipt", isLoading: viewModel.isLoading) {
                                    viewModel.verifyReceipt(receiptNo: receiptNo)
                                }
                                .padding(.top, 4)
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Verify Receipts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.white)
                }
            }
        }
    }
}
