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

    /// Equatable-safe derived property for use with `.onChange(of:)`.
    var isLoggedIn: Bool {
        if case .loggedIn = sessionState { return true }
        return false
    }

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
            sharedViewModel.checkSession()
            await waitForNonLoadingState()
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

        sharedViewModel.loginWithEmail(email: email, password: password)
        await waitForNonLoadingState()

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

        sharedViewModel.createSocialSession(
            email: email,
            name: name,
            avatarUrl: avatarUrl,
            provider: provider
        )
        await waitForNonLoadingState()

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
        case is SharedAuthState.LoggedIn:
            if let loggedIn = state as? SharedAuthState.LoggedIn {
                currentUser = loggedIn.user
                sessionState = .loggedIn(loggedIn.user)
            }
        case is SharedAuthState.LoggedOut:
            sessionState = .loggedOut
        case is SharedAuthState.Error:
            if let err = state as? SharedAuthState.Error {
                errorMessage = err.message
                sessionState = .error(err.message)
            }
        default:
            // Loading or unknown — treat as logged out so UI never stays stuck
            sessionState = .loggedOut
        }
    }

    /// Polls `authState` every 100 ms until it leaves the Loading state.
    /// Hard timeout of 10 s prevents an infinite wait on network failure.
    private func waitForNonLoadingState() async {
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline {
            let state = sharedViewModel.authState.value
            if !(state is SharedAuthState.Loading) { return }
            try? await Task.sleep(nanoseconds: 100_000_000) // 100 ms
        }
    }
}
