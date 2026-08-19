import SwiftUI

// ---------------------------------------------------------------------------
// VidyaSchool Design System — Glass UI & AppTheme
// Matches Android Material3 zinc-palette dark scheme (Theme.kt) with iOS SwiftUI styling
// ---------------------------------------------------------------------------

enum AppTheme {

    // -----------------------------------------------------------------------
    // Colours (zinc palette matching Android Theme.kt)
    // -----------------------------------------------------------------------

    enum Color {
        // Dark scheme (Android DarkColorScheme)
        static let darkBackground    = SwiftUI.Color(hex: "#09090B")  // zinc-950 (MaterialTheme.background)
        static let darkSurface       = SwiftUI.Color(hex: "#18181B")  // zinc-900 (MaterialTheme.surface)
        static let darkSurface2      = SwiftUI.Color(hex: "#27272A")  // zinc-800
        static let darkOutline       = SwiftUI.Color(hex: "#27272A")  // zinc-800 (MaterialTheme.outline)
        static let darkOnSurface     = SwiftUI.Color.white            // MaterialTheme.onSurface
        static let darkSecondary     = SwiftUI.Color(hex: "#71717A")  // zinc-500 (MaterialTheme.secondary)
        static let darkMuted         = SwiftUI.Color(hex: "#A1A1AA")  // zinc-400
        static let darkPrimary       = SwiftUI.Color.white            // MaterialTheme.primary

        // Light scheme
        static let lightBackground   = SwiftUI.Color(hex: "#FAFAFA")
        static let lightSurface      = SwiftUI.Color.white
        static let lightSurface2     = SwiftUI.Color(hex: "#F4F4F5")
        static let lightOutline      = SwiftUI.Color(hex: "#E4E4E7")
        static let lightOnSurface    = SwiftUI.Color(hex: "#18181B")
        static let lightSecondary    = SwiftUI.Color(hex: "#A1A1AA")
        static let lightPrimary      = SwiftUI.Color(hex: "#18181B")

        // Semantic / accent
        static let accent            = SwiftUI.Color(hex: "#6366F1")  // indigo-500
        static let accentMuted       = SwiftUI.Color(hex: "#4F46E5")  // indigo-600
        static let accentPurple      = SwiftUI.Color(hex: "#8B5CF6")  // violet-500
        static let accentCyan        = SwiftUI.Color(hex: "#06B6D4")  // cyan-500
        static let success           = SwiftUI.Color(hex: "#22C55E")  // green-500
        static let warning           = SwiftUI.Color(hex: "#F59E0B")  // amber-500
        static let destructive       = SwiftUI.Color(hex: "#EF4444")  // red-500
        static let destructiveMuted  = SwiftUI.Color(hex: "#7F1D1D")

        // Glass tints
        static let glassBg           = SwiftUI.Color.white.opacity(0.05)
        static let glassBorder       = SwiftUI.Color(hex: "#27272A")
        static let glassHighlight    = SwiftUI.Color.white.opacity(0.12)
    }

    // -----------------------------------------------------------------------
    // Gradients
    // -----------------------------------------------------------------------

    enum Gradient {
        static let heroGradient = LinearGradient(
            colors: [
                SwiftUI.Color(hex: "#18181B"),
                SwiftUI.Color(hex: "#09090B")
            ],
            startPoint: .top,
            endPoint: .bottom
        )

