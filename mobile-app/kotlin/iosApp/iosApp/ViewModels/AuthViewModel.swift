import Foundation
import Shared

// ---------------------------------------------------------------------------
// Session state mirroring SharedAuthState from KMP
// ---------------------------------------------------------------------------

enum SessionState {
    case idle
    case loading
    case loggedIn(AppUser)
    case loggedOut
    case error(String)
}

// ---------------------------------------------------------------------------
// iOS ViewModel wrapping KMP SharedAuthViewModel
// ---------------------------------------------------------------------------

@MainActor
final class AuthViewModel: ObservableObject {

    // Published UI state
    @Published var sessionState: SessionState = .idle
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    @Published var currentUser: AppUser? = nil

    // KMP shared layer
    private let sessionStorage = SessionStorage()
    private let apiClient = ApiClient()
    private lazy var sharedViewModel = SharedAuthViewModel(
        sessionStorage: sessionStorage,
        apiClient: apiClient
    )

    // -----------------------------------------------------------------------
    // Session check on launch
    // -----------------------------------------------------------------------

    func checkSession() {
        sessionState = .loading
        Task {
            // Run KMP check on background thread then map result
            await withCheckedContinuation { continuation in
                sharedViewModel.checkSession()
                // Give coroutines a moment to emit (simple approach)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                    continuation.resume()
                }
            }
            syncStateFromShared()
        }
    }

    // -----------------------------------------------------------------------
    // Email / password login
    // -----------------------------------------------------------------------

    func login(email: String, password: String) async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields."
            return
        }
        isLoading = true
        errorMessage = nil

        await withCheckedContinuation { continuation in
            sharedViewModel.loginWithEmail(email: email, password: password)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                continuation.resume()
            }
        }

        isLoading = false
        syncStateFromShared()
    }

    // -----------------------------------------------------------------------
    // Social login bridge (called after native Google/GitHub auth succeeds)
    // -----------------------------------------------------------------------

    func handleSocialLogin(
        email: String,
        name: String?,
        avatarUrl: String?,
        provider: String
    ) async {
        isLoading = true
        errorMessage = nil

        await withCheckedContinuation { continuation in
            sharedViewModel.createSocialSession(
                email: email,
                name: name,
                avatarUrl: avatarUrl,
                provider: provider
            )
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                continuation.resume()
            }
        }

        isLoading = false
        syncStateFromShared()
    }

    // -----------------------------------------------------------------------
    // Logout
    // -----------------------------------------------------------------------

    func logout() {
        sharedViewModel.logout()
        currentUser = nil
        sessionState = .loggedOut
    }

    func resetError() {
        sharedViewModel.resetError()
        errorMessage = nil
    }

    // -----------------------------------------------------------------------
    // Theme preference (delegates to shared SessionStorage)
    // -----------------------------------------------------------------------

    var themeMode: String { sessionStorage.getThemeMode() }

    func setThemeMode(_ mode: String) {
        sessionStorage.setThemeMode(mode: mode)
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private func syncStateFromShared() {
        let state = sharedViewModel.authState.value
        switch state {
        case is SharedAuthStateLoggedIn:
            if let loggedIn = state as? SharedAuthStateLoggedIn {
                currentUser = loggedIn.user
                sessionState = .loggedIn(loggedIn.user)
            }
        case is SharedAuthStateLoggedOut:
            sessionState = .loggedOut
        case is SharedAuthStateError:
            if let err = state as? SharedAuthStateError {
                errorMessage = err.message
                sessionState = .error(err.message)
            }
        case is SharedAuthStateLoading:
            sessionState = .loading
        default:
            sessionState = .idle
        }
    }
}
