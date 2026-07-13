import SwiftUI

// ---------------------------------------------------------------------------
// Login Screen
// ---------------------------------------------------------------------------

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email: String = ""
    @State private var password: String = ""
    @State private var shakeError: Bool = false
    @FocusState private var focusedField: Field?

    enum Field { case email, password }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        // Header
                        VStack(spacing: AppTheme.Spacing.xs) {
                            Text("Welcome back")
                                .font(AppTheme.Font.title1)
                                .foregroundColor(.white)
                            Text("Sign in to your account")
                                .font(AppTheme.Font.subheadline)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                        }
                        .padding(.top, AppTheme.Spacing.xl)

                        // Error message
                        if let error = authViewModel.errorMessage {
                            HStack(spacing: AppTheme.Spacing.sm) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(AppTheme.Color.destructive)
                                Text(error)
                                    .font(AppTheme.Font.footnote)
                                    .foregroundColor(AppTheme.Color.destructive)
                                Spacer()
                            }
                            .padding(AppTheme.Spacing.md)
                            .background(AppTheme.Color.destructiveMuted.opacity(0.15))
                            .cornerRadius(AppTheme.Radius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                                    .stroke(AppTheme.Color.destructive.opacity(0.3), lineWidth: 1)
                            )
                            .shake(trigger: shakeError)
                        }

                        // Form fields
                        VStack(spacing: AppTheme.Spacing.md) {
                            VSTextField(
                                label: "Email address",
                                text: $email,
                                placeholder: "you@example.com",
                                keyboardType: .emailAddress,
                                autocapitalization: .never
                            )
                            .focused($focusedField, equals: .email)
                            .submitLabel(.next)
                            .onSubmit { focusedField = .password }

                            VSTextField(
                                label: "Password",
                                text: $password,
                                placeholder: "••••••••",
                                isSecure: true
                            )
                            .focused($focusedField, equals: .password)
                            .submitLabel(.go)
                            .onSubmit { performLogin() }
                        }

                        // Login button
                        VSButton(
                            title: "Sign In",
                            isLoading: authViewModel.isLoading
                        ) {
                            performLogin()
                        }

                        // Divider
                        HStack {
                            Rectangle().fill(AppTheme.Color.darkOutline).frame(height: 1)
                            Text("or continue with")
                                .font(AppTheme.Font.caption)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                                .lineLimit(1)
                                .fixedSize()
                            Rectangle().fill(AppTheme.Color.darkOutline).frame(height: 1)
                        }

                        // Social auth (UI only — native SDKs required)
                        HStack(spacing: AppTheme.Spacing.sm) {
                            SocialButton(
                                title: "Google",
                                icon: "g.circle.fill",
                                iconColor: SwiftUI.Color(hex: "#EA4335")
                            ) {
                                // TODO: Integrate GoogleSignIn SDK for iOS
                                // https://developers.google.com/identity/sign-in/ios
                            }

                            SocialButton(
                                title: "GitHub",
                                icon: "chevron.left.forwardslash.chevron.right",
                                iconColor: .white
                            ) {
                                // TODO: Integrate AppAuth or ASWebAuthenticationSession for GitHub OAuth
                            }
                        }

                        Text("Social sign-in requires native iOS SDKs.\nEmail login is fully functional.")
                            .font(AppTheme.Font.caption2)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, AppTheme.Spacing.lg)
                    .padding(.bottom, AppTheme.Spacing.xl)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }
            }
        }
        .onChange(of: authViewModel.errorMessage) { error in
            if error != nil {
                withAnimation(.default) { shakeError = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { shakeError = false }
            }
        }
        .onChange(of: authViewModel.isLoggedIn) { loggedIn in
            if loggedIn { dismiss() }
        }
    }

    private func performLogin() {
        focusedField = nil
        authViewModel.resetError()
        Task {
            await authViewModel.login(email: email, password: password)
        }
    }
}

// ---------------------------------------------------------------------------
// Signup Screen
// ---------------------------------------------------------------------------