        static let accentGradient = LinearGradient(
            colors: [
                SwiftUI.Color(hex: "#6366F1"),
                SwiftUI.Color(hex: "#8B5CF6")
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let glassBorder = LinearGradient(
            colors: [
                SwiftUI.Color(hex: "#27272A"),
                SwiftUI.Color(hex: "#27272A").opacity(0.6)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let glassCardBg = LinearGradient(
            colors: [
                SwiftUI.Color(hex: "#18181B"),
                SwiftUI.Color(hex: "#141416")
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let shimmerGradient = LinearGradient(
            colors: [
                SwiftUI.Color.white.opacity(0.03),
                SwiftUI.Color.white.opacity(0.10),
                SwiftUI.Color.white.opacity(0.03)
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    // -----------------------------------------------------------------------
    // Typography
    // -----------------------------------------------------------------------

    enum Font {
        static let largeTitle  = SwiftUI.Font.system(size: 34, weight: .bold,   design: .default)
        static let title1      = SwiftUI.Font.system(size: 28, weight: .bold,   design: .default)
        static let title2      = SwiftUI.Font.system(size: 22, weight: .semibold, design: .default)
        static let title3      = SwiftUI.Font.system(size: 20, weight: .semibold, design: .default)
        static let headline    = SwiftUI.Font.system(size: 17, weight: .semibold, design: .default)
        static let body        = SwiftUI.Font.system(size: 17, weight: .regular, design: .default)
        static let callout     = SwiftUI.Font.system(size: 16, weight: .regular, design: .default)
        static let subheadline = SwiftUI.Font.system(size: 15, weight: .regular, design: .default)
        static let footnote    = SwiftUI.Font.system(size: 13, weight: .regular, design: .default)
        static let caption     = SwiftUI.Font.system(size: 12, weight: .regular, design: .default)
        static let caption2    = SwiftUI.Font.system(size: 11, weight: .regular, design: .default)
    }

    // -----------------------------------------------------------------------
    // Spacing
    // -----------------------------------------------------------------------

    enum Spacing {
        static let xs:  CGFloat = 4
        static let sm:  CGFloat = 8
        static let md:  CGFloat = 16
        static let lg:  CGFloat = 24
        static let xl:  CGFloat = 32
        static let xxl: CGFloat = 48
    }

    // -----------------------------------------------------------------------
    // Corner Radii
    // -----------------------------------------------------------------------

    enum Radius {
        static let sm:  CGFloat = 8
        static let md:  CGFloat = 12
        static let lg:  CGFloat = 16
        static let xl:  CGFloat = 20
        static let full: CGFloat = 9999
    }
}

// ---------------------------------------------------------------------------
// Hex colour extension
// ---------------------------------------------------------------------------

extension SwiftUI.Color {
    init(hex: UInt) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: 1.0
        )
    }

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red:   Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// ---------------------------------------------------------------------------
// Glass UI Core Components (Matching Android Dark Theme)
// ---------------------------------------------------------------------------

/// Clean Deep Background matching Android Theme.kt (Color(0xFF09090B))
struct GlassBackground: View {
    var body: some View {
        AppTheme.Color.darkBackground
            .ignoresSafeArea()
    }
}

/// Frosted Glassmorphism Card matching Android Card + surfaceVariant + outline
struct GlassCard<Content: View>: View {
    let content: Content
    var cornerRadius: CGFloat = AppTheme.Radius.xl
    var padding: CGFloat = AppTheme.Spacing.md

    init(cornerRadius: CGFloat = AppTheme.Radius.xl, padding: CGFloat = AppTheme.Spacing.md, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(AppTheme.Color.darkSurface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(AppTheme.Color.darkOutline, lineWidth: 1)
            )
    }
}

/// Backwards-compatible VSCard wrapping GlassCard
struct VSCard<Content: View>: View {
    let content: Content
    var padding: CGFloat = AppTheme.Spacing.md

    init(padding: CGFloat = AppTheme.Spacing.md, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        GlassCard(cornerRadius: AppTheme.Radius.xl, padding: padding) {
            content
        }
    }
}

/// Frosted Glass Pill Chip
struct GlassPill: View {
    let text: String
    var icon: String? = nil
    var color: SwiftUI.Color = AppTheme.Color.accent

    var body: some View {
        HStack(spacing: 5) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .semibold))
            }
            Text(text)
                .font(AppTheme.Font.caption2)
                .fontWeight(.semibold)
        }
        .foregroundColor(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.Radius.full)
                    .fill(color.opacity(0.14))
                RoundedRectangle(cornerRadius: AppTheme.Radius.full)
                    .stroke(color.opacity(0.35), lineWidth: 1)
            }
        )
    }
}

// ---------------------------------------------------------------------------
// Exact Vector Icons Matching Android XML Drawables
// ---------------------------------------------------------------------------

/// Authentic 4-color Google Logo Icon matching Android's `ic_google_logo.xml`
struct GoogleLogoIcon: View {
    var body: some View {
        Canvas { context, size in
            let scaleX = size.width / 48.0
            let scaleY = size.height / 48.0

            // 1. Red Path (#EA4335 / #FF3D00)
            var redPath = Path()
            redPath.move(to: CGPoint(x: 6.306 * scaleX, y: 14.691 * scaleY))
            redPath.addLine(to: CGPoint(x: 12.877 * scaleX, y: 19.51 * scaleY))
            redPath.addCurve(to: CGPoint(x: 24.0 * scaleX, y: 12.0 * scaleY),
                             control1: CGPoint(x: 14.655 * scaleX, y: 15.108 * scaleY),
                             control2: CGPoint(x: 18.961 * scaleX, y: 12.0 * scaleY))
            redPath.addCurve(to: CGPoint(x: 31.961 * scaleX, y: 15.039 * scaleY),
                             control1: CGPoint(x: 27.059 * scaleX, y: 12.0 * scaleY),
                             control2: CGPoint(x: 29.842 * scaleX, y: 13.154 * scaleY))
            redPath.addLine(to: CGPoint(x: 37.618 * scaleX, y: 9.382 * scaleY))
            redPath.addCurve(to: CGPoint(x: 24.0 * scaleX, y: 4.0 * scaleY),
                             control1: CGPoint(x: 34.046 * scaleX, y: 6.053 * scaleY),
                             control2: CGPoint(x: 29.268 * scaleX, y: 4.0 * scaleY))
            redPath.addCurve(to: CGPoint(x: 6.306 * scaleX, y: 14.691 * scaleY),
                             control1: CGPoint(x: 16.318 * scaleX, y: 4.0 * scaleY),
                             control2: CGPoint(x: 9.656 * scaleX, y: 8.337 * scaleY))
            redPath.closeSubpath()
            context.fill(redPath, with: .color(SwiftUI.Color(hex: "#EA4335")))

            // 2. Green Path (#34A853 / #4CAF50)
            var greenPath = Path()
            greenPath.move(to: CGPoint(x: 24.0 * scaleX, y: 44.0 * scaleY))
            greenPath.addCurve(to: CGPoint(x: 37.409 * scaleX, y: 38.808 * scaleY),
                               control1: CGPoint(x: 29.166 * scaleX, y: 44.0 * scaleY),
                               control2: CGPoint(x: 33.86 * scaleX, y: 42.023 * scaleY))
            greenPath.addLine(to: CGPoint(x: 31.219 * scaleX, y: 33.57 * scaleY))
            greenPath.addCurve(to: CGPoint(x: 24.0 * scaleX, y: 36.0 * scaleY),
                               control1: CGPoint(x: 29.1 * scaleX, y: 35.1 * scaleY),
                               control2: CGPoint(x: 26.65 * scaleX, y: 36.0 * scaleY))
            greenPath.addCurve(to: CGPoint(x: 12.717 * scaleX, y: 28.054 * scaleY),
                               control1: CGPoint(x: 18.798 * scaleX, y: 36.0 * scaleY),
                               control2: CGPoint(x: 14.381 * scaleX, y: 32.683 * scaleY))
            greenPath.addLine(to: CGPoint(x: 6.195 * scaleX, y: 33.079 * scaleY))
            greenPath.addCurve(to: CGPoint(x: 24.0 * scaleX, y: 44.0 * scaleY),
                               control1: CGPoint(x: 9.505 * scaleX, y: 39.556 * scaleY),
                               control2: CGPoint(x: 16.227 * scaleX, y: 44.0 * scaleY))
            greenPath.closeSubpath()
            context.fill(greenPath, with: .color(SwiftUI.Color(hex: "#34A853")))

            // 3. Blue Path (#4285F4 / #1976D2)
            var bluePath = Path()
            bluePath.move(to: CGPoint(x: 43.611 * scaleX, y: 20.083 * scaleY))
            bluePath.addLine(to: CGPoint(x: 24.0 * scaleX, y: 20.083 * scaleY))
            bluePath.addLine(to: CGPoint(x: 24.0 * scaleX, y: 28.0 * scaleY))
            bluePath.addLine(to: CGPoint(x: 35.303 * scaleX, y: 28.0 * scaleY))
            bluePath.addCurve(to: CGPoint(x: 31.219 * scaleX, y: 33.57 * scaleY),
                              control1: CGPoint(x: 34.22 * scaleX, y: 30.8 * scaleY),
                              control2: CGPoint(x: 32.8 * scaleX, y: 32.4 * scaleY))
            bluePath.addLine(to: CGPoint(x: 37.409 * scaleX, y: 38.808 * scaleY))
            bluePath.addCurve(to: CGPoint(x: 44.0 * scaleX, y: 24.0 * scaleY),
                              control1: CGPoint(x: 41.5 * scaleX, y: 35.0 * scaleY),
                              control2: CGPoint(x: 44.0 * scaleX, y: 29.8 * scaleY))
            bluePath.addCurve(to: CGPoint(x: 43.611 * scaleX, y: 20.083 * scaleY),
                              control1: CGPoint(x: 44.0 * scaleX, y: 22.659 * scaleY),
                              control2: CGPoint(x: 43.862 * scaleX, y: 21.35 * scaleY))
            bluePath.closeSubpath()
            context.fill(bluePath, with: .color(SwiftUI.Color(hex: "#4285F4")))

            // 4. Yellow Path (#FBBC05 / #FFC107)
            var yellowPath = Path()
            yellowPath.move(to: CGPoint(x: 6.306 * scaleX, y: 14.691 * scaleY))
            yellowPath.addLine(to: CGPoint(x: 12.877 * scaleX, y: 19.51 * scaleY))
            yellowPath.addCurve(to: CGPoint(x: 12.717 * scaleX, y: 28.054 * scaleY),
                                control1: CGPoint(x: 12.14 * scaleX, y: 21.72 * scaleY),
                                control2: CGPoint(x: 12.08 * scaleX, y: 25.84 * scaleY))
            yellowPath.addLine(to: CGPoint(x: 6.195 * scaleX, y: 33.079 * scaleY))
            yellowPath.addCurve(to: CGPoint(x: 4.0 * scaleX, y: 24.0 * scaleY),
                                control1: CGPoint(x: 4.8 * scaleX, y: 30.3 * scaleY),
                                control2: CGPoint(x: 4.0 * scaleX, y: 27.24 * scaleY))
            yellowPath.addCurve(to: CGPoint(x: 6.306 * scaleX, y: 14.691 * scaleY),
                                control1: CGPoint(x: 4.0 * scaleX, y: 20.6 * scaleY),
                                control2: CGPoint(x: 4.85 * scaleX, y: 17.45 * scaleY))
            yellowPath.closeSubpath()
            context.fill(yellowPath, with: .color(SwiftUI.Color(hex: "#FBBC05")))
        }
    }
}

/// Authentic GitHub Invertocat Logo Icon matching Android's `ic_github_logo.xml`
struct GitHubLogoIcon: View {
    var color: SwiftUI.Color = .white

