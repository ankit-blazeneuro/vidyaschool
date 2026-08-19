import SwiftUI

struct UpdateBannerView: View {
    let updateInfo: UpdateInfo
    let onUpdate: () -> Void
    let onDismiss: () -> Void
    
    var body: some View {
        GlassCard(padding: AppTheme.Spacing.lg) {
            VStack(spacing: AppTheme.Spacing.md) {
                // Header
                HStack {
                    ZStack {
                        Circle()
                            .fill(AppTheme.Color.accent.opacity(0.2))
                            .frame(width: 44, height: 44)
                        Image(systemName: "arrow.down.circle.fill")
                            .font(.system(size: 26))
                            .foregroundColor(AppTheme.Color.accent)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Update Available")
                            .font(AppTheme.Font.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Version \(updateInfo.versionName) is now available.")
                            .font(AppTheme.Font.subheadline)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                    
                    Spacer()
                }
                
                Text("A new version of VidyaSchool has been released. Please update now to access new features and performance enhancements.")
                    .font(AppTheme.Font.callout)
                    .foregroundColor(Color.white.opacity(0.85))
                    .lineSpacing(4)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                // Actions
                HStack(spacing: AppTheme.Spacing.md) {
                    Button(action: {
                        let generator = UIImpactFeedbackGenerator(style: .light)
                        generator.impactOccurred()
                        onDismiss()
                    }) {
                        Text("Later")
                            .font(AppTheme.Font.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(AppTheme.Radius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                                    .stroke(Color.white.opacity(0.18), lineWidth: 1)
                            )
                    }
                    
                    Button(action: {
                        let generator = UIImpactFeedbackGenerator(style: .medium)
                        generator.impactOccurred()
                        onUpdate()
                    }) {
                        Text("Update Now")
                            .font(AppTheme.Font.headline)
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Color.white)
                            .cornerRadius(AppTheme.Radius.md)
                    }
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
        .padding(.bottom, AppTheme.Spacing.lg)
    }
}

#Preview {
    ZStack {
        GlassBackground()
        VStack {
            Spacer()
            UpdateBannerView(
                updateInfo: UpdateInfo(versionName: "v1.2.3", downloadUrl: "https://github.com"),
                onUpdate: {},
                onDismiss: {}
            )
        }
    }
}

