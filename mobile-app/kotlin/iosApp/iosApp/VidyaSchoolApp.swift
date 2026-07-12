import SwiftUI
import Shared

@main
struct VidyaSchoolApp: App {

    @StateObject private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
                .preferredColorScheme(.dark)
        }
    }
}