    var body: some View {
        Canvas { context, size in
            let scale = min(size.width, size.height) / 24.0
            var path = Path()

            path.move(to: CGPoint(x: 12 * scale, y: 0.297 * scale))
            path.addCurve(to: CGPoint(x: 0 * scale, y: 12.297 * scale),
                          control1: CGPoint(x: 5.37 * scale, y: 0.297 * scale),
                          control2: CGPoint(x: 0 * scale, y: 5.67 * scale))
            path.addCurve(to: CGPoint(x: 8.205 * scale, y: 23.682 * scale),
                          control1: CGPoint(x: 0 * scale, y: 17.6 * scale),
                          control2: CGPoint(x: 3.438 * scale, y: 22.097 * scale))
            path.addCurve(to: CGPoint(x: 8.784 * scale, y: 23.103 * scale),
                          control1: CGPoint(x: 8.805 * scale, y: 23.792 * scale),
                          control2: CGPoint(x: 8.784 * scale, y: 23.473 * scale))
            path.addLine(to: CGPoint(x: 8.784 * scale, y: 20.697 * scale))
            path.addCurve(to: CGPoint(x: 5.093 * scale, y: 20.197 * scale),
                          control1: CGPoint(x: 5.447 * scale, y: 21.423 * scale),
                          control2: CGPoint(x: 4.745 * scale, y: 19.382 * scale))
            path.addCurve(to: CGPoint(x: 3.869 * scale, y: 18.577 * scale),
                          control1: CGPoint(x: 4.412 * scale, y: 18.467 * scale),
                          control2: CGPoint(x: 3.869 * scale, y: 18.577 * scale))
            path.addCurve(to: CGPoint(x: 4.887 * scale, y: 18.513 * scale),
                          control1: CGPoint(x: 3.031 * scale, y: 18.006 * scale),
                          control2: CGPoint(x: 3.966 * scale, y: 18.513 * scale))
            path.addCurve(to: CGPoint(x: 6.377 * scale, y: 19.467 * scale),
                          control1: CGPoint(x: 5.688 * scale, y: 18.513 * scale),
                          control2: CGPoint(x: 6.223 * scale, y: 19.467 * scale))
            path.addCurve(to: CGPoint(x: 8.358 * scale, y: 20.082 * scale),
                          control1: CGPoint(x: 6.843 * scale, y: 20.267 * scale),
                          control2: CGPoint(x: 7.618 * scale, y: 20.082 * scale))
            path.addCurve(to: CGPoint(x: 8.895 * scale, y: 18.917 * scale),
                          control1: CGPoint(x: 8.544 * scale, y: 19.553 * scale),
                          control2: CGPoint(x: 8.895 * scale, y: 18.917 * scale))
            path.addCurve(to: CGPoint(x: 4.095 * scale, y: 13.972 * scale),
                          control1: CGPoint(x: 6.228 * scale, y: 18.617 * scale),
                          control2: CGPoint(x: 4.095 * scale, y: 17.527 * scale))
            path.addCurve(to: CGPoint(x: 5.37 * scale, y: 9.877 * scale),
                          control1: CGPoint(x: 4.095 * scale, y: 12.277 * scale),
                          control2: CGPoint(x: 4.708 * scale, y: 10.797 * scale))
            path.addCurve(to: CGPoint(x: 5.487 * scale, y: 7.747 * scale),
                          control1: CGPoint(x: 5.253 * scale, y: 9.537 * scale),
                          control2: CGPoint(x: 5.487 * scale, y: 8.677 * scale))
            path.addCurve(to: CGPoint(x: 8.784 * scale, y: 9.172 * scale),
                          control1: CGPoint(x: 6.558 * scale, y: 7.407 * scale),
                          control2: CGPoint(x: 8.784 * scale, y: 9.172 * scale))
            path.addCurve(to: CGPoint(x: 12.0 * scale, y: 8.747 * scale),
                          control1: CGPoint(x: 9.813 * scale, y: 8.887 * scale),
                          control2: CGPoint(x: 10.908 * scale, y: 8.747 * scale))
            path.addCurve(to: CGPoint(x: 15.228 * scale, y: 9.172 * scale),
                          control1: CGPoint(x: 13.104 * scale, y: 8.747 * scale),
                          control2: CGPoint(x: 14.199 * scale, y: 8.887 * scale))
            path.addCurve(to: CGPoint(x: 18.525 * scale, y: 7.747 * scale),
                          control1: CGPoint(x: 15.228 * scale, y: 9.172 * scale),
                          control2: CGPoint(x: 17.454 * scale, y: 7.407 * scale))
            path.addCurve(to: CGPoint(x: 18.642 * scale, y: 9.877 * scale),
                          control1: CGPoint(x: 18.525 * scale, y: 8.677 * scale),
                          control2: CGPoint(x: 18.759 * scale, y: 9.537 * scale))
            path.addCurve(to: CGPoint(x: 19.917 * scale, y: 13.962 * scale),
                          control1: CGPoint(x: 19.304 * scale, y: 10.797 * scale),
                          control2: CGPoint(x: 19.917 * scale, y: 12.267 * scale))
            path.addCurve(to: CGPoint(x: 15.108 * scale, y: 18.927 * scale),
                          control1: CGPoint(x: 19.917 * scale, y: 17.537 * scale),
                          control2: CGPoint(x: 17.772 * scale, y: 18.617 * scale))
            path.addCurve(to: CGPoint(x: 15.657 * scale, y: 20.307 * scale),
                          control1: CGPoint(x: 15.483 * scale, y: 19.297 * scale),
                          control2: CGPoint(x: 15.657 * scale, y: 19.867 * scale))
            path.addLine(to: CGPoint(x: 15.657 * scale, y: 23.103 * scale))
            path.addCurve(to: CGPoint(x: 16.248 * scale, y: 23.682 * scale),
                          control1: CGPoint(x: 15.657 * scale, y: 23.473 * scale),
                          control2: CGPoint(x: 15.624 * scale, y: 23.792 * scale))
            path.addCurve(to: CGPoint(x: 24.0 * scale, y: 12.297 * scale),
                          control1: CGPoint(x: 20.574 * scale, y: 22.087 * scale),
                          control2: CGPoint(x: 24.0 * scale, y: 17.59 * scale))
            path.addCurve(to: CGPoint(x: 12.0 * scale, y: 0.297 * scale),
                          control1: CGPoint(x: 24.0 * scale, y: 5.67 * scale),
                          control2: CGPoint(x: 18.63 * scale, y: 0.297 * scale))
            path.closeSubpath()

            context.fill(path, with: .color(color))
        }
    }
}

/// Social Button Matching Android SecondaryButton Style & Full Width Layout
struct SocialAuthButton: View {
    let title: String
    let iconType: IconType // .google or .github
    var isLoading: Bool = false
    let action: () -> Void

