import Foundation
import Shared

@MainActor
final class AccountsViewModel: ObservableObject {
    @Published var isLoading: Bool = false
    @Published var verificationResult: String? = nil
    @Published var errorMessage: String? = nil

    private let apiClient = ApiClient()

    func verifyReceipt(receiptNo: String) {
        guard !receiptNo.isEmpty else {
            self.errorMessage = "Please enter a receipt number."
            return
        }
        isLoading = true
        errorMessage = nil
        verificationResult = nil

        Task {
            do {
                let response = try await apiClient.verifyReceipt(receiptNo: receiptNo)
                let statusCode = response.status.value
                if statusCode == 200 {
                    self.verificationResult = "Receipt #\(receiptNo) is VALID and officially registered in the ledger."
                } else {
                    self.errorMessage = "Receipt #\(receiptNo) not found or invalid (Status: \(statusCode))."
                }
            } catch {
                self.errorMessage = "Receipt verification failed. Please check the code."
            }
            self.isLoading = false
        }
    }
}
