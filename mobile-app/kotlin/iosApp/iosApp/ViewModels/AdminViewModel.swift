import Foundation
import Shared

@MainActor
final class AdminViewModel: ObservableObject {
    @Published var sliderImages: [SliderImage] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    @Published var noticeSuccess: Bool = false

    private let apiClient = ApiClient()

    func fetchSliderImages() {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                let images = try await apiClient.getSliderImages(role: "admin", studentClass: nil)
                self.sliderImages = images
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }

    func updateSliderImages(images: [SliderImage]) {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                _ = try await apiClient.updateSliderImages(images: images)
                self.sliderImages = images
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }

    func createNotice(title: String, content: String, targetRole: String) {
        isLoading = true
        errorMessage = nil
        noticeSuccess = false
        Task {
            do {
                // Since notices creation is a simulated operation for the frontend demo,
                // we perform a short delay to mock the API request.
                try await Task.sleep(nanoseconds: 800_000_000)
                print("Broadcasting Notice: \(title) -> \(content) to \(targetRole)")
                self.noticeSuccess = true
            } catch {
                self.errorMessage = error.localizedDescription
            }
            self.isLoading = false
        }
    }
}