    enum IconType { case google, github }

    var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            action()
        }) {
            HStack(spacing: 12) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    if iconType == .google {
                        GoogleLogoIcon()
                            .frame(width: 20, height: 20)
                    } else {
                        GitHubLogoIcon(color: .white)
                            .frame(width: 20, height: 20)
                    }

                    Text(title)
                        .font(AppTheme.Font.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .fill(AppTheme.Color.darkSurface2.opacity(0.8))
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .stroke(AppTheme.Gradient.glassBorder, lineWidth: 1)
            )
        }
        .disabled(isLoading)
    }
}

// ---------------------------------------------------------------------------
// Reusable UI Components
// ---------------------------------------------------------------------------

/// Primary branded button with haptic feedback & Glass variant
struct VSButton: View {
    let title: String
    var isLoading: Bool = false
    var style: Style = .primary
    let action: () -> Void

    enum Style { case primary, secondary, ghost, destructive, glass }

    var body: some View {
        Button(action: {
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
            action()
        }) {
            HStack(spacing: AppTheme.Spacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: foregroundColor))
                        .scaleEffect(0.8)
                } else {
                    Text(title)
                        .font(AppTheme.Font.headline)
                        .foregroundColor(foregroundColor)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(backgroundFill)
            .cornerRadius(AppTheme.Radius.md)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .stroke(borderColor, lineWidth: 1)
            )
        }
        .disabled(isLoading)
        .animation(.easeInOut(duration: 0.15), value: isLoading)
    }

    private var foregroundColor: SwiftUI.Color {
        switch style {
        case .primary:     return AppTheme.Color.darkBackground
        case .secondary:   return AppTheme.Color.darkOnSurface
        case .ghost:       return AppTheme.Color.darkSecondary
        case .destructive: return .white
        case .glass:       return .white
        }
    }

    @ViewBuilder
    private var backgroundFill: some View {
        switch style {
        case .primary:
            AppTheme.Color.darkOnSurface
        case .secondary:
            AppTheme.Color.darkSurface2
        case .ghost:
            SwiftUI.Color.clear
        case .destructive:
            AppTheme.Color.destructive
        case .glass:
            AppTheme.Color.glassBg
        }
    }

    private var borderColor: SwiftUI.Color {
        switch style {
        case .secondary:   return AppTheme.Color.darkOutline
        case .glass:       return AppTheme.Color.glassBorder
        default:           return .clear
        }
    }
}

