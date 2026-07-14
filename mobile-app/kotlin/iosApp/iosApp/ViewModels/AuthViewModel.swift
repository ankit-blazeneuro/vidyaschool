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
        guard sessionStorage.isLoggedIn() else {
            sessionState = .loggedOut
            return
        }
        Task {
            let initialState = sharedViewModel.authState.value
            sharedViewModel.checkSession()
            await waitForStateChange(from: initialState)
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

        let initialState = sharedViewModel.authState.value
        sharedViewModel.loginWithEmail(email: email, password: password)
        await waitForStateChange(from: initialState)

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

        let initialState = sharedViewModel.authState.value
        sharedViewModel.createSocialSession(
            email: email,
            name: name,
            avatarUrl: avatarUrl,
            provider: provider
        )
        await waitForStateChange(from: initialState)

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

    private func isSameState(_ lhs: SharedAuthState, _ rhs: SharedAuthState) -> Bool {
        if lhs is SharedAuthState.Idle && rhs is SharedAuthState.Idle { return true }
        if lhs is SharedAuthState.Loading && rhs is SharedAuthState.Loading { return true }
        if lhs is SharedAuthState.LoggedOut && rhs is SharedAuthState.LoggedOut { return true }
        if lhs is SharedAuthState.LoggedIn && rhs is SharedAuthState.LoggedIn { return true }
        if lhs is SharedAuthState.Error && rhs is SharedAuthState.Error { return true }
        return false
    }

    /// Waits for the authState to change from the initial state (ensuring the KMP coroutine has
    /// been dispatched and started execution), and then waits for the loading state to complete.
    private func waitForStateChange(from initialState: SharedAuthState) async {
        let deadline = Date().addingTimeInterval(10)
        let dispatchDeadline = Date().addingTimeInterval(0.2) // 200 ms timeout for the coroutine to start
        
        var stateChanged = false
        while Date() < dispatchDeadline {
            let state = sharedViewModel.authState.value
            if !isSameState(state, initialState) {
                stateChanged = true
                break
            }
            try? await Task.sleep(nanoseconds: 10_000_000) // 10 ms
        }
        
        if stateChanged {
            let state = sharedViewModel.authState.value
            if !(state is SharedAuthState.Loading) {
                // If it already transitioned directly to a terminal state (e.g. LoggedOut synchronously)
                return
            }
        }
        
        // Wait until the state is no longer Loading
        while Date() < deadline {
            let state = sharedViewModel.authState.value
            if !(state is SharedAuthState.Loading) {
                return
            }
            try? await Task.sleep(nanoseconds: 50_000_000) // 50 ms
        }
    }
}
