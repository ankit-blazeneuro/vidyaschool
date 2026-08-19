import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// QRLoginView — Web QR Scanner & Session Login View (iOS equivalent of Android QRLoginScreen)
// ---------------------------------------------------------------------------

struct QRLoginView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var manualCode: String = ""
    @State private var isAuthorizing: Bool = false
    @State private var authSuccess: Bool = false
    @State private var errorMessage: String? = nil
    @State private var scanLineOffset: CGFloat = -100

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        // Header instructions
                        VStack(spacing: 6) {
                            Image(systemName: "qrcode.viewfinder")
                                .font(.system(size: 44))
                                .foregroundColor(AppTheme.Color.accent)

                            Text("Scan Web QR Code")
                                .font(AppTheme.Font.title3)
                                .foregroundColor(.white)

                            Text("Point your camera at web.vidyaschool.com to instantly sign in on your computer browser.")
                                .font(AppTheme.Font.caption)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, AppTheme.Spacing.md)
                        }

                        if authSuccess {
                            // Success Confirmation Glass Card
                            GlassCard {
                                VStack(spacing: AppTheme.Spacing.md) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 54))
                                        .foregroundColor(AppTheme.Color.success)

                                    Text("Session Authorized!")
                                        .font(AppTheme.Font.title3)
                                        .foregroundColor(.white)

                                    Text("You have successfully logged in to VidyaSchool Web.")
                                        .font(AppTheme.Font.subheadline)
                                        .foregroundColor(AppTheme.Color.darkSecondary)

                                    VSButton(title: "Done") {
                                        dismiss()
                                    }
                                }
                                .padding(.vertical, AppTheme.Spacing.md)
                            }
                        } else {
                            // Camera Viewfinder Mock Box
                            ZStack {
                                RoundedRectangle(cornerRadius: 20)
                                    .fill(Color.black.opacity(0.4))
                                    .frame(width: 250, height: 250)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(AppTheme.Gradient.glassBorder, lineWidth: 1.5)
                                    )

                                // Viewfinder Corner Indicators
                                ViewfinderCorners()
                                    .frame(width: 230, height: 230)
                                    .foregroundColor(AppTheme.Color.accent)

                                // Scanning Laser Line Animation
                                Rectangle()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.clear, AppTheme.Color.accent, Color.clear],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: 220, height: 3)
                                    .offset(y: scanLineOffset)
                                    .onAppear {
                                        withAnimation(
                                            Animation.easeInOut(duration: 2.0).repeatForever(autoreverses: true)
                                        ) {
                                            scanLineOffset = 100
                                        }
                                    }

                                VStack(spacing: 8) {
                                    Image(systemName: "camera.fill")
                                        .font(.system(size: 24))
                                        .foregroundColor(Color.white.opacity(0.4))
                                    Text("Align QR Code inside frame")
                                        .font(AppTheme.Font.caption2)
                                        .foregroundColor(Color.white.opacity(0.5))
                                }
                            }

                            Divider()
                                .background(Color.white.opacity(0.1))
                                .padding(.horizontal, AppTheme.Spacing.lg)

                            // Manual Code Entry Section
                            GlassCard {
                                VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                                    Text("Or Enter 6-Digit Web Code")
                                        .font(AppTheme.Font.footnote)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.white)

                                    VSTextField(
                                        label: "Pairing Code",
                                        text: $manualCode,
                                        placeholder: "e.g. 849201"
                                    )
                                    .keyboardType(.numberPad)

                                    if let err = errorMessage {
                                        Text(err)
                                            .font(AppTheme.Font.caption)
                                            .foregroundColor(AppTheme.Color.destructive)
                                    }

                                    VSButton(
                                        title: "Authorize Desktop Session",
                                        isLoading: isAuthorizing
                                    ) {
                                        authorizeCode()
                                    }
                                    .disabled(manualCode.trimmingCharacters(in: .whitespaces).isEmpty)
                                }
                            }
                        }

                        // Security Tip Card
                        GlassCard {
                            HStack(spacing: 12) {
                                Image(systemName: "lock.shield.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(AppTheme.Color.accent)
                                Text("Never scan or enter QR code pairing keys requested by unknown callers or external emails.")
                                    .font(AppTheme.Font.caption2)
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("QR Login")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.white)
                }
            }
        }
    }

    private func authorizeCode() {
        guard !manualCode.isEmpty else { return }
        isAuthorizing = true
        errorMessage = nil

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            isAuthorizing = false
            if manualCode.count >= 4 {
                authSuccess = true
            } else {
                errorMessage = "Invalid 6-digit web code. Please re-check computer screen."
            }
        }
    }
}

// Corner Overlay Graphic for Viewfinder
private struct ViewfinderCorners: View {
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let length: CGFloat = 24

            Path { p in
                // Top-Left
                p.move(to: CGPoint(x: 0, y: length))
                p.addLine(to: CGPoint(x: 0, y: 0))
                p.addLine(to: CGPoint(x: length, y: 0))

                // Top-Right
                p.move(to: CGPoint(x: w - length, y: 0))
                p.addLine(to: CGPoint(x: w, y: 0))
                p.addLine(to: CGPoint(x: w, y: length))

                // Bottom-Left
                p.move(to: CGPoint(x: 0, y: h - length))
                p.addLine(to: CGPoint(x: 0, y: h))
                p.addLine(to: CGPoint(x: length, y: h))

                // Bottom-Right
                p.move(to: CGPoint(x: w - length, y: h))
                p.addLine(to: CGPoint(x: w, y: h))
                p.addLine(to: CGPoint(x: w, y: h - length))
            }
            .stroke(style: StrokeStyle(lineWidth: 3, lineCap: .round))
        }
    }
}
