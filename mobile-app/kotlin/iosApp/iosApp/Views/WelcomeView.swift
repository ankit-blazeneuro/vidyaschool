import SwiftUI

// ---------------------------------------------------------------------------
// Splash / Loading View
// ---------------------------------------------------------------------------

struct SplashView: View {
    @State private var scale: CGFloat = 0.7
    @State private var opacity: Double = 0

    var body: some View {
        ZStack {
            AppTheme.Color.darkBackground.ignoresSafeArea()

            VStack(spacing: AppTheme.Spacing.md) {
                // Logo mark
                ZStack {
                    Circle()
                        .fill(AppTheme.Color.darkSurface)
                        .frame(width: 88, height: 88)
                    Text("VS")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                }

                Text("VidyaSchool")
                    .font(AppTheme.Font.title1)
                    .foregroundColor(.white)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: AppTheme.Color.darkSecondary))
                    .padding(.top, AppTheme.Spacing.md)
            }
            .scaleEffect(scale)
            .opacity(opacity)
            .onAppear {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                    scale = 1.0
                    opacity = 1.0
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Welcome Screen
// ---------------------------------------------------------------------------

struct WelcomeView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showLoginSheet = false
    @State private var showSignupSheet = false
    @State private var particleOffset: CGFloat = 0

    var body: some View {
        ZStack {
            // Background
            AppTheme.Color.darkBackground.ignoresSafeArea()

            // Ambient glow blobs
            GeometryReader { geo in
                Circle()
                    .fill(AppTheme.Color.accent.opacity(0.12))
                    .frame(width: 300, height: 300)
                    .blur(radius: 80)
                    .offset(x: geo.size.width * 0.4, y: -geo.size.height * 0.1 + particleOffset)

                Circle()
                    .fill(SwiftUI.Color(hex: "#8B5CF6").opacity(0.08))
                    .frame(width: 250, height: 250)
                    .blur(radius: 60)
                    .offset(x: -40, y: geo.size.height * 0.3 - particleOffset * 0.6)
            }
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.easeInOut(duration: 4).repeatForever(autoreverses: true)) {
                    particleOffset = 30
                }
            }

            VStack(spacing: 0) {
                Spacer()

                // Hero section
                VStack(spacing: AppTheme.Spacing.md) {
                    // Logo
                    ZStack {
                        Circle()
                            .fill(AppTheme.Color.darkSurface)
                            .frame(width: 100, height: 100)
                            .overlay(
                                Circle()
                                    .stroke(AppTheme.Color.darkOutline, lineWidth: 1)
                            )
                        Text("VS")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(.white)
                    }

                    VStack(spacing: AppTheme.Spacing.xs) {
                        Text("Vidya School")
                            .font(AppTheme.Font.largeTitle)
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)

                        Text("Your complete school management\nplatform")
                            .font(AppTheme.Font.subheadline)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                    }
                }

                Spacer()

                // Bottom sheet style action area
                VStack(spacing: AppTheme.Spacing.sm) {
                    // Feature pills
                    HStack(spacing: AppTheme.Spacing.sm) {
                        FeaturePill(icon: "book.closed", label: "Library")
                        FeaturePill(icon: "indianrupeesign.circle", label: "Fees")
                        FeaturePill(icon: "bell", label: "Notices")
                    }
                    .padding(.bottom, AppTheme.Spacing.md)

                    VSButton(title: "Get Started") {
                        showLoginSheet = true
                    }

                    VSButton(title: "Create Account", style: .secondary) {
                        showSignupSheet = true
                    }

                    Text("By continuing, you agree to our Terms of Service")
                        .font(AppTheme.Font.caption)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.top, AppTheme.Spacing.xs)
                }
                .padding(.horizontal, AppTheme.Spacing.lg)
                .padding(.bottom, AppTheme.Spacing.xl)
                .padding(.top, AppTheme.Spacing.lg)
                .background(
                    UnevenRoundedRectangle(
                        topLeadingRadius: AppTheme.Radius.xl,
                        topTrailingRadius: AppTheme.Radius.xl
                    )
                    .fill(AppTheme.Color.darkSurface.opacity(0.7))
                    .overlay(
                        UnevenRoundedRectangle(
                            topLeadingRadius: AppTheme.Radius.xl,
                            topTrailingRadius: AppTheme.Radius.xl
                        )
                        .stroke(AppTheme.Color.darkOutline.opacity(0.4), lineWidth: 1)
                    )
                )
            }
        }
        .sheet(isPresented: $showLoginSheet) {
            LoginView()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .sheetBackground(AppTheme.Color.darkBackground)
        }
        .sheet(isPresented: $showSignupSheet) {
            SignupView()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .sheetBackground(AppTheme.Color.darkBackground)
        }
    }
}

private struct FeaturePill: View {
    let icon: String
    let label: String

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .medium))
            Text(label)
                .font(AppTheme.Font.caption2)
        }
        .foregroundColor(AppTheme.Color.darkSecondary)
        .padding(.horizontal, AppTheme.Spacing.sm)
        .padding(.vertical, 6)
        .background(AppTheme.Color.darkSurface2)
        .cornerRadius(AppTheme.Radius.full)
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.Radius.full)
                .stroke(AppTheme.Color.darkOutline, lineWidth: 1)
        )
    }
}
