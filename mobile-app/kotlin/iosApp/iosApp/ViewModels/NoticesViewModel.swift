import Foundation
import Shared

@MainActor
final class NoticesViewModel: ObservableObject {
    @Published var notices: [NoticeResponse] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    private let apiClient = ApiClient()
    private let sessionStorage = SessionStorage()

    func fetchNotices() {
        guard let token = sessionStorage.getSessionToken() else {
            self.errorMessage = "Session token not found."
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                let list = try await apiClient.getNotices(authToken: token)
                // Sort notices by createdAt descending
                self.notices = list.sorted { ($0.createdAt) > ($1.createdAt) }
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }
}
