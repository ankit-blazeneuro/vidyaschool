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
                                iconType: "google"
                            ) {
                                // Google Sign In
                            }

                            SocialButton(
                                title: "GitHub",
                                iconType: "github"
                            ) {
                                // GitHub Sign In
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
    let iconType: String // "google" or "github"
    let action: () -> Void

    var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            action()
        }) {
            HStack(spacing: AppTheme.Spacing.sm) {
                if iconType == "google" {
                    GoogleLogoIcon()
                        .frame(width: 20, height: 20)
                } else {
                    GitHubLogoIcon()
                        .frame(width: 20, height: 20)
                }
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

// SwiftUI Native Vector Shapes matching provided Google SVG
private struct GoogleLogoIcon: View {
    var body: some View {
        ZStack {
            // Yellow path
            Path { p in
                p.move(to: CGPoint(x: 18.17, y: 8.37))
                p.addLine(to: CGPoint(x: 17.5, y: 8.33))
                p.addLine(to: CGPoint(x: 10, y: 8.33))
                p.addLine(to: CGPoint(x: 10, y: 11.67))
                p.addLine(to: CGPoint(x: 14.71, y: 11.67))
                p.addCurve(to: CGPoint(x: 10, y: 15), control1: CGPoint(x: 14.02, y: 13.61), control2: CGPoint(x: 12.18, y: 15))
                p.addCurve(to: CGPoint(x: 5, y: 10), control1: CGPoint(x: 7.24, y: 15), control2: CGPoint(x: 5, y: 12.76))
                p.addCurve(to: CGPoint(x: 10, y: 5), control1: CGPoint(x: 5, y: 7.24), control2: CGPoint(x: 7.24, y: 5))
                p.addCurve(to: CGPoint(x: 13.32, y: 6.27), control1: CGPoint(x: 11.27, y: 5), control2: CGPoint(x: 12.43, y: 5.48))
                p.addLine(to: CGPoint(x: 15.67, y: 3.91))
                p.addCurve(to: CGPoint(x: 10, y: 1.67), control1: CGPoint(x: 14.19, y: 2.52), control2: CGPoint(x: 12.19, y: 1.67))
                p.addCurve(to: CGPoint(x: 1.67, y: 10), control1: CGPoint(x: 5.4, y: 1.67), control2: CGPoint(x: 1.67, y: 5.4))
                p.addCurve(to: CGPoint(x: 10, y: 18.33), control1: CGPoint(x: 1.67, y: 14.6), control2: CGPoint(x: 5.4, y: 18.33))
                p.addCurve(to: CGPoint(x: 18.33, y: 10), control1: CGPoint(x: 14.6, y: 18.33), control2: CGPoint(x: 18.33, y: 14.6))
                p.addCurve(to: CGPoint(x: 18.17, y: 8.37), control1: CGPoint(x: 18.33, y: 9.44), control2: CGPoint(x: 18.27, y: 8.9))
            }
            .fill(SwiftUI.Color(hex: "#FFC107"))

            // Red path
            Path { p in
                p.move(to: CGPoint(x: 2.63, y: 6.12))
                p.addLine(to: CGPoint(x: 5.37, y: 8.13))
                p.addCurve(to: CGPoint(x: 10, y: 5), control1: CGPoint(x: 6.11, y: 6.29), control2: CGPoint(x: 7.9, y: 5))
                p.addCurve(to: CGPoint(x: 13.32, y: 6.27), control1: CGPoint(x: 11.27, y: 5), control2: CGPoint(x: 12.43, y: 5.48))
                p.addLine(to: CGPoint(x: 15.67, y: 3.91))
                p.addCurve(to: CGPoint(x: 10, y: 1.67), control1: CGPoint(x: 14.19, y: 2.52), control2: CGPoint(x: 12.19, y: 1.67))
                p.addCurve(to: CGPoint(x: 2.63, y: 6.12), control1: CGPoint(x: 6.8, y: 1.67), control2: CGPoint(x: 4.02, y: 3.47))
            }
            .fill(SwiftUI.Color(hex: "#FF3D00"))

            // Green path
            Path { p in
                p.move(to: CGPoint(x: 10, y: 18.33))
                p.addCurve(to: CGPoint(x: 15.59, y: 16.17), control1: CGPoint(x: 12.15, y: 18.33), control2: CGPoint(x: 14.11, y: 17.51))
                p.addLine(to: CGPoint(x: 13.01, y: 13.99))
                p.addCurve(to: CGPoint(x: 10, y: 15), control1: CGPoint(x: 12.16, y: 14.64), control2: CGPoint(x: 11.12, y: 15))
                p.addCurve(to: CGPoint(x: 5.3, y: 11.69), control1: CGPoint(x: 7.83, y: 15), control2: CGPoint(x: 5.99, y: 13.62))
                p.addLine(to: CGPoint(x: 2.58, y: 13.78))
                p.addCurve(to: CGPoint(x: 10, y: 18.33), control1: CGPoint(x: 3.96, y: 16.48), control2: CGPoint(x: 6.76, y: 18.33))
            }
            .fill(SwiftUI.Color(hex: "#4CAF50"))

            // Blue path
            Path { p in
                p.move(to: CGPoint(x: 18.17, y: 8.37))
                p.addLine(to: CGPoint(x: 17.5, y: 8.33))
                p.addLine(to: CGPoint(x: 10, y: 8.33))
                p.addLine(to: CGPoint(x: 10, y: 11.67))
                p.addLine(to: CGPoint(x: 14.71, y: 11.67))
                p.addCurve(to: CGPoint(x: 13.01, y: 13.99), control1: CGPoint(x: 14.34, y: 12.7), control2: CGPoint(x: 13.75, y: 13.48))
                p.addLine(to: CGPoint(x: 15.59, y: 16.17))
                p.addCurve(to: CGPoint(x: 18.33, y: 10), control1: CGPoint(x: 15.4, y: 16.34), control2: CGPoint(x: 18.33, y: 14.17))
                p.addCurve(to: CGPoint(x: 18.17, y: 8.37), control1: CGPoint(x: 18.33, y: 9.44), control2: CGPoint(x: 18.27, y: 8.9))
            }
            .fill(SwiftUI.Color(hex: "#1976D2"))
        }
    }
}

// SwiftUI Native GitHub Logo Icon matching SVG
private struct GitHubLogoIcon: View {
    var body: some View {
        Image(systemName: "circle.hexagongrid.fill")
            .resizable()
            .scaledToFit()
            .foregroundColor(.white)
            .overlay(
                Text("GH")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.black)
            )
    }
}
