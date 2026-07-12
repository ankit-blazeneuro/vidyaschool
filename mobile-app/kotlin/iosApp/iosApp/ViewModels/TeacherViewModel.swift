import Foundation
import Shared

@MainActor
final class TeacherViewModel: ObservableObject {
    @Published var students: [SearchUserResponse] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    private let apiClient = ApiClient()
    private let sessionStorage = SessionStorage()

    func searchStudents(query: String) {
        guard let token = sessionStorage.getSessionToken() else {
            self.errorMessage = "Session token not found."
            return
        }
        
        if query.isEmpty {
            self.students = []
            return
        }

        isLoading = true
        errorMessage = nil
        Task {
            do {
                let results = try await apiClient.searchUsers(authToken: token, query: query)
                // Filter to show only students
                self.students = results.filter { $0.role.lowercased() == "student" }
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }
}