struct SignupView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var confirmPassword: String = ""
    @State private var localError: String? = nil
    @State private var shakeError: Bool = false
    @FocusState private var focusedField: Field?

    enum Field { case name, email, password, confirm }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        VStack(spacing: AppTheme.Spacing.xs) {
                            Text("Create account")
                                .font(AppTheme.Font.title1)
                                .foregroundColor(.white)
                            Text("Join VidyaSchool today")
                                .font(AppTheme.Font.subheadline)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                        }
                        .padding(.top, AppTheme.Spacing.xl)

                        if let error = localError ?? authViewModel.errorMessage {
                            HStack(spacing: AppTheme.Spacing.sm) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(AppTheme.Color.destructive)
                                Text(error)
                                    .font(AppTheme.Font.footnote)
                                    .foregroundColor(AppTheme.Color.destructive)
                                Spacer()
                            }
                            .padding(AppTheme.Spacing.md)
                            .background(AppTheme.Color.destructiveMuted.opacity(0.15))
                            .cornerRadius(AppTheme.Radius.md)
                            .shake(trigger: shakeError)
                        }

                        VStack(spacing: AppTheme.Spacing.md) {
                            VSTextField(label: "Full Name", text: $name, placeholder: "John Doe")
                                .focused($focusedField, equals: .name)
                                .submitLabel(.next)
                                .onSubmit { focusedField = .email }

                            VSTextField(
                                label: "Email address",
                                text: $email,
                                placeholder: "you@example.com",
                                keyboardType: .emailAddress,
                                autocapitalization: .never
                            )
                            .focused($focusedField, equals: .email)
                            .submitLabel(.next)
                            .onSubmit { focusedField = .password }

                            VSTextField(
                                label: "Password",
                                text: $password,
                                placeholder: "Min. 8 characters",
                                isSecure: true
                            )
                            .focused($focusedField, equals: .password)
                            .submitLabel(.next)
                            .onSubmit { focusedField = .confirm }

                            VSTextField(
                                label: "Confirm Password",
                                text: $confirmPassword,
                                placeholder: "Re-enter password",
                                isSecure: true
                            )
                            .focused($focusedField, equals: .confirm)
                            .submitLabel(.go)
                            .onSubmit { performSignup() }
                        }

                        VSButton(title: "Create Account", isLoading: authViewModel.isLoading) {
                            performSignup()
                        }
                    }
                    .padding(.horizontal, AppTheme.Spacing.lg)
                    .padding(.bottom, AppTheme.Spacing.xl)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }
            }
        }
        .onChange(of: authViewModel.isLoggedIn) { loggedIn in
            if loggedIn { dismiss() }
        }
    }

    private func performSignup() {
        focusedField = nil
        localError = nil
        authViewModel.resetError()

        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            localError = "Please fill in all fields."
            triggerShake()
            return
        }
        guard password == confirmPassword else {
            localError = "Passwords do not match."
            triggerShake()
            return
        }
        guard password.count >= 8 else {
            localError = "Password must be at least 8 characters."
            triggerShake()
            return
        }
        // Note: signup calls login after account creation
        Task {
            await authViewModel.login(email: email, password: password)
        }
    }

    private func triggerShake() {
        withAnimation(.default) { shakeError = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { shakeError = false }
    }
}

// ---------------------------------------------------------------------------
// Social login button
// ---------------------------------------------------------------------------

private struct SocialButton: View {
    let title: String
    let icon: String
    let iconColor: SwiftUI.Color
    let action: () -> Void

    var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            action()
        }) {
            HStack(spacing: AppTheme.Spacing.sm) {
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                    .font(.system(size: 18, weight: .medium))
                Text(title)
                    .font(AppTheme.Font.callout)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(AppTheme.Color.darkSurface2)
            .cornerRadius(AppTheme.Radius.md)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .stroke(AppTheme.Color.darkOutline, lineWidth: 1)
            )
        }
    }
}
