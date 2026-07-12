import SwiftUI

struct UpdateBannerView: View {
    let updateInfo: UpdateInfo
    let onUpdate: () -> Void
    let onDismiss: () -> Void
    
    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            // Header
            HStack {
                Image(systemName: "arrow.down.circle.fill")
                    .font(.system(size: 32))
                    .foregroundColor(AppTheme.Color.accent)
                
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
            .padding(.top, 4)
            
            Text("A new version of VidyaSchool has been released. Please update now to access new features and bug fixes.")
                .font(AppTheme.Font.callout)
                .foregroundColor(AppTheme.Color.darkOnSurface.opacity(0.8))
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
                        .foregroundColor(AppTheme.Color.darkSecondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(AppTheme.Color.darkSurface2)
                        .cornerRadius(AppTheme.Radius.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                                .stroke(AppTheme.Color.darkOutline, lineWidth: 1)
                        )
                }
                
                Button(action: {
                    let generator = UIImpactFeedbackGenerator(style: .medium)
                    generator.impactOccurred()
                    onUpdate()
                }) {
                    Text("Update Now")
                        .font(AppTheme.Font.headline)
                        .foregroundColor(AppTheme.Color.darkBackground)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(AppTheme.Color.darkOnSurface)
                        .cornerRadius(AppTheme.Radius.md)
                }
            }
        }
        .padding(AppTheme.Spacing.lg)
        .background(
            RoundedRectangle(cornerRadius: AppTheme.Radius.xl)
                .fill(AppTheme.Color.darkSurface.opacity(0.95))
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.xl)
                        .stroke(AppTheme.Color.darkOutline.opacity(0.6), lineWidth: 1.5)
                )
        )
        .shadow(color: .black.opacity(0.5), radius: 20, x: 0, y: -10)
        .padding(.horizontal, AppTheme.Spacing.md)
        .padding(.bottom, AppTheme.Spacing.lg)
    }
}

#Preview {
    ZStack {
        AppTheme.Color.darkBackground.ignoresSafeArea()
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
