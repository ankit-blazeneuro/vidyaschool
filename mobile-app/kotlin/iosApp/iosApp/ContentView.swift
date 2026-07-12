import SwiftUI

struct ContentView: View {

    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var updateChecker = UpdateChecker.shared

    var body: some View {
        ZStack {
            // Main Content
            Group {
                switch authViewModel.sessionState {
                case .loading:
                    SplashView()
                case .loggedOut, .idle:
                    WelcomeView()
                case .loggedIn(let user):
                    DashboardView(user: user)
                case .error:
                    WelcomeView()
                }
            }
            
            // In-app Update Banner Overlay
            if let updateInfo = updateChecker.updateInfo {
                VStack {
                    Spacer()
                    UpdateBannerView(
                        updateInfo: updateInfo,
                        onUpdate: {
                            updateChecker.openDownloadURL(updateInfo.downloadUrl)
                        },
                        onDismiss: {
                            withAnimation(.spring()) {
                                updateChecker.skipVersion(updateInfo.versionName)
                            }
                        }
                    )
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(100)
            }
        }
        .onAppear {
            authViewModel.checkSession()
            Task {
                await updateChecker.checkForUpdates()
            }
        }
    }
}