/// Branded Frosted Glass Text Field
struct VSTextField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var isSecure: Bool = false
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences

    @State private var isRevealed: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
            Text(label)
                .font(AppTheme.Font.caption)
                .foregroundColor(AppTheme.Color.darkSecondary)

            HStack {
                Group {
                    if isSecure && !isRevealed {
                        SecureField(placeholder, text: $text)
                    } else {
                        TextField(placeholder, text: $text)
                            .keyboardType(keyboardType)
                            .textInputAutocapitalization(autocapitalization)
                    }
                }
                .font(AppTheme.Font.body)
                .foregroundColor(AppTheme.Color.darkOnSurface)

                if isSecure {
                    Button(action: { isRevealed.toggle() }) {
                        Image(systemName: isRevealed ? "eye.slash" : "eye")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }
            }
            .padding(.horizontal, AppTheme.Spacing.md)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .fill(AppTheme.Color.darkSurface2.opacity(0.8))
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .stroke(AppTheme.Color.darkOutline.opacity(0.6), lineWidth: 1)
            )
        }
    }
}

/// Shimmer loading skeleton
struct ShimmerView: View {
    @State private var phase: CGFloat = -1

    var body: some View {
        GeometryReader { geo in
            RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                .fill(AppTheme.Color.darkSurface2)
                .overlay(
                    LinearGradient(
                        colors: [
                            .clear,
                            SwiftUI.Color.white.opacity(0.12),
                            .clear
                        ],
                        startPoint: .init(x: phase, y: 0),
                        endPoint: .init(x: phase + 1, y: 0)
                    )
                )
                .onAppear {
                    withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                        phase = 1
                    }
                }
        }
    }
}

