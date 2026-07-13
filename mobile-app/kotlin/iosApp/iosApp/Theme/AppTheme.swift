import SwiftUI

// ---------------------------------------------------------------------------
// VidyaSchool Design System — AppTheme
// Mirrors the Android Material3 zinc-palette dark/light scheme
// ---------------------------------------------------------------------------

enum AppTheme {

    // -----------------------------------------------------------------------
    // Colours  (zinc palette matching Android Theme.kt)
    // -----------------------------------------------------------------------

    enum Color {
        // Dark scheme
        static let darkBackground    = SwiftUI.Color(hex: "#09090B")  // zinc-950
        static let darkSurface       = SwiftUI.Color(hex: "#18181B")  // zinc-900
        static let darkSurface2      = SwiftUI.Color(hex: "#27272A")  // zinc-800
        static let darkOutline       = SwiftUI.Color(hex: "#3F3F46")  // zinc-700
        static let darkOnSurface     = SwiftUI.Color.white
        static let darkSecondary     = SwiftUI.Color(hex: "#71717A")  // zinc-500
        static let darkPrimary       = SwiftUI.Color.white

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
        static let success           = SwiftUI.Color(hex: "#22C55E")  // green-500
        static let warning           = SwiftUI.Color(hex: "#F59E0B")  // amber-500
        static let destructive       = SwiftUI.Color(hex: "#EF4444")  // red-500
        static let destructiveMuted  = SwiftUI.Color(hex: "#7F1D1D")
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

        static let cardGradient = LinearGradient(
            colors: [
                SwiftUI.Color(hex: "#1C1C1E").opacity(0.95),
                SwiftUI.Color(hex: "#09090B").opacity(0.95)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let shimmerGradient = LinearGradient(
            colors: [
                SwiftUI.Color.white.opacity(0.05),
                SwiftUI.Color.white.opacity(0.15),
                SwiftUI.Color.white.opacity(0.05)
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
        static let xl:  CGFloat = 24
        static let full: CGFloat = 9999
    }
}

// ---------------------------------------------------------------------------
// Hex colour extension
// ---------------------------------------------------------------------------

extension SwiftUI.Color {
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
// Reusable UI Components
// ---------------------------------------------------------------------------

/// Primary branded button with haptic feedback
struct VSButton: View {
    let title: String
    var isLoading: Bool = false
    var style: Style = .primary
    let action: () -> Void

    enum Style { case primary, secondary, ghost, destructive }

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
            .frame(height: 52)
            .background(backgroundFill)
            .cornerRadius(AppTheme.Radius.md)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .stroke(borderColor, lineWidth: style == .secondary ? 1 : 0)
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
        }
    }

    private var borderColor: SwiftUI.Color {
        style == .secondary ? AppTheme.Color.darkOutline : .clear
    }
}

/// Branded text field
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
            .background(AppTheme.Color.darkSurface2)
            .cornerRadius(AppTheme.Radius.md)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                    .stroke(AppTheme.Color.darkOutline, lineWidth: 1)
            )
        }
    }
}

/// Glass-morphism card
struct VSCard<Content: View>: View {
    let content: Content
    var padding: CGFloat = AppTheme.Spacing.md

    init(padding: CGFloat = AppTheme.Spacing.md, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.lg)
                    .fill(AppTheme.Color.darkSurface.opacity(0.85))
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.Radius.lg)
                            .stroke(AppTheme.Color.darkOutline.opacity(0.5), lineWidth: 1)
                    )
            )
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
                            SwiftUI.Color.white.opacity(0.08),
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

/// Role badge chip
struct RoleBadge: View {
    let role: String

    var body: some View {
        Text(role.capitalized)
            .font(AppTheme.Font.caption2)
            .fontWeight(.semibold)
            .foregroundColor(roleColor)
            .padding(.horizontal, AppTheme.Spacing.sm)
            .padding(.vertical, 3)
            .background(roleColor.opacity(0.15))
            .cornerRadius(AppTheme.Radius.full)
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
// Falls back to a .background modifier on iOS 16.0–16.3.
// ---------------------------------------------------------------------------

extension View {
    /// Applies `.presentationBackground` on iOS 16.4+ and a plain
    /// `.background` on earlier iOS 16.x deployments.
    @ViewBuilder
    func sheetBackground(_ color: SwiftUI.Color) -> some View {
        if #available(iOS 16.4, *) {
            self.presentationBackground(color)
        } else {
            self.background(color.ignoresSafeArea())
        }
    }
}
