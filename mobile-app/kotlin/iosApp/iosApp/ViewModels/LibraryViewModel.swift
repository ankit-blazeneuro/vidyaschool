import Foundation
import Shared

@MainActor
final class LibraryViewModel: ObservableObject {
    @Published var borrowings: [StudentBorrowingResponse] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    private let apiClient = ApiClient()
    private let sessionStorage = SessionStorage()

    func fetchBorrowings() {
        guard let token = sessionStorage.getSessionToken() else {
            self.errorMessage = "Session token not found."
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                let list = try await apiClient.getStudentBorrowings(authToken: token)
                self.borrowings = list
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }

    func renewBook(bookId: String) {
        guard let token = sessionStorage.getSessionToken() else {
            self.errorMessage = "Session token not found."
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                let req = StudentRenewRequest(id: bookId)
                _ = try await apiClient.renewBook(authToken: token, request: req)
                fetchBorrowings()
            } catch {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}