/// Role badge chip with glass highlight
struct RoleBadge: View {
    let role: String

    var body: some View {
        Text(role.capitalized)
            .font(AppTheme.Font.caption2)
            .fontWeight(.semibold)
            .foregroundColor(roleColor)
            .padding(.horizontal, AppTheme.Spacing.sm)
            .padding(.vertical, 3)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.Radius.full)
                        .fill(roleColor.opacity(0.15))
                    RoundedRectangle(cornerRadius: AppTheme.Radius.full)
                        .stroke(roleColor.opacity(0.35), lineWidth: 1)
                }
            )
    }

    private var roleColor: SwiftUI.Color {
        switch role.lowercased() {
        case "admin":    return AppTheme.Color.destructive
        case "teacher":  return AppTheme.Color.accent
        case "accounts": return AppTheme.Color.warning
        default:         return AppTheme.Color.success  // student
        }
    }
}

// ---------------------------------------------------------------------------
// Shake Modifier (for error states)
// ---------------------------------------------------------------------------

struct ShakeModifier: GeometryEffect {
    var amount: CGFloat = 10
    var shakesPerUnit = 3
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        let offset = amount * sin(animatableData * .pi * CGFloat(shakesPerUnit))
        return ProjectionTransform(CGAffineTransform(translationX: offset, y: 0))
    }
}

extension View {
    func shake(trigger: Bool) -> some View {
        modifier(ShakeModifier(animatableData: trigger ? 1 : 0))
    }
}

// ---------------------------------------------------------------------------
// presentationBackground compatibility (requires iOS 16.4+)
// ---------------------------------------------------------------------------

extension View {
    @ViewBuilder
    func sheetBackground(_ color: SwiftUI.Color) -> some View {
        if #available(iOS 16.4, *) {
            self.presentationBackground(color)
        } else {
            self.background(color.ignoresSafeArea())
        }
    }
}

