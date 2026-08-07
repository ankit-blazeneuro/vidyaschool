import Foundation
import Shared

struct PaidReceiptData: Identifiable {
    let id = UUID().uuidString
    let amount: Double
    let receiptNo: String
    let title: String
}

@MainActor
final class FeesViewModel: ObservableObject {
    @Published var installments: [FeeInstallment] = []
    @Published var isLoading: Bool = false
    @Published var isProcessingPayment: String? = nil
    @Published var errorMessage: String? = nil
    @Published var paymentSuccessMessage: String? = nil
    @Published var activeReceiptData: PaidReceiptData? = nil

    private let apiClient = ApiClient()
    private let sessionStorage = SessionStorage()

    func fetchFees() {
        guard let token = sessionStorage.getSessionToken() else {
            self.errorMessage = "Session token not found."
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                let list = try await apiClient.getMyFees(authToken: token)
                self.installments = list
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }

    func payFee(installment: FeeInstallment) {
        guard let token = sessionStorage.getSessionToken() else {
            self.errorMessage = "Session token not found."
            return
        }
        isProcessingPayment = installment.id
        errorMessage = nil
        paymentSuccessMessage = nil

        Task {
            do {
                let amountPaise = Int32(installment.amount * 100)
                let orderReq = CreateOrderRequest(
                    installmentIds: [installment.id],
                    amount: amountPaise,
                    receipt: nil
                )
                let order = try await apiClient.createOrder(authToken: token, request: orderReq)

                // If mockPayment is true or 1, simulate/use the mock payFees endpoint directly
                let isMock = order.mockPayment?.boolValue ?? false
                if isMock {
                    let payReq = PayFeesRequest(
                        installmentIds: [installment.id],
                        paymentMethod: "Razorpay"
                    )
                    let payResp = try await apiClient.payFees(authToken: token, request: payReq)
                    if payResp.success {
                        let rec = payResp.receiptNo ?? "REC-\(Int.random(in: 10000...99999))"
                        self.paymentSuccessMessage = "Mock payment of \(installment.amount) successful! Receipt: \(rec)"
                        self.activeReceiptData = PaidReceiptData(
                            amount: installment.amount,
                            receiptNo: rec,
                            title: "\(installment.month.capitalized) \(installment.year) Fee"
                        )
                    } else {
                        self.errorMessage = "Mock payment failed."
                    }
                } else {
                    // Simulate real checkout delay and then call verification
                    try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
                    let verifyReq = VerifyPaymentRequest(
                        orderId: order.orderId ?? "",
                        paymentId: "pay_simulated_\(UUID().uuidString)",
                        signature: "sig_simulated_\(UUID().uuidString)",
                        installmentIds: [installment.id],
                        paymentMethod: "Razorpay"
                    )
                    let verifyResp = try await apiClient.verifyPayment(authToken: token, request: verifyReq)
                    if verifyResp.success {
                        let rec = verifyResp.receiptNo ?? "REC-\(Int.random(in: 10000...99999))"
                        self.paymentSuccessMessage = "Payment verified successfully! Receipt: \(rec)"
                        self.activeReceiptData = PaidReceiptData(
                            amount: installment.amount,
                            receiptNo: rec,
                            title: "\(installment.month.capitalized) \(installment.year) Fee"
                        )
                    } else {
                        self.errorMessage = "Payment verification failed."
                    }
                }
                fetchFees()
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isProcessingPayment = nil
        }
    }
}
